# 데이터온 — Vercel 배포용

이 폴더는 데이터온 학습 플랫폼을 Vercel에 바로 배포할 수 있도록 만든 독립 실행형 Vite 프로젝트입니다.

## 가장 빠른 배포

1. 터미널에서 이 폴더로 이동합니다.
2. `npm install`
3. `npx vercel`
4. 미리보기 확인 후 `npx vercel --prod`

자세한 설명은 `DEPLOY-VERCEL-KO.md`를 확인하세요.

## 로컬 실행

```powershell
npm install
npm run dev
```

## 특징

- 별도의 데이터베이스나 환경 변수가 필요하지 않습니다.
- 업로드한 사진은 브라우저에서만 픽셀로 변환되며 서버에 저장되지 않습니다.
- `vercel.json`에 Vite 빌드와 SPA 라우팅 설정이 포함되어 있습니다.
