# 포스트업 - 자동차 경제 뉴스 사이트

자동차 산업과 경제 정보를 전문적으로 다루는 포스트업 뉴스 사이트입니다.

## 🚀 Cloudflare Pages 자동 배포 설정

### 자동 배포 프로세스
1. **GitHub에 푸시** → **Cloudflare Pages 자동 감지** → **Hugo 빌드** → **자동 배포**
2. 새로운 기사를 `content/` 폴더에 추가하고 커밋/푸시하면 자동으로 사이트가 업데이트됩니다.

### Cloudflare Pages 설정 방법

#### 1. Cloudflare Pages 프로젝트 생성
1. Cloudflare Dashboard → Pages → "Create a project"
2. "Connect to Git" 선택 → GitHub 리포지토리 연결
3. 빌드 설정:
   - **Build command**: `hugo --minify --gc`
   - **Build output directory**: `public`
   - **Root directory**: `/` (루트)

#### 2. 환경 변수 설정
**Production 환경**:
```
HUGO_VERSION=0.147.9
HUGO_ENV=production
HUGO_ENVIRONMENT=production
NODE_VERSION=18
```

**Preview 환경**:
```
HUGO_VERSION=0.147.9
HUGO_ENV=development
NODE_VERSION=18
```

#### 3. 빌드 설정 확인
- **Framework preset**: Hugo
- **Build command**: `hugo --minify --gc`
- **Build output directory**: `public`
- **Node.js version**: 18

### 빌드 문제 해결

#### 엔터테인먼트 섹션 404 오류 해결
최근 수정사항으로 엔터테인먼트 섹션이 사이트맵과 메인 페이지에 포함되었습니다:
- ✅ 사이트맵에 entertainment 섹션 추가
- ✅ 메인 페이지에 엔터테인먼트 기사 표시
- ✅ 엔터테인먼트 섹션 아이콘 및 스타일 적용

#### 일반적인 빌드 문제
1. **Hugo 버전 불일치**: 환경 변수에서 `HUGO_VERSION=0.147.9` 설정
2. **Base URL 문제**: 빌드 명령어에 `--baseURL $CF_PAGES_URL` 추가
3. **캐시 문제**: Cloudflare Pages에서 "Clear cache and deploy" 실행

### 수동 배포 (로컬에서)
```bash
# 빌드
hugo --minify --gc

# Cloudflare Pages에 배포 (wrangler 사용)
npx wrangler pages deploy public
```

### 새 기사 발행 방법
1. `content/automotive/`, `content/economy/`, `content/entertainment/` 폴더에 새 마크다운 파일 생성
2. 파일 헤더에 필요한 메타데이터 추가:
   ```yaml
   ---
   title: "기사 제목"
   description: "기사 요약"
   author: "기자명"
   date: 2024-01-01T10:00:00+09:00
   tags: ["태그1", "태그2"]
   categories: ["health"] # 또는 "medical", "wellness"
   images: ["이미지_URL"]
   ---
   ```
3. Git 커밋 및 푸시:
   ```bash
   git add .
   git commit -m "새 기사 추가: 기사 제목"
   git push origin main
   ```
4. 약 2-3분 후 Cloudflare Pages에서 자동으로 사이트에 반영됩니다.

## 🛠️ 개발 환경 설정

### 로컬 개발 서버 실행
```bash
# Hugo 서버 실행 (드래프트 포함)
hugo server -D

# 또는 npm 스크립트 사용
npm run dev
```

### 프로덕션 빌드
```bash
# Hugo 최적화 빌드
hugo --minify

# 또는 npm 스크립트 사용
npm run build
```

## 📁 프로젝트 구조
```
├── content/           # 콘텐츠 파일
│   ├── automotive/    # 자동차 뉴스
│   ├── economy/       # 경제 뉴스
│   ├── entertainment/ # 엔터테인먼트 뉴스
│   └── authors/       # 작성자 정보
├── layouts/           # 템플릿 파일
├── static/            # 정적 파일
├── functions/         # Cloudflare Pages Functions
├── config.yaml        # Hugo 설정
├── _build.yml         # Cloudflare Pages 빌드 설정
├── wrangler.toml      # Cloudflare Pages 설정
├── _redirects         # 리다이렉트 규칙
└── static/_headers    # HTTP 헤더 설정
```

## 🎯 주요 기능
- 반응형 3컬럼 레이아웃
- 실시간 기사 업데이트
- 카테고리별 필터링 (자동차, 경제, 엔터테인먼트)
- 작성자별 기사 분류
- SEO 최적화
- 모바일 최적화
- Cloudflare Pages 최적화 캐시

## 🔧 캐시 최적화
- **HTML 파일**: 5분 캐시, 실시간 업데이트
- **CSS/JS**: 1년 캐시 (immutable)
- **이미지**: 1주일 캐시
- **사이트맵**: 1시간 캐시

## 📞 문의
- 이메일: contact@humanbigdata.com
- 전화: 1811-9670 