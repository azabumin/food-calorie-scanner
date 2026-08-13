import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { DietStatus } from '../types';

type Props = {
  goal: number;
  onGoalChange: (goal: number) => void;
  consumed: number;
  remaining: number;
  status: DietStatus;
  overWarning: boolean;
};

const STATUS_COLOR: Record<DietStatus, string> = {
  ok: COLORS.accent,
  near: COLORS.warning,
  over: COLORS.danger,
};

const STATUS_MESSAGE: Record<DietStatus, string> = {
  ok: '오늘 페이스가 좋아요. 이대로 유지해보세요.',
  near: '목표에 거의 다 왔어요. 저녁은 가볍게 가볼까요?',
  over: '오늘 목표 칼로리를 초과했어요.',
};

export default function SummaryCard({ goal, onGoalChange, consumed, remaining, status, overWarning }: Props) {
  const [goalText, setGoalText] = useState(String(goal));

  useEffect(() => {
    setGoalText(String(goal));
  }, [goal]);

  function commitGoal() {
    const parsed = parseInt(goalText, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onGoalChange(parsed);
    } else {
      setGoalText(String(goal));
    }
  }

  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const barColor = STATUS_COLOR[status];

  return (
    <View style={styles.card}>
      <View style={styles.goalRow}>
        <Text style={styles.goalLabel}>오늘 목표 칼로리</Text>
        <View style={styles.goalInputRow}>
          <TextInput
            style={styles.goalInput}
            value={goalText}
            onChangeText={setGoalText}
            onEndEditing={commitGoal}
            onSubmitEditing={commitGoal}
            keyboardType="number-pad"
            maxLength={5}
          />
          <Text style={styles.goalUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.numbersRow}>
        <View>
          <Text style={styles.numberValue}>{consumed}</Text>
          <Text style={styles.numberLabel}>섭취 kcal</Text>
        </View>
        <View style={styles.numbersRight}>
          <Text style={[styles.numberValue, { color: remaining < 0 ? COLORS.danger : COLORS.text }]}>
            {remaining < 0 ? `+${Math.abs(remaining)}` : remaining}
          </Text>
          <Text style={styles.numberLabel}>{remaining < 0 ? '초과 kcal' : '남은 kcal'}</Text>
        </View>
      </View>

      {overWarning ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠ 아직 저녁 전인데 벌써 목표 칼로리를 넘었어요. 저녁은 가볍게 조절해보세요.
          </Text>
        </View>
      ) : (
        <Text style={[styles.statusText, { color: barColor }]}>{STATUS_MESSAGE[status]}</Text>
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
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    width: 72,
    textAlign: 'right',
    backgroundColor: COLORS.chipBg,
  },
  goalUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  progressTrack: {
    height: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.chipBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  numbersRight: {
    alignItems: 'flex-end',
  },
  numberValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  numberLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  warningBanner: {
    backgroundColor: '#FBEAE7',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  warningText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
