export type NutrientTotals = {
  protein: number;
  fat: number;
  carbs: number;
};

export type FoodItem = {
  name: string;
  estimatedPortion: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  // True for the one item whose identity IS the dish (its name changes if the user picks a
  // different dishCandidate). Optional so meals saved before this shipped still satisfy the type.
  matchesDishCandidate?: boolean;
};

/**
 * One of the dishes the model thinks the photo might be. The API returns several
 * when two dishes look alike in a photo but differ a lot in calories — 穴子丼 vs
 * うなぎ丼 differ by roughly 300kcal, and after grilling they look nearly identical.
 */
export type DishCandidate = {
  name: string;
  confidence: number; // 0.0 - 1.0
  totalCalories: number;
  reason: string;
};

export type AnalysisResult = {
  dishName: string;
  items: FoodItem[];
  totalCalories: number;
  nutrients: NutrientTotals;
  confidenceNote: string;
  // Optional so meals saved before this shipped still satisfy the type.
  dishCandidates?: DishCandidate[];
  needsConfirmation?: boolean;
  confirmQuestion?: string;
};

export type MealEntry = AnalysisResult & {
  id: string;
  time: string; // ISO timestamp
};

export type DietStatus = 'ok' | 'near' | 'over';

export type CoachAdvice = {
  dinnerAdvice: string;
  coachNote: string;
};

export type Lang = 'ja' | 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'tl' | 'th' | 'my' | 'ne' | 'pt';

export type LanguageMeta = {
  code: Lang;
  native: string;
  english: string;
};

// Same 11-language set and ordering as the prescription-reader sibling app, for consistency
// across the user's app family: ja/ko first (this app's original market), then the largest
// foreign-worker nationalities in Japan, then Portuguese for the Brazilian community, with
// English as a fallback.
export const LANGUAGES: LanguageMeta[] = [
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'zh', native: '中文', english: 'Chinese' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'tl', native: 'Filipino', english: 'Filipino (Tagalog)' },
  { code: 'th', native: 'ภาษาไทย', english: 'Thai' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
];

// Collected once on first launch so the app can compute a personalized daily
// calorie goal (Mifflin-St Jeor BMR -> TDEE -> goal) instead of a flat default.
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type GoalRate = 'maintain' | 'mild' | 'moderate' | 'aggressive';

export type UserProfile = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalRate: GoalRate;
};

// Membership tier — determines feature access. 'premium' is unreachable until
// payment (phase 2) sets isPremium; today it only ever resolves to trial/free.
export type Tier = 'trial' | 'free' | 'premium';

export type TrendDay = {
  date: string;
  consumedCalories: number;
  goalCalories: number;
  status: DietStatus;
  hasData: boolean;
};

export type AchievementTier = 'praise' | 'mild' | 'encourage';
