// My Page actions: stop or restore the next renewal. Nothing here talks to ZEUS -- renewals are
// scheduled by hand in ZEUS's dashboard, so cancelling just marks the user (canceled_at) and the
// monthly "who's due" list skips them; the operator also deletes any reservation already made.

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
};

async function loadRow(env: Env, userId: string): Promise<AccountRow | null> {
  return env.USERS_DB.prepare(
    'SELECT is_premium, premium_expires_at, next_charge_due_at, canceled_at FROM users WHERE id = ?'
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
