import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';
import type { AchievementTier, DietStatus, TrendDay } from '../types';

type Props = {
  series: TrendDay[];
  achievement: AchievementTier;
  locked: boolean;
  onUpgradePress: () => void;
  t: Strings;
};

const STATUS_COLOR: Record<DietStatus, string> = {
  ok: COLORS.accent,
  near: COLORS.warning,
  over: COLORS.danger,
};

const ACHIEVEMENT_KEY: Record<AchievementTier, keyof Strings['trend']> = {
  praise: 'achievementPraise',
  mild: 'achievementMild',
  encourage: 'achievementEncourage',
};

const BAR_MAX_HEIGHT = 64;

export default function TrendCard({ series, achievement, locked, onUpgradePress, t }: Props) {
  const hasAnyData = series.some((d) => d.hasData);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.trend.title}</Text>

      {!hasAnyData ? (
        <Text style={styles.emptyText}>{t.trend.emptyText}</Text>
      ) : (
        <>
          <View style={styles.barRow}>
            {series.map((day) => {
              const ratio = day.hasData && day.goalCalories > 0 ? day.consumedCalories / day.goalCalories : 0;
              const height = Math.max(day.hasData ? 4 : 2, Math.min(ratio, 1) * BAR_MAX_HEIGHT);
              return (
                <View key={day.date} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: day.hasData ? STATUS_COLOR[day.status] : COLORS.border,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.achievementText}>{t.trend[ACHIEVEMENT_KEY[achievement]] as string}</Text>
        </>
      )}

      {locked && (
        <TouchableOpacity style={styles.lockedRow} onPress={onUpgradePress}>
          <Text style={styles.lockedText}>{t.trend.lockedTeaser}</Text>
        </TouchableOpacity>
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
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 14,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 14,
    borderRadius: RADIUS.sm,
  },
  achievementText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  lockedRow: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  lockedText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
});
