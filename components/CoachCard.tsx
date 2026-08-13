import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';
import type { CoachAdvice } from '../types';

type Props = {
  advice: CoachAdvice | null;
  loading: boolean;
  errorMsg: string | null;
  onRequest: () => void;
  t: Strings;
};

export default function CoachCard({ advice, loading, errorMsg, onRequest, t }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.coach.title}</Text>
      <Text style={styles.subtitle}>{t.coach.subtitle}</Text>

      {!loading && (
        <TouchableOpacity style={styles.button} onPress={onRequest}>
          <Text style={styles.buttonText}>{advice ? t.coach.askAgainButton : t.coach.askButton}</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.coach.loading}</Text>
        </View>
      )}

      {!loading && errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {!loading && !errorMsg && advice && (
        <View style={styles.adviceBlock}>
          <View style={styles.adviceSection}>
            <Text style={styles.adviceLabel}>{t.coach.dinnerLabel}</Text>
            <Text style={styles.adviceText}>{advice.dinnerAdvice}</Text>
          </View>
          <View style={styles.adviceSection}>
            <Text style={styles.adviceLabel}>{t.coach.noteLabel}</Text>
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
