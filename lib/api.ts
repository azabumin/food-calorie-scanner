import { WORKER_URL } from '../constants/config';
import { STRINGS } from './i18n';
import type { AnalysisResult, CoachAdvice, DietStatus, Lang, NutrientTotals } from '../types';

export class AnalyzeError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnalyzeError';
  }
}

export async function analyzeFoodPhoto(
  base64: string,
  mediaType: string,
  lang: Lang
): Promise<AnalysisResult> {
  const t = STRINGS[lang].errors;
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType, lang }),
    });
  } catch {
    throw new AnalyzeError(t.networkError);
  }

  if (response.status === 429) {
    throw new AnalyzeError(t.rateLimited, 429);
  }
  if (!response.ok) {
    throw new AnalyzeError(t.analyzeFailed, response.status);
  }

  const data = (await response.json()) as AnalysisResult;
  return data;
}

export type CoachRequest = {
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  status: DietStatus;
  nutrients: NutrientTotals;
  meals: { dishName: string; calories: number }[];
  lang: Lang;
};

export async function getCoachAdvice(req: CoachRequest): Promise<CoachAdvice> {
  const t = STRINGS[req.lang].errors;
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new AnalyzeError(t.networkError);
  }

  if (response.status === 429) {
    throw new AnalyzeError(t.rateLimited, 429);
  }
  if (!response.ok) {
    throw new AnalyzeError(t.coachFailed, response.status);
  }

  const data = (await response.json()) as CoachAdvice;
  return data;
}
