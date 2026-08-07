export interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_KV: KVNamespace;
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
        },
        required: ['name', 'estimatedPortion', 'calories'],
        additionalProperties: false,
      },
    },
    totalCalories: { type: 'integer', description: '전체 예상 칼로리 합계 (kcal)' },
    confidenceNote: {
      type: 'string',
      description: '이 추정치의 한계에 대한 짧은 한국어 안내 문구 (1~2문장)',
    },
  },
  required: ['dishName', 'items', 'totalCalories', 'confidenceNote'],
  additionalProperties: false,
} as const;

const PROMPT = `사진 속 음식을 분석해주세요.
1. 음식(요리)의 이름을 알려주세요.
2. 눈에 보이는 재료 또는 구성 음식 항목을 각각 나열하고, 항목별 예상 양(portion)과 칼로리(kcal)를 추정해주세요.
3. 전체 칼로리 합계를 계산해주세요.
4. 이 추정치가 실제 조리법, 재료, 양에 따라 달라질 수 있다는 점을 짧게 안내해주세요.
모든 답변은 한국어로 작성해주세요. 사진에 여러 음식이 있으면 모두 포함해주세요.`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/analyze' || request.method !== 'POST') {
      return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    }

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

    // Reserve quota before calling the model so a burst of concurrent
    // requests can't all slip past the check.
    const dayTtlSeconds = 60 * 60 * 26;
    await Promise.all([
      env.RATE_LIMIT_KV.put(ipKey, String(ipCount + 1), { expirationTtl: dayTtlSeconds }),
      env.RATE_LIMIT_KV.put(globalKey, String(globalCount + 1), { expirationTtl: dayTtlSeconds }),
    ]);

    try {
      const analysis = await callClaude(body.image, mediaType, env.ANTHROPIC_API_KEY);
      return jsonResponse(analysis, 200, corsHeaders);
    } catch (err) {
      console.error('analysis_failed', err);
      return jsonResponse({ error: 'analysis_failed' }, 502, corsHeaders);
    }
  },
};

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

async function callClaude(base64Image: string, mediaType: string, apiKey: string) {
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
      output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
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
