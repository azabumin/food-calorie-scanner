import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';
import type { Lang, MealEntry } from '../types';

type Props = {
  meals: MealEntry[];
  onDelete: (id: string) => void;
  lang: Lang;
  t: Strings;
};

const TIME_LOCALE: Record<Lang, string> = { ko: 'ko-KR', ja: 'ja-JP' };

export default function MealList({ meals, onDelete, lang, t }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.meals.title(meals.length)}</Text>

      {meals.length === 0 ? (
        <Text style={styles.emptyText}>{t.meals.empty}</Text>
      ) : (
        meals.map((meal, index) => (
          <View key={meal.id} style={[styles.row, index === 0 && styles.rowFirst]}>
            <View style={styles.rowInfo}>
              <Text style={styles.time}>
                {new Date(meal.time).toLocaleTimeString(TIME_LOCALE[lang], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.dishName}>{meal.dishName}</Text>
            </View>
            <Text style={styles.calories}>{meal.totalCalories} kcal</Text>
            <TouchableOpacity onPress={() => onDelete(meal.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>{t.meals.delete}</Text>
            </TouchableOpacity>
          </View>
        ))
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowInfo: {
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  calories: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  deleteButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
