# 🌟 HugoDiscoverPro - 포스트업 건강 미디어 플랫폼

## 📋 프로젝트 개요

**포스트업**은 Hugo 정적 사이트 생성기를 기반으로 구축된 현대적인 건강 전문 미디어 플랫폼입니다. 건강과 운동에 특화된 전문 콘텐츠 관리 솔루션을 제공합니다.

### 🎯 핵심 목표
- **시의성 있는 건강 정보**: 빠르고 신뢰도 높은 건강 정보 전달
- **AI 자동화**: 완전 자동화된 뉴스 생성 및 발행 시스템
- **SEO 최적화**: 검색엔진 친화적인 구조와 성능
- **모바일 우선**: 반응형 디자인과 사용자 경험 최적화

## 🏗️ 프로젝트 구조

```
HugoDiscoverPro/
├── 📁 ai-system/                    # AI 뉴스 자동 생성 시스템
│   ├── main.js                      # 메인 제어 시스템
│   ├── trend-collector.js           # 트렌드 수집기
│   ├── image-collector.js           # 이미지 수집기
│   ├── ai-article-writer.js         # AI 기사 작성기
│   ├── hugo-generator.js            # Hugo 마크다운 생성기
│   ├── config.js                    # 시스템 설정
│   └── README.md                    # AI 시스템 가이드
│
├── 📁 content/                      # Hugo 컨텐츠 디렉토리
│   ├── _index.md                    # 홈페이지 컨텐츠
│   ├── about.md                     # 회사 소개
│   ├── contact.md                   # 연락처
│   ├── privacy.md                   # 개인정보처리방침
│   ├── terms.md                     # 이용약관
│   ├── editorial-guidelines.md      # 편집 가이드라인
│   ├── youth-protection.md          # 청소년 보호 정책
│   │
│   ├── 📁 authors/                  # 기자 프로필
│   │   ├── _index.md
│   │   ├── ha-young-sang.md         # 하영상 기자
│   │   └── kim-gwang-ho.md          # 김한수 건강전문가
│   │
│   ├── 📁 health/                   # 건강 정보
│   │   ├── _index.md
│   │   ├── electric-vehicle-market-analysis.md
│   │   └── hyundai-palisade-hybrid-us-debut.md
│   │
│   ├── 📁 securities/               # 증권 뉴스
│   │   ├── _index.md
│   │   └── tesla-earnings-report.md
│   │
│   ├── 📁 realestate/               # 부동산 뉴스
│   │   ├── _index.md
│   │   └── housing-market-trends.md
│   │
│   ├── 📁 it/                       # IT 뉴스
│   │   ├── _index.md
│   │   ├── ai-semiconductor-industry.md
│   │   ├── chatgpt-korea-market-analysis.md
│   │   ├── tesla-fully-autonomous-delivery.md
│   │   └── 2025-01-30-hyundai-electric-vehicle-autonomous-driving.md
│   │
│   ├── 📁 international/            # 국제 뉴스
│   │   ├── _index.md
│   │   └── global-economic-outlook.md
│   │
│   └── 📁 youth/                    # 청년 뉴스
│       ├── _index.md
│       └── 2025-01-30-iu-latest-activities-music-industry.md
│
├── 📁 layouts/                      # Hugo 템플릿 시스템
│   ├── _default/
│   │   ├── baseof.html              # 기본 레이아웃
│   │   ├── list.html                # 목록 페이지
│   │   ├── single.html              # 개별 기사 페이지
│   │   └── rss.xml                  # RSS 피드
│   ├── index.html                   # 홈페이지 템플릿
│   ├── 404.html                     # 404 에러 페이지
│   ├── partials/
│   │   ├── header.html              # 헤더 컴포넌트
│   │   ├── footer.html              # 푸터 컴포넌트
│   │   ├── article-card.html        # 기사 카드 컴포넌트
│   │   └── breadcrumb.html          # 브레드크럼 네비게이션
│   ├── taxonomy/
│   │   ├── list.html                # 태그/카테고리 목록
│   │   └── single.html              # 개별 태그/카테고리
│   └── sitemap.xml                  # 사이트맵 템플릿
│
├── 📁 static/                       # 정적 파일
│   ├── css/
│   │   └── style.css                # 메인 스타일시트
│   ├── js/
│   │   └── main.js                  # 프론트엔드 JavaScript
│   ├── images/
│   │   ├── favicon.ico              # 파비콘
│   │   ├── logo.svg                 # 로고
│   │   └── [뉴스 이미지들]           # 기사 이미지
│   ├── robots.txt                   # 로봇 크롤링 규칙
│   ├── sw.js                        # 서비스 워커
│   └── _headers                     # 보안 헤더 설정
│
├── 📁 docs/                         # 문서화
│   └── NEWS_PROCESSOR_GUIDE.md      # 뉴스 처리 가이드
│
├── 📁 attached_assets/              # 첨부 자료
│   ├── Pasted--PRD-Product-Requirements-Document-1-Overview.txt
│   └── Pasted--PRD-UX.txt
│
├── 📁 public/                       # 빌드된 사이트 (자동 생성)
├── 📁 resources/                    # Hugo 리소스 캐시
│
├── config.yaml                      # Hugo 메인 설정 파일
├── netlify.toml                     # Netlify 배포 설정
├── wrangler.toml                    # Cloudflare Pages 설정
├── .replit                          # Replit 환경 설정
├── replit.md                        # 프로젝트 문서 (이 파일)
├── run_generator.py                 # Python 뉴스 생성기 실행 스크립트
└── extracted_urls.txt               # 추출된 URL 목록
```

## 🚀 주요 기능

### 1. 📰 뉴스 카테고리 시스템
- **건강**: 건강관리, 질병예방, 의료정보
- **운동**: 피트니스, 운동법, 스포츠의학
- **영양**: 영양학, 다이어트, 식단관리
- **웰빙**: 정신건강, 스트레스 관리, 라이프스타일
- **의료**: 의료기술, 치료법, 건강보험
- **청년**: 청년층 건강이슈, 운동문화

### 2. 🤖 AI 자동 뉴스 생성 시스템
- **완전 자동화**: 트렌드 수집 → 이미지 수집 → AI 기사 작성 → Hugo 마크다운 생성
- **실시간 반영**: 생성된 기사가 Hugo 프로젝트에 즉시 반영
- **다중 AI 지원**: Cursor AI 직접 생성, 템플릿 기반 폴백
- **스케줄링**: 설정된 시간에 자동으로 기사 생성 (일 5회)
- **카테고리 최적화**: 각 분야별 맞춤 기사 생성

#### AI 시스템 워크플로우
```
🔍 트렌드 수집 (RSS, Google Trends, Reddit)
    ↓
📊 정보 분석 및 점수화
    ↓
🖼️ 관련 이미지 수집 (Google, Bing, DuckDuckGo)
    ↓
✍️ AI 기사 작성 (Cursor AI 직접 생성)
    ↓
📝 Hugo 마크다운 변환 및 저장
    ↓
🌐 사이트 자동 반영
```

### 3. 📱 반응형 웹 디자인
- **모바일 우선 설계**: 스마트폰, 태블릿 최적화
- **Bootstrap 5**: 현대적이고 안정적인 CSS 프레임워크
- **다크모드 지원**: 사용자 환경 설정 저장
- **검색 기능**: 실시간 기사 검색 및 필터링

### 4. 🔍 SEO 최적화
- **구조화된 데이터**: JSON-LD 스키마 마크업
- **다중 사이트맵**: 일반, 뉴스, 저자, 페이지별 사이트맵
- **메타 태그 최적화**: Open Graph, Twitter Cards
- **Google News 최적화**: 뉴스 키워드, 발행 정보
- **성능 최적화**: 이미지 압축, CSS/JS 최소화

### 5. 👥 저자 관리 시스템
- **기자 프로필**: 개별 기자 페이지 및 작성 기사 목록
- **저자별 RSS**: 특정 기자의 기사만 구독 가능
- **크레딧 시스템**: 모든 기사에 저자 정보 표시

## ⚙️ 기술 스택

### Frontend
- **Hugo**: 정적 사이트 생성기 (v0.147.9)
- **Bootstrap 5**: CSS 프레임워크
- **Font Awesome**: 아이콘 라이브러리
- **Google Fonts**: 웹 폰트 (Noto Sans KR)
- **Vanilla JavaScript**: 프론트엔드 인터렉션

### Backend & AI
- **Node.js**: AI 뉴스 생성 시스템 런타임
- **Python**: 뉴스 생성기 스크립트
- **Cursor AI**: 직접 AI 기사 생성
- **RSS Parser**: 뉴스 피드 수집
- **Image Scraping**: 다중 검색엔진 이미지 수집

### Deployment & Hosting
- **Cloudflare Pages**: 메인 호스팅 (hugodiscoverpro.pages.dev)
- **Netlify**: 대체 호스팅 옵션
- **GitHub**: 소스 코드 관리
- **Replit**: 개발 환경

### Security & Performance
- **Content Security Policy**: XSS 보호
- **HTTPS**: SSL/TLS 암호화
- **CDN**: 글로벌 컨텐츠 배포
- **Image Optimization**: WebP 지원, 지연 로딩
- **Caching**: 브라우저 캐싱 최적화

## 🛠️ 설치 및 실행

### 로컬 개발 환경 설정
```bash
# 1. 저장소 클론
git clone [repository-url]
cd HugoDiscoverPro

# 2. Hugo 설치 (필요시)
# Windows: choco install hugo-extended
# macOS: brew install hugo
# Linux: snap install hugo

# 3. 개발 서버 실행
hugo server --buildDrafts --buildFuture

# 4. 브라우저에서 접속
# http://localhost:1313
```

### AI 뉴스 생성 시스템 실행
```bash
# 기본 실행 (3개 기사 생성)
npm start

# 특정 개수 기사 생성
npm start run 5

# Hugo 빌드 포함
npm start run 3 --build

# 자동 스케줄링 시작
npm start schedule
```

### 프로덕션 빌드
```bash
# 사이트 빌드
hugo --gc --minify

# 빌드 결과는 public/ 폴더에 생성
```

## 📊 컨텐츠 관리

### 새 기사 작성
```bash
# 새 기사 생성
hugo new health/new-article.md
hugo new exercise/fitness-news.md

# AI 자동 생성
npm start single "특정 주제"
```

### Front Matter 예시
```yaml
---
title: "기사 제목"
description: "기사 요약"
date: 2025-01-30T10:00:00+09:00
draft: false
categories: ["건강"]
tags: ["건강", "운동", "웰빙"]
images: ["https://example.com/image.jpg"]
author: "김한수"
ai_generated: false
trend_score: 85
word_count: 1200
reading_time: 6
---
```

## 🔧 설정 및 커스터마이징

### 주요 설정 파일
- **config.yaml**: Hugo 메인 설정
- **ai-system/config.js**: AI 시스템 설정
- **netlify.toml**: 배포 설정
- **static/_headers**: 보안 헤더

### 환경별 설정
- **개발환경**: `hugo server`
- **스테이징**: `hugo --buildFuture`
- **프로덕션**: `hugo --gc --minify`

## 📈 성능 및 분석

### 빌드 최적화
- **이미지 최적화**: Hugo 이미지 프로세싱
- **CSS/JS 최소화**: 번들링 및 압축
- **캐싱 전략**: 브라우저 및 CDN 캐싱

### SEO 메트릭
- **Google PageSpeed**: 모바일/데스크톱 최적화
- **Core Web Vitals**: LCP, FID, CLS 최적화
- **구조화된 데이터**: Rich Snippets 지원

## 🚀 배포 및 운영

### 자동 배포 파이프라인
1. **Git Push** → GitHub Repository
2. **Webhook** → Cloudflare Pages
3. **Hugo Build** → `hugo --gc --minify`
4. **Deploy** → CDN 배포
5. **Cache Invalidation** → 전역 캐시 갱신

### 모니터링
- **사이트 상태**: Uptime 모니터링
- **성능 추적**: Web Vitals 측정
- **SEO 분석**: 검색엔진 최적화 상태

## 📞 문의 및 지원

### 회사 정보
- **회사명**: 주식회사 픽펄스
- **등록번호**: 경북,아55580
- **주소**: 경북 경산시 진량읍 일연로 747
- **전화**: 010-7539-8504
- **이메일**: hangil9910@gmail.com

### 개발팀
- **발행인**: 김한수
- **편집인**: 김한수
- **청소년보호책임자**: 김한수

## 📝 라이센스 및 정책

- **개인정보처리방침**: `/privacy/`
- **이용약관**: `/terms/`
- **편집가이드라인**: `/editorial-guidelines/`
- **청소년보호정책**: `/youth-protection/`

---

> **포스트업**은 과학적 근거와 전문성을 결합하여 차세대 건강 미디어의 새로운 기준을 제시합니다.
