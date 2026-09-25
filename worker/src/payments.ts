import { resolveIsPremium } from './auth';
import { sendPaymentFailedEmail } from './email';

// ZEUS LinkPoint (リンク（画面遷移）型) integration.
//
// Flow:
//   1. On /pricing the customer reviews the plan (price, renewal, cancellation all shown) and we
//      hand back LinkPoint form params with money=580 via POST /payments/checkout. The customer
//      pays on ZEUS's hosted page (3-D Secure) and the sale is processed immediately (売上処理方法: 即時).
//   2. ZEUS calls GET /payments/webhook (registered with ZEUS's sales rep in advance) with the
//      result. A successful money>0 callback flips is_premium=1 right away.
//   3. Renewals are NOT automatic on ZEUS's side: each month the operator schedules the charge by
//      hand under 継続予約登録 in ZEUS's dashboard using the same sendid (see docs/billing-cycle.md),
//      skipping anyone with canceled_at set and every 13th cycle (loyalty free month). ZEUS calls
//      the same webhook again for each of those charges.
//   money=0 callbacks (a card registered without a charge) are still handled for cards registered
//   before this flow existed; those customers just pay from /pricing like everyone else.

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const ZEUS_ORDER_URL = 'https://linkpt.cardservice.co.jp/cgi-bin/credit/order.cgi';
// ZEUS's documented CGI-callback source IPs -- checked as a defense-in-depth measure on top
// of the clientip param match, not the sole guard (see handleZeusWebhook).
const ZEUS_CALLBACK_IPS = new Set(['210.164.6.67', '202.221.139.50']);
const TRIAL_DAYS = 7; // keep in sync with lib/membership.ts TRIAL_DAYS
export const MONTHLY_PRICE_YEN = 580; // keep in sync with PRICING.monthlyYen in constants/company.ts
const BILLING_CYCLE_DAYS = 30;
const PREMIUM_GRACE_DAYS = 35;
const DAY_MS = 86_400_000;
// Every 13th cycle (1-indexed) is the loyalty free month -- see constants/company.ts's
// "12ヶ月連続でご利用いただくと、13ヶ月目のご利用料金が無料になります" copy. The monthly
// "who's due" query (docs/billing-cycle.md) uses this same modulus to decide who to skip.

function randomSendId(): string {
  // 20 hex chars, well under LinkPoint's 25-byte sendid limit and unique enough per user.
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

export async function handleCheckoutStart(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string
): Promise<Response> {
  let body: { phone?: unknown; chargeNow?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  // A stale cached page still shows the old "no charge will be made now" wording and sends no
  // flag -- refuse rather than charge someone under copy that says the opposite.
  if (body.chargeNow !== true) {
    return jsonResponse({ error: 'outdated_client' }, 400, corsHeaders);
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!/^0\d{9,10}$/.test(phone)) {
    return jsonResponse({ error: 'invalid_phone' }, 400, corsHeaders);
  }

  const user = await env.USERS_DB.prepare(
    'SELECT id, email, is_premium, premium_expires_at, payment_sendid FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      is_premium: number;
      premium_expires_at: string | null;
      payment_sendid: string | null;
    }>();
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  // Never take a payment from someone who is already premium -- that would be a double charge.
  if (resolveIsPremium(user.email, !!user.is_premium, user.premium_expires_at)) {
    return jsonResponse({ error: 'already_active' }, 409, corsHeaders);
  }

  const sendid = user.payment_sendid ?? randomSendId();
  await env.USERS_DB.prepare('UPDATE users SET phone = ?, payment_sendid = ? WHERE id = ?')
    .bind(phone, sendid, userId)
    .run();

  const origin = request.headers.get('Origin') ?? 'https://dietdiary.jp';
  return jsonResponse(
    {
      action: ZEUS_ORDER_URL,
      params: {
        clientip: env.ZEUS_IP_CODE,
        money: String(MONTHLY_PRICE_YEN),
        sendid,
        telno: phone,
        email: user.email,
        success_url: `${origin}/payment-result?status=success`,
        success_str: 'アプリに戻る',
        failure_url: `${origin}/payment-result?status=failure`,
        failure_str: 'アプリに戻る',
      },
    },
    200,
    corsHeaders
  );
}

// GET callback ZEUS calls server-to-server after every card registration or charge.
// Must always answer 200 with body "successok" (a non-200 or wrong body makes ZEUS retry and
// eventually email us a CGI-error notice) -- so we ack first and only update our own state.
export async function handleZeusWebhook(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const result = url.searchParams.get('result');
  const clientip = url.searchParams.get('clientip');
  const money = url.searchParams.get('money');
  const sendid = url.searchParams.get('sendid');
  // ZEUS-issued unique transaction id. Retried CGI calls for the *same* transaction (their own
  // docs: auto-retry up to 5x on timeout/disconnect) repeat this same value -- used below so a
  // retry doesn't get double-counted as a second month of billing.
  const ordd = url.searchParams.get('ordd');

  const sourceIp = request.headers.get('CF-Connecting-IP') ?? '';
  const knownSource = ZEUS_CALLBACK_IPS.has(sourceIp);
  const knownAccount = !!clientip && clientip === env.ZEUS_IP_CODE;

  if (knownSource && knownAccount && sendid && (result === 'OK' || result === 'NG')) {
    const current = await env.USERS_DB.prepare(
      'SELECT email, is_premium, premium_expires_at, billing_cycle_number, next_charge_due_at, canceled_at, last_processed_ordd FROM users WHERE payment_sendid = ?'
    )
      .bind(sendid)
      .first<{
        email: string;
        is_premium: number;
        premium_expires_at: string | null;
        billing_cycle_number: number;
        next_charge_due_at: string | null;
        canceled_at: string | null;
        last_processed_ordd: string | null;
      }>();

    const alreadyProcessed = !current || (!!ordd && ordd === current.last_processed_ordd);

    if (alreadyProcessed) {
      // Unknown sendid, or this exact transaction was already processed (a ZEUS retry) --
      // ack without touching state again.
    } else if (result === 'NG') {
      // A payment or scheduled renewal failed -- let the customer know so they can try again
      // (or update their card before the grace period runs out).
      await env.USERS_DB.prepare('UPDATE users SET last_processed_ordd = ? WHERE payment_sendid = ?').bind(ordd, sendid).run();
      try {
        await sendPaymentFailedEmail(current.email, env.RESEND_API_KEY);
      } catch (err) {
        console.error('payment_failed_email_error', err);
      }
    } else if (money === '0') {
      // Card registration without a charge (only cards registered before the pay-now flow).
      // Never move the due date of someone who is already paid up.
      const firstChargeDue = new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString();
      await env.USERS_DB.prepare(
        'UPDATE users SET card_registered = 1, next_charge_due_at = CASE WHEN is_premium = 1 THEN next_charge_due_at ELSE ? END, last_processed_ordd = ? WHERE payment_sendid = ?'
      )
        .bind(firstChargeDue, ordd, sendid)
        .run();
    } else {
      // A real charge succeeded: either the customer's pay-now checkout or a monthly renewal
      // the operator scheduled by hand. Grant access and set the next due date.
      const now = new Date();
      const paidAccessLapsed =
        !current.is_premium ||
        !current.premium_expires_at ||
        new Date(current.premium_expires_at).getTime() <= now.getTime();
      // An on-time renewal keeps its cadence (due date + 30d); a first or late payment counts
      // 30 days from today instead of from a due date that is already in the past.
      const dueBaseline =
        !paidAccessLapsed && current.next_charge_due_at && new Date(current.next_charge_due_at).getTime() > now.getTime()
          ? new Date(current.next_charge_due_at)
          : now;
      const nextDue = new Date(dueBaseline.getTime() + BILLING_CYCLE_DAYS * DAY_MS).toISOString();
      // Access lasts a bit past the *next* due date so a manual renewal landing a few days late
      // doesn't lock the customer out early (mirrors rxhelper's grace period).
      const premiumExpiresAt = new Date(dueBaseline.getTime() + PREMIUM_GRACE_DAYS * DAY_MS).toISOString();
      // Paying again after access had lapsed starts a fresh subscription and a fresh "12 months
      // in a row" streak. A stray charge while a cancellation is still pending (the ZEUS
      // reservation wasn't deleted) still pays for a month but must not undo the cancellation.
      const canceledAt = paidAccessLapsed ? null : current.canceled_at;
      const cycle = paidAccessLapsed ? 1 : current.billing_cycle_number + 1;
      await env.USERS_DB.prepare(
        'UPDATE users SET is_premium = 1, premium_expires_at = ?, billing_cycle_number = ?, next_charge_due_at = ?, canceled_at = ?, last_processed_ordd = ? WHERE payment_sendid = ?'
      )
        .bind(premiumExpiresAt, cycle, nextDue, canceledAt, ordd, sendid)
        .run();
    }
  } else if (result === 'OK' || result === 'NG') {
    // Ack it (ZEUS shouldn't retry), but the IP/account check failed -- worth knowing about.
    console.error('zeus_webhook_untrusted', { sourceIp, clientip, sendid });
  }

  return new Response('successok', { status: 200 });
}
