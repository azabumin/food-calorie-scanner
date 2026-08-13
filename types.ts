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
