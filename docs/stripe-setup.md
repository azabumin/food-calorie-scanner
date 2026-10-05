# dietdiary.jp Stripe 결제 가동 절차

> ※ 2026-10 현재 Stripe 신규 계정에서는 '테스트 모드' 대신 **'샌드박스(sandbox)'**로 안내됩니다. 이 문서의 '테스트 모드'는 '샌드박스'로 읽으세요. 샌드박스에서 만든 상품·가격·쿠폰은 본번 전환 때 '복사' 기능으로 옮길 수 있지만, 웹훅 엔드포인트와 API 키는 본번에서 새로 만들어야 합니다(화면 안내와 추정; 전환 때 확인).

**현재 상태 (2026-10-05)**: 코드는 완성·로컬 테스트 완료(가짜 Stripe로 약 55개 항목), **본번 미배포·결제는 일시정지** 상태입니다.
(`worker/src/payments.ts`의 `CHECKOUT_OPEN = false`, `constants/company.ts`의 `PAYMENTS_OPEN = false`)
ZEUS의 다이어트 일기 계약(IPコード 2011000686)은 2026-10-05에 ZEUS가 무료로 취소했습니다.

## 0. 전체 순서
1. Stripe 계정 만들기·심사 (아자부님) → 2. 테스트 모드에서 상품·쿠폰·웹훅 만들기 (아자부님) →
3. 비밀값 4개를 워커에 넣기 (아자부님, 터미널) → 4. DB 컬럼 추가·플래그 켜기·배포 (Claude) →
5. 테스트 모드로 결제·해지·13개월째 무료 확인 → 6. 라이브 모드로 같은 설정을 다시 하고 전환

## 1. Stripe 계정
- https://dashboard.stripe.com 에서 가입 → 사업자 정보(법인 또는 개인사업자), 대표자 본인 확인, 입금 계좌, 사이트 URL(`https://dietdiary.jp`), 특정상거래법 표기 URL(`https://dietdiary.jp/legal`)을 입력합니다.
- 사업 설명 예: 「AIが食事写真からカロリーを推定する、日本語のダイエット記録アプリ（月額プラン）。医療行為・診断は行いません。」
- 심사 중에도 **테스트 모드**는 바로 쓸 수 있습니다.
- 회사를 정리하실 계획이면 계정을 **개인사업자 명의**로 만들지 먼저 정하세요(특상법의 판매 사업자 표기도 같이 바뀝니다).

## 2. Stripe 대시보드 (테스트 모드에서 먼저)
| 만들 것 | 설정 |
|---|---|
| 상품·가격 | 이름「今日のダイエット日記 プレミアム」, **¥580 / 월(정기)**, 세금 구분은 **세금 포함(tax inclusive)** → 가격 ID `price_...` |
| 쿠폰 | **100% 할인, 기간「1회(once)」**, 이름「13ヶ月目無料」 → 쿠폰 ID |
| 웹훅 | 개발자 → 웹훅 → 엔드포인트 추가. URL: `https://food-calorie-scanner-api.food-calorie-scanner-worker.workers.dev/payments/stripe-webhook` / 이벤트 5개: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` → 서명 시크릿 `whsec_...` |
| 설정 | 결제 성공 시 영수증 메일 ON, 카드 명세서 표기명(Statement descriptor) 설정 |
※ 테스트 모드와 라이브 모드는 **상품·쿠폰·웹훅·키가 모두 따로**입니다(ID도 다릅니다).

## 3. 워커 비밀값 (아자부님이 터미널에서 직접)
**비밀값은 채팅에 붙여 넣지 마세요.** 명령을 실행하면 값을 묻는 프롬프트가 나오고, 거기에 붙여 넣습니다(2단계).
```
cd "C:\work\MY_PROJECT\다이어트칼로리측정\worker"
npx wrangler secret put STRIPE_SECRET_KEY            (sk_test_... → 라이브 전환 시 sk_live_...)
npx wrangler secret put STRIPE_WEBHOOK_SECRET        (whsec_...)
npx wrangler secret put STRIPE_PRICE_ID              (price_...)
npx wrangler secret put STRIPE_FREE_MONTH_COUPON_ID  (쿠폰 ID)
```
※ 가격·쿠폰 ID도 비밀값으로 넣는 이유: wrangler.jsonc의 vars에 넣으면 자동 생성 타입과 충돌하기 때문입니다.

## 4. Claude가 할 일 (키를 넣었다고 알려 주시면)
- 운영 DB에 컬럼 추가: `ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;` / `... stripe_subscription_id TEXT;`
- `CHECKOUT_OPEN = true`, `PAYMENTS_OPEN = true`로 바꾸고 워커·프런트를 배포, 전체 확인

## 5. 테스트 모드 확인 목록
- **안전장치**: `STRIPE_SECRET_KEY`가 `sk_test_`로 시작하는 동안은 아자부님 메일(`azabumin@gmail.com`과 `+`가 붙은 별칭) 외에는 결제로 진행할 수 없습니다(테스트 카드로 타인이 무료 프리미엄을 쓰는 것을 막기 위해). `sk_live_`로 바꾸면 모두에게 열립니다.
- **관리자 계정 본인은 항상 프리미엄 취급이라 결제할 수 없습니다**(409). 테스트는 **`azabumin+test1@gmail.com`**처럼 `+`를 붙인 별도 계정을 새로 가입해서 하세요(메일은 원래 받은편지함으로 옵니다).
- 테스트 카드 `4242 4242 4242 4242`(유효기간은 미래 아무 날짜, CVC 아무 3자리)로 결제 → 완료 화면 → 마이페이지가 「ご利用中」
- 마이페이지에서 해지 → Stripe 대시보드의 구독이 「기간 말에 취소 예정」
- **Stripe의「테스트 시계(Test clocks)」로 12개월 진행해서 13번째 청구서가 0엔인지 확인** (쿠폰 로직은 가짜 Stripe로만 검증했습니다)
- 결제 실패용 테스트 카드 `4000 0000 0000 0341`: 갱신 실패 → 실패 안내 메일

## 6. 라이브 전환
- 라이브 모드에서 2번(상품·쿠폰·웹훅)을 다시 만들고, 3번의 비밀값 4개를 라이브 값으로 교체
- 본인 카드로 ¥580 결제 → 바로 마이페이지에서 해지 → Stripe 대시보드에서 환불(환불해도 결제 수수료가 돌아오지 않을 수 있으니 Stripe 도움말에서 확인)

## 참고
- 수수료: 3.6% + 정기결제 관리(Billing) 0.7% = 4.3%, 월 고정비 없음 (2026-10 공식 요금 페이지 기준)
- 갱신은 Stripe가 자동으로 하므로 ZEUS식 월 수작업은 없습니다. 환불·분쟁(chargeback)은 Stripe 대시보드에서 직접 처리하며, 분쟁 이벤트는 워커가 처리하지 않습니다.
- 이용 기간은 청구 기간 말 + 3일 여유입니다. 결제가 늦어져도 바로 끊기지 않습니다.
- 문제가 생기면 `CHECKOUT_OPEN`/`PAYMENTS_OPEN`을 `false`로 되돌리면 즉시 신규 결제가 멈춥니다(기존 구독 갱신은 Stripe가 계속합니다).
