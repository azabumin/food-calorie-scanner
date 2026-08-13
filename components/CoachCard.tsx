import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { CoachAdvice } from '../types';

type Props = {
  advice: CoachAdvice | null;
  loading: boolean;
  errorMsg: string | null;
  onRequest: () => void;
};

export default function CoachCard({ advice, loading, errorMsg, onRequest }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>AI 다이어트 코치</Text>
      <Text style={styles.subtitle}>오늘 식사를 바탕으로 저녁 메뉴와 다이어트 조언을 받아보세요.</Text>

      {!loading && (
        <TouchableOpacity style={styles.button} onPress={onRequest}>
          <Text style={styles.buttonText}>{advice ? '다시 물어보기' : '저녁 뭐 먹을지 물어보기'}</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>코치가 생각하는 중이에요...</Text>
        </View>
      )}

      {!loading && errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {!loading && !errorMsg && advice && (
        <View style={styles.adviceBlock}>
          <View style={styles.adviceSection}>
            <Text style={styles.adviceLabel}>🍽 저녁 추천</Text>
            <Text style={styles.adviceText}>{advice.dinnerAdvice}</Text>
          </View>
          <View style={styles.adviceSection}>
            <Text style={styles.adviceLabel}>💬 코치 한마디</Text>
            <Text style={styles.adviceText}>{advice.coachNote}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  adviceBlock: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  adviceSection: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  adviceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
});
