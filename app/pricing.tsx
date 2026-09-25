import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { PRICING } from '../constants/company';
import { FREE_DAILY_ANALYZE_LIMIT, FREE_TREND_DAYS, PREMIUM_TREND_DAYS } from '../lib/membership';
import { fetchMe, loadAuthToken } from '../lib/auth';
import { CheckoutError, startZeusCheckout, submitZeusOrder } from '../lib/payment';

type Step = 'plans' | 'confirm' | 'phone';

export default function PricingScreen() {
  const [step, setStep] = useState<Step>('plans');
  const [authToken, setAuthToken] = useState<string | null | undefined>(undefined); // undefined = still loading
  const [isPremium, setIsPremium] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAuthToken().then(async (token) => {
      setAuthToken(token);
      if (token) {
        const me = await fetchMe(token);
        if (me) setIsPremium(me.isPremium);
      }
    });
  }, []);

  async function handleSubmitPhone() {
    if (!authToken) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const checkout = await startZeusCheckout(authToken, phone);
      submitZeusOrder(checkout); // navigates the browser away to ZEUS -- nothing after this runs
    } catch (e) {
      setSubmitting(false);
      if (e instanceof CheckoutError && e.code === 'invalid_phone') {
        setErrorMsg('電話番号を正しく入力してください（例：09012345678）。');
      } else if (e instanceof CheckoutError && e.code === 'already_active') {
        setErrorMsg('すでにプレミアムをご利用いただける状態です。トップページに戻ってご確認ください。');
      } else if (e instanceof CheckoutError && e.code === 'unauthorized') {
        setErrorMsg('ログインの有効期限が切れています。お手数ですが再度ログインしてください。');
      } else {
        setErrorMsg('通信エラーが発生しました。しばらくしてからもう一度お試しください。');
      }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>料金プラン</Text>
      <Text style={styles.subtitle}>
        写真1枚でカロリー分析。プレミアムならAI夕食コーチと無制限の分析、30・90日間の記録もご利用いただけます。
      </Text>

      <View style={styles.compareCard}>
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>写真分析</Text>
          <Text style={styles.compareFree}>{`${FREE_DAILY_ANALYZE_LIMIT}回／日`}</Text>
          <Text style={styles.comparePremium}>無制限</Text>
        </View>
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>AI夕食コーチ</Text>
          <Text style={styles.compareFree}>—</Text>
          <Text style={styles.comparePremium}>利用可能</Text>
        </View>
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>記録グラフ</Text>
          <Text style={styles.compareFree}>{`${FREE_TREND_DAYS}日間`}</Text>
          <Text style={styles.comparePremium}>{`${PREMIUM_TREND_DAYS}日間`}</Text>
        </View>
        <View style={styles.compareHeaderRow}>
          <Text style={styles.compareLabel} />
          <Text style={styles.compareHeaderText}>無料</Text>
          <Text style={[styles.compareHeaderText, styles.comparePremiumHeader]}>プレミアム</Text>
        </View>
      </View>

      {step === 'plans' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>プレミアムプラン</Text>
          <View style={styles.planRow}>
            <View style={[styles.planButton, styles.planButtonActive]}>
              <Text style={[styles.planButtonText, styles.planButtonTextActive]}>月額プラン</Text>
              <Text style={[styles.planPrice, styles.planButtonTextActive]}>
                {PRICING.monthlyYen}円 / 月
              </Text>
            </View>
          </View>
          <Text style={styles.loyaltyNote}>
            {`12ヶ月連続でご利用いただくと、13ヶ月目のご利用料金が無料になります。`}
          </Text>
          <Text style={styles.trialNote}>
            {`ご登録から${PRICING.trialDays}日間は、全機能を無料でお試しいただけます（カード登録は不要です）。プレミアムプランは、お申し込みのお支払いを完了した時点で決済され、以降は毎月自動更新されます。`}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('confirm')}>
            <Text style={styles.primaryButtonText}>この内容で申し込む</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'confirm' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>お申し込み内容のご確認</Text>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>プラン</Text>
            <Text style={styles.confirmValue}>{`プレミアム 月額プラン ${PRICING.monthlyYen}円（税込）`}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>今回のお支払い</Text>
            <Text style={styles.confirmValue}>
              {`${PRICING.monthlyYen}円（税込）。「お支払いに進む」を押して次の画面でカード情報を入力すると、ただちに請求され、プレミアムのご利用が始まります。`}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>更新サイクル</Text>
            <Text style={styles.confirmValue}>
              以降、約1か月ごとに自動更新・決済されます（12ヶ月連続でご利用いただくと、13ヶ月目は無料になります）
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>解約方法</Text>
            <Text style={styles.confirmValue}>
              マイページからいつでも解約（次回更新の停止）が可能です。解約後もお支払い済み期間の終了日まで引き続きご利用いただけます。
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('phone')}>
            <Text style={styles.primaryButtonText}>お支払いに進む</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('plans')}>
            <Text style={styles.secondaryButtonText}>プラン選択に戻る</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'phone' && authToken === undefined && (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {step === 'phone' && authToken === null && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ログインが必要です</Text>
          <Text style={styles.confirmValue}>
            お支払いのお手続きにはログインが必要です。ログイン後、もう一度お申し込みください。
          </Text>
          <Link href="/account" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>ログイン画面へ</Text>
          </Link>
        </View>
      )}

      {step === 'phone' && !!authToken && isPremium && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>すでにプレミアムをご利用中です</Text>
          <Text style={styles.confirmValue}>
            ご利用状況の確認や解約のお手続きは、マイページから行えます。
          </Text>
          <Link href="/mypage" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>マイページへ</Text>
          </Link>
        </View>
      )}

      {step === 'phone' && !!authToken && !isPremium && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>連絡先電話番号のご入力</Text>
          <Text style={styles.trialNote}>
            決済サービス提供元（ZEUS）の画面でカード情報をご入力いただくために必要です。
          </Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="09012345678"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSubmitPhone}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{`${PRICING.monthlyYen}円を支払ってプレミアムを開始する`}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('confirm')} disabled={submitting}>
            <Text style={styles.secondaryButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footerLinks}>
        <Link href="/legal" style={styles.footerLink}>
          <Text style={styles.footerLinkText}>特定商取引法に基づく表記</Text>
        </Link>
        <Link href="/terms" style={styles.footerLink}>
          <Text style={styles.footerLinkText}>利用規約</Text>
        </Link>
        <Link href="/privacy" style={styles.footerLink}>
          <Text style={styles.footerLinkText}>プライバシーポリシー</Text>
        </Link>
      </View>
      <Link href="/" style={styles.backLink}>
        <Text style={styles.backLinkText}>トップページへ戻る</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  compareCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
    marginBottom: 2,
  },
  compareHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  comparePremiumHeader: {
    color: COLORS.primaryDark,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compareLabel: {
    flex: 1.4,
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '600',
  },
  compareFree: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  comparePremium: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  planRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  planButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.chipBg,
    gap: 2,
  },
  planButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  planButtonTextActive: {
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  loyaltyNote: {
    fontSize: 12.5,
    color: COLORS.primaryDark,
    fontWeight: '700',
    lineHeight: 18,
  },
  trialNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.chipBg,
  },
  errorText: {
    fontSize: 12.5,
    color: '#C0392B',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
    gap: 2,
  },
  confirmLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  confirmValue: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
