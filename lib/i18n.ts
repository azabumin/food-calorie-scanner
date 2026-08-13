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
  profile: {
    title: string;
    subtitle: string;
    genderLabel: string;
    genderMale: string;
    genderFemale: string;
    ageLabel: string;
    agePlaceholder: string;
    heightLabel: string;
    heightPlaceholder: string;
    weightLabel: string;
    weightPlaceholder: string;
    activityLabel: string;
    activitySedentary: string;
    activityLight: string;
    activityModerate: string;
    activityActive: string;
    activityVeryActive: string;
    goalLabel: string;
    goalMaintain: string;
    goalMild: string;
    goalModerate: string;
    goalAggressive: string;
    submitButton: string;
    validationError: string;
    editLink: string;
  };
  chooseLanguage: string;
  cancel: string;
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
  profile: {
    title: '프로필 설정',
    subtitle: '입력하신 정보로 나에게 맞는 하루 목표 칼로리를 계산해드려요.',
    genderLabel: '성별',
    genderMale: '남성',
    genderFemale: '여성',
    ageLabel: '나이',
    agePlaceholder: '예: 35',
    heightLabel: '키 (cm)',
    heightPlaceholder: '예: 170',
    weightLabel: '체중 (kg)',
    weightPlaceholder: '예: 65',
    activityLabel: '활동량',
    activitySedentary: '거의 안 움직임 (운동 거의 안 함)',
    activityLight: '가벼운 활동 (주 1~3일 운동)',
    activityModerate: '보통 활동 (주 3~5일 운동)',
    activityActive: '활발한 활동 (주 6~7일 운동)',
    activityVeryActive: '매우 활발함 (매일 강도 높은 운동·육체노동)',
    goalLabel: '목표',
    goalMaintain: '체중 유지',
    goalMild: '천천히 감량 (주당 약 0.25kg)',
    goalModerate: '감량 (주당 약 0.5kg)',
    goalAggressive: '빠르게 감량 (주당 약 0.75kg)',
    submitButton: '목표 칼로리 계산하기',
    validationError: '모든 항목을 올바르게 입력해 주세요.',
    editLink: '프로필 수정',
  },
  chooseLanguage: '언어 선택',
  cancel: '취소',
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
  profile: {
    title: 'プロフィール設定',
    subtitle: '入力した情報から、あなたに合った1日の目標カロリーを計算します。',
    genderLabel: '性別',
    genderMale: '男性',
    genderFemale: '女性',
    ageLabel: '年齢',
    agePlaceholder: '例: 35',
    heightLabel: '身長 (cm)',
    heightPlaceholder: '例: 170',
    weightLabel: '体重 (kg)',
    weightPlaceholder: '例: 65',
    activityLabel: '活動レベル',
    activitySedentary: 'ほぼ運動しない',
    activityLight: '軽い運動 (週1〜3日)',
    activityModerate: '普通の運動 (週3〜5日)',
    activityActive: '活発な運動 (週6〜7日)',
    activityVeryActive: '非常に活発 (毎日激しい運動・肉体労働)',
    goalLabel: '目標',
    goalMaintain: '体重を維持する',
    goalMild: 'ゆっくり減量 (週あたり約0.25kg)',
    goalModerate: '減量する (週あたり約0.5kg)',
    goalAggressive: '早めに減量 (週あたり約0.75kg)',
    submitButton: '目標カロリーを計算する',
    validationError: 'すべての項目を正しく入力してください。',
    editLink: 'プロフィールを編集',
  },
  chooseLanguage: '言語を選択',
  cancel: 'キャンセル',
};

const en: Strings = {
  app: {
    title: "Today's Diet Diary",
    subtitle: 'Snap a photo of your meal to log calories and nutrition, and get dinner advice from your AI coach.',
  },
  addCard: {
    cameraButton: 'Log a Meal by Photo',
    galleryButton: 'Choose from Gallery',
    helper: '* Calories and nutrition are AI estimates and may vary from the actual recipe and portion size.',
  },
  errors: {
    cameraPermission: 'Camera access is needed. Please allow it in your browser or device settings.',
    libraryPermission: 'Photo access is needed. Please allow it in your browser or device settings.',
    imageProcessFailed: 'Could not process the image.',
    analyzeGeneric: 'Something went wrong while analyzing the photo.',
    pickGeneric: 'There was a problem loading the photo.',
    networkError: 'Could not connect to the server. Please check your internet connection.',
    rateLimited: "Today's analysis limit has been reached. Please try again tomorrow.",
    analyzeFailed: 'Something went wrong during analysis. Please try again in a moment.',
    coachFailed: 'Could not get advice from the coach. Please try again in a moment.',
  },
  result: {
    analyzing: 'Analyzing your photo...',
    retry: 'Try Again',
    totalCalories: 'Total Calories',
    macroLine: (p, f, c) => `Protein ${p}g · Fat ${f}g · Carbs ${c}g`,
    addToLog: "Add to Today's Log",
    tryAnotherPhoto: 'Analyze Another Photo',
  },
  summary: {
    goalLabel: "Today's Calorie Goal",
    unit: 'kcal',
    consumedLabel: 'kcal eaten',
    remainingLabel: 'kcal left',
    overLabel: 'kcal over',
    statusOk: "You're on a good pace today. Keep it up.",
    statusNear: "You're almost at your goal. Maybe go light on dinner?",
    statusOver: "You've gone over today's calorie goal.",
    warning: "⚠ It's not even dinner yet and you're already over your goal. Try to keep dinner light.",
  },
  nutrition: {
    title: 'Nutrition Balance',
    empty: 'No nutrition data recorded yet.',
    carbs: 'Carbs',
    protein: 'Protein',
    fat: 'Fat',
    tipShortfall: (macro) => `You could use a bit more ${macro} today.`,
    tipBalanced: 'Your nutrition balance looks good today.',
  },
  meals: {
    title: (count) => `Today's Meals (${count})`,
    empty: 'No meals logged yet. Upload a photo to log your first meal.',
    delete: 'Delete',
  },
  coach: {
    title: 'AI Diet Coach',
    subtitle: "Get dinner suggestions and diet advice based on today's meals.",
    askButton: 'Ask What to Eat for Dinner',
    askAgainButton: 'Ask Again',
    loading: 'The coach is thinking...',
    dinnerLabel: '🍽 Dinner Suggestion',
    noteLabel: "💬 Coach's Note",
  },
  profile: {
    title: 'Set Up Your Profile',
    subtitle: "We'll use this to calculate a daily calorie goal that fits you.",
    genderLabel: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    ageLabel: 'Age',
    agePlaceholder: 'e.g. 35',
    heightLabel: 'Height (cm)',
    heightPlaceholder: 'e.g. 170',
    weightLabel: 'Weight (kg)',
    weightPlaceholder: 'e.g. 65',
    activityLabel: 'Activity Level',
    activitySedentary: 'Sedentary (little or no exercise)',
    activityLight: 'Light (exercise 1-3 days/week)',
    activityModerate: 'Moderate (exercise 3-5 days/week)',
    activityActive: 'Active (exercise 6-7 days/week)',
    activityVeryActive: 'Very Active (hard exercise or physical job)',
    goalLabel: 'Goal',
    goalMaintain: 'Maintain Weight',
    goalMild: 'Lose Weight Gradually (~0.25kg/week)',
    goalModerate: 'Lose Weight (~0.5kg/week)',
    goalAggressive: 'Lose Weight Faster (~0.75kg/week)',
    submitButton: 'Calculate My Goal',
    validationError: 'Please fill in all fields with valid values.',
    editLink: 'Edit Profile',
  },
  chooseLanguage: 'Choose Language',
  cancel: 'Cancel',
};

const vi: Strings = {
  app: {
    title: 'Nhật Ký Ăn Kiêng Hôm Nay',
    subtitle: 'Chụp ảnh bữa ăn để ghi lại calo và dinh dưỡng, đồng thời nhận lời khuyên bữa tối từ huấn luyện viên AI.',
  },
  addCard: {
    cameraButton: 'Ghi Lại Bữa Ăn Bằng Ảnh',
    galleryButton: 'Chọn Từ Thư Viện',
    helper: '* Calo và dinh dưỡng là ước tính của AI, có thể khác với công thức và khẩu phần thực tế.',
  },
  errors: {
    cameraPermission: 'Cần quyền truy cập máy ảnh. Vui lòng cho phép trong cài đặt trình duyệt hoặc thiết bị.',
    libraryPermission: 'Cần quyền truy cập ảnh. Vui lòng cho phép trong cài đặt trình duyệt hoặc thiết bị.',
    imageProcessFailed: 'Không thể xử lý hình ảnh.',
    analyzeGeneric: 'Đã xảy ra sự cố khi phân tích ảnh.',
    pickGeneric: 'Đã xảy ra sự cố khi tải ảnh.',
    networkError: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.',
    rateLimited: 'Đã đạt giới hạn số lần phân tích hôm nay. Vui lòng thử lại vào ngày mai.',
    analyzeFailed: 'Đã xảy ra sự cố trong quá trình phân tích. Vui lòng thử lại sau.',
    coachFailed: 'Không thể nhận lời khuyên từ huấn luyện viên. Vui lòng thử lại sau.',
  },
  result: {
    analyzing: 'Đang phân tích ảnh của bạn...',
    retry: 'Thử Lại',
    totalCalories: 'Tổng Calo',
    macroLine: (p, f, c) => `Đạm ${p}g · Chất béo ${f}g · Carb ${c}g`,
    addToLog: 'Thêm Vào Nhật Ký Hôm Nay',
    tryAnotherPhoto: 'Phân Tích Ảnh Khác',
  },
  summary: {
    goalLabel: 'Mục Tiêu Calo Hôm Nay',
    unit: 'kcal',
    consumedLabel: 'kcal đã ăn',
    remainingLabel: 'kcal còn lại',
    overLabel: 'kcal vượt mức',
    statusOk: 'Hôm nay bạn đang giữ nhịp độ tốt. Cứ tiếp tục như vậy nhé.',
    statusNear: 'Bạn sắp đạt mục tiêu rồi. Bữa tối nên ăn nhẹ nhàng thôi nhé?',
    statusOver: 'Bạn đã vượt mục tiêu calo hôm nay.',
    warning: '⚠ Chưa đến bữa tối mà bạn đã vượt mục tiêu rồi. Hãy cố gắng ăn tối nhẹ nhàng.',
  },
  nutrition: {
    title: 'Cân Bằng Dinh Dưỡng',
    empty: 'Chưa có dữ liệu dinh dưỡng nào được ghi lại.',
    carbs: 'Carb',
    protein: 'Đạm',
    fat: 'Chất béo',
    tipShortfall: (macro) => `Hôm nay bạn nên bổ sung thêm một chút ${macro}.`,
    tipBalanced: 'Cân bằng dinh dưỡng hôm nay của bạn khá tốt.',
  },
  meals: {
    title: (count) => `Bữa Ăn Hôm Nay (${count})`,
    empty: 'Chưa có bữa ăn nào được ghi lại. Hãy tải ảnh lên để ghi bữa ăn đầu tiên.',
    delete: 'Xóa',
  },
  coach: {
    title: 'Huấn Luyện Viên Ăn Kiêng AI',
    subtitle: 'Nhận gợi ý bữa tối và lời khuyên ăn kiêng dựa trên các bữa ăn hôm nay.',
    askButton: 'Hỏi Nên Ăn Gì Cho Bữa Tối',
    askAgainButton: 'Hỏi Lại',
    loading: 'Huấn luyện viên đang suy nghĩ...',
    dinnerLabel: '🍽 Gợi Ý Bữa Tối',
    noteLabel: '💬 Lời Nhắn Từ Huấn Luyện Viên',
  },
  profile: {
    title: 'Thiết Lập Hồ Sơ',
    subtitle: 'Chúng tôi sẽ dùng thông tin này để tính mục tiêu calo hàng ngày phù hợp với bạn.',
    genderLabel: 'Giới Tính',
    genderMale: 'Nam',
    genderFemale: 'Nữ',
    ageLabel: 'Tuổi',
    agePlaceholder: 'VD: 35',
    heightLabel: 'Chiều Cao (cm)',
    heightPlaceholder: 'VD: 170',
    weightLabel: 'Cân Nặng (kg)',
    weightPlaceholder: 'VD: 65',
    activityLabel: 'Mức Độ Vận Động',
    activitySedentary: 'Ít vận động (hầu như không tập thể dục)',
    activityLight: 'Nhẹ (tập 1-3 ngày/tuần)',
    activityModerate: 'Vừa phải (tập 3-5 ngày/tuần)',
    activityActive: 'Năng động (tập 6-7 ngày/tuần)',
    activityVeryActive: 'Rất năng động (vận động mạnh mỗi ngày hoặc lao động chân tay)',
    goalLabel: 'Mục Tiêu',
    goalMaintain: 'Duy Trì Cân Nặng',
    goalMild: 'Giảm Cân Từ Từ (~0.25kg/tuần)',
    goalModerate: 'Giảm Cân (~0.5kg/tuần)',
    goalAggressive: 'Giảm Cân Nhanh Hơn (~0.75kg/tuần)',
    submitButton: 'Tính Mục Tiêu Của Tôi',
    validationError: 'Vui lòng điền đầy đủ và chính xác tất cả các mục.',
    editLink: 'Chỉnh Sửa Hồ Sơ',
  },
  chooseLanguage: 'Chọn Ngôn Ngữ',
  cancel: 'Hủy',
};

const zh: Strings = {
  app: {
    title: '今日饮食日记',
    subtitle: '拍一张照片即可记录卡路里和营养,还能获得AI教练的晚餐建议。',
  },
  addCard: {
    cameraButton: '拍照记录一餐',
    galleryButton: '从相册选择',
    helper: '* 卡路里和营养为AI估算值,可能与实际做法和分量有差异。',
  },
  errors: {
    cameraPermission: '需要摄像头权限。请在浏览器或设备设置中允许访问。',
    libraryPermission: '需要照片访问权限。请在浏览器或设备设置中允许访问。',
    imageProcessFailed: '无法处理该图片。',
    analyzeGeneric: '分析照片时出现问题。',
    pickGeneric: '加载照片时出现问题。',
    networkError: '无法连接服务器,请检查网络连接。',
    rateLimited: '今日分析次数已达上限,请明天再试。',
    analyzeFailed: '分析过程中出现问题,请稍后再试。',
    coachFailed: '无法获取教练建议,请稍后再试。',
  },
  result: {
    analyzing: '正在分析照片...',
    retry: '重试',
    totalCalories: '总卡路里',
    macroLine: (p, f, c) => `蛋白质 ${p}g · 脂肪 ${f}g · 碳水 ${c}g`,
    addToLog: '添加到今日记录',
    tryAnotherPhoto: '分析其他照片',
  },
  summary: {
    goalLabel: '今日目标卡路里',
    unit: 'kcal',
    consumedLabel: '已摄入 kcal',
    remainingLabel: '剩余 kcal',
    overLabel: '超出 kcal',
    statusOk: '今天的节奏不错,继续保持吧。',
    statusNear: '已经接近目标了,晚餐要不要吃清淡一点?',
    statusOver: '今天已经超出目标卡路里了。',
    warning: '⚠ 还没到晚餐时间就已经超出目标了,晚餐请尽量清淡。',
  },
  nutrition: {
    title: '营养平衡',
    empty: '暂无营养数据记录。',
    carbs: '碳水',
    protein: '蛋白质',
    fat: '脂肪',
    tipShortfall: (macro) => `今天的${macro}摄入似乎有点不足。`,
    tipBalanced: '今天的营养平衡很不错。',
  },
  meals: {
    title: (count) => `今日饮食 (${count})`,
    empty: '还没有记录的饮食。上传照片记录第一餐吧。',
    delete: '删除',
  },
  coach: {
    title: 'AI饮食教练',
    subtitle: '根据今日饮食获取晚餐建议和饮食指导。',
    askButton: '问问晚餐该吃什么',
    askAgainButton: '再问一次',
    loading: '教练正在思考...',
    dinnerLabel: '🍽 晚餐建议',
    noteLabel: '💬 教练留言',
  },
  profile: {
    title: '设置个人资料',
    subtitle: '我们将根据这些信息计算适合您的每日目标卡路里。',
    genderLabel: '性别',
    genderMale: '男性',
    genderFemale: '女性',
    ageLabel: '年龄',
    agePlaceholder: '例如: 35',
    heightLabel: '身高 (cm)',
    heightPlaceholder: '例如: 170',
    weightLabel: '体重 (kg)',
    weightPlaceholder: '例如: 65',
    activityLabel: '活动水平',
    activitySedentary: '久坐 (几乎不运动)',
    activityLight: '轻度活动 (每周运动1-3天)',
    activityModerate: '中度活动 (每周运动3-5天)',
    activityActive: '积极活动 (每周运动6-7天)',
    activityVeryActive: '非常活跃 (每天高强度运动或体力劳动)',
    goalLabel: '目标',
    goalMaintain: '维持体重',
    goalMild: '缓慢减重 (每周约0.25kg)',
    goalModerate: '减重 (每周约0.5kg)',
    goalAggressive: '快速减重 (每周约0.75kg)',
    submitButton: '计算我的目标',
    validationError: '请正确填写所有项目。',
    editLink: '编辑个人资料',
  },
  chooseLanguage: '选择语言',
  cancel: '取消',
};

const id: Strings = {
  app: {
    title: 'Buku Harian Diet Hari Ini',
    subtitle: 'Foto makanan Anda untuk mencatat kalori dan nutrisi, dan dapatkan saran makan malam dari pelatih AI.',
  },
  addCard: {
    cameraButton: 'Catat Makanan dengan Foto',
    galleryButton: 'Pilih dari Galeri',
    helper: '* Kalori dan nutrisi adalah perkiraan AI dan mungkin berbeda dari resep dan porsi sebenarnya.',
  },
  errors: {
    cameraPermission: 'Izin kamera diperlukan. Silakan aktifkan di pengaturan browser atau perangkat Anda.',
    libraryPermission: 'Izin akses foto diperlukan. Silakan aktifkan di pengaturan browser atau perangkat Anda.',
    imageProcessFailed: 'Tidak dapat memproses gambar.',
    analyzeGeneric: 'Terjadi masalah saat menganalisis foto.',
    pickGeneric: 'Terjadi masalah saat memuat foto.',
    networkError: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.',
    rateLimited: 'Batas analisis hari ini telah tercapai. Silakan coba lagi besok.',
    analyzeFailed: 'Terjadi masalah saat menganalisis. Silakan coba lagi beberapa saat lagi.',
    coachFailed: 'Tidak dapat menerima saran dari pelatih. Silakan coba lagi beberapa saat lagi.',
  },
  result: {
    analyzing: 'Sedang menganalisis foto Anda...',
    retry: 'Coba Lagi',
    totalCalories: 'Total Kalori',
    macroLine: (p, f, c) => `Protein ${p}g · Lemak ${f}g · Karbo ${c}g`,
    addToLog: 'Tambahkan ke Catatan Hari Ini',
    tryAnotherPhoto: 'Analisis Foto Lain',
  },
  summary: {
    goalLabel: 'Target Kalori Hari Ini',
    unit: 'kcal',
    consumedLabel: 'kcal dimakan',
    remainingLabel: 'kcal tersisa',
    overLabel: 'kcal berlebih',
    statusOk: 'Ritme Anda hari ini bagus. Pertahankan terus.',
    statusNear: 'Anda hampir mencapai target. Makan malam ringan saja?',
    statusOver: 'Anda sudah melebihi target kalori hari ini.',
    warning: '⚠ Belum makan malam tapi target sudah terlampaui. Usahakan makan malam yang ringan.',
  },
  nutrition: {
    title: 'Keseimbangan Nutrisi',
    empty: 'Belum ada data nutrisi yang tercatat.',
    carbs: 'Karbo',
    protein: 'Protein',
    fat: 'Lemak',
    tipShortfall: (macro) => `Asupan ${macro} Anda hari ini sepertinya masih kurang.`,
    tipBalanced: 'Keseimbangan nutrisi Anda hari ini cukup baik.',
  },
  meals: {
    title: (count) => `Makanan Hari Ini (${count})`,
    empty: 'Belum ada makanan yang tercatat. Unggah foto untuk mencatat makanan pertama Anda.',
    delete: 'Hapus',
  },
  coach: {
    title: 'Pelatih Diet AI',
    subtitle: 'Dapatkan saran makan malam dan panduan diet berdasarkan makanan hari ini.',
    askButton: 'Tanya Menu Makan Malam',
    askAgainButton: 'Tanya Lagi',
    loading: 'Pelatih sedang berpikir...',
    dinnerLabel: '🍽 Saran Makan Malam',
    noteLabel: '💬 Catatan dari Pelatih',
  },
  profile: {
    title: 'Atur Profil Anda',
    subtitle: 'Kami akan menggunakan informasi ini untuk menghitung target kalori harian yang sesuai untuk Anda.',
    genderLabel: 'Jenis Kelamin',
    genderMale: 'Laki-laki',
    genderFemale: 'Perempuan',
    ageLabel: 'Usia',
    agePlaceholder: 'cth: 35',
    heightLabel: 'Tinggi Badan (cm)',
    heightPlaceholder: 'cth: 170',
    weightLabel: 'Berat Badan (kg)',
    weightPlaceholder: 'cth: 65',
    activityLabel: 'Tingkat Aktivitas',
    activitySedentary: 'Jarang Bergerak (hampir tidak berolahraga)',
    activityLight: 'Ringan (olahraga 1-3 hari/minggu)',
    activityModerate: 'Sedang (olahraga 3-5 hari/minggu)',
    activityActive: 'Aktif (olahraga 6-7 hari/minggu)',
    activityVeryActive: 'Sangat Aktif (olahraga berat harian atau pekerjaan fisik)',
    goalLabel: 'Target',
    goalMaintain: 'Menjaga Berat Badan',
    goalMild: 'Turun Berat Badan Perlahan (~0.25kg/minggu)',
    goalModerate: 'Turun Berat Badan (~0.5kg/minggu)',
    goalAggressive: 'Turun Berat Badan Lebih Cepat (~0.75kg/minggu)',
    submitButton: 'Hitung Target Saya',
    validationError: 'Silakan isi semua kolom dengan benar.',
    editLink: 'Ubah Profil',
  },
  chooseLanguage: 'Pilih Bahasa',
  cancel: 'Batal',
};

const tl: Strings = {
  app: {
    title: 'Talaarawan ng Diyeta Ngayong Araw',
    subtitle: 'Kumuha ng larawan ng iyong pagkain para masubaybayan ang calories at nutrisyon, at makakuha ng payo sa hapunan mula sa AI coach.',
  },
  addCard: {
    cameraButton: 'Itala ang Pagkain sa Pamamagitan ng Litrato',
    galleryButton: 'Pumili mula sa Gallery',
    helper: '* Ang calories at nutrisyon ay tantiya ng AI at maaaring iba sa aktwal na recipe at dami ng pagkain.',
  },
  errors: {
    cameraPermission: 'Kailangan ang pahintulot sa camera. Paki-allow ito sa settings ng browser o device.',
    libraryPermission: 'Kailangan ang pahintulot sa mga larawan. Paki-allow ito sa settings ng browser o device.',
    imageProcessFailed: 'Hindi maproseso ang larawan.',
    analyzeGeneric: 'May problemang naganap habang sinusuri ang larawan.',
    pickGeneric: 'Nagkaroon ng problema sa pag-load ng larawan.',
    networkError: 'Hindi makakonekta sa server. Paki-check ang iyong internet connection.',
    rateLimited: 'Naabot na ang limitasyon ng pagsusuri para ngayong araw. Subukan muli bukas.',
    analyzeFailed: 'May problemang naganap habang sinusuri. Subukan muli mamaya.',
    coachFailed: 'Hindi makuha ang payo mula sa coach. Subukan muli mamaya.',
  },
  result: {
    analyzing: 'Sinusuri ang iyong litrato...',
    retry: 'Subukang Muli',
    totalCalories: 'Kabuuang Calories',
    macroLine: (p, f, c) => `Protina ${p}g · Taba ${f}g · Karbohidrat ${c}g`,
    addToLog: 'Idagdag sa Talaan Ngayong Araw',
    tryAnotherPhoto: 'Suriin ang Ibang Litrato',
  },
  summary: {
    goalLabel: 'Target na Calories Ngayong Araw',
    unit: 'kcal',
    consumedLabel: 'kcal nakain',
    remainingLabel: 'kcal natitira',
    overLabel: 'kcal sobra',
    statusOk: 'Maganda ang takbo mo ngayon. Ituloy mo lang.',
    statusNear: 'Malapit ka na sa target mo. Baka gaanin na lang ang hapunan?',
    statusOver: 'Nalagpasan mo na ang target na calories ngayong araw.',
    warning: '⚠ Hindi pa oras ng hapunan pero nalagpasan mo na ang target. Subukang gaanin ang hapunan.',
  },
  nutrition: {
    title: 'Balanse ng Nutrisyon',
    empty: 'Wala pang naitalang nutrisyon.',
    carbs: 'Karbohidrat',
    protein: 'Protina',
    fat: 'Taba',
    tipShortfall: (macro) => `Mukhang kulang pa ang ${macro} mo ngayong araw.`,
    tipBalanced: 'Maganda ang balanse ng nutrisyon mo ngayong araw.',
  },
  meals: {
    title: (count) => `Mga Pagkain Ngayong Araw (${count})`,
    empty: 'Wala pang naitalang pagkain. Mag-upload ng larawan para itala ang una mong pagkain.',
    delete: 'Alisin',
  },
  coach: {
    title: 'AI Diet Coach',
    subtitle: 'Kumuha ng mungkahi sa hapunan at payo sa diyeta base sa mga pagkain ngayong araw.',
    askButton: 'Itanong Kung Ano ang Kainin sa Hapunan',
    askAgainButton: 'Magtanong Ulit',
    loading: 'Iniisip pa ng coach...',
    dinnerLabel: '🍽 Mungkahi sa Hapunan',
    noteLabel: '💬 Mensahe ng Coach',
  },
  profile: {
    title: 'I-set Up ang Iyong Profile',
    subtitle: 'Gagamitin namin ito para kalkulahin ang target na calories araw-araw na angkop sa iyo.',
    genderLabel: 'Kasarian',
    genderMale: 'Lalaki',
    genderFemale: 'Babae',
    ageLabel: 'Edad',
    agePlaceholder: 'hal. 35',
    heightLabel: 'Taas (cm)',
    heightPlaceholder: 'hal. 170',
    weightLabel: 'Timbang (kg)',
    weightPlaceholder: 'hal. 65',
    activityLabel: 'Antas ng Aktibidad',
    activitySedentary: 'Kaunti ang Galaw (halos walang ehersisyo)',
    activityLight: 'Magaan (ehersisyo 1-3 araw/linggo)',
    activityModerate: 'Katamtaman (ehersisyo 3-5 araw/linggo)',
    activityActive: 'Aktibo (ehersisyo 6-7 araw/linggo)',
    activityVeryActive: 'Napaka-Aktibo (mabigat na ehersisyo araw-araw o pisikal na trabaho)',
    goalLabel: 'Target',
    goalMaintain: 'Panatilihin ang Timbang',
    goalMild: 'Mabagal na Pagbaba ng Timbang (~0.25kg/linggo)',
    goalModerate: 'Pagbaba ng Timbang (~0.5kg/linggo)',
    goalAggressive: 'Mas Mabilis na Pagbaba ng Timbang (~0.75kg/linggo)',
    submitButton: 'Kalkulahin ang Target Ko',
    validationError: 'Pakisagutan nang tama ang lahat ng patlang.',
    editLink: 'I-edit ang Profile',
  },
  chooseLanguage: 'Pumili ng Wika',
  cancel: 'Kanselahin',
};

const th: Strings = {
  app: {
    title: 'ไดอารี่ควบคุมอาหารวันนี้',
    subtitle: 'ถ่ายรูปมื้ออาหารเพื่อบันทึกแคลอรี่และโภชนาการ พร้อมรับคำแนะนำมื้อเย็นจากโค้ช AI',
  },
  addCard: {
    cameraButton: 'บันทึกมื้ออาหารด้วยรูปภาพ',
    galleryButton: 'เลือกจากคลังภาพ',
    helper: '* แคลอรี่และโภชนาการเป็นการประมาณโดย AI อาจแตกต่างจากสูตรและปริมาณจริง',
  },
  errors: {
    cameraPermission: 'ต้องการสิทธิ์เข้าถึงกล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์หรืออุปกรณ์',
    libraryPermission: 'ต้องการสิทธิ์เข้าถึงรูปภาพ กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์หรืออุปกรณ์',
    imageProcessFailed: 'ไม่สามารถประมวลผลรูปภาพได้',
    analyzeGeneric: 'เกิดปัญหาขณะวิเคราะห์รูปภาพ',
    pickGeneric: 'เกิดปัญหาขณะโหลดรูปภาพ',
    networkError: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
    rateLimited: 'ถึงขีดจำกัดการวิเคราะห์ของวันนี้แล้ว กรุณาลองใหม่พรุ่งนี้',
    analyzeFailed: 'เกิดปัญหาระหว่างการวิเคราะห์ กรุณาลองใหม่อีกครั้งในภายหลัง',
    coachFailed: 'ไม่สามารถรับคำแนะนำจากโค้ชได้ กรุณาลองใหม่อีกครั้งในภายหลัง',
  },
  result: {
    analyzing: 'กำลังวิเคราะห์รูปภาพของคุณ...',
    retry: 'ลองอีกครั้ง',
    totalCalories: 'แคลอรี่รวม',
    macroLine: (p, f, c) => `โปรตีน ${p}g · ไขมัน ${f}g · คาร์บ ${c}g`,
    addToLog: 'เพิ่มลงบันทึกวันนี้',
    tryAnotherPhoto: 'วิเคราะห์รูปภาพอื่น',
  },
  summary: {
    goalLabel: 'เป้าหมายแคลอรี่วันนี้',
    unit: 'kcal',
    consumedLabel: 'kcal ที่กินไป',
    remainingLabel: 'kcal ที่เหลือ',
    overLabel: 'kcal ที่เกิน',
    statusOk: 'วันนี้จังหวะดีอยู่ ลองรักษาแบบนี้ต่อไปนะ',
    statusNear: 'ใกล้ถึงเป้าหมายแล้ว มื้อเย็นลองกินเบาๆ ดีไหม?',
    statusOver: 'วันนี้เกินเป้าหมายแคลอรี่แล้ว',
    warning: '⚠ ยังไม่ถึงมื้อเย็นแต่เกินเป้าหมายไปแล้ว ลองกินมื้อเย็นให้เบาลงนะ',
  },
  nutrition: {
    title: 'สมดุลโภชนาการ',
    empty: 'ยังไม่มีข้อมูลโภชนาการที่บันทึกไว้',
    carbs: 'คาร์บ',
    protein: 'โปรตีน',
    fat: 'ไขมัน',
    tipShortfall: (macro) => `วันนี้ดูเหมือนจะได้รับ${macro}ค่อนข้างน้อยนะ`,
    tipBalanced: 'สมดุลโภชนาการวันนี้ดูดีนะ',
  },
  meals: {
    title: (count) => `มื้ออาหารวันนี้ (${count})`,
    empty: 'ยังไม่มีมื้ออาหารที่บันทึกไว้ อัปโหลดรูปภาพเพื่อบันทึกมื้อแรกของคุณ',
    delete: 'ลบ',
  },
  coach: {
    title: 'โค้ชควบคุมอาหาร AI',
    subtitle: 'รับคำแนะนำมื้อเย็นและคำแนะนำการควบคุมอาหารจากมื้ออาหารวันนี้',
    askButton: 'ถามว่ามื้อเย็นควรกินอะไร',
    askAgainButton: 'ถามอีกครั้ง',
    loading: 'โค้ชกำลังคิดอยู่...',
    dinnerLabel: '🍽 คำแนะนำมื้อเย็น',
    noteLabel: '💬 ข้อความจากโค้ช',
  },
  profile: {
    title: 'ตั้งค่าโปรไฟล์ของคุณ',
    subtitle: 'เราจะใช้ข้อมูลนี้เพื่อคำนวณเป้าหมายแคลอรี่รายวันที่เหมาะกับคุณ',
    genderLabel: 'เพศ',
    genderMale: 'ชาย',
    genderFemale: 'หญิง',
    ageLabel: 'อายุ',
    agePlaceholder: 'เช่น 35',
    heightLabel: 'ส่วนสูง (ซม.)',
    heightPlaceholder: 'เช่น 170',
    weightLabel: 'น้ำหนัก (กก.)',
    weightPlaceholder: 'เช่น 65',
    activityLabel: 'ระดับกิจกรรม',
    activitySedentary: 'นั่งทำงานเป็นหลัก (แทบไม่ออกกำลังกาย)',
    activityLight: 'เบา (ออกกำลังกาย 1-3 วัน/สัปดาห์)',
    activityModerate: 'ปานกลาง (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
    activityActive: 'กระตือรือร้น (ออกกำลังกาย 6-7 วัน/สัปดาห์)',
    activityVeryActive: 'กระตือรือร้นมาก (ออกกำลังกายหนักทุกวันหรืองานใช้แรงกาย)',
    goalLabel: 'เป้าหมาย',
    goalMaintain: 'รักษาน้ำหนัก',
    goalMild: 'ลดน้ำหนักช้าๆ (~0.25กก./สัปดาห์)',
    goalModerate: 'ลดน้ำหนัก (~0.5กก./สัปดาห์)',
    goalAggressive: 'ลดน้ำหนักเร็วขึ้น (~0.75กก./สัปดาห์)',
    submitButton: 'คำนวณเป้าหมายของฉัน',
    validationError: 'กรุณากรอกข้อมูลให้ครบและถูกต้องทุกช่อง',
    editLink: 'แก้ไขโปรไฟล์',
  },
  chooseLanguage: 'เลือกภาษา',
  cancel: 'ยกเลิก',
};

const my: Strings = {
  app: {
    title: 'ယနေ့ အစားအသောက် မှတ်တမ်း',
    subtitle: 'အစားအစာ ဓာတ်ပုံရိုက်ပြီး ကယ်လိုရီနှင့် အာဟာရကို မှတ်တမ်းတင်ကာ AI နည်းပြထံမှ ညစာ အကြံဉာဏ်ရယူပါ။',
  },
  addCard: {
    cameraButton: 'ဓာတ်ပုံဖြင့် အစားအစာ မှတ်တမ်းတင်ရန်',
    galleryButton: 'ပြခန်းမှ ရွေးရန်',
    helper: '* ကယ်လိုရီနှင့် အာဟာရသည် AI ခန့်မှန်းချက်ဖြစ်ပြီး၊ အမှန်တကယ် ချက်ပြုတ်နည်းနှင့် ပမာဏနှင့် ကွာခြားနိုင်ပါသည်။',
  },
  errors: {
    cameraPermission: 'ကင်မရာခွင့်ပြုချက် လိုအပ်ပါသည်။ ဘရောက်ဇာ သို့မဟုတ် စက်ပစ္စည်း ဆက်တင်တွင် ခွင့်ပြုပေးပါ။',
    libraryPermission: 'ဓာတ်ပုံခွင့်ပြုချက် လိုအပ်ပါသည်။ ဘရောက်ဇာ သို့မဟုတ် စက်ပစ္စည်း ဆက်တင်တွင် ခွင့်ပြုပေးပါ။',
    imageProcessFailed: 'ပုံကို လုပ်ဆောင်၍ မရပါ။',
    analyzeGeneric: 'ဓာတ်ပုံ စိစစ်နေစဉ် ပြဿနာ ဖြစ်ပွားခဲ့ပါသည်။',
    pickGeneric: 'ဓာတ်ပုံ ဖွင့်ရာတွင် ပြဿနာ ဖြစ်ပွားခဲ့ပါသည်။',
    networkError: 'ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။ အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ။',
    rateLimited: 'ယနေ့အတွက် စိစစ်နိုင်သည့် အကြိမ်ရေ ပြည့်သွားပါပြီ။ မနက်ဖြန် ထပ်မံ ကြိုးစားပါ။',
    analyzeFailed: 'စိစစ်နေစဉ် ပြဿနာ ဖြစ်ပွားခဲ့ပါသည်။ ခဏနေ ထပ်စမ်းကြည့်ပါ။',
    coachFailed: 'နည်းပြထံမှ အကြံဉာဏ် မရယူနိုင်ပါ။ ခဏနေ ထပ်စမ်းကြည့်ပါ။',
  },
  result: {
    analyzing: 'သင့်ဓာတ်ပုံကို စိစစ်နေပါသည်...',
    retry: 'ထပ်စမ်းကြည့်ပါ',
    totalCalories: 'စုစုပေါင်း ကယ်လိုရီ',
    macroLine: (p, f, c) => `ပရိုတိန်း ${p}g · အဆီ ${f}g · ကာဗိုဟိုက်ဒရိတ် ${c}g`,
    addToLog: 'ယနေ့ မှတ်တမ်းသို့ ထည့်ရန်',
    tryAnotherPhoto: 'အခြားပုံတစ်ပုံ စိစစ်ရန်',
  },
  summary: {
    goalLabel: 'ယနေ့ ကယ်လိုရီ ပန်းတိုင်',
    unit: 'kcal',
    consumedLabel: 'စားပြီး kcal',
    remainingLabel: 'ကျန်ရှိ kcal',
    overLabel: 'ကျော်လွန် kcal',
    statusOk: 'ယနေ့ အရှိန်ကောင်းနေပါသည်။ ဒီအတိုင်း ဆက်လုပ်ပါ။',
    statusNear: 'ပန်းတိုင်နီးလာပါပြီ။ ညစာ ပေါ့ပေါ့ပါးပါး စားကြည့်မလား?',
    statusOver: 'ယနေ့ ကယ်လိုရီ ပန်းတိုင်ကို ကျော်လွန်သွားပါပြီ။',
    warning: '⚠ ညစာ မစားရသေးဘဲ ပန်းတိုင်ကို ကျော်လွန်သွားပါပြီ။ ညစာကို ပေါ့ပေါ့ပါးပါး ချိန်ညှိပါ။',
  },
  nutrition: {
    title: 'အာဟာရ ဟန်ချက်',
    empty: 'အာဟာရ အချက်အလက် မှတ်တမ်း မရှိသေးပါ။',
    carbs: 'ကာဗိုဟိုက်ဒရိတ်',
    protein: 'ပရိုတိန်း',
    fat: 'အဆီ',
    tipShortfall: (macro) => `ယနေ့ ${macro} နည်းနည်း လိုအပ်နေပုံရပါသည်။`,
    tipBalanced: 'ယနေ့ အာဟာရ ဟန်ချက် ကောင်းမွန်ပါသည်။',
  },
  meals: {
    title: (count) => `ယနေ့ အစားအစာများ (${count})`,
    empty: 'အစားအစာ မှတ်တမ်း မရှိသေးပါ။ ပထမဆုံး အစားအစာကို မှတ်တမ်းတင်ရန် ဓာတ်ပုံ တင်ပါ။',
    delete: 'ဖျက်ရန်',
  },
  coach: {
    title: 'AI အစားအသောက် နည်းပြ',
    subtitle: 'ယနေ့ အစားအစာများအပေါ် အခြေခံ၍ ညစာ အကြံပြုချက်နှင့် အစားအသောက် အကြံဉာဏ် ရယူပါ။',
    askButton: 'ညစာ ဘာစားရမလဲ မေးရန်',
    askAgainButton: 'ထပ်မေးရန်',
    loading: 'နည်းပြ စဉ်းစားနေပါသည်...',
    dinnerLabel: '🍽 ညစာ အကြံပြုချက်',
    noteLabel: '💬 နည်းပြ၏ စကားစုံ',
  },
  profile: {
    title: 'ကိုယ်ရေးအချက်အလက် သတ်မှတ်ရန်',
    subtitle: 'ဤအချက်အလက်များကို အသုံးပြု၍ သင့်အတွက် သင့်တော်သော နေ့စဉ် ကယ်လိုရီ ပန်းတိုင်ကို တွက်ချက်ပေးပါမည်။',
    genderLabel: 'ကျား/မ',
    genderMale: 'ကျား',
    genderFemale: 'မ',
    ageLabel: 'အသက်',
    agePlaceholder: 'ဥပမာ 35',
    heightLabel: 'အရပ် (cm)',
    heightPlaceholder: 'ဥပမာ 170',
    weightLabel: 'ကိုယ်အလေးချိန် (kg)',
    weightPlaceholder: 'ဥပမာ 65',
    activityLabel: 'လှုပ်ရှားမှု အဆင့်',
    activitySedentary: 'လှုပ်ရှားမှု နည်း (လေ့ကျင့်ခန်း လုပ်လေ့မရှိ)',
    activityLight: 'ပေါ့ပါး (တစ်ပတ် ၁-၃ ရက် လေ့ကျင့်ခန်း)',
    activityModerate: 'အလယ်အလတ် (တစ်ပတ် ၃-၅ ရက် လေ့ကျင့်ခန်း)',
    activityActive: 'တက်ကြွသော (တစ်ပတ် ၆-၇ ရက် လေ့ကျင့်ခန်း)',
    activityVeryActive: 'အလွန်တက်ကြွသော (နေ့စဉ် ပြင်းထန်သော လေ့ကျင့်ခန်း သို့မဟုတ် ရုပ်ပိုင်းဆိုင်ရာ အလုပ်)',
    goalLabel: 'ပန်းတိုင်',
    goalMaintain: 'ကိုယ်အလေးချိန် ထိန်းထားရန်',
    goalMild: 'ဖြည်းညင်းစွာ လျှော့ချရန် (တစ်ပတ် ~0.25kg)',
    goalModerate: 'လျှော့ချရန် (တစ်ပတ် ~0.5kg)',
    goalAggressive: 'ပိုမြန်စွာ လျှော့ချရန် (တစ်ပတ် ~0.75kg)',
    submitButton: 'ကျွန်ုပ်၏ ပန်းတိုင် တွက်ချက်ရန်',
    validationError: 'ကျေးဇူးပြု၍ အကွက်အားလုံးကို မှန်ကန်စွာ ဖြည့်ပါ။',
    editLink: 'ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်',
  },
  chooseLanguage: 'ဘာသာစကား ရွေးရန်',
  cancel: 'ပယ်ဖျက်ရန်',
};

const ne: Strings = {
  app: {
    title: 'आजको डाइट डायरी',
    subtitle: 'क्यालोरी र पोषण रेकर्ड गर्न आफ्नो खानाको फोटो खिच्नुहोस्, र AI कोचबाट डिनरको सल्लाह पाउनुहोस्।',
  },
  addCard: {
    cameraButton: 'फोटोबाट खाना रेकर्ड गर्नुहोस्',
    galleryButton: 'ग्यालरीबाट छान्नुहोस्',
    helper: '* क्यालोरी र पोषण AI को अनुमान हो, वास्तविक रेसिपी र मात्राभन्दा फरक हुन सक्छ।',
  },
  errors: {
    cameraPermission: 'क्यामेरा अनुमति आवश्यक छ। कृपया ब्राउजर वा उपकरणको सेटिङमा अनुमति दिनुहोस्।',
    libraryPermission: 'फोटो पहुँच अनुमति आवश्यक छ। कृपया ब्राउजर वा उपकरणको सेटिङमा अनुमति दिनुहोस्।',
    imageProcessFailed: 'तस्बिर प्रशोधन गर्न सकिएन।',
    analyzeGeneric: 'फोटो विश्लेषण गर्दा समस्या भयो।',
    pickGeneric: 'फोटो लोड गर्दा समस्या भयो।',
    networkError: 'सर्भरसँग जडान गर्न सकिएन। कृपया आफ्नो इन्टरनेट जडान जाँच गर्नुहोस्।',
    rateLimited: 'आजको विश्लेषण सीमा पुगिसक्यो। कृपया भोलि फेरि प्रयास गर्नुहोस्।',
    analyzeFailed: 'विश्लेषण गर्दा समस्या भयो। कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।',
    coachFailed: 'कोचबाट सल्लाह पाउन सकिएन। कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।',
  },
  result: {
    analyzing: 'तपाईंको फोटो विश्लेषण गर्दै...',
    retry: 'फेरि प्रयास गर्नुहोस्',
    totalCalories: 'कुल क्यालोरी',
    macroLine: (p, f, c) => `प्रोटिन ${p}g · बोसो ${f}g · कार्ब ${c}g`,
    addToLog: 'आजको रेकर्डमा थप्नुहोस्',
    tryAnotherPhoto: 'अर्को फोटो विश्लेषण गर्नुहोस्',
  },
  summary: {
    goalLabel: 'आजको क्यालोरी लक्ष्य',
    unit: 'kcal',
    consumedLabel: 'खाइयो kcal',
    remainingLabel: 'बाँकी kcal',
    overLabel: 'बढी kcal',
    statusOk: 'आज तपाईंको गति राम्रो छ। यसैगरी जारी राख्नुहोस्।',
    statusNear: 'तपाईं लक्ष्यको नजिक पुग्नुभयो। डिनर हल्का खाने हो?',
    statusOver: 'आज तपाईंले क्यालोरी लक्ष्य नाघ्नुभयो।',
    warning: '⚠ अझै डिनर भएको छैन तर लक्ष्य नाघिसकियो। डिनर हल्का राख्ने प्रयास गर्नुहोस्।',
  },
  nutrition: {
    title: 'पोषण सन्तुलन',
    empty: 'अहिलेसम्म कुनै पोषण डाटा रेकर्ड गरिएको छैन।',
    carbs: 'कार्ब',
    protein: 'प्रोटिन',
    fat: 'बोसो',
    tipShortfall: (macro) => `आज तपाईंलाई अलि थप ${macro} चाहिन्छ जस्तो देखिन्छ।`,
    tipBalanced: 'आजको पोषण सन्तुलन राम्रो देखिन्छ।',
  },
  meals: {
    title: (count) => `आजका खानाहरू (${count})`,
    empty: 'अहिलेसम्म कुनै खाना रेकर्ड गरिएको छैन। पहिलो खाना रेकर्ड गर्न फोटो अपलोड गर्नुहोस्।',
    delete: 'मेटाउनुहोस्',
  },
  coach: {
    title: 'AI डाइट कोच',
    subtitle: 'आजको खानाको आधारमा डिनर सुझाव र डाइट सल्लाह पाउनुहोस्।',
    askButton: 'डिनरमा के खाने भनेर सोध्नुहोस्',
    askAgainButton: 'फेरि सोध्नुहोस्',
    loading: 'कोच सोच्दै हुनुहुन्छ...',
    dinnerLabel: '🍽 डिनर सुझाव',
    noteLabel: '💬 कोचको सन्देश',
  },
  profile: {
    title: 'प्रोफाइल सेटअप गर्नुहोस्',
    subtitle: 'यो जानकारीको आधारमा हामी तपाईंलाई उपयुक्त दैनिक क्यालोरी लक्ष्य गणना गर्नेछौं।',
    genderLabel: 'लिङ्ग',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    ageLabel: 'उमेर',
    agePlaceholder: 'जस्तै: ३५',
    heightLabel: 'उचाइ (cm)',
    heightPlaceholder: 'जस्तै: १७०',
    weightLabel: 'तौल (kg)',
    weightPlaceholder: 'जस्तै: ६५',
    activityLabel: 'सक्रियता स्तर',
    activitySedentary: 'थोरै चलमल (व्यायाम गर्दिन)',
    activityLight: 'हल्का (हप्तामा १-३ दिन व्यायाम)',
    activityModerate: 'मध्यम (हप्तामा ३-५ दिन व्यायाम)',
    activityActive: 'सक्रिय (हप्तामा ६-७ दिन व्यायाम)',
    activityVeryActive: 'धेरै सक्रिय (दैनिक कडा व्यायाम वा शारीरिक काम)',
    goalLabel: 'लक्ष्य',
    goalMaintain: 'तौल कायम राख्ने',
    goalMild: 'बिस्तारै तौल घटाउने (~हप्तामा ०.२५kg)',
    goalModerate: 'तौल घटाउने (~हप्तामा ०.५kg)',
    goalAggressive: 'छिटो तौल घटाउने (~हप्तामा ०.७५kg)',
    submitButton: 'मेरो लक्ष्य गणना गर्नुहोस्',
    validationError: 'कृपया सबै फिल्डहरू सही तरिकाले भर्नुहोस्।',
    editLink: 'प्रोफाइल सम्पादन गर्नुहोस्',
  },
  chooseLanguage: 'भाषा छान्नुहोस्',
  cancel: 'रद्द गर्नुहोस्',
};

const pt: Strings = {
  app: {
    title: 'Diário de Dieta de Hoje',
    subtitle: 'Tire uma foto da sua refeição para registrar calorias e nutrição, e receba conselhos de jantar do seu coach de IA.',
  },
  addCard: {
    cameraButton: 'Registrar Refeição por Foto',
    galleryButton: 'Escolher da Galeria',
    helper: '* Calorias e nutrição são estimativas de IA e podem variar da receita e porção reais.',
  },
  errors: {
    cameraPermission: 'É necessária permissão da câmera. Permita nas configurações do navegador ou do dispositivo.',
    libraryPermission: 'É necessária permissão de acesso às fotos. Permita nas configurações do navegador ou do dispositivo.',
    imageProcessFailed: 'Não foi possível processar a imagem.',
    analyzeGeneric: 'Ocorreu um problema ao analisar a foto.',
    pickGeneric: 'Ocorreu um problema ao carregar a foto.',
    networkError: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    rateLimited: 'O limite de análises de hoje foi atingido. Tente novamente amanhã.',
    analyzeFailed: 'Ocorreu um problema durante a análise. Tente novamente em instantes.',
    coachFailed: 'Não foi possível obter o conselho do coach. Tente novamente em instantes.',
  },
  result: {
    analyzing: 'Analisando sua foto...',
    retry: 'Tentar Novamente',
    totalCalories: 'Calorias Totais',
    macroLine: (p, f, c) => `Proteína ${p}g · Gordura ${f}g · Carboidratos ${c}g`,
    addToLog: 'Adicionar ao Registro de Hoje',
    tryAnotherPhoto: 'Analisar Outra Foto',
  },
  summary: {
    goalLabel: 'Meta de Calorias de Hoje',
    unit: 'kcal',
    consumedLabel: 'kcal consumidas',
    remainingLabel: 'kcal restantes',
    overLabel: 'kcal acima',
    statusOk: 'Seu ritmo hoje está bom. Continue assim.',
    statusNear: 'Você está quase na meta. Que tal um jantar mais leve?',
    statusOver: 'Você ultrapassou a meta de calorias de hoje.',
    warning: '⚠ Ainda nem chegou a hora do jantar e você já ultrapassou a meta. Tente um jantar mais leve.',
  },
  nutrition: {
    title: 'Equilíbrio Nutricional',
    empty: 'Nenhum dado nutricional registrado ainda.',
    carbs: 'Carboidratos',
    protein: 'Proteína',
    fat: 'Gordura',
    tipShortfall: (macro) => `Hoje você poderia consumir um pouco mais de ${macro}.`,
    tipBalanced: 'Seu equilíbrio nutricional hoje está bom.',
  },
  meals: {
    title: (count) => `Refeições de Hoje (${count})`,
    empty: 'Nenhuma refeição registrada ainda. Envie uma foto para registrar sua primeira refeição.',
    delete: 'Excluir',
  },
  coach: {
    title: 'Coach de Dieta com IA',
    subtitle: 'Receba sugestões de jantar e conselhos de dieta com base nas refeições de hoje.',
    askButton: 'Perguntar o Que Comer no Jantar',
    askAgainButton: 'Perguntar Novamente',
    loading: 'O coach está pensando...',
    dinnerLabel: '🍽 Sugestão de Jantar',
    noteLabel: '💬 Recado do Coach',
  },
  profile: {
    title: 'Configure Seu Perfil',
    subtitle: 'Usaremos essas informações para calcular uma meta de calorias diária adequada para você.',
    genderLabel: 'Sexo',
    genderMale: 'Masculino',
    genderFemale: 'Feminino',
    ageLabel: 'Idade',
    agePlaceholder: 'ex: 35',
    heightLabel: 'Altura (cm)',
    heightPlaceholder: 'ex: 170',
    weightLabel: 'Peso (kg)',
    weightPlaceholder: 'ex: 65',
    activityLabel: 'Nível de Atividade',
    activitySedentary: 'Sedentário (pouco ou nenhum exercício)',
    activityLight: 'Leve (exercício 1-3 dias/semana)',
    activityModerate: 'Moderado (exercício 3-5 dias/semana)',
    activityActive: 'Ativo (exercício 6-7 dias/semana)',
    activityVeryActive: 'Muito Ativo (exercício intenso diário ou trabalho físico)',
    goalLabel: 'Objetivo',
    goalMaintain: 'Manter o Peso',
    goalMild: 'Perder Peso Gradualmente (~0.25kg/semana)',
    goalModerate: 'Perder Peso (~0.5kg/semana)',
    goalAggressive: 'Perder Peso Mais Rápido (~0.75kg/semana)',
    submitButton: 'Calcular Minha Meta',
    validationError: 'Preencha todos os campos corretamente.',
    editLink: 'Editar Perfil',
  },
  chooseLanguage: 'Escolher Idioma',
  cancel: 'Cancelar',
};

export const STRINGS: Record<Lang, Strings> = { ja, ko, en, vi, zh, id, tl, th, my, ne, pt };

const BROWSER_LANG_MAP: Record<string, Lang> = {
  ja: 'ja',
  ko: 'ko',
  en: 'en',
  vi: 'vi',
  zh: 'zh',
  id: 'id',
  tl: 'tl',
  fil: 'tl',
  th: 'th',
  my: 'my',
  ne: 'ne',
  pt: 'pt',
};

export function detectDefaultLang(): Lang {
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    const prefix = navigator.language.toLowerCase().split('-')[0];
    return BROWSER_LANG_MAP[prefix] ?? 'en';
  }
  return 'en';
}
