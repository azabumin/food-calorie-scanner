import { Platform } from 'react-native';

import { WORKER_URL } from '../constants/config';

export type ZeusCheckoutResponse = {
  action: string;
  params: Record<string, string>;
};

export class CheckoutError extends Error {
  constructor(public code: 'invalid_phone' | 'already_active' | 'unauthorized' | 'network' | 'unknown') {
    super(code);
    this.name = 'CheckoutError';
  }
}

// Asks our Worker for the LinkPoint form params (server-computed sendid, our clientip, money=580,
// etc.) tied to the authenticated user -- the phone number is saved server-side too. chargeNow
// tells the Worker this screen told the customer they will be charged immediately.
export async function startZeusCheckout(token: string, phone: string): Promise<ZeusCheckoutResponse> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone, chargeNow: true }),
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
    throw new CheckoutError(code === 'invalid_phone' || code === 'already_active' ? code : 'unknown');
  }
  return response.json();
}

// Performs a real browser POST navigation to ZEUS's LinkPoint payment page. This must be a
// full form submit (not fetch/XHR) -- the response is an HTML page the customer's browser
// needs to render and let them interact with, not JSON we could read back.
export function submitZeusOrder({ action, params }: ZeusCheckoutResponse): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  Object.entries(params).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
