import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Lang, MealEntry } from '../types';

const GOAL_KEY = 'diet:goalCalories';
const LANG_KEY = 'diet:lang';
const DEFAULT_GOAL = 1800;

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function logKey(date: string): string {
  return `diet:log:${date}`;
}

export async function loadGoalCalories(): Promise<number> {
  const raw = await AsyncStorage.getItem(GOAL_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GOAL;
}

export async function saveGoalCalories(goal: number): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, String(Math.round(goal)));
}

export async function loadTodayLog(): Promise<MealEntry[]> {
  const raw = await AsyncStorage.getItem(logKey(todayKey()));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTodayLog(entries: MealEntry[]): Promise<void> {
  await AsyncStorage.setItem(logKey(todayKey()), JSON.stringify(entries));
}

export async function loadLang(): Promise<Lang | null> {
  const raw = await AsyncStorage.getItem(LANG_KEY);
  return raw === 'ko' || raw === 'ja' ? raw : null;
}

export async function saveLang(lang: Lang): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
}
