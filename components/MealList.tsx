import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { MealEntry } from '../types';

type Props = {
  meals: MealEntry[];
  onDelete: (id: string) => void;
};

export default function MealList({ meals, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>오늘의 식사 ({meals.length})</Text>

      {meals.length === 0 ? (
        <Text style={styles.emptyText}>아직 기록된 식사가 없어요. 사진을 올려서 첫 식사를 기록해보세요.</Text>
      ) : (
        meals.map((meal, index) => (
          <View key={meal.id} style={[styles.row, index === 0 && styles.rowFirst]}>
            <View style={styles.rowInfo}>
              <Text style={styles.time}>
                {new Date(meal.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.dishName}>{meal.dishName}</Text>
            </View>
            <Text style={styles.calories}>{meal.totalCalories} kcal</Text>
            <TouchableOpacity onPress={() => onDelete(meal.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>삭제</Text>
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
