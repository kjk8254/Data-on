# 데이터온 Vercel 배포 안내

이 패키지는 Vercel에서 바로 빌드할 수 있는 Vite 웹앱입니다. 환경 변수나 데이터베이스 설정은 필요하지 않습니다.

## 방법 A — 명령어로 바로 배포하기(권장)

### 1. ZIP 파일 풀기

다운로드한 `data-on-vercel.zip`을 마우스 오른쪽 버튼으로 눌러 **압축 풀기**를 선택합니다.

압축을 푼 폴더의 첫 화면에 `package.json`, `vercel.json`, `index.html`, `src` 폴더가 보여야 합니다.

### 2. Node.js 준비하기

Node.js 22 이상을 설치합니다. 설치 후 PowerShell에서 아래 명령으로 확인할 수 있습니다.

```powershell
node --version
npm --version
```

### 3. 배포 폴더에서 PowerShell 열기

압축을 푼 폴더를 연 뒤 탐색기 주소창에 `powershell`을 입력하고 Enter를 누릅니다.

### 4. 필요한 패키지 설치하기

```powershell
npm install
```

### 5. 배포 전 빌드 확인하기

```powershell
npm run build
```

`dist` 폴더가 생성되고 오류가 없다면 준비가 완료된 것입니다.

### 6. Vercel 로그인하기

```powershell
npx vercel login
```

브라우저가 열리면 Vercel 계정으로 로그인합니다.

### 7. 미리보기 배포하기

```powershell
npx vercel
```

처음 실행할 때 질문이 나오면 다음처럼 선택합니다.

- **Set up and deploy?** → `Y`
- **Which scope?** → 본인 계정 선택
- **Link to existing project?** → 처음이라면 `N`
- **Project name?** → `data-on` 또는 원하는 영문 이름
- **In which directory is your code located?** → `./`
- **Want to modify these settings?** → `N`

완료되면 미리보기 주소가 표시됩니다. 주소를 열어 세 메뉴와 사진 업로드 기능을 확인합니다.

### 8. 정식 배포하기

미리보기에 문제가 없으면 아래 명령을 실행합니다.

```powershell
npx vercel --prod
```

완료 후 표시되는 `https://...vercel.app` 주소가 정식 사이트 주소입니다.

## 방법 B — GitHub를 연결해 자동 배포하기

1. ZIP을 풀고 GitHub에서 새 저장소를 만듭니다.
2. 압축을 푼 폴더 안의 모든 파일을 저장소 최상위에 업로드합니다.
3. Vercel 대시보드에서 **Add New → Project**를 누릅니다.
4. 방금 만든 GitHub 저장소를 찾아 **Import**를 누릅니다.
5. 다음 설정을 확인합니다.
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 환경 변수는 추가하지 않고 **Deploy**를 누릅니다.

이후 GitHub 저장소에 새 내용을 올릴 때마다 Vercel이 자동으로 미리보기 또는 정식 배포를 생성합니다.

## 배포 후 확인할 기능

- 상단 메뉴가 `데이터 분류하기`, `데이터 변환하기`, `데이터로 소통하기`로 표시되는지 확인합니다.
- 데이터 분류 카드가 두 상자로 이동하는지 확인합니다.
- 사진을 업로드하고 8×8, 16×16, 24×24 픽셀 변환이 되는지 확인합니다.
- 데이터 소통의 네 가지 미션이 순서대로 열리는지 확인합니다.
- 휴대전화에서도 하단 메뉴와 화면이 잘 보이는지 확인합니다.

## 자주 생기는 문제

### 404 또는 빈 화면이 나올 때

Vercel의 Root Directory가 `package.json`이 있는 폴더인지 확인합니다. `vercel.json`과 `package.json`이 같은 폴더에 있어야 합니다.

### 빌드 버전 오류가 날 때

Vercel 프로젝트의 **Settings → Build and Deployment**에서 Node.js 버전을 22로 선택한 뒤 다시 배포합니다.

### 수정본을 다시 배포할 때

명령어 방식은 수정 후 `npx vercel --prod`를 다시 실행합니다. GitHub 방식은 수정 파일을 커밋하고 푸시하면 자동으로 새 배포가 생성됩니다.

## 공식 도움말

- Vercel CLI 배포: https://vercel.com/docs/cli/deploying-from-cli
- Git 저장소 연결 배포: https://vercel.com/docs/git
- `vercel.json` 설정: https://vercel.com/docs/project-configuration/vercel-json
