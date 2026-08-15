function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const PBKDF2_ITERATIONS = 100_000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
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

type UserRow = { id: string; email: string; password_hash: string; is_premium: number; created_at: string };

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

  const token = await signToken({ userId: id, exp: Date.now() + TOKEN_TTL_MS }, env.AUTH_SECRET);
  return jsonResponse({ token, email, createdAt, isPremium: false }, 200, corsHeaders);
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
    'SELECT id, email, password_hash, is_premium, created_at FROM users WHERE email = ?'
  )
    .bind(email)
    .first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);
  }

  const token = await signToken({ userId: user.id, exp: Date.now() + TOKEN_TTL_MS }, env.AUTH_SECRET);
  return jsonResponse(
    { token, email: user.email, createdAt: user.created_at, isPremium: !!user.is_premium },
    200,
    corsHeaders
  );
}

export async function handleMe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? await verifyToken(token, env.AUTH_SECRET) : null;
  if (!payload) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  const user = await env.USERS_DB.prepare('SELECT email, is_premium, created_at FROM users WHERE id = ?')
    .bind(payload.userId)
    .first<Pick<UserRow, 'email' | 'is_premium' | 'created_at'>>();
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  return jsonResponse({ email: user.email, createdAt: user.created_at, isPremium: !!user.is_premium }, 200, corsHeaders);
}
