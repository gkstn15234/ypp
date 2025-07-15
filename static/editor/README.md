# 🚀 WordPress → Hugo 마이그레이션 완벽 가이드

WordPress XML 파일을 Hugo 마크다운으로 변환하는 완전한 Node.js 마이그레이션 도구입니다.

## 📋 현재 상황 정리

### 귀하의 환경
- ✅ Hugo 블로그 (GitHub Pages)
- ✅ Cloudflare Pages 배포
- ✅ Cloudflare Images 서비스 사용 중
- ✅ 마이그레이션 대상: WordPress XML 파일 2개
  - `1.txt` (16.5MB): 게시물 데이터
  - `2.txt` (9.9MB): 첨부파일 데이터

### 목표
WordPress 콘텐츠를 기존 Hugo 블로그에 안전하게 마이그레이션하면서 **이미지 위치 완벽 보존**

## 🎯 핵심 기능

### ✨ **이미지 위치 100% 보존** (가장 중요)
- 원본 글에서 이미지가 있던 정확한 위치 유지
- WordPress URL → Cloudflare Images URL 자동 교체
- 이미지 속성 완벽 보존 (alt, title, class, style 등)

### 🔧 **완전 자동화**
- WordPress XML 파일 자동 파싱
- 이미지 자동 다운로드 및 Cloudflare 업로드
- Hugo Front Matter 자동 생성
- 카테고리 및 작성자 자동 매핑
- 파일명 자동 생성 (날짜-slug 형식)

### 🛡️ **안전한 처리**
- 로컬 환경에서 실행
- 배치 처리로 API 제한 고려
- 재시도 로직 (최대 3회)
- 실패 시 원본 URL 유지
- DRY RUN 모드 지원

## 📁 프로젝트 구조

```
wp-to-hugo-migration/
├── package.json                    # 의존성 및 스크립트
├── .env                           # Cloudflare API 키 (생성 필요)
├── src/
│   ├── converter.js               # 메인 변환 로직
│   ├── parser.js                  # WordPress XML 파싱
│   ├── cloudflareImages.js        # Cloudflare Images API
│   ├── hugoFormatter.js           # Hugo 포맷팅
│   └── imageProcessor.js          # 이미지 위치 보존 처리
├── config/
│   ├── hugo-config.json           # Hugo 설정
│   └── categories.json            # 카테고리 매핑
├── input/                         # WordPress XML 파일
│   ├── 1.txt                      # 게시물 데이터
│   └── 2.txt                      # 첨부파일 데이터
├── output/                        # 변환된 파일
│   └── content/
│       ├── automotive/            # 자동차 카테고리
│       ├── economy/               # 경제 카테고리
│       └── posts/                 # 기타 카테고리
└── logs/                          # 변환 로그
```

## 🚀 빠른 시작

### 1. 설치 및 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 2. 환경 변수 설정 (.env)

```env
# Cloudflare Images API 설정
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token
CLOUDFLARE_HASH=your_cloudflare_hash

# 처리 설정
BATCH_SIZE=3
DELAY_BETWEEN_BATCHES=2000
MAX_RETRIES=3
```

### 3. WordPress XML 파일 준비

```bash
# input 폴더에 WordPress XML 파일 배치
mkdir -p input
cp your-wordpress-export.xml input/1.txt
cp your-wordpress-images.xml input/2.txt
```

### 4. 실행

```bash
# 테스트 실행 (처음 5개만)
npm run test

# DRY RUN (파일 생성 안함)
npm run dry-run

# 이미지 업로드 포함 실행
npm run upload-images

# 전체 마이그레이션
npm run migrate
```

## 🔧 상세 사용법

### 📊 테스트 실행 결과 예시

```bash
$ npm run test

🚀 WordPress → Hugo 마이그레이션 시작...

🧪 테스트 모드: 처음 5개 게시물만 처리합니다.
☁️  이미지 업로드 모드: Cloudflare Images에 업로드합니다.

📄 1단계: WordPress XML 파일 파싱
📄 파싱 시작: ./input/1.txt
✅ 총 1,247개 아이템 발견
📝 발행된 게시물: 1,247개
✅ 파싱 완료: 게시물 5개, 첨부파일 156개

🖼️  2단계: 이미지 처리
🖼️  이미지 23개 발견
🚀 이미지 업로드 시작: 23개
✅ 업로드 성공: car-image-1.jpg
✅ 업로드 성공: economy-chart.png
📊 진행률: 23/23 (100.0%)

📝 3단계: 게시물 변환
📝 처리 중 (20.0%): 현대자동차 신모델 출시
💾 저장: ./output/content/automotive/2024-01-15-hyundai-new-model.md
📝 처리 중 (40.0%): 경제 동향 분석
💾 저장: ./output/content/economy/2024-01-16-economy-analysis.md

📊 4단계: 결과 요약
🎉 마이그레이션 완료 결과:
⏱️  소요 시간: 45.3초
📝 총 게시물: 5개
✅ 성공: 5개
❌ 실패: 0개
📊 성공률: 100.0%
🖼️  총 이미지: 23개
☁️  업로드 성공: 23개
💥 업로드 실패: 0개

✅ 마이그레이션이 성공적으로 완료되었습니다!
```

### 🎯 변환 결과 예시

#### 🔴 WordPress 원본
```xml
<item>
    <title>현대자동차 신모델 출시</title>
    <content:encoded><![CDATA[
        <p>현대자동차가 새로운 전기차 모델을 출시했습니다.</p>
        <img src="https://wp-site.com/uploads/2024/01/car-image.jpg" alt="현대차 이미지">
        <p>이 모델은 혁신적인 기술을 적용했습니다.</p>
    ]]></content:encoded>
    <dc:creator>오은진</dc:creator>
    <pubDate>Mon, 15 Jan 2024 10:30:00 +0000</pubDate>
    <category domain="category">자동차</category>
    <category domain="post_tag">현대자동차</category>
</item>
```

#### 🟢 Hugo 변환 결과
```markdown
---
title: "현대자동차 신모델 출시"
description: "현대자동차가 새로운 전기차 모델을 출시했습니다."
date: 2024-01-15T10:30:00+09:00
draft: false
categories: ["자동차"]
tags: ["현대자동차"]
images: [
  "https://imagedelivery.net/abc123/def456/public"
]
author: "oh-eun-jin"
---

<p>현대자동차가 새로운 전기차 모델을 출시했습니다.</p>
<img src="https://imagedelivery.net/abc123/def456/public" alt="현대차 이미지">
<p>이 모델은 혁신적인 기술을 적용했습니다.</p>
```

## 📈 성능 최적화

### 배치 처리
```javascript
// 3개씩 배치 처리로 API 제한 방지
const batchSize = 3;
const delay = 2000; // 2초 지연
```

### 재시도 로직
```javascript
// 최대 3회 재시도 (지수 백오프)
const maxRetries = 3;
const delay = Math.pow(2, attempt) * 1000;
```

### 메모리 최적화
```javascript
// 스트림 처리로 메모리 효율성 확보
const imageBuffer = await downloadImageAsStream(url);
```

## 🛠️ 고급 설정

### 카테고리 매핑 커스터마이징
```json
// config/categories.json
{
  "categoryMappings": {
    "wordpress": {
      "자동차": "automotive",
      "경제": "economy",
      "기술": "technology"
    }
  }
}
```

### 작성자 매핑 설정
```javascript
// src/hugoFormatter.js
const authorMap = {
  '오은진': 'oh-eun-jin',
  '김철수': 'kim-chul-su'
};
```

## 🔍 문제 해결

### 자주 발생하는 문제

#### 1. Cloudflare API 오류
```bash
❌ 업로드 실패: API 제한 초과
```
**해결방법**: `.env`에서 `BATCH_SIZE`를 줄이고 `DELAY_BETWEEN_BATCHES`를 늘리세요.

#### 2. 이미지 다운로드 실패
```bash
❌ 이미지 다운로드 타임아웃
```
**해결방법**: 네트워크 상태 확인 후 재시도하세요.

#### 3. 파일 크기 초과
```bash
⚠️  파일 크기 초과 (8.5MB)
```
**해결방법**: 5MB 이하 이미지만 업로드됩니다. 원본 URL이 유지됩니다.

### 디버깅 모드
```bash
# 상세 로그 출력
DEBUG=* npm run migrate

# 특정 게시물만 처리
node src/converter.js --test --dry-run
```

## 📊 변환 통계

### 지원되는 WordPress 기능
- ✅ 게시물 (post type)
- ✅ 첨부파일 (attachment)
- ✅ 카테고리 (category)
- ✅ 태그 (post_tag)
- ✅ 이미지 (img 태그)
- ✅ 갤러리 ([gallery] 숏코드)
- ✅ 캡션 ([caption] 숏코드)
- ✅ 메타데이터 (title, date, author)

### 변환 결과 통계 예시
```
📊 변환 통계:
   총 게시물: 1,247개
   평균 콘텐츠 길이: 2,834자
   이미지 포함 글: 892개

📁 카테고리별 분포:
   자동차: 456개
   경제: 321개
   기술: 234개
   라이프스타일: 156개
   기타: 80개

✍️  작성자별 분포:
   오은진: 678개
   김철수: 345개
   박영희: 224개
```

## 🎉 마이그레이션 완료 후

### 1. 결과 검증
```bash
# 생성된 파일 확인
ls -la output/content/automotive/
ls -la output/content/economy/

# 로그 확인
cat logs/conversion-results-*.json
```

### 2. Hugo 프로젝트에 복사
```bash
# Hugo 프로젝트 루트에서
cp -r wp-to-hugo-migration/output/content/* content/
```

### 3. 빌드 및 배포
```bash
# Hugo 빌드
hugo --minify

# Cloudflare Pages 자동 배포
git add .
git commit -m "WordPress 콘텐츠 마이그레이션 완료"
git push origin main
```

## 📝 라이선스

MIT License - 자유롭게 사용하세요!

## 🤝 기여하기

버그 리포트나 기능 요청은 GitHub Issues를 이용해주세요.

---

**완벽한 마이그레이션이 가능합니다!** 🎯

이미지 위치 100% 보존을 보장하는 전문 도구로, WordPress 사이트의 모든 콘텐츠를 Hugo로 안전하게 이전할 수 있습니다. 