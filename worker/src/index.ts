// `Env` (RATE_LIMIT_KV, ALLOWED_ORIGIN) comes from the generated worker-configuration.d.ts
// (run `npx wrangler types` after changing wrangler.jsonc). ANTHROPIC_API_KEY is a secret,
// so it isn't in that config-derived type — extend it here.
declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
  }
}

// Cost-control caps for the shared Anthropic API key. Adjust as needed.
const PER_IP_DAILY_LIMIT = 20;
const GLOBAL_DAILY_LIMIT = 300;
const MAX_BASE64_LENGTH = 8_000_000; // ~6MB image
const MODEL = 'claude-haiku-4-5';
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    dishName: { type: 'string', description: '사진 속 음식의 이름 (한국어)' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '재료 또는 구성 음식 이름 (한국어)' },
          estimatedPortion: { type: 'string', description: '예: "1공기(200g)", "2조각"' },
          calories: { type: 'integer', description: '해당 항목의 예상 칼로리 (kcal)' },
          protein: { type: 'number', description: '해당 항목의 예상 단백질 (g)' },
          fat: { type: 'number', description: '해당 항목의 예상 지방 (g)' },
          carbs: { type: 'number', description: '해당 항목의 예상 탄수화물 (g)' },
        },
        required: ['name', 'estimatedPortion', 'calories', 'protein', 'fat', 'carbs'],
        additionalProperties: false,
      },
    },
    totalCalories: { type: 'integer', description: '전체 예상 칼로리 합계 (kcal)' },
    nutrients: {
      type: 'object',
      properties: {
        protein: { type: 'number', description: '전체 단백질 합계 (g)' },
        fat: { type: 'number', description: '전체 지방 합계 (g)' },
        carbs: { type: 'number', description: '전체 탄수화물 합계 (g)' },
      },
      required: ['protein', 'fat', 'carbs'],
      additionalProperties: false,
    },
    confidenceNote: {
      type: 'string',
      description: '이 추정치의 한계에 대한 짧은 한국어 안내 문구 (1~2문장)',
    },
  },
  required: ['dishName', 'items', 'totalCalories', 'nutrients', 'confidenceNote'],
  additionalProperties: false,
} as const;

const PROMPT = `사진 속 음식을 분석해주세요.
1. 음식(요리)의 이름을 알려주세요.
2. 눈에 보이는 재료 또는 구성 음식 항목을 각각 나열하고, 항목별 예상 양(portion), 칼로리(kcal), 단백질(g), 지방(g), 탄수화물(g)을 추정해주세요.
3. 전체 칼로리 합계와 전체 단백질/지방/탄수화물 합계를 계산해주세요.
4. 이 추정치가 실제 조리법, 재료, 양에 따라 달라질 수 있다는 점을 짧게 안내해주세요.
모든 답변은 한국어로 작성해주세요. 사진에 여러 음식이 있으면 모두 포함해주세요.`;

const COACH_SCHEMA = {
  type: 'object',
  properties: {
    dinnerAdvice: {
      type: 'string',
      description:
        '오늘 저녁 식사로 무엇을 먹으면 좋을지 구체적인 메뉴 2~3가지와 그 이유 (한국어, 2~4문장)',
    },
    coachNote: {
      type: 'string',
      description: '오늘 하루 식단에 대한 짧은 총평과 내일을 위한 조언 (한국어, 1~2문장)',
    },
  },
  required: ['dinnerAdvice', 'coachNote'],
  additionalProperties: false,
} as const;

const STATUS_LABEL: Record<string, string> = {
  ok: '목표 대비 여유 있음',
  near: '목표에 근접함',
  over: '목표 칼로리 초과',
};

function buildCoachPrompt(body: CoachRequestBody): string {
  const mealLines =
    body.meals.length > 0
      ? body.meals.map((m) => `- ${m.dishName} (${m.calories}kcal)`).join('\n')
      : '(아직 기록된 식사 없음)';

  return `사용자의 오늘 식단 다이어트 코치 역할을 해주세요.

- 목표 칼로리: ${body.goalCalories}kcal
- 지금까지 섭취한 칼로리: ${body.consumedCalories}kcal
- 남은 칼로리 예산: ${body.remainingCalories}kcal
- 현재 상태: ${STATUS_LABEL[body.status] ?? body.status}
- 오늘 섭취한 영양소: 단백질 ${body.nutrients.protein}g, 지방 ${body.nutrients.fat}g, 탄수화물 ${body.nutrients.carbs}g
- 오늘 먹은 식사 목록:
${mealLines}

위 정보를 바탕으로:
1. dinnerAdvice: 오늘 저녁 식사로 무엇을 먹으면 좋을지 남은 칼로리 예산 안에서 현실적인 메뉴를 2~3가지 제안하고 이유를 설명해주세요. 이미 목표를 초과한 상태라면 무리하게 굶으라고 하지 말고, 가볍고 건강한 저녁 옵션이나 다음 날 조정 방법을 제안해주세요. 오늘 부족한 영양소(단백질/지방/탄수화물)가 있다면 그것을 보완하는 메뉴를 우선 고려해주세요.
2. coachNote: 오늘 하루 식단에 대한 짧은 총평과 내일을 위한 다이어트 조언을 1~2문장으로 작성해주세요.
모든 답변은 한국어로, 친근하고 부담 주지 않는 톤으로 작성해주세요. 이것은 의학적 조언이 아니라는 점을 유념해주세요.`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || (url.pathname !== '/analyze' && url.pathname !== '/coach')) {
      return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    }

    // Both routes share one daily budget — they draw on the same Anthropic API key.
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
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
  let body: { image?: unknown; mediaType?: unknown };
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

  try {
    const analysis = await callClaudeJson(ANALYSIS_SCHEMA, env.ANTHROPIC_API_KEY, [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
      { type: 'text', text: PROMPT },
    ]);
    return jsonResponse(analysis, 200, corsHeaders);
  } catch (err) {
    console.error('analysis_failed', err);
    return jsonResponse({ error: 'analysis_failed' }, 502, corsHeaders);
  }
}

type CoachRequestBody = {
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  status: string;
  nutrients: { protein: number; fat: number; carbs: number };
  meals: { dishName: string; calories: number }[];
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin === env.ALLOWED_ORIGIN || origin.startsWith('http://localhost:')) {
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
      max_tokens: 1024,
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
