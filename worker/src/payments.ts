import { isOwnerEmail, resolveIsPremium } from './auth';
import { sendPaymentFailedEmail } from './email';
import { stripeRequest, StripeError, verifyStripeSignature } from './stripe';

// Stripe subscriptions for dietdiary.jp (replaces the ZEUS LinkPoint integration, whose contract for
// this site was cancelled in 2026-10).
//
// Flow:
//   1. POST /payments/checkout (authed) creates a Stripe Checkout Session (mode=subscription) for the
//      monthly price and returns its hosted-page URL; the browser redirects there and the customer
//      pays by card (3-D Secure handled by Stripe). Stripe renews the subscription by itself every month.
//   2. Stripe calls POST /payments/stripe-webhook (signature-verified):
//        checkout.session.completed      -> remember the Stripe customer/subscription for this user
//        invoice.paid                    -> premium on until the paid period ends (+ a few days' grace)
//        invoice.payment_failed          -> payment-failure email
//        customer.subscription.updated   -> mirror "cancel at period end" into canceled_at
//        customer.subscription.deleted   -> mark canceled; access simply runs out with the paid period
//   3. My Page cancel/resume (account.ts) flips cancel_at_period_end on the Stripe subscription.
//   4. Loyalty: after the 12th paid invoice (cycle 12, 25, ...) a one-time 100% coupon is attached to
//      the subscription, so the 13th invoice is 0 yen (see applyFreeMonthIfDue).

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Kill switch for NEW checkouts: set to false (together with PAYMENTS_OPEN in constants/company.ts) to
// pause them; renewals of existing subscriptions keep running inside Stripe. While the Worker holds a
// non-live Stripe key only the owner's mailbox can check out (see handleCheckoutStart).
// PAYMENTS_ENABLED=true is a test-only override (wrangler dev --var) for the local test suite.
const CHECKOUT_OPEN = true;

function checkoutOpen(env: Env): boolean {
  return CHECKOUT_OPEN || env.PAYMENTS_ENABLED === 'true';
}

// Access outlives the paid period by a few days so a renewal that Stripe is still retrying (or a
// webhook that arrives late) doesn't lock a paying customer out for a moment.
const GRACE_DAYS = 3;
const DAY_MS = 86_400_000;
// Every 13th cycle is the loyalty free month: cycles 1-12 are paid, 13 is free, 14-25 are paid, ...
const LOYALTY_CYCLE = 13;

// Where Stripe sends the customer back to: the calling origin if it is one of ours, else production.
function returnOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGIN ?? '').split(',').map((o) => o.trim());
  return allowed.includes(origin) ? origin : 'https://dietdiary.jp';
}

export async function handleCheckoutStart(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string
): Promise<Response> {
  if (!checkoutOpen(env)) {
    return jsonResponse({ error: 'payments_paused' }, 503, corsHeaders);
  }

  let body: { chargeNow?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }
  // The confirmation screen tells the customer they are charged immediately; refuse anything that
  // didn't come from it (e.g. a stale cached page with different wording).
  if (body.chargeNow !== true) {
    return jsonResponse({ error: 'outdated_client' }, 400, corsHeaders);
  }
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    console.error('stripe_not_configured');
    return jsonResponse({ error: 'payments_paused' }, 503, corsHeaders);
  }

  const user = await env.USERS_DB.prepare(
    'SELECT id, email, is_premium, premium_expires_at, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      is_premium: number;
      premium_expires_at: string | null;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
    }>();
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  // Unless the Worker holds a LIVE Stripe key (sk_live_ / rk_live_), only the owner's mailbox (and its
  // +aliases) may check out: a test card would hand any stranger free premium. Fails safe on odd keys.
  if (!/^[sr]k_live_/.test(env.STRIPE_SECRET_KEY) && !isOwnerEmail(user.email)) {
    return jsonResponse({ error: 'payments_paused' }, 503, corsHeaders);
  }

  // Never take a second subscription from someone who already has premium...
  if (resolveIsPremium(user.email, !!user.is_premium, user.premium_expires_at)) {
    return jsonResponse({ error: 'already_active' }, 409, corsHeaders);
  }
  // ...or whose Stripe subscription is still alive (e.g. a renewal that is failing and being retried):
  // that customer should fix their card, not start a second subscription and get billed twice.
  if (user.stripe_subscription_id) {
    try {
      const existing = await stripeRequest(env, 'GET', `/v1/subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`);
      if (['active', 'trialing', 'past_due', 'unpaid'].includes(existing.status)) {
        return jsonResponse({ error: 'subscription_exists' }, 409, corsHeaders);
      }
    } catch (err) {
      console.error('stripe_subscription_lookup_failed', err);
      return jsonResponse({ error: 'payments_unavailable' }, 502, corsHeaders);
    }
  }

  const origin = returnOrigin(request, env);
  const params: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/payment-result?status=success`,
    cancel_url: `${origin}/payment-result?status=failure`,
    client_reference_id: user.id,
    'metadata[user_id]': user.id,
    'subscription_data[metadata][user_id]': user.id,
    locale: 'ja',
    'custom_text[submit][message]':
      'お支払い後、約1か月ごとに自動更新されます（12ヶ月連続でご利用いただくと、13ヶ月目は無料）。解約はマイページからいつでも可能です。',
  };
  if (user.stripe_customer_id) params.customer = user.stripe_customer_id;
  else params.customer_email = user.email;

  try {
    const session = await stripeRequest(env, 'POST', '/v1/checkout/sessions', params);
    if (typeof session.url !== 'string') throw new StripeError(0, 'no checkout url in response');
    return jsonResponse({ url: session.url }, 200, corsHeaders);
  } catch (err) {
    console.error('stripe_checkout_failed', err);
    return jsonResponse({ error: 'payments_unavailable' }, 502, corsHeaders);
  }
}

type DbUser = {
  id: string;
  email: string;
  billing_cycle_number: number;
  canceled_at: string | null;
  last_processed_ordd: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const USER_COLUMNS =
  'id, email, billing_cycle_number, canceled_at, last_processed_ordd, stripe_customer_id, stripe_subscription_id';

// Stripe moved some invoice fields between API versions (invoice.subscription vs.
// invoice.parent.subscription_details.*); read both so the endpoint works whichever version it uses.
function invoiceSubscriptionId(invoice: any): string | null {
  return invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;
}

function invoiceUserId(invoice: any): string | null {
  return (
    invoice.subscription_details?.metadata?.user_id ?? invoice.parent?.subscription_details?.metadata?.user_id ?? null
  );
}

async function findUser(env: Env, customerId: string | null, userIdHint: string | null): Promise<DbUser | null> {
  if (customerId) {
    const byCustomer = await env.USERS_DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE stripe_customer_id = ?`)
      .bind(customerId)
      .first<DbUser>();
    if (byCustomer) return byCustomer;
  }
  if (userIdHint) {
    return env.USERS_DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(userIdHint).first<DbUser>();
  }
  return null;
}

// After the 12th paid invoice, attach a one-time 100%-off coupon so the next invoice is free. The
// coupon is applied BEFORE the database write: if this call fails the event is retried and nothing was
// recorded; if the write fails afterwards the retry just sets the same discount again.
async function applyFreeMonthIfDue(env: Env, subscriptionId: string | null, cycle: number): Promise<void> {
  if (cycle % LOYALTY_CYCLE !== LOYALTY_CYCLE - 1) return;
  if (!subscriptionId || !env.STRIPE_FREE_MONTH_COUPON_ID) {
    console.error('free_month_not_applied', { subscriptionId, cycle });
    return;
  }
  await stripeRequest(env, 'POST', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    'discounts[0][coupon]': env.STRIPE_FREE_MONTH_COUPON_ID,
  });
}

async function onCheckoutCompleted(env: Env, session: any): Promise<void> {
  if (session.mode !== 'subscription') return;
  const userId: string | null = session.client_reference_id ?? session.metadata?.user_id ?? null;
  if (!userId || !session.customer) return;
  await env.USERS_DB.prepare(
    'UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?, card_registered = 1 WHERE id = ?'
  )
    .bind(session.customer, session.subscription ?? null, userId)
    .run();
}

async function onInvoicePaid(env: Env, invoice: any): Promise<boolean> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return true; // a one-off invoice, not part of a subscription -- nothing to do

  const user = await findUser(env, invoice.customer ?? null, invoiceUserId(invoice));
  // Not found yet: checkout.session.completed may still be on its way. Report failure so Stripe retries.
  if (!user) return false;
  // Stripe re-sends events (and we may see one twice): each invoice is counted once.
  if (user.last_processed_ordd === invoice.id) return true;

  const now = Date.now();
  const periodEndSec: number | undefined = invoice.lines?.data?.[0]?.period?.end;
  const paidUntil = periodEndSec ? periodEndSec * 1000 : now + 31 * DAY_MS;
  const expiresAt = new Date(Math.max(paidUntil, now) + GRACE_DAYS * DAY_MS).toISOString();
  const nextDue = new Date(Math.max(paidUntil, now)).toISOString();

  // A brand-new subscription (first invoice) starts a fresh "12 months in a row" streak and clears
  // any earlier cancellation; every later invoice continues the streak.
  const isNewSubscription = invoice.billing_reason === 'subscription_create';
  const cycle = isNewSubscription ? 1 : user.billing_cycle_number + 1;
  const canceledAt = isNewSubscription ? null : user.canceled_at;

  await applyFreeMonthIfDue(env, subscriptionId, cycle);

  await env.USERS_DB.prepare(
    `UPDATE users SET is_premium = 1, premium_expires_at = ?, next_charge_due_at = ?, billing_cycle_number = ?,
       canceled_at = ?, last_processed_ordd = ?, stripe_customer_id = ?, stripe_subscription_id = ?, card_registered = 1
     WHERE id = ?`
  )
    .bind(expiresAt, nextDue, cycle, canceledAt, invoice.id, invoice.customer ?? user.stripe_customer_id, subscriptionId, user.id)
    .run();
  return true;
}

async function onInvoicePaymentFailed(env: Env, invoice: any): Promise<boolean> {
  if (!invoiceSubscriptionId(invoice)) return true;
  const user = await findUser(env, invoice.customer ?? null, invoiceUserId(invoice));
  if (!user) return false;
  try {
    await sendPaymentFailedEmail(user.email, env.RESEND_API_KEY);
  } catch (err) {
    console.error('payment_failed_email_error', err);
  }
  return true;
}

// The customer's cancel/resume (or an edit in the Stripe dashboard) arrives here as
// cancel_at_period_end; mirror it so the My Page state matches Stripe.
async function onSubscriptionUpdated(env: Env, subscription: any): Promise<boolean> {
  if (!['active', 'trialing', 'past_due'].includes(subscription.status)) return true;
  const user = await findUser(env, subscription.customer ?? null, subscription.metadata?.user_id ?? null);
  if (!user) return false;
  const canceledAt = subscription.cancel_at_period_end ? (user.canceled_at ?? new Date().toISOString()) : null;
  await env.USERS_DB.prepare('UPDATE users SET canceled_at = ? WHERE id = ?').bind(canceledAt, user.id).run();
  return true;
}

// The subscription has ended (period ran out after a cancellation, or payments kept failing). Access
// already stops by itself when premium_expires_at passes, so only record the cancellation.
async function onSubscriptionDeleted(env: Env, subscription: any): Promise<boolean> {
  const user = await findUser(env, subscription.customer ?? null, subscription.metadata?.user_id ?? null);
  if (!user) return true;
  await env.USERS_DB.prepare('UPDATE users SET canceled_at = COALESCE(canceled_at, ?) WHERE id = ?')
    .bind(new Date().toISOString(), user.id)
    .run();
  return true;
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('stripe_webhook_secret_missing');
    return new Response('not configured', { status: 503 });
  }
  const rawBody = await request.text();
  const valid = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error('stripe_webhook_bad_signature');
    return new Response('invalid signature', { status: 400 });
  }

  let event: { type: string; data: { object: any } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  try {
    let handled = true;
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(env, event.data.object);
        break;
      case 'invoice.paid':
        handled = await onInvoicePaid(env, event.data.object);
        break;
      case 'invoice.payment_failed':
        handled = await onInvoicePaymentFailed(env, event.data.object);
        break;
      case 'customer.subscription.updated':
        handled = await onSubscriptionUpdated(env, event.data.object);
        break;
      case 'customer.subscription.deleted':
        handled = await onSubscriptionDeleted(env, event.data.object);
        break;
      default:
        break; // events we don't act on are acknowledged so Stripe stops sending them
    }
    // 500 makes Stripe retry later (e.g. the customer record isn't linked yet).
    return handled ? new Response('ok', { status: 200 }) : new Response('retry', { status: 500 });
  } catch (err) {
    console.error('stripe_webhook_error', event.type, err);
    return new Response('error', { status: 500 });
  }
}
