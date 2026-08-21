import { handleLogin, handleMe, handleRegister } from './auth';

// `Env` (RATE_LIMIT_KV, USERS_DB, ALLOWED_ORIGIN) comes from the generated
// worker-configuration.d.ts (run `npx wrangler types` after changing wrangler.jsonc).
// ANTHROPIC_API_KEY and AUTH_SECRET are secrets, so they aren't in that
// config-derived type — extend it here.
declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
    AUTH_SECRET: string;
  }
}

// Cost-control caps for the shared Anthropic API key. Adjust as needed.
const PER_IP_DAILY_LIMIT = 20;
const GLOBAL_DAILY_LIMIT = 300;
const MAX_BASE64_LENGTH = 8_000_000; // ~6MB image
const MODEL = 'claude-haiku-4-5';
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const LANGUAGE_NAMES: Record<string, string> = {
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  en: 'English',
  vi: 'Vietnamese (Tiếng Việt)',
  zh: 'Chinese (中文)',
  id: 'Indonesian (Bahasa Indonesia)',
  tl: 'Filipino (Tagalog)',
  th: 'Thai (ภาษาไทย)',
  my: 'Burmese (မြန်မာ)',
  ne: 'Nepali (नेपाली)',
  pt: 'Portuguese (Português)',
};

function resolveLang(value: unknown): string {
  return typeof value === 'string' && value in LANGUAGE_NAMES ? value : 'en';
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    dishName: {
      type: 'string',
      description: 'Name of the dish shown in the photo. Must equal dishCandidates[0].name.',
    },
    dishCandidates: {
      type: 'array',
      description:
        'Ranked candidates, highest confidence first. Always at least one. Return two or ' +
        'more whenever a lookalike dish is plausible — never assert a single answer in that case.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Dish name' },
          confidence: { type: 'number', description: '0.0 to 1.0' },
          totalCalories: {
            type: 'integer',
            description: 'Total kcal if THIS candidate is the correct one',
          },
          reason: {
            type: 'string',
            description: 'The visual evidence supporting this candidate',
          },
        },
        required: ['name', 'confidence', 'totalCalories', 'reason'],
        additionalProperties: false,
      },
    },
    needsConfirmation: {
      type: 'boolean',
      description:
        'True when the top candidate is not clearly separated from the next one, or when ' +
        'lighting/white balance makes the photo unreliable.',
    },
    confirmQuestion: {
      type: 'string',
      description:
        'One short question that would settle the ambiguity, e.g. "うなぎと穴子、どちらでしたか？". ' +
        'Empty string when needsConfirmation is false.',
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the ingredient or component item' },
          estimatedPortion: { type: 'string', description: 'e.g. "1 bowl (200g)", "2 pieces"' },
          calories: { type: 'integer', description: 'Estimated calories for this item (kcal)' },
          protein: { type: 'number', description: 'Estimated protein for this item (g)' },
          fat: { type: 'number', description: 'Estimated fat for this item (g)' },
          carbs: { type: 'number', description: 'Estimated carbohydrates for this item (g)' },
        },
        required: ['name', 'estimatedPortion', 'calories', 'protein', 'fat', 'carbs'],
        additionalProperties: false,
      },
    },
    totalCalories: { type: 'integer', description: 'Total estimated calories (kcal)' },
    nutrients: {
      type: 'object',
      properties: {
        protein: { type: 'number', description: 'Total protein (g)' },
        fat: { type: 'number', description: 'Total fat (g)' },
        carbs: { type: 'number', description: 'Total carbohydrates (g)' },
      },
      required: ['protein', 'fat', 'carbs'],
      additionalProperties: false,
    },
    confidenceNote: {
      type: 'string',
      description: 'A short 1-2 sentence note on the limits of this estimate',
    },
  },
  required: [
    'dishName',
    'dishCandidates',
    'needsConfirmation',
    'confirmQuestion',
    'items',
    'totalCalories',
    'nutrients',
    'confidenceNote',
  ],
  additionalProperties: false,
} as const;

// Dishes that look alike in a photo but differ a lot in calories. When one of a pair
// is a candidate, the model must offer both instead of guessing. Extend this list as
// real misidentifications come in from the /correction endpoint.
const LOOKALIKE_RULES = `
Some dishes look nearly identical in a photo but differ greatly in calories.
When any dish below is plausible, you MUST return every plausible member in
dishCandidates and set needsConfirmation to true. Do NOT assert a single answer.

- うなぎ蒲焼 / 穴子      (unagi ~880kcal per donburi vs anago ~555kcal)
- 豚汁 / けんちん汁
- 牛丼 / 豚丼
- 天丼 / かき揚げ丼
- 味噌カツ / とんかつ
- ざるそば / もりそば

Distinguishing うなぎ from 穴子 once glazed with tare:
NEVER judge tare darkness in absolute terms. Restaurant lighting and phone HDR
shift it heavily, and that is the single most common cause of a wrong answer here.
Judge it RELATIVE to the white rice visible in the same bowl.
- うなぎ : tare much darker than the rice; thick and lacquered; strong specular
           highlights from the fat; flesh colour does not show through.
- 穴子   : tare lighter — closer to a translucent amber; the pale flesh partly
           shows through the glaze; Edo-style nimi-anago is lighter still.
Also weigh signals that lighting cannot distort:
- Fillet thickness and width (うなぎ thick and wide / 穴子 thin and narrow)
- Ratio of fish area to the rice below it

If the whites in the photo do not look neutral — warm tungsten cast, heavy
shadow, blown highlights — LOWER your confidence and set needsConfirmation to true.
It is far better to ask one question than to silently log the wrong calories.
`;

function buildAnalysisPrompt(lang: string): string {
  const languageName = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.ko;
  return `IMPORTANT: Every string value in your JSON response — dish name, item names, portions, confidence note — must be written in ${languageName}. This applies no matter what language the dish's usual name comes from, or what language any text/label visible in the photo is in. Do not use English unless ${languageName} is English.

Analyze the food shown in this photo.
1. Identify the dish. Put your ranked guesses in dishCandidates (highest confidence first),
   and set dishName to the top candidate's name. Both written in ${languageName}.
2. List each visible ingredient or component item (its name written in ${languageName}), estimating its portion, calories (kcal), protein (g), fat (g), and carbohydrates (g).
3. Calculate the total calories and the total protein/fat/carbohydrates. These must match the TOP candidate.
4. Briefly note, in ${languageName}, that this estimate may vary depending on the actual recipe, ingredients, and portion size.
If the photo shows multiple dishes, include all of them. Reminder: respond entirely in ${languageName}.
${LOOKALIKE_RULES}
Write confirmQuestion in ${languageName} as well. Leave it as an empty string when
needsConfirmation is false. Set needsConfirmation to true whenever the top two
candidates are within about 0.3 confidence of each other.

confirmQuestion must be ONE short question that the user answers by picking one of
the dishCandidates — the app shows it above a list of those names as tappable choices.
Never ask two things at once, and never ask for a measurement or a description the
user would have to type.
Good: "うなぎと穴子、どちらでしたか？"
Bad : "うなぎでしょうか穴子でしょうか？また厚みはどのくらいですか？"`;
}

const COACH_SCHEMA = {
  type: 'object',
  properties: {
    dinnerAdvice: {
      type: 'string',
      description: '2-3 concrete dinner menu suggestions with reasons (2-4 sentences)',
    },
    coachNote: {
      type: 'string',
      description: "A short overall comment on today's diet and advice for tomorrow (1-2 sentences)",
    },
  },
  required: ['dinnerAdvice', 'coachNote'],
  additionalProperties: false,
} as const;

const STATUS_LABEL: Record<string, string> = {
  ok: 'comfortably under the goal',
  near: 'close to the goal',
  over: 'over the goal',
};

const GOAL_RATE_LABEL: Record<string, string> = {
  maintain: 'maintaining current weight (no deficit)',
  mild: 'losing weight gradually (~0.25kg/week)',
  moderate: 'losing weight at a moderate pace (~0.5kg/week)',
  aggressive: 'losing weight more quickly (~0.75kg/week)',
};

function resolveGoalRate(value: unknown): string {
  return typeof value === 'string' && value in GOAL_RATE_LABEL ? value : 'maintain';
}

function buildCoachPrompt(body: CoachRequestBody): string {
  const languageName = LANGUAGE_NAMES[body.lang] ?? LANGUAGE_NAMES.ko;
  const mealLines =
    body.meals.length > 0
      ? body.meals.map((m) => `- ${m.dishName} (${m.calories}kcal)`).join('\n')
      : '(no meals logged yet)';

  return `IMPORTANT: Respond entirely in ${languageName}. Both dinnerAdvice and coachNote must be written in ${languageName}, even if any meal names listed below are written in another language. Do not use English unless ${languageName} is English.

Act as the user's diet coach for today's meals.

- Goal calories: ${body.goalCalories}kcal
- Consumed so far: ${body.consumedCalories}kcal
- Remaining calorie budget: ${body.remainingCalories}kcal
- Current status: ${STATUS_LABEL[body.status] ?? body.status}
- Nutrients consumed today: protein ${body.nutrients.protein}g, fat ${body.nutrients.fat}g, carbs ${body.nutrients.carbs}g
- User's diet goal: ${GOAL_RATE_LABEL[body.dietGoal]}
- Meals logged today:
${mealLines}

Based on this:
1. dinnerAdvice: Suggest 2-3 realistic dinner menu options that fit within the remaining calorie budget, with reasons. If the user has already gone over budget, do not tell them to starve — suggest a light, healthy dinner option or how to adjust tomorrow instead. If any macro (protein/fat/carbs) is running low today, prioritize menu suggestions that make up for it.
2. coachNote: A short overall comment on today's diet and one piece of advice for tomorrow, in 1-2 sentences.
Respond entirely in ${languageName}, in a warm, non-judgmental tone. Note this is not medical advice.`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    // Auth routes don't call Claude, so they're handled before (and don't consume)
    // the AI-cost rate limiter below.
    if (url.pathname === '/auth/register' && request.method === 'POST') {
      return handleRegister(request, env, corsHeaders, ip);
    }
    if (url.pathname === '/auth/login' && request.method === 'POST') {
      return handleLogin(request, env, corsHeaders, ip);
    }
    if (url.pathname === '/auth/me' && request.method === 'GET') {
      return handleMe(request, env, corsHeaders);
    }

    // Recording a user's correction doesn't call Claude, so it skips the AI budget too.
    if (url.pathname === '/correction' && request.method === 'POST') {
      return handleCorrection(request, env, corsHeaders);
    }

    if (request.method !== 'POST' || (url.pathname !== '/analyze' && url.pathname !== '/coach')) {
      return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    }

    // Both /analyze and /coach share one daily budget — they draw on the same Anthropic API key.
    const today = new Date().toISOString().slice(0, 10);
    const ipKey = `ip:${ip}:${today}`;
    const globalKey = `global:${today}`;

    const [ipCountRaw, globalCountRaw] = await Promise.all([
      env.RATE_LIMIT_KV.get(ipKey),
      env.RATE_LIMIT_KV.get(globalKey),
    ]);
    const ipCount = parseInt(ipCountRaw ?? '0', 10);
    const globalCount = parseInt(globalCountRaw ?? '0', 10);

    if (ipCount >= PER_IP_DAILY_LIMIT || globalCount >= GLOBAL_DAILY_LIMIT) {
      return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
    }

    // Reserve quota before calling the model so a burst of concurrent
    // requests can't all slip past the check.
    const dayTtlSeconds = 60 * 60 * 26;
    await Promise.all([
      env.RATE_LIMIT_KV.put(ipKey, String(ipCount + 1), { expirationTtl: dayTtlSeconds }),
      env.RATE_LIMIT_KV.put(globalKey, String(globalCount + 1), { expirationTtl: dayTtlSeconds }),
    ]);

    if (url.pathname === '/analyze') {
      return handleAnalyze(request, env, corsHeaders);
    }
    return handleCoach(request, env, corsHeaders);
  },
};

async function handleAnalyze(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: { image?: unknown; mediaType?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  if (typeof body.image !== 'string' || body.image.length === 0) {
    return jsonResponse({ error: 'missing_image' }, 400, corsHeaders);
  }
  if (body.image.length > MAX_BASE64_LENGTH) {
    return jsonResponse({ error: 'image_too_large' }, 413, corsHeaders);
  }
  const mediaType =
    typeof body.mediaType === 'string' && ALLOWED_MEDIA_TYPES.includes(body.mediaType)
      ? body.mediaType
      : 'image/jpeg';
  const lang = resolveLang(body.lang);

  try {
    const analysis = await callClaudeJson(ANALYSIS_SCHEMA, env.ANTHROPIC_API_KEY, [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
      { type: 'text', text: buildAnalysisPrompt(lang) },
    ]);
    return jsonResponse(analysis, 200, corsHeaders);
  } catch (err) {
    console.error('analysis_failed', err);
    return jsonResponse({ error: 'analysis_failed' }, 502, corsHeaders);
  }
}

// When the user overrides the dish the model picked, store it. This is the only way
// real misidentifications ever reach us — the photo itself is never kept, just the
// names and the confidence the model had. Query it later to extend LOOKALIKE_RULES:
//   npx wrangler d1 execute food-calorie-scanner-db --remote \
//     --command "SELECT predicted, corrected, COUNT(*) c FROM dish_corrections \
//                GROUP BY predicted, corrected ORDER BY c DESC"
async function handleCorrection(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: {
    predicted?: unknown;
    corrected?: unknown;
    confidence?: unknown;
    wasOffered?: unknown;
    lang?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const predicted = typeof body.predicted === 'string' ? body.predicted.slice(0, 120) : '';
  const corrected = typeof body.corrected === 'string' ? body.corrected.slice(0, 120) : '';
  if (!predicted || !corrected || predicted === corrected) {
    return jsonResponse({ error: 'invalid_correction' }, 400, corsHeaders);
  }

  const confidence = typeof body.confidence === 'number' ? body.confidence : null;
  // Whether the corrected dish was already in dishCandidates. If this is usually false,
  // the lookalike list is missing a pair. If it's usually true, the ranking is the problem.
  const wasOffered = body.wasOffered === true ? 1 : 0;

  try {
    await env.USERS_DB.prepare(
      `INSERT INTO dish_corrections
         (predicted, corrected, confidence, was_offered, lang, model, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        predicted,
        corrected,
        confidence,
        wasOffered,
        resolveLang(body.lang),
        MODEL,
        new Date().toISOString()
      )
      .run();
  } catch (err) {
    // A failed correction log must never break the user's meal entry.
    console.error('correction_log_failed', err);
    return jsonResponse({ ok: false }, 200, corsHeaders);
  }

  return jsonResponse({ ok: true }, 200, corsHeaders);
}

type CoachRequestBody = {
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  status: string;
  nutrients: { protein: number; fat: number; carbs: number };
  meals: { dishName: string; calories: number }[];
  lang: string;
  dietGoal: string;
};

function parseCoachBody(raw: unknown): CoachRequestBody | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const nutrients = b.nutrients as Record<string, unknown> | undefined;
  if (
    typeof b.goalCalories !== 'number' ||
    typeof b.consumedCalories !== 'number' ||
    typeof b.remainingCalories !== 'number' ||
    typeof b.status !== 'string' ||
    typeof nutrients !== 'object' ||
    nutrients === null ||
    typeof nutrients.protein !== 'number' ||
    typeof nutrients.fat !== 'number' ||
    typeof nutrients.carbs !== 'number' ||
    !Array.isArray(b.meals)
  ) {
    return null;
  }
  const meals = b.meals.filter(
    (m): m is { dishName: string; calories: number } =>
      typeof m === 'object' &&
      m !== null &&
      typeof (m as Record<string, unknown>).dishName === 'string' &&
      typeof (m as Record<string, unknown>).calories === 'number'
  );
  return {
    goalCalories: b.goalCalories,
    consumedCalories: b.consumedCalories,
    remainingCalories: b.remainingCalories,
    status: b.status,
    nutrients: { protein: nutrients.protein, fat: nutrients.fat, carbs: nutrients.carbs },
    meals,
    lang: resolveLang(b.lang),
    dietGoal: resolveGoalRate(b.dietGoal),
  };
}

async function handleCoach(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const body = parseCoachBody(raw);
  if (!body) {
    return jsonResponse({ error: 'invalid_body' }, 400, corsHeaders);
  }

  try {
    const advice = await callClaudeJson(COACH_SCHEMA, env.ANTHROPIC_API_KEY, [
      { type: 'text', text: buildCoachPrompt(body) },
    ]);
    return jsonResponse(advice, 200, corsHeaders);
  } catch (err) {
    console.error('coach_failed', err);
    return jsonResponse({ error: 'coach_failed' }, 502, corsHeaders);
  }
}

function buildCorsHeaders(origin: string, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  const allowedOrigins = env.ALLOWED_ORIGIN.split(',');
  if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

async function callClaudeJson(schema: object, apiKey: string, content: ClaudeContentBlock[]) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      // Raised from 1024 when dishCandidates was added — the candidate list plus its
      // reasons pushes the JSON past the old cap, and a truncated body fails JSON.parse.
      max_tokens: 2048,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    stop_reason: string;
    content: { type: string; text?: string }[];
  };

  if (data.stop_reason === 'refusal') {
    throw new Error('model refused the request');
  }

  const textBlock = data.content.find((block) => block.type === 'text');
  if (!textBlock?.text) {
    throw new Error('no text block in Claude response');
  }

  return JSON.parse(textBlock.text);
}
