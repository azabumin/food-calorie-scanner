import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';
import { ACTIVITY_LEVELS, GOAL_RATES, isValidProfile } from '../lib/tdee';
import type { ActivityLevel, Gender, GoalRate, UserProfile } from '../types';

type Props = {
  t: Strings;
  initialProfile?: UserProfile;
  onSubmit: (profile: UserProfile) => void;
  onCancel?: () => void;
};

const ACTIVITY_LABEL_KEY: Record<ActivityLevel, keyof Strings['profile']> = {
  sedentary: 'activitySedentary',
  light: 'activityLight',
  moderate: 'activityModerate',
  active: 'activityActive',
  veryActive: 'activityVeryActive',
};

const GOAL_LABEL_KEY: Record<GoalRate, keyof Strings['profile']> = {
  maintain: 'goalMaintain',
  mild: 'goalMild',
  moderate: 'goalModerate',
  aggressive: 'goalAggressive',
};

export default function ProfileSetup({ t, initialProfile, onSubmit, onCancel }: Props) {
  const [gender, setGender] = useState<Gender>(initialProfile?.gender ?? 'male');
  const [age, setAge] = useState(initialProfile ? String(initialProfile.age) : '');
  const [heightCm, setHeightCm] = useState(initialProfile ? String(initialProfile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(initialProfile ? String(initialProfile.weightKg) : '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel ?? 'moderate');
  const [goalRate, setGoalRate] = useState<GoalRate>(initialProfile?.goalRate ?? 'moderate');
  const [showError, setShowError] = useState(false);

  function handleSubmit() {
    const candidate = {
      gender,
      age: parseInt(age, 10),
      heightCm: parseInt(heightCm, 10),
      weightKg: parseInt(weightKg, 10),
      activityLevel,
      goalRate,
    };
    if (!isValidProfile(candidate)) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onSubmit(candidate);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.profile.title}</Text>
      <Text style={styles.subtitle}>{t.profile.subtitle}</Text>

      <Text style={styles.label}>{t.profile.genderLabel}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionButton, gender === 'male' && styles.optionButtonActive]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.optionText, gender === 'male' && styles.optionTextActive]}>
            {t.profile.genderMale}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, gender === 'female' && styles.optionButtonActive]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.optionText, gender === 'female' && styles.optionTextActive]}>
            {t.profile.genderFemale}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t.profile.ageLabel}</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholder={t.profile.agePlaceholder}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>{t.profile.heightLabel}</Text>
      <TextInput
        style={styles.input}
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="number-pad"
        placeholder={t.profile.heightPlaceholder}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>{t.profile.weightLabel}</Text>
      <TextInput
        style={styles.input}
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="number-pad"
        placeholder={t.profile.weightPlaceholder}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>{t.profile.activityLabel}</Text>
      <View style={styles.optionList}>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.listOption, activityLevel === level && styles.listOptionActive]}
            onPress={() => setActivityLevel(level)}
          >
            <Text style={[styles.listOptionText, activityLevel === level && styles.listOptionTextActive]}>
              {t.profile[ACTIVITY_LABEL_KEY[level]] as string}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.profile.goalLabel}</Text>
      <View style={styles.optionList}>
        {GOAL_RATES.map((rate) => (
          <TouchableOpacity
            key={rate}
            style={[styles.listOption, goalRate === rate && styles.listOptionActive]}
            onPress={() => setGoalRate(rate)}
          >
            <Text style={[styles.listOptionText, goalRate === rate && styles.listOptionTextActive]}>
              {t.profile[GOAL_LABEL_KEY[rate]] as string}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showError && <Text style={styles.errorText}>{t.profile.validationError}</Text>}

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>{t.profile.submitButton}</Text>
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t.cancel}</Text>
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
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.chipBg,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.chipBg,
  },
  optionList: {
    gap: SPACING.xs,
  },
  listOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.chipBg,
  },
  listOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  listOptionTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
});
