import type { Tier } from '../types';

export const TRIAL_DAYS = 7;
export const FREE_DAILY_ANALYZE_LIMIT = 1;
export const FREE_TREND_DAYS = 7;
export const PREMIUM_TREND_DAYS = 90;

function daysSince(dateKey: string): number {
  const start = new Date(`${dateKey}T00:00:00`);
  const now = new Date();
  const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTrial = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.floor((startLocal.getTime() - startOfTrial.getTime()) / 86_400_000);
}

// isPremium is always false until phase 2 wires up real payment status — the
// signature already accepts it so gating logic doesn't need to change later.
export function getTier(trialStartDate: string, isPremium: boolean): Tier {
  if (isPremium) return 'premium';
  return daysSince(trialStartDate) < TRIAL_DAYS ? 'trial' : 'free';
}

export function trialDaysRemaining(trialStartDate: string): number {
  return Math.max(0, TRIAL_DAYS - daysSince(trialStartDate));
}

export function canAnalyze(tier: Tier, analyzeCountToday: number): boolean {
  if (tier !== 'free') return true;
  return analyzeCountToday < FREE_DAILY_ANALYZE_LIMIT;
}

export function coachLocked(tier: Tier): boolean {
  return tier === 'free';
}

export function trendDaysAllowed(tier: Tier): number {
  return tier === 'free' ? FREE_TREND_DAYS : PREMIUM_TREND_DAYS;
}
