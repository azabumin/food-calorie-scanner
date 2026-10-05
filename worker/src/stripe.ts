// Minimal Stripe client for Cloudflare Workers: plain REST over fetch (no SDK), form-encoded bodies,
// plus webhook signature verification with Web Crypto.

export class StripeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'StripeError';
  }
}

// STRIPE_API_BASE only exists so tests can point the Worker at a local fake Stripe.
function apiBase(env: Env): string {
  return env.STRIPE_API_BASE ?? 'https://api.stripe.com';
}

export async function stripeRequest(
  env: Env,
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, string>,
  idempotencyKey?: string
): Promise<any> {
  if (!env.STRIPE_SECRET_KEY) throw new StripeError(0, 'STRIPE_SECRET_KEY is not set');
  const headers: Record<string, string> = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  if (params) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${apiBase(env)}${path}`, {
      method,
      headers,
      body: params ? new URLSearchParams(params).toString() : undefined,
    });
  } catch (err) {
    throw new StripeError(0, `Stripe unreachable: ${String(err)}`);
  }
  const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!response.ok) throw new StripeError(response.status, data?.error?.message ?? `Stripe HTTP ${response.status}`);
  return data;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Stripe-Signature looks like "t=1700000000,v1=<hex>,v1=<hex>": v1 is HMAC-SHA256 of "<t>.<raw body>"
// keyed with the endpoint's signing secret. The raw (unparsed) body must be used, and old timestamps
// are rejected so a captured request can't be replayed later.
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  nowMs: number = Date.now()
): Promise<boolean> {
  if (!header) return false;
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key === 't') timestamp = value ?? '';
    else if (key === 'v1' && value) signatures.push(value);
  }
  const t = Number(timestamp);
  if (!timestamp || !Number.isFinite(t) || signatures.length === 0) return false;
  if (Math.abs(nowMs / 1000 - t) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const expected = toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return signatures.some((sig) => constantTimeEqual(sig, expected));
}
