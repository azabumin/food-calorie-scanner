import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COMPANY, PRICING } from '../constants/company';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const ARTICLES: { title: string; body: string }[] = [
  {
    title: '第1条（適用）',
    body: `本規約は、${COMPANY.name}（以下「当社」といいます）が提供する「今日のダイエット日記」（以下「本サービス」といいます）の利用に関する条件を定めるものです。ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。`,
  },
  {
    title: '第2条（サービス内容）',
    body: '本サービスは、ユーザーが撮影した食事写真をAIが分析し、推定カロリー・栄養素、目標カロリーの提案、AI夕食コーチによるアドバイス等を提供するものです。AIによる分析結果は推定値であり、実際の調理法・分量等により誤差が生じる場合があります。本サービスは医療・栄養に関する専門的な助言を提供するものではありません。',
  },
  {
    title: '第3条（利用登録）',
    body: '本サービスの一部機能（無料プラン、無料お試し期間）は登録なしでご利用いただけます。プレミアムプランのご利用には、当社所定の方法による登録が必要です。',
  },
  {
    title: '第4条（料金・お支払い）',
    body: `プレミアムプランは月額${PRICING.monthlyYen}円（税込）です。新規登録から${PRICING.trialDays}日間は無料でお試しいただけます。お試し期間終了後、自動的に決済され、以降も毎月自動更新されます。12ヶ月連続でご利用いただいた場合、13ヶ月目のご利用料金は無料になります。料金・お支払い条件の詳細は特定商取引法に基づく表記をご確認ください。`,
  },
  {
    title: '第5条（解約）',
    body: 'ユーザーはいつでもマイページから次回更新の停止（解約）手続きを行うことができます。解約後も、お支払い済みの期間の終了日まで引き続きプレミアム機能をご利用いただけます。お支払い済みの料金の返金は原則として行いません。',
  },
  {
    title: '第6条（禁止事項）',
    body: '法令または公序良俗に違反する行為、当社または第三者の権利を侵害する行為、本サービスの運営を妨害する行為、不正な方法により本サービスを利用する行為を禁止します。',
  },
  {
    title: '第7条（免責事項）',
    body: '本サービスが提供するカロリー・栄養情報および助言は、医療行為・医学的アドバイスに代わるものではありません。健康・医療に関する判断は、必ず医師等の専門家にご相談ください。当社は、本サービスの利用により生じた損害について、当社に故意または重過失がある場合を除き、責任を負わないものとします。',
  },
  {
    title: '第8条（サービス内容の変更・停止）',
    body: '当社は、ユーザーへの事前の通知をもって、本サービスの内容を変更し、または提供を中断・終了することがあります。',
  },
  {
    title: '第9条（準拠法・管轄裁判所）',
    body: '本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>利用規約</Text>
      <View style={styles.card}>
        {ARTICLES.map((article, index) => (
          <View key={article.title} style={[styles.article, index === 0 && styles.articleFirst]}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleBody}>{article.body}</Text>
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
  article: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  articleFirst: {
    borderTopWidth: 0,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  articleBody: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
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
