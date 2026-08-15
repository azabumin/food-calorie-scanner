import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { AuthError, login, register, saveAuthToken } from '../lib/auth';
import type { AuthErrorCode } from '../lib/auth';

type Mode = 'login' | 'register';

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_input: 'メールアドレスまたはパスワードの形式が正しくありません（パスワードは8文字以上)。',
  email_taken: 'このメールアドレスは既に登録されています。ログインをお試しください。',
  invalid_credentials: 'メールアドレスまたはパスワードが正しくありません。',
  rate_limited: '試行回数が上限に達しました。しばらく経ってから再度お試しください。',
  network: 'ネットワークに接続できませんでした。通信状況をご確認ください。',
  unknown: 'エラーが発生しました。時間をおいて再度お試しください。',
};

export default function AccountScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMsg(null);
  }

  async function handleSubmit() {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result =
        mode === 'login' ? await login(normalizedEmail, password) : await register(normalizedEmail, password);
      await saveAuthToken(result.token);
      router.replace('/');
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown';
      setErrorMsg(ERROR_MESSAGES[code]);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !submitting;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>アカウント</Text>
      <Text style={styles.subtitle}>
        ログインすると、機種変更や端末データの削除に影響されずに会員情報を保持できます。
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
          onPress={() => switchMode('login')}
        >
          <Text style={[styles.tabButtonText, mode === 'login' && styles.tabButtonTextActive]}>ログイン</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
          onPress={() => switchMode('register')}
        >
          <Text style={[styles.tabButtonText, mode === 'register' && styles.tabButtonTextActive]}>新規登録</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8文字以上"
          placeholderTextColor={COLORS.textMuted}
        />
        {mode === 'register' && (
          <Text style={styles.helperText}>パスワードは8文字以上で設定してください。</Text>
        )}

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{mode === 'login' ? 'ログイン' : '登録する'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Link href="/" style={styles.backLink}>
        <Text style={styles.backLinkText}>ゲストのまま使う（トップページへ戻る）</Text>
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
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.chipBg,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: SPACING.sm,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
