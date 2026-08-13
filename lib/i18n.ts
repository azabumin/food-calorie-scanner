import type { Lang } from '../types';

export type Strings = {
  app: {
    title: string;
    subtitle: string;
  };
  addCard: {
    cameraButton: string;
    galleryButton: string;
    helper: string;
  };
  errors: {
    cameraPermission: string;
    libraryPermission: string;
    imageProcessFailed: string;
    analyzeGeneric: string;
    pickGeneric: string;
    networkError: string;
    rateLimited: string;
    analyzeFailed: string;
    coachFailed: string;
  };
  result: {
    analyzing: string;
    retry: string;
    totalCalories: string;
    macroLine: (protein: number, fat: number, carbs: number) => string;
    addToLog: string;
    tryAnotherPhoto: string;
  };
  summary: {
    goalLabel: string;
    unit: string;
    consumedLabel: string;
    remainingLabel: string;
    overLabel: string;
    statusOk: string;
    statusNear: string;
    statusOver: string;
    warning: string;
  };
  nutrition: {
    title: string;
    empty: string;
    carbs: string;
    protein: string;
    fat: string;
    tipShortfall: (macro: string) => string;
    tipBalanced: string;
  };
  meals: {
    title: (count: number) => string;
    empty: string;
    delete: string;
  };
  coach: {
    title: string;
    subtitle: string;
    askButton: string;
    askAgainButton: string;
    loading: string;
    dinnerLabel: string;
    noteLabel: string;
  };
  langToggle: {
    ko: string;
    ja: string;
  };
};

const ko: Strings = {
  app: {
    title: '오늘의 다이어트 다이어리',
    subtitle: '사진 한 장으로 칼로리와 영양을 기록하고, AI 코치의 저녁 식사 조언까지 받아보세요.',
  },
  addCard: {
    cameraButton: '사진으로 식사 기록하기',
    galleryButton: '갤러리에서 선택',
    helper: '* AI가 추정한 칼로리·영양이며, 실제 조리법과 양에 따라 오차가 있을 수 있습니다.',
  },
  errors: {
    cameraPermission: '카메라 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.',
    libraryPermission: '사진 접근 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.',
    imageProcessFailed: '이미지를 처리할 수 없습니다.',
    analyzeGeneric: '이미지를 분석하는 중 문제가 발생했습니다.',
    pickGeneric: '사진을 불러오는 중 문제가 발생했습니다.',
    networkError: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.',
    rateLimited: '오늘 사용 가능한 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.',
    analyzeFailed: '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    coachFailed: '코치 조언을 받아오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  },
  result: {
    analyzing: '사진을 분석하고 있어요...',
    retry: '다시 시도',
    totalCalories: '총 칼로리',
    macroLine: (p, f, c) => `단백질 ${p}g · 지방 ${f}g · 탄수화물 ${c}g`,
    addToLog: '오늘 식사 기록에 추가하기',
    tryAnotherPhoto: '다른 사진으로 다시 분석하기',
  },
  summary: {
    goalLabel: '오늘 목표 칼로리',
    unit: 'kcal',
    consumedLabel: '섭취 kcal',
    remainingLabel: '남은 kcal',
    overLabel: '초과 kcal',
    statusOk: '오늘 페이스가 좋아요. 이대로 유지해보세요.',
    statusNear: '목표에 거의 다 왔어요. 저녁은 가볍게 가볼까요?',
    statusOver: '오늘 목표 칼로리를 초과했어요.',
    warning: '⚠ 아직 저녁 전인데 벌써 목표 칼로리를 넘었어요. 저녁은 가볍게 조절해보세요.',
  },
  nutrition: {
    title: '영양 밸런스',
    empty: '아직 기록된 영양 정보가 없어요.',
    carbs: '탄수화물',
    protein: '단백질',
    fat: '지방',
    tipShortfall: (macro) => `오늘은 ${macro}이(가) 조금 부족해 보여요.`,
    tipBalanced: '오늘 영양 밸런스가 균형 잡혀 있어요.',
  },
  meals: {
    title: (count) => `오늘의 식사 (${count})`,
    empty: '아직 기록된 식사가 없어요. 사진을 올려서 첫 식사를 기록해보세요.',
    delete: '삭제',
  },
  coach: {
    title: 'AI 다이어트 코치',
    subtitle: '오늘 식사를 바탕으로 저녁 메뉴와 다이어트 조언을 받아보세요.',
    askButton: '저녁 뭐 먹을지 물어보기',
    askAgainButton: '다시 물어보기',
    loading: '코치가 생각하는 중이에요...',
    dinnerLabel: '🍽 저녁 추천',
    noteLabel: '💬 코치 한마디',
  },
  langToggle: {
    ko: '한국어',
    ja: '日本語',
  },
};

const ja: Strings = {
  app: {
    title: '今日のダイエット日記',
    subtitle: '写真1枚でカロリーと栄養を記録し、AIコーチの夕食アドバイスも受け取れます。',
  },
  addCard: {
    cameraButton: '写真で食事を記録する',
    galleryButton: 'ギャラリーから選択',
    helper: '※ AIが推定したカロリー・栄養です。実際の調理法や量によって誤差が生じることがあります。',
  },
  errors: {
    cameraPermission: 'カメラの権限が必要です。ブラウザまたは端末の設定で権限を許可してください。',
    libraryPermission: '写真へのアクセス権限が必要です。ブラウザまたは端末の設定で権限を許可してください。',
    imageProcessFailed: '画像を処理できませんでした。',
    analyzeGeneric: '画像の分析中に問題が発生しました。',
    pickGeneric: '写真の読み込み中に問題が発生しました。',
    networkError: 'サーバーに接続できません。インターネット接続をご確認ください。',
    rateLimited: '本日利用可能な分析回数を使い切りました。明日また試してください。',
    analyzeFailed: '分析中に問題が発生しました。しばらくしてから再度お試しください。',
    coachFailed: 'コーチのアドバイスを取得できませんでした。しばらくしてから再度お試しください。',
  },
  result: {
    analyzing: '写真を分析しています...',
    retry: '再試行',
    totalCalories: '合計カロリー',
    macroLine: (p, f, c) => `タンパク質 ${p}g・脂質 ${f}g・炭水化物 ${c}g`,
    addToLog: '今日の食事記録に追加する',
    tryAnotherPhoto: '別の写真でもう一度分析する',
  },
  summary: {
    goalLabel: '今日の目標カロリー',
    unit: 'kcal',
    consumedLabel: '摂取 kcal',
    remainingLabel: '残り kcal',
    overLabel: '超過 kcal',
    statusOk: '今日のペースは良好です。このまま維持しましょう。',
    statusNear: '目標にかなり近づいています。夕食は軽めにしましょうか?',
    statusOver: '今日の目標カロリーを超えました。',
    warning: '⚠ まだ夕食前なのに、もう目標カロリーを超えています。夕食は軽めに調整しましょう。',
  },
  nutrition: {
    title: '栄養バランス',
    empty: 'まだ栄養情報が記録されていません。',
    carbs: '炭水化物',
    protein: 'タンパク質',
    fat: '脂質',
    tipShortfall: (macro) => `今日は${macro}がやや不足しているようです。`,
    tipBalanced: '今日の栄養バランスは良好です。',
  },
  meals: {
    title: (count) => `今日の食事 (${count})`,
    empty: 'まだ記録された食事がありません。写真をアップロードして最初の食事を記録しましょう。',
    delete: '削除',
  },
  coach: {
    title: 'AIダイエットコーチ',
    subtitle: '今日の食事をもとに、夕食メニューとダイエットアドバイスを受け取りましょう。',
    askButton: '夕食は何を食べるべきか聞いてみる',
    askAgainButton: 'もう一度聞いてみる',
    loading: 'コーチが考えています...',
    dinnerLabel: '🍽 夕食のおすすめ',
    noteLabel: '💬 コーチからの一言',
  },
  langToggle: {
    ko: '한국어',
    ja: '日本語',
  },
};

export const STRINGS: Record<Lang, Strings> = { ko, ja };

export function detectDefaultLang(): Lang {
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'ko';
  }
  return 'ko';
}
