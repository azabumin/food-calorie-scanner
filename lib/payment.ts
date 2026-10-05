import { Platform } from 'react-native';

import { WORKER_URL } from '../constants/config';

export class CheckoutError extends Error {
  constructor(
    public code:
      | 'already_active'
      | 'subscription_exists'
      | 'payments_paused'
      | 'unavailable'
      | 'unauthorized'
      | 'network'
      | 'unknown'
  ) {
    super(code);
    this.name = 'CheckoutError';
  }
}

// Asks our Worker to open a Stripe Checkout Session for the monthly plan and returns the URL of
// Stripe's hosted payment page. chargeNow tells the Worker this screen told the customer they will be
// charged immediately.
export async function startCheckout(token: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chargeNow: true }),
    });
  } catch {
    throw new CheckoutError('network');
  }
  if (response.status === 401) throw new CheckoutError('unauthorized');
  if (!response.ok) {
    let code: unknown;
    try {
      code = (await response.json()).error;
    } catch {
      // ignore -- falls through to 'unknown'
    }
    if (code === 'already_active' || code === 'subscription_exists' || code === 'payments_paused') {
      throw new CheckoutError(code);
    }
    throw new CheckoutError(code === 'payments_unavailable' ? 'unavailable' : 'unknown');
  }
  const data = (await response.json()) as { url?: unknown };
  if (typeof data.url !== 'string' || !isTrustedCheckoutUrl(data.url)) throw new CheckoutError('unknown');
  return data.url;
}

// Only ever send the browser to Stripe (or back to this site) -- never to whatever URL a response
// happens to contain.
function isTrustedCheckoutUrl(url: string): boolean {
  try {
    const { protocol, hostname, origin } = new URL(url);
    if (origin === (typeof window !== 'undefined' ? window.location.origin : '')) return true;
    return protocol === 'https:' && (hostname === 'stripe.com' || hostname.endsWith('.stripe.com'));
  } catch {
    return false;
  }
}

export function redirectToCheckout(url: string): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.location.assign(url);
}
