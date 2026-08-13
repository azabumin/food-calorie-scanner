import type { ActivityLevel, GoalRate, UserProfile } from '../types';

export const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];
export const GOAL_RATES: GoalRate[] = ['maintain', 'mild', 'moderate', 'aggressive'];

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

// ~500kcal/day deficit is roughly 0.5kg/week (7700kcal per kg of body fat).
const GOAL_DEFICIT: Record<GoalRate, number> = {
  maintain: 0,
  mild: 250,
  moderate: 500,
  aggressive: 750,
};

const MIN_SAFE_CALORIES = 1200;

const AGE_MIN = 10;
const AGE_MAX = 100;
const HEIGHT_MIN_CM = 100;
const HEIGHT_MAX_CM = 250;
const WEIGHT_MIN_KG = 30;
const WEIGHT_MAX_KG = 250;

export function isValidProfile(p: Partial<UserProfile>): p is UserProfile {
  return (
    (p.gender === 'male' || p.gender === 'female') &&
    typeof p.age === 'number' &&
    p.age >= AGE_MIN &&
    p.age <= AGE_MAX &&
    typeof p.heightCm === 'number' &&
    p.heightCm >= HEIGHT_MIN_CM &&
    p.heightCm <= HEIGHT_MAX_CM &&
    typeof p.weightKg === 'number' &&
    p.weightKg >= WEIGHT_MIN_KG &&
    p.weightKg <= WEIGHT_MAX_KG &&
    !!p.activityLevel &&
    ACTIVITY_LEVELS.includes(p.activityLevel) &&
    !!p.goalRate &&
    GOAL_RATES.includes(p.goalRate)
  );
}

// Mifflin-St Jeor BMR -> TDEE -> goal, clamped to a safe floor.
export function calculateGoalCalories(profile: UserProfile): number {
  const bmr =
    profile.gender === 'male'
      ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
      : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIER[profile.activityLevel];
  const goal = tdee - GOAL_DEFICIT[profile.goalRate];
  return Math.max(MIN_SAFE_CALORIES, Math.round(goal));
}
