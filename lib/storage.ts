import AsyncStorage from '@react-native-async-storage/async-storage';

import { isValidProfile } from './tdee';
import { LANGUAGES } from '../types';
import type { Lang, MealEntry, UserProfile } from '../types';

const GOAL_KEY = 'diet:goalCalories';
const LANG_KEY = 'diet:lang';
const PROFILE_KEY = 'diet:profile';
const TRIAL_START_KEY = 'diet:trialStart';
const DEFAULT_GOAL = 1800;

function analyzeCountKey(date: string): string {
  return `diet:analyzeCount:${date}`;
}

// Local calendar date, not UTC — toISOString() would still report "yesterday"
// during the first few morning hours in UTC+ timezones (e.g. 00:00-09:00 in
// Japan/Korea), silently merging that morning's meals into the previous day's log.
export function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export async function loadLogForDate(date: string): Promise<MealEntry[]> {
  const raw = await AsyncStorage.getItem(logKey(date));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadTodayLog(): Promise<MealEntry[]> {
  return loadLogForDate(todayKey());
}

export async function saveTodayLog(entries: MealEntry[]): Promise<void> {
  await AsyncStorage.setItem(logKey(todayKey()), JSON.stringify(entries));
}

export async function loadLang(): Promise<Lang | null> {
  const raw = await AsyncStorage.getItem(LANG_KEY);
  return LANGUAGES.some((l) => l.code === raw) ? (raw as Lang) : null;
}

export async function saveLang(lang: Lang): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isValidProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Set once on first launch; never overwritten afterward. Basis for the 7-day
// trial window and, once it ends, the permanent free tier.
export async function ensureTrialStart(): Promise<string> {
  const existing = await AsyncStorage.getItem(TRIAL_START_KEY);
  if (existing) return existing;
  const start = todayKey();
  await AsyncStorage.setItem(TRIAL_START_KEY, start);
  return start;
}

export async function loadAnalyzeCountToday(): Promise<number> {
  const raw = await AsyncStorage.getItem(analyzeCountKey(todayKey()));
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function incrementAnalyzeCountToday(): Promise<void> {
  const count = await loadAnalyzeCountToday();
  await AsyncStorage.setItem(analyzeCountKey(todayKey()), String(count + 1));
}

// Always false until phase 2 wires up real payment status.
export async function loadIsPremium(): Promise<boolean> {
  return false;
}
