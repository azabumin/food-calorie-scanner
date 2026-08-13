import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { NutrientTotals } from '../types';

type Props = {
  nutrients: NutrientTotals;
};

const RECOMMENDED = { carbs: 50, protein: 30, fat: 20 };

const MACROS: { key: keyof NutrientTotals; label: string; color: string; kcalPerG: number }[] = [
  { key: 'carbs', label: '탄수화물', color: COLORS.macroCarbs, kcalPerG: 4 },
  { key: 'protein', label: '단백질', color: COLORS.macroProtein, kcalPerG: 4 },
  { key: 'fat', label: '지방', color: COLORS.macroFat, kcalPerG: 9 },
];

export default function NutritionBalance({ nutrients }: Props) {
  const macroCalories = MACROS.map((m) => ({ ...m, kcal: nutrients[m.key] * m.kcalPerG }));
  const totalKcal = macroCalories.reduce((sum, m) => sum + m.kcal, 0);

  if (totalKcal <= 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>영양 밸런스</Text>
        <Text style={styles.emptyText}>아직 기록된 영양 정보가 없어요.</Text>
      </View>
    );
  }

  const withPercent = macroCalories.map((m) => ({ ...m, percent: (m.kcal / totalKcal) * 100 }));
  const shortfall = withPercent
    .map((m) => ({ label: m.label, gap: RECOMMENDED[m.key] - m.percent }))
    .sort((a, b) => b.gap - a.gap)[0];
  const tip =
    shortfall.gap > 10
      ? `오늘은 ${shortfall.label}이(가) 조금 부족해 보여요.`
      : '오늘 영양 밸런스가 균형 잡혀 있어요.';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>영양 밸런스</Text>

      <View style={styles.bar}>
        {withPercent.map((m) => (
          <View key={m.key} style={{ flex: Math.max(m.percent, 2), backgroundColor: m.color }} />
        ))}
      </View>

      <View style={styles.legend}>
        {withPercent.map((m) => (
          <View key={m.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: m.color }]} />
            <Text style={styles.legendLabel}>{m.label}</Text>
            <Text style={styles.legendValue}>
              {Math.round(nutrients[m.key])}g ({Math.round(m.percent)}%)
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.tip}>{tip}</Text>
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
  bar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    backgroundColor: COLORS.chipBg,
  },
  legend: {
    gap: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tip: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
