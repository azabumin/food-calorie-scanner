export type FoodItem = {
  name: string;
  estimatedPortion: string;
  calories: number;
};

export type AnalysisResult = {
  dishName: string;
  items: FoodItem[];
  totalCalories: number;
  confidenceNote: string;
};
