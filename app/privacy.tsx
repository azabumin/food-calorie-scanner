import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COMPANY } from '../constants/company';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. 収集する情報',
    body: '本サービスは、以下の情報を取り扱います。\n・食事写真: AIによるカロリー分析にのみ使用し、分析後にサーバー上へ保存することはありません。\n・プロフィール情報: 性別・年齢・身長・体重・活動レベル等（目標カロリーの計算にのみ使用）。\n・言語設定、当日の食事記録（お使いの端末内にのみ保存されます）。\n・プレミアムプランご登録時のメールアドレス（ログインのために使用します）。',
  },
  {
    title: '2. 利用目的',
    body: '収集した情報は、カロリー・栄養分析結果の提供、目標カロリーの計算、AI夕食コーチによる助言の生成、プレミアムプランのご提供・ご登録の管理のために利用します。',
  },
  {
    title: '3. 第三者への提供',
    body: '食事写真の分析処理のためAnthropic社（Claude API）に、サービスの稼働基盤としてCloudflare社に、決済処理のため決済代行会社に、それぞれ必要な範囲でデータを送信します。これら委託先以外の第三者への情報提供は、法令に基づく場合を除き行いません。',
  },
  {
    title: '4. 保存期間',
    body: '食事写真そのものは分析後に保存されません。食事記録・プロフィール等はお使いの端末（ブラウザ）内に保存され、当社のサーバーには保存されません。プレミアムプランのご登録情報は、ご契約期間中および法令で定められた期間、適切に管理いたします。',
  },
  {
    title: '5. 開示・訂正・削除のご請求',
    body: 'ご自身の情報の開示・訂正・削除をご希望の場合は、下記お問い合わせ先までご連絡ください。合理的な期間内に対応いたします。',
  },
  {
    title: '6. お問い合わせ窓口',
    body: `${COMPANY.name}\nメールアドレス: ${COMPANY.email}`,
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>プライバシーポリシー</Text>
      <View style={styles.card}>
        {SECTIONS.map((section, index) => (
          <View key={section.title} style={[styles.section, index === 0 && styles.sectionFirst]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
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
  section: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  sectionFirst: {
    borderTopWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sectionBody: {
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
