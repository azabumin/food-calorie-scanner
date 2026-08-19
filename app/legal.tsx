import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COMPANY, PRICING } from '../constants/company';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const ROWS: { label: string; value: string }[] = [
  { label: '販売事業者', value: COMPANY.name },
  { label: '代表責任者', value: COMPANY.representative },
  { label: '所在地', value: COMPANY.address },
  {
    label: 'お問い合わせ',
    value: `メールアドレス: ${COMPANY.email}\n電話番号: ご請求をいただいた場合、遅滞なく開示いたします。`,
  },
  {
    label: '販売価格',
    value: `月額プラン ${PRICING.monthlyYen}円（税込）\n※12ヶ月連続でご利用いただいた場合、13ヶ月目のご利用料金が無料になります。`,
  },
  { label: '商品代金以外の必要料金', value: 'インターネット接続に伴う通信費はお客様のご負担となります。' },
  { label: 'お支払い方法', value: 'クレジットカード決済' },
  {
    label: 'お支払い時期',
    value: `ご登録から${PRICING.trialDays}日間は無料でお試しいただけます。お試し期間終了後、月額プランで自動的に決済が行われます。以降、毎月、初回契約日に対応する日に自動更新・決済されます。`,
  },
  { label: 'サービス提供時期', value: 'お支払い手続き完了後、直ちにご利用いただけます。' },
  {
    label: '返品・キャンセルについて',
    value:
      'デジタルサービスの性質上、お支払い済みの料金の返金は原則としてお受けしておりません。次回の自動更新の停止（解約）はいつでもマイページから手続きいただけます。解約後も、お支払い済みの期間の終了日まで引き続きプレミアム機能をご利用いただけます。',
  },
  { label: '動作環境', value: '最新版のGoogle Chrome、Safari、Microsoft Edge等のWebブラウザ' },
];

export default function LegalScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>特定商取引法に基づく表記</Text>
      <View style={styles.card}>
        {ROWS.map((row, index) => (
          <View key={row.label} style={[styles.row, index === 0 && styles.rowFirst]}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  row: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
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
