# dietdiary.jp Stripe決済 開始手順

> ※ 2026-10時点のStripeの新規アカウントでは、「テストモード」の代わりに**「サンドボックス」**と案内されます。この文書の「テストモード」は「サンドボックス」と読み替えてください。サンドボックスで作った商品・価格・クーポンは、本番への切替時に「コピー」機能で移せますが、Webhookのエンドポイントとキーは、本番で新しく作る必要があります（画面の案内と私の推測。切替時に確認）。

**現在の状態（2026-10-05）**：コードは完成し、ローカルテスト済み（偽のStripeで約55項目）です。**本番には未反映で、決済は一時停止中**です。
（`worker/src/payments.ts` の `CHECKOUT_OPEN = false`、`constants/company.ts` の `PAYMENTS_OPEN = false`）
ZEUSの「今日のダイエット日記」契約（IPコード 2011000686）は、2026-10-05にZEUS側が無償でキャンセルしました。

## 0. 全体の流れ
1. Stripeアカウントの作成・審査（アザブさん）→ 2. テストモードで商品・クーポン・Webhookを作成（アザブさん）→
3. 秘密の値4つをWorkerに登録（アザブさん、ターミナル）→ 4. DB列の追加・フラグ切替・デプロイ（Claude）→
5. テストモードで決済・解約・13ヶ月目無料を確認 → 6. 本番モードで同じ設定をやり直して切替

## 1. Stripeアカウント
- https://dashboard.stripe.com で登録。事業者情報（法人または個人事業主）、代表者の本人確認、入金口座、サイトURL（`https://dietdiary.jp`）、特定商取引法の表記URL（`https://dietdiary.jp/legal`）を入力します。
- 事業内容の例：「AIが食事写真からカロリーを推定する、日本語のダイエット記録アプリ（月額プラン）。医療行為・診断は行いません。」
- 審査中でも**テストモード**はすぐ使えます。
- 会社を整理する予定の場合は、アカウントを**個人事業主名義**にするかを先に決めてください（特商法の販売事業者の表記も変わります）。

## 2. Stripeダッシュボード（まずテストモードで）
| 作るもの | 設定 |
|---|---|
| 商品・価格 | 名前「今日のダイエット日記 プレミアム」、**¥580 / 月（定期）**、税区分は**税込み（tax inclusive）** → 価格ID `price_...` |
| クーポン | **100%割引、期間「1回のみ（once）」**、名前「13ヶ月目無料」 → クーポンID |
| Webhook | 開発者 → Webhook → エンドポイントを追加。URL：`https://food-calorie-scanner-api.food-calorie-scanner-worker.workers.dev/payments/stripe-webhook` ／ イベント5つ：`checkout.session.completed`、`invoice.paid`、`invoice.payment_failed`、`customer.subscription.updated`、`customer.subscription.deleted` → 署名シークレット `whsec_...` |
| 設定 | 決済成功時の領収書メールをON、カード明細の表記名（Statement descriptor）を設定 |
※ テストモードと本番モードでは、**商品・クーポン・Webhook・キーがすべて別**です（IDも異なります）。

## 3. Workerの秘密の値（アザブさんがターミナルで直接）
**秘密の値はチャットに貼らないでください。** コマンドを実行すると値を聞かれるので、そこに貼り付けます（2段階）。
```
cd "C:\work\MY_PROJECT\다이어트칼로리측정\worker"
npx wrangler secret put STRIPE_SECRET_KEY            (sk_test_... → 本番切替時に sk_live_...)
npx wrangler secret put STRIPE_WEBHOOK_SECRET        (whsec_...)
npx wrangler secret put STRIPE_PRICE_ID              (price_...)
npx wrangler secret put STRIPE_FREE_MONTH_COUPON_ID  (クーポンID)
```
※ 価格・クーポンIDも秘密の値として登録するのは、wrangler.jsonc の vars に入れると自動生成される型と衝突するためです。

## 4. Claudeが行うこと（キーを登録したとお知らせください）
- 本番DBに列を追加：`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;` ／ `... stripe_subscription_id TEXT;`
- `CHECKOUT_OPEN = true`、`PAYMENTS_OPEN = true` に変更し、Workerとフロントをデプロイ、全体を確認

## 5. テストモードの確認項目
- **安全対策**：`STRIPE_SECRET_KEY` が `sk_test_` で始まる間は、アザブさんのメール（`azabumin@gmail.com` と、その `+` 付きの別名）以外は決済に進めません（テストカードで他人が無料でプレミアムを使えてしまうため）。`sk_live_` に替えると全員に開きます。
- **管理者アカウント本人は常にプレミアム扱いのため、決済できません**（409）。テストは **`azabumin+test1@gmail.com`** のように `+` を付けた別アカウントを新規登録して行ってください（メールは本来の受信箱に届きます）。
- テストカード `4242 4242 4242 4242`（有効期限は未来の任意の日付、CVCは任意の3桁）で決済 → 完了画面 → マイページが「ご利用中」
- マイページで解約 → Stripeダッシュボードの購読が「期間末に解約予定」
- **Stripeの「テストクロック（Test clocks）」で12ヶ月進めて、13回目の請求が0円になるか確認**（クーポンの仕組みは偽のStripeでしか検証していません）
- 決済失敗用のテストカード `4000 0000 0000 0341`：更新失敗 → 失敗のお知らせメール

## 6. 本番への切替
- 本番モードで2（商品・クーポン・Webhook）を作り直し、3の秘密の値4つを本番の値に差し替え
- ご自身のカードで¥580を決済 → すぐマイページで解約 → Stripeダッシュボードで返金（返金しても決済手数料が戻らない場合があるため、Stripeのヘルプで確認）

## 参考
- 手数料：3.6% + 定期課金管理（Billing）0.7% = 4.3%、月額固定費なし（2026-10時点の公式料金ページ）
- 更新はStripeが自動で行うため、ZEUSのような毎月の手作業はありません。返金・不正請求申し立て（チャージバック）はStripeダッシュボードで直接対応し、申し立てのイベントはWorkerでは処理しません。
- 利用期間は、請求期間の末日＋3日の猶予です。支払いが少し遅れても、すぐには止まりません。
- 問題が起きたら、`CHECKOUT_OPEN` / `PAYMENTS_OPEN` を `false` に戻すと、新規の決済がすぐ止まります（既存の購読の更新はStripeが続けます）。
