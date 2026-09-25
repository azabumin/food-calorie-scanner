// Sends transactional emails via Resend (https://resend.com).
//
// dietdiary.jp's DNS lives at お名前.com (dnsv.jp nameservers), not on Cloudflare, so
// Cloudflare Email Service's `send_email` binding can't onboard it (needs a Cloudflare-managed
// zone to write SPF/DKIM into). Resend only needs a few DNS records added wherever the domain's
// DNS already lives -- no nameserver migration -- so that's the path this project uses
// (same approach as rxhelper.jp's worker/src/email.ts).
//
// Setup (one-time, done outside this codebase):
//   1. Create a free Resend account at resend.com (can reuse the same account as rxhelper.jp --
//      Resend supports multiple verified sending domains on one account).
//   2. Add dietdiary.jp as a sending domain there; it gives you SPF/DKIM records to add at
//      お名前.com (same DNS panel already used for the GitHub Pages A-records -- these are
//      TXT/CNAME records, so they don't conflict with the existing A records).
//   3. Wait for Resend to verify the domain (DNS propagation, usually minutes).
//   4. Create an API key in the Resend dashboard.
//   5. Run `wrangler secret put RESEND_API_KEY` in worker/ and paste the key.
// Until RESEND_API_KEY is set, this just logs the email (visible via `wrangler tail`) instead
// of failing -- see the fallback below.

const FROM = 'ダイエット日記 <noreply@dietdiary.jp>';

const PAYMENT_FAILED_SUBJECT_JA = '【重要】お支払いが完了しませんでした / Payment Failed';

function paymentFailedBody(): string {
  return (
    '（日本語）\n' +
    'いつもご利用いただきありがとうございます。\n' +
    'ご登録のクレジットカードでのお支払い処理が完了しませんでした。\n' +
    'カードの有効期限切れや利用限度額などが原因の場合がございます。\n' +
    'お手数ですが、マイページからカード情報をご確認・更新ください。\n' +
    '一定期間お支払いが確認できない場合、プレミアム機能のご利用が停止されます。\n\n' +
    '(English)\n' +
    'Thank you for using our service.\n' +
    "We were unable to process your payment with the credit card on file.\n" +
    'This can happen if the card has expired or reached its limit.\n' +
    'Please check and update your card details from My Page.\n' +
    'If payment cannot be confirmed within the grace period, premium access will be paused.'
  );
}

function textToHtml(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

async function sendViaResend(
  to: string,
  subject: string,
  text: string,
  resendApiKey: string | undefined,
  logTag: string
): Promise<void> {
  if (!resendApiKey) {
    console.log(logTag, { to, subject });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, text, html: textToHtml(text) }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API ${response.status}: ${errText}`);
  }
}

// Sent when a scheduled ZEUS charge (継続予約登録 renewal, or the initial trial-end charge)
// comes back result=NG. Not localized per-user (we don't store a server-side language
// preference) -- bilingual JA/EN covers the large majority of this app's users well enough
// for a safety-net notice like this.
export async function sendPaymentFailedEmail(email: string, resendApiKey: string | undefined): Promise<void> {
  await sendViaResend(email, PAYMENT_FAILED_SUBJECT_JA, paymentFailedBody(), resendApiKey, 'payment_failed_email_not_configured');
}
