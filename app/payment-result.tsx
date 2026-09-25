import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { fetchMe, loadAuthToken } from '../lib/auth';

type Outcome = 'checking' | 'paid' | 'pending' | 'failed';

const POLL_TIMES = 6;
const POLL_INTERVAL_MS = 2000;

export default function PaymentResultScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [outcome, setOutcome] = useState<Outcome>(status === 'success' ? 'checking' : 'failed');

  // ZEUS tells our server about the payment separately from redirecting the customer back here,
  // so the two can arrive in either order -- ask the server a few times before giving up.
  useEffect(() => {
    if (status !== 'success') {
      setOutcome('failed');
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await loadAuthToken();
      for (let i = 0; i < POLL_TIMES && token; i++) {
        const me = await fetchMe(token);
        if (me?.isPremium) {
          if (!cancelled) setOutcome('paid');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelled) return;
      }
      if (!cancelled) setOutcome('pending');
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {outcome === 'checking' && (
          <>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.body}>
              お支払いの結果を確認しています。反映まで数分かかることがあります。しばらくそのままお待ちください。
            </Text>
          </>
        )}
        {outcome === 'paid' && (
          <>
            <Text style={styles.title}>お支払いが完了しました</Text>
            <Text style={styles.body}>ありがとうございます。プレミアムのすべての機能を、ただちにご利用いただけます。</Text>
          </>
        )}
        {outcome === 'pending' && (
          <>
            <Text style={styles.title}>お支払いの結果を確認中です</Text>
            <Text style={styles.body}>
              反映まで数分かかることがあります。しばらくしてからトップページに戻ってご確認ください。
            </Text>
          </>
        )}
        {outcome === 'failed' && (
          <>
            <Text style={styles.title}>お支払いを完了できませんでした</Text>
            <Text style={styles.body}>
              お支払いは完了していません。カード情報をご確認のうえ、料金プランのページからもう一度お試しください。
            </Text>
            <Link href="/pricing" style={styles.link}>
              <Text style={styles.linkText}>料金プランへ</Text>
            </Link>
          </>
        )}
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>トップページへ戻る</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },
  link: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  linkText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
