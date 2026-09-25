function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const PBKDF2_ITERATIONS = 100_000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// The site owner's own account stays signed in for a year, so it never silently drops back to a
// guest (trial / free tier) between visits.
const ADMIN_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;
// /auth/me hands out a fresh token once the current one has less than this left, so anyone who
// opens the app at least once a month stays signed in instead of losing their plan every 30 days.
const TOKEN_REFRESH_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;
const AUTH_DAILY_ATTEMPT_LIMIT = 20;

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `${bufToHex(salt)}:${bufToHex(hash)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const hash = await pbkdf2(password, hexToBuf(saltHex));
  return constantTimeEqual(bufToHex(hash), hashHex);
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return atob(padded);
}

async function hmacSign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

type TokenPayload = { userId: string; exp: number };

async function signToken(payload: TokenPayload, secret: string): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmacSign(body, secret);
  return `${body}.${sig}`;
}

async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedSig = await hmacSign(body, secret);
  if (!constantTimeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(body)) as TokenPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  is_premium: number;
  created_at: string;
  premium_expires_at: string | null;
  card_registered: number;
  next_charge_due_at: string | null;
  // Set when the customer stops the next renewal from My Page; premium lasts until the paid period ends.
  canceled_at: string | null;
};

// The site owner's own account (used to demo the app / verify it works) should never be
// blocked by trial expiry or the ZEUS payment gate. This overrides the *response*, not the
// DB row -- nothing here looks like a real ZEUS-billed subscription, it just always
// resolves as premium for this one email.
const ADMIN_EMAILS = new Set(['azabumin@gmail.com']);

function tokenTtlMs(email: string): number {
  return ADMIN_EMAILS.has(email.toLowerCase()) ? ADMIN_TOKEN_TTL_MS : TOKEN_TTL_MS;
}

// is_premium alone never goes back to 0 on its own -- ZEUS's continuous-reservation renewal
// is a manual monthly process (see payments.ts / docs/billing-cycle.md), so a missed or failed
// renewal has to expire access itself rather than leaving it premium forever. premium_expires_at
// is set (and pushed out another cycle) by the webhook every time a real charge succeeds.
export function resolveIsPremium(email: string, isPremiumDb: boolean, premiumExpiresAt: string | null): boolean {
  if (ADMIN_EMAILS.has(email.toLowerCase())) return true;
  if (!isPremiumDb) return false;
  if (!premiumExpiresAt) return true; // legacy/edge case: paid but no expiry recorded yet
  return new Date(premiumExpiresAt).getTime() > Date.now();
}

// The subscription fields every auth response carries, so My Page can render without a second call.
function subscriptionFields(
  user: Pick<UserRow, 'email' | 'is_premium' | 'premium_expires_at' | 'card_registered' | 'next_charge_due_at' | 'canceled_at'>
) {
  return {
    isPremium: resolveIsPremium(user.email, !!user.is_premium, user.premium_expires_at),
    cardRegistered: !!user.card_registered,
    cancelAtPeriodEnd: !!user.canceled_at,
    nextChargeDueAt: user.next_charge_due_at ?? null,
    premiumExpiresAt: user.premium_expires_at ?? null,
  };
}

// Separate KV namespace/prefix from the AI-cost rate limiter — this one guards
// against credential-stuffing/brute-force on the auth endpoints specifically.
async function checkAndBumpAuthAttempts(env: Env, ip: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `auth-attempt:${ip}:${today}`;
  const countRaw = await env.RATE_LIMIT_KV.get(key);
  const count = parseInt(countRaw ?? '0', 10);
  if (count >= AUTH_DAILY_ATTEMPT_LIMIT) return false;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

export async function handleRegister(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  ip: string
): Promise<Response> {
  if (!(await checkAndBumpAuthAttempts(env, ip))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidEmail(email) || password.length < 8) {
    return jsonResponse({ error: 'invalid_input' }, 400, corsHeaders);
  }

  const existing = await env.USERS_DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return jsonResponse({ error: 'email_taken' }, 409, corsHeaders);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();
  await env.USERS_DB.prepare(
    'INSERT INTO users (id, email, password_hash, is_premium, created_at) VALUES (?, ?, ?, 0, ?)'
  )
    .bind(id, email, passwordHash, createdAt)
    .run();

  const token = await signToken({ userId: id, exp: Date.now() + tokenTtlMs(email) }, env.AUTH_SECRET);
  return jsonResponse(
    {
      token,
      email,
      createdAt,
      ...subscriptionFields({
        email,
        is_premium: 0,
        premium_expires_at: null,
        card_registered: 0,
        next_charge_due_at: null,
        canceled_at: null,
      }),
    },
    200,
    corsHeaders
  );
}

export async function handleLogin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  ip: string
): Promise<Response> {
  if (!(await checkAndBumpAuthAttempts(env, ip))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return jsonResponse({ error: 'invalid_input' }, 400, corsHeaders);
  }

  const user = await env.USERS_DB.prepare(
    'SELECT id, email, password_hash, is_premium, created_at, premium_expires_at, card_registered, next_charge_due_at, canceled_at FROM users WHERE email = ?'
  )
    .bind(email)
    .first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);
  }

  const token = await signToken({ userId: user.id, exp: Date.now() + tokenTtlMs(user.email) }, env.AUTH_SECRET);
  return jsonResponse(
    {
      token,
      email: user.email,
      createdAt: user.created_at,
      ...subscriptionFields(user),
    },
    200,
    corsHeaders
  );
}

// Shared by any authenticated route outside auth.ts itself (e.g. payments.ts) --
// returns the userId from a valid Bearer token, or null if missing/invalid/expired.
export async function resolveAuthedUserId(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const payload = await verifyToken(token, env.AUTH_SECRET);
  return payload?.userId ?? null;
}

export async function handleMe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? await verifyToken(token, env.AUTH_SECRET) : null;
  if (!payload) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  const user = await env.USERS_DB.prepare(
    'SELECT email, is_premium, created_at, premium_expires_at, card_registered, next_charge_due_at, canceled_at FROM users WHERE id = ?'
  )
    .bind(payload.userId)
    .first<
      Pick<
        UserRow,
        'email' | 'is_premium' | 'created_at' | 'premium_expires_at' | 'card_registered' | 'next_charge_due_at' | 'canceled_at'
      >
    >();
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  const refreshedToken =
    payload.exp - Date.now() < TOKEN_REFRESH_WINDOW_MS
      ? await signToken({ userId: payload.userId, exp: Date.now() + tokenTtlMs(user.email) }, env.AUTH_SECRET)
      : undefined;

  return jsonResponse(
    {
      email: user.email,
      createdAt: user.created_at,
      ...subscriptionFields(user),
      ...(refreshedToken ? { token: refreshedToken } : {}),
    },
    200,
    corsHeaders
  );
}
