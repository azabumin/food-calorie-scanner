import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { AuthError, cancelSubscription, fetchMe, loadAuthToken, resumeSubscription } from '../lib/auth';
import type { AuthUser, SubscriptionChange } from '../lib/auth';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function MyPageScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAuthToken().then(async (stored) => {
      if (!stored) {
        setUser(null);
        return;
      }
      setToken(stored);
      setUser(await fetchMe(stored));
    });
  }, []);

  async function runAction(action: (token: string) => Promise<SubscriptionChange>) {
    if (!token) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const change = await action(token);
      setUser((prev) => (prev ? { ...prev, ...change } : prev));
      setConfirming(false);
    } catch (e) {
      setErrorMsg(
        e instanceof AuthError && e.code === 'network'
          ? 'ネットワークに接続できませんでした。通信状況をご確認ください。'
          : 'お手続きを完了できませんでした。時間をおいて再度お試しください。'
      );
      // The state may have changed underneath us (e.g. the paid period just ended) -- re-read it.
      fetchMe(token).then((fresh) => fresh && setUser(fresh));
    } finally {
      setBusy(false);
    }
  }

  // The site owner's own account has no expiry and no renewal to manage.
  const manageable = !!user?.isPremium && !!user.premiumExpiresAt;
  const renewalIso = user?.nextChargeDueAt ?? user?.premiumExpiresAt ?? null;
  const canceled = !!user?.cancelAtPeriodEnd;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      {user === undefined && (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {user === null && (
        <View style={styles.card}>
          <Text style={styles.body}>マイページのご利用にはログインが必要です。</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/account')}>
            <Text style={styles.primaryButtonText}>ログイン画面へ</Text>
          </TouchableOpacity>
        </View>
      )}

      {!!user && (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>メールアドレス</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>ご利用状況</Text>
            <Text style={styles.rowValue}>
              {user.isPremium ? (canceled ? '解約手続き済み（プレミアム）' : 'プレミアム ご利用中（月額プラン）') : '無料プラン'}
            </Text>
          </View>

          {user.isPremium && !canceled && manageable && !!renewalIso && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>次回更新日</Text>
              <Text style={styles.rowValue}>{formatDate(renewalIso)}</Text>
            </View>
          )}

          {user.isPremium && canceled && !!renewalIso && (
            <Text style={styles.body}>
              {`次回の更新は行われません。${formatDate(renewalIso)}まで引き続きプレミアムをご利用いただけます。`}
            </Text>
          )}

          {!user.isPremium && (
            <>
              <Text style={styles.body}>
                プレミアムプランでは、無制限の分析、AI夕食コーチ、30・90日間の記録グラフをご利用いただけます。
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/pricing')}>
                <Text style={styles.primaryButtonText}>料金プランを見る</Text>
              </TouchableOpacity>
            </>
          )}

          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {user.isPremium && !canceled && manageable && !confirming && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setConfirming(true)} disabled={busy}>
              <Text style={styles.secondaryButtonText}>解約する（次回更新を停止）</Text>
            </TouchableOpacity>
          )}

          {user.isPremium && !canceled && manageable && confirming && (
            <>
              <Text style={styles.body}>
                解約すると、次回の更新が停止されます。お支払い済みの期間は引き続きご利用いただけます。解約しますか？
              </Text>
              <TouchableOpacity
                style={[styles.dangerButton, busy && styles.buttonDisabled]}
                onPress={() => runAction(cancelSubscription)}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>解約する</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setConfirming(false)} disabled={busy}>
                <Text style={styles.secondaryButtonText}>やめる</Text>
              </TouchableOpacity>
            </>
          )}

          {user.isPremium && canceled && manageable && (
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={() => runAction(resumeSubscription)}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>解約を取り消す（更新を続ける）</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  row: {
    gap: 2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  rowValue: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 19,
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
  dangerButton: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  secondaryButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
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
