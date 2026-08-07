import { WORKER_URL } from '../constants/config';
import type { AnalysisResult } from '../types';

export class AnalyzeError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnalyzeError';
  }
}

export async function analyzeFoodPhoto(base64: string, mediaType: string): Promise<AnalysisResult> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType }),
    });
  } catch {
    throw new AnalyzeError('서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.');
  }

  if (response.status === 429) {
    throw new AnalyzeError('오늘 사용 가능한 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.', 429);
  }
  if (!response.ok) {
    throw new AnalyzeError('분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', response.status);
  }

  const data = (await response.json()) as AnalysisResult;
  return data;
}
