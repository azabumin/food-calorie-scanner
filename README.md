# 음식 칼로리 스캐너 (food-calorie-scanner)

핸드폰 카메라로 음식 사진을 찍으면 AI가 재료와 칼로리를 분석해서 리스트로 보여주는 웹 앱.
누구나 링크만 열면 바로 사용할 수 있도록 GitHub Pages로 배포합니다.

- **Live app:** https://azabumin.github.io/food-calorie-scanner/
- **Frontend:** Expo + expo-router + react-native-web (`app/`)
- **Backend:** Cloudflare Worker, Claude 비전 API 프록시 (`worker/`) — 자세한 배포 방법은
  [`worker/README.md`](worker/README.md) 참고

## 로컬 개발

```bash
npm install
npm run web
```

## 배포

프론트엔드:

```bash
npm run deploy   # expo export -p web 후 gh-pages로 배포
```

백엔드(Worker)는 [`worker/README.md`](worker/README.md)의 안내를 따르세요.

## 구조

```
app/                 화면 (expo-router)
constants/            테마, Worker URL 설정
lib/api.ts            Worker 호출
worker/                Cloudflare Worker 백엔드 (Claude API 프록시 + 사용량 제한)
```

## 알아둘 점

- 사진은 서버에 저장되지 않습니다 — 분석 요청마다 Claude API로 바로 전달되고 응답만 반환합니다.
- 칼로리는 AI 추정치이며 실제 조리법/양에 따라 오차가 있을 수 있습니다.
- 무료로 누구나 쓸 수 있도록 Worker에 하루 사용량 제한(rate limit)이 걸려 있습니다 —
  자세한 내용과 조정 방법은 `worker/README.md` 참고.
