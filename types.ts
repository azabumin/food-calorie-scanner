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
};

export type AnalysisResult = {
  dishName: string;
  items: FoodItem[];
  totalCalories: number;
  nutrients: NutrientTotals;
  confidenceNote: string;
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
