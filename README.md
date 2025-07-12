# 오토데일프릭스 - 자동차 경제 뉴스 사이트

자동차 산업과 경제 정보를 전문적으로 다루는 오토데일프릭스 뉴스 사이트입니다.

## 🚀 실시간 배포 설정

### 자동 배포 프로세스
1. **GitHub에 푸시** → **GitHub Actions 실행** → **Hugo 빌드** → **Cloudflare Pages 배포**
2. 새로운 기사를 `content/` 폴더에 추가하고 커밋/푸시하면 자동으로 사이트가 업데이트됩니다.

### 필요한 GitHub Secrets 설정
```
CLOUDFLARE_API_TOKEN: Cloudflare API 토큰
CLOUDFLARE_ACCOUNT_ID: Cloudflare 계정 ID
CLOUDFLARE_ZONE: Cloudflare Zone ID
CLOUDFLARE_TOKEN: 캐시 무효화용 토큰
SITE_URL: 사이트 URL (예: https://autodaiiy.com)
```

### 캐시 설정 (실시간 업데이트)
- **메인 페이지**: 5분 캐시 (새 기사 즉시 반영)
- **카테고리 페이지**: 10분 캐시
- **개별 기사**: 30분 캐시
- **작성자 페이지**: 1시간 캐시
- **정적 파일**: 1년 캐시

### 새 기사 발행 방법
1. `content/automotive/` 또는 `content/economy/` 폴더에 새 마크다운 파일 생성
2. 파일 헤더에 필요한 메타데이터 추가:
   ```yaml
   ---
   title: "기사 제목"
   description: "기사 요약"
   author: "기자명"
   date: 2024-01-01T10:00:00+09:00
   tags: ["태그1", "태그2"]
   images: ["이미지_URL"]
   ---
   ```
3. Git 커밋 및 푸시:
   ```bash
   git add .
   git commit -m "새 기사 추가: 기사 제목"
   git push origin main
   ```
4. 약 2-3분 후 사이트에 자동 반영됩니다.

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
│   └── authors/       # 작성자 정보
├── layouts/           # 템플릿 파일
├── static/            # 정적 파일
├── config.yaml        # Hugo 설정
├── package.json       # 빌드 스크립트
├── wrangler.toml      # Cloudflare Pages 설정
└── .github/workflows/ # GitHub Actions
```

## 🎯 주요 기능
- 반응형 3컬럼 레이아웃
- 실시간 기사 업데이트
- 카테고리별 필터링
- 작성자별 기사 분류
- SEO 최적화
- 모바일 최적화
- 빠른 캐시 무효화

## 📞 문의
- 이메일: contact@humanbigdata.com
- 전화: 1811-9670 