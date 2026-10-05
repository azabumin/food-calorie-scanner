# 매달 갱신 결제 대상자 뽑는 방법 (継続予約登録 준비) -- rxhelper.jp(ZEUS) 전용

2026-09-25 개정(rxhelper): **첫 결제는 고객이 직접 한다.** 무료체험(7일)이 끝나면 앱의 "お支払いに進む"에서
480円을 즉시 결제하고, ZEUS 웹훅으로 자동 개통된다. 운영자가 매달 하는 일은 **두 번째 달부터의 갱신 결제**를
ZEUS 継続予約登録에 올리는 것뿐이다. (ZEUS 継続予約登録은 자동갱신이 아니라 매달 직접 등록하는 방식.)
※ dietdiary.jp는 2026-10에 Stripe(자동 갱신)로 바뀌었다 -> 아래 dietdiary 절 참고.

## 언제 실행하나
매달 1회, 그 달에 결제 예정일이 있는 사람을 미리 뽑아 ZEUS 継続予約登録에 올린다
(등록 후 예정일 15시부터 처리되므로, 예정일 하루 이틀 전에 미리 등록해 두는 게 안전).

## 실행 방법 (Claude에게 요청)
"이번달 다이어트/처방전 갱신 결제 대상자 뽑아줘" 라고 요청하면 아래 쿼리를 실행해 CSV로 정리해 준다.

### dietdiary.jp -- Stripe (2026-10 이후, 자동) : 매달 하는 일 없음
dietdiary.jp는 ZEUS 계약을 해지하고 **Stripe 정기결제(subscription)**로 옮겼다. Stripe가 매달 자동으로 청구하므로
"이번 달 대상자 뽑기"와 ZEUS 継続予約登録은 **하지 않는다** (아래 rxhelper 절만 해당).
- 첫 결제: 고객이 앱의 「お支払いに進む」 -> Stripe 결제 페이지에서 카드 입력 -> 웹훅(`/payments/stripe-webhook`)이 즉시 프리미엄 개통.
- 매달 갱신: Stripe가 자동 청구 -> `invoice.paid` 웹훅이 이용 기간을 갱신(기간 말 + 3일 여유).
- 13개월째 무료: 12번째 결제 후 워커가 1회용 100% 쿠폰을 구독에 붙인다(`STRIPE_FREE_MONTH_COUPON_ID`) -> 13번째 청구서는 0엔.
- 해지: 고객이 마이페이지에서 해지 -> 워커가 Stripe 구독에 `cancel_at_period_end=true`. 이미 낸 기간 끝까지 이용 가능, 이후 청구 없음.
- 결제 실패: Stripe가 자동 재시도(Smart Retries) + 워커가 실패 안내 메일 발송. 이용 만료일이 지나면 자동으로 무료 등급.
- 환불·분쟁(chargeback) 처리는 Stripe 대시보드에서 직접. (분쟁 이벤트는 워커가 처리하지 않는다.)
- 설정/키/웹훅 등록 절차: docs/stripe-setup.md

### rxhelper.jp (prescription-reader-db)
```sql
SELECT id, email, billing_cycle_number,
       ((billing_cycle_number + 1) % 13 = 0) AS is_free_month
FROM users
WHERE subscription_status = 'active'
  AND canceled_at IS NULL
  AND next_charge_due_at IS NOT NULL
  AND date(next_charge_due_at) <= date('now', '+7 days')
  AND email != 'azabumin@gmail.com'
ORDER BY next_charge_due_at;
```
- `is_free_month = 0` → ZEUS 継続予約登録에 `id,480` 형식으로 등록
- `is_free_month = 1` → 등록하지 말고 위와 같은 방식으로 UPDATE
  (`subscription_expires_at`, `next_charge_due_at`을 `strftime('%Y-%m-%dT%H:%M:%fZ', <컬럼>, '+30 days')`로 +30일, `billing_cycle_number`을 +1.
  날짜는 반드시 ISO 형식(끝이 Z)으로 저장할 것 — `datetime()`은 공백 형식이라 쓰지 않는다)

## 해지한 고객 처리 (매달 같이 확인)
고객이 마이페이지에서 「解約」하면 DB의 `canceled_at`이 채워지고, 위 대상자 목록에서 자동으로 빠진다.
이미 ZEUS에 다음 달 예약을 올려 둔 상태였다면 **ZEUS 継続予約登録 화면에서 그 예약을 삭제**해야 한다
(안 지우면 해지한 고객에게 결제가 나간다 — 이 경우에도 웹훅은 해지 상태를 유지한 채 한 달치 이용만 연장한다).
해지 예정자 확인 (rxhelper):
```sql
SELECT id, email, canceled_at, subscription_expires_at FROM users
WHERE canceled_at IS NOT NULL AND subscription_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
```

## ZEUS 관리자화면 등록 절차 (실제 결제 등록)
1. 売上管理画面 → [継続予約登録]
2. 予約日選択: 원하는 결제일 선택 (당일 처리 원하면 15시 이전 등록)
3. 登録方法選択: [CSV形式登録] → 登録に使用するキー: [ID(sendid)で登録]
4. 위 쿼리 결과를 `sendid,580` (또는 `id,480`) 형식으로 한 줄씩 입력
5. 등록 완료 후 반드시 예약 상황 확인

## 결제 성공/실패 이후
- 성공 시: ZEUS가 `/payments/webhook`을 호출 → DB가 자동으로 `is_premium=1`
  (또는 `subscription_status='active'`) + `billing_cycle_number`/`next_charge_due_at`/만료일 갱신
- 실패 시: 웹훅이 오지 않거나 result=NG로 옴 → 고객에게 실패 안내 메일이 나가고 DB는 갱신되지 않는다.
  다음 달 목록에서 계속 잡히므로 카드 문제로 계속 실패하면 안내가 필요하다
  (이용 만료일이 지나면 자동으로 무료 등급/체험 종료 상태로 돌아간다)
- 이용이 끊긴 뒤 고객이 다시 결제하면(앱의 お支払いに進む) 새 구독으로 시작되고
  「12ヶ月連続」 카운트도 1부터 다시 센다.

## 그 외
- 이전 방식(카드만 등록하고 0円으로 시작)으로 등록된 고객은 `card_registered=1` 또는
  `subscription_status='registered'`로 남아 있다. 이 사람들은 앱의 お支払いに進む에서 직접 결제하면 된다.
- dietdiary DB에는 마이그레이션 시스템이 없어 컬럼을 `wrangler d1 execute`로 직접 추가한다
  (2026-09-25: `canceled_at TEXT`, Stripe 가동 시: `stripe_customer_id TEXT`, `stripe_subscription_id TEXT` -- docs/stripe-setup.md).
  rxhelper는 `worker/migrations/0005_cancel_at_period_end.sql`.
