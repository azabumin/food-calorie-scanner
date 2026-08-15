import { loadLogForDate, todayKey } from './storage';
import type { AchievementTier, DietStatus, MealEntry, TrendDay } from '../types';

const NEAR_GOAL_RATIO = 0.9;

function statusFor(consumed: number, goal: number, hasData: boolean): DietStatus {
  if (!hasData) return 'ok';
  if (consumed > goal) return 'over';
  if (goal > 0 && consumed / goal >= NEAR_GOAL_RATIO) return 'near';
  return 'ok';
}

function dateKeyDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Historical days are evaluated against the CURRENT goal, not whatever goal was
// active on that day (goal changes aren't tracked historically) — a deliberate
// simplification, not a bug.
//
// `todayMeals` is passed in from in-memory state rather than re-read from
// storage — the save-to-storage effect for today's log runs async and isn't
// guaranteed to have flushed yet, so reading storage for "today" specifically
// could return stale data. Past days are stable once the day has ended, so
// those are read from storage as usual.
export async function buildTrendSeries(
  days: number,
  goalCalories: number,
  todayMeals: MealEntry[]
): Promise<TrendDay[]> {
  const today = todayKey();
  const series: TrendDay[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = offset === 0 ? today : dateKeyDaysAgo(offset);
    const meals = offset === 0 ? todayMeals : await loadLogForDate(date);
    const consumedCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
    const hasData = meals.length > 0;
    series.push({
      date,
      consumedCalories,
      goalCalories,
      status: statusFor(consumedCalories, goalCalories, hasData),
      hasData,
    });
  }
  return series;
}

export function computeAchievement(series: TrendDay[]): AchievementTier {
  const withData = series.filter((d) => d.hasData);
  if (withData.length === 0) return 'encourage';
  const successCount = withData.filter((d) => d.status !== 'over').length;
  const rate = successCount / withData.length;
  if (rate >= 0.8) return 'praise';
  if (rate >= 0.5) return 'mild';
  return 'encourage';
}
