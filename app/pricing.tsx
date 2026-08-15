import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { PRICING } from '../constants/company';
import { FREE_DAILY_ANALYZE_LIMIT, FREE_TREND_DAYS, PREMIUM_TREND_DAYS } from '../lib/membership';

type Plan = 'monthly' | 'annual';
type Step = 'plans' | 'confirm' | 'pending';

const ANNUAL_SAVINGS_PERCENT = Math.round(100 - (PRICING.annualYen / (PRICING.monthlyYen * 12)) * 100);

function formatTrialEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + PRICING.trialDays);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function PricingScreen() {
  const [step, setStep] = useState<Step>('plans');
  const [plan, setPlan] = useState<Plan>('monthly');

  const price = plan === 'monthly' ? PRICING.monthlyYen : PRICING.annualYen;
  const cadenceLabel = plan === 'monthly' ? '毎月' : '毎年';

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
          <Text style={styles.cardTitle}>プランを選択</Text>
          <View style={styles.planRow}>
            <TouchableOpacity
              style={[styles.planButton, plan === 'monthly' && styles.planButtonActive]}
              onPress={() => setPlan('monthly')}
            >
              <Text style={[styles.planButtonText, plan === 'monthly' && styles.planButtonTextActive]}>
                月額プラン
              </Text>
              <Text style={[styles.planPrice, plan === 'monthly' && styles.planButtonTextActive]}>
                {PRICING.monthlyYen}円 / 月
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planButton, plan === 'annual' && styles.planButtonActive]}
              onPress={() => setPlan('annual')}
            >
              <Text style={[styles.planButtonText, plan === 'annual' && styles.planButtonTextActive]}>
                年額プラン
              </Text>
              <Text style={[styles.planPrice, plan === 'annual' && styles.planButtonTextActive]}>
                {PRICING.annualYen}円 / 年
              </Text>
              <Text style={styles.planBadge}>{`約${ANNUAL_SAVINGS_PERCENT}%お得`}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.trialNote}>
            {`ご登録から${PRICING.trialDays}日間は無料でお試しいただけます。お試し期間終了後、上記プランで自動的に決済されます。`}
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
            <Text style={styles.confirmValue}>{plan === 'monthly' ? '月額プラン' : '年額プラン'}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>初回お支払日（無料お試し終了日）</Text>
            <Text style={styles.confirmValue}>{formatTrialEndDate()}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>お支払い金額</Text>
            <Text style={styles.confirmValue}>{`${price}円（税込）`}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>更新サイクル</Text>
            <Text style={styles.confirmValue}>{`以降、${cadenceLabel}自動更新・決済されます`}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>解約方法</Text>
            <Text style={styles.confirmValue}>
              マイページからいつでも解約手続きが可能です。解約後もお支払い済み期間の終了日まで引き続きご利用いただけます。
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('pending')}>
            <Text style={styles.primaryButtonText}>申し込む</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('plans')}>
            <Text style={styles.secondaryButtonText}>プラン選択に戻る</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'pending' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ただいま準備中です</Text>
          <Text style={styles.pendingText}>
            決済システムの連携を準備しております。ご利用いただけるようになりましたら、あらためてご案内いたします。ご不明な点は下記お問い合わせ先までご連絡ください。
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('plans')}>
            <Text style={styles.secondaryButtonText}>プラン選択に戻る</Text>
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
  planBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  trialNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
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
  pendingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
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
