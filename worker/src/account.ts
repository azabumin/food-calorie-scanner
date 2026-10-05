// My Page actions: stop or restore the next renewal. For a Stripe subscriber this flips
// cancel_at_period_end on the Stripe subscription itself (so Stripe really stops charging); the
// customer.subscription.updated webhook would mirror it back, but canceled_at is written here too so
// My Page reflects the change immediately.

import { stripeRequest, StripeError } from './stripe';

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

type AccountRow = {
  is_premium: number;
  premium_expires_at: string | null;
  next_charge_due_at: string | null;
  canceled_at: string | null;
  stripe_subscription_id: string | null;
};

async function loadRow(env: Env, userId: string): Promise<AccountRow | null> {
  return env.USERS_DB.prepare(
    'SELECT is_premium, premium_expires_at, next_charge_due_at, canceled_at, stripe_subscription_id FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<AccountRow>();
}

async function setCanceled(
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string,
  canceled: boolean
): Promise<Response> {
  const row = await loadRow(env, userId);
  if (!row) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);

  // Only someone with paid, unexpired premium has a renewal to stop or restore.
  const paid = !!row.is_premium && !!row.premium_expires_at && new Date(row.premium_expires_at).getTime() > Date.now();
  if (!paid) return jsonResponse({ error: 'not_subscribed' }, 409, corsHeaders);

  if (canceled !== !!row.canceled_at) {
    if (row.stripe_subscription_id) {
      try {
        await stripeRequest(env, 'POST', `/v1/subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`, {
          cancel_at_period_end: canceled ? 'true' : 'false',
        });
      } catch (err) {
        console.error('stripe_cancel_toggle_failed', canceled, err);
        // 4xx: Stripe refuses (e.g. the subscription has already ended and can't be resumed).
        // Anything else: Stripe is unreachable -- nothing was changed, so the customer can retry.
        const refused = err instanceof StripeError && err.status >= 400 && err.status < 500;
        return jsonResponse({ error: refused ? 'subscription_ended' : 'payments_unavailable' }, refused ? 409 : 502, corsHeaders);
      }
    }
    await env.USERS_DB.prepare('UPDATE users SET canceled_at = ? WHERE id = ?')
      .bind(canceled ? new Date().toISOString() : null, userId)
      .run();
  }

  const updated = await loadRow(env, userId);
  return jsonResponse(
    {
      cancelAtPeriodEnd: !!updated?.canceled_at,
      nextChargeDueAt: updated?.next_charge_due_at ?? null,
      premiumExpiresAt: updated?.premium_expires_at ?? null,
    },
    200,
    corsHeaders
  );
}

export const handleCancelSubscription = (env: Env, corsHeaders: Record<string, string>, userId: string) =>
  setCanceled(env, corsHeaders, userId, true);

export const handleResumeSubscription = (env: Env, corsHeaders: Record<string, string>, userId: string) =>
  setCanceled(env, corsHeaders, userId, false);
