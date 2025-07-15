# Hugo 마크다운 출력 폴더

변환된 Hugo 마크다운 파일들이 이 폴더에 생성됩니다.

## 출력 구조

```
output/
├── content/
│   ├── automotive/              # 자동차 카테고리 게시물
│   │   ├── 2024-01-15-hyundai-new-model.md
│   │   ├── 2024-01-16-kia-electric-suv.md
│   │   └── ...
│   ├── economy/                 # 경제 카테고리 게시물
│   │   ├── 2024-01-15-stock-market-analysis.md
│   │   ├── 2024-01-16-economic-outlook.md
│   │   └── ...
│   └── posts/                   # 기타 카테고리 게시물
│       ├── 2024-01-15-general-news.md
│       └── ...
└── README.md                    # 이 파일
```

## 파일 형식

### 파일명 패턴
```
YYYY-MM-DD-slug.md
```

### Front Matter 예시
```yaml
---
title: "현대자동차 신모델 출시"
description: "현대자동차가 새로운 전기차 모델을 출시했습니다."
date: 2024-01-15T10:30:00+09:00
draft: false
categories: ["자동차"]
tags: ["현대자동차", "전기차"]
images: [
  "https://imagedelivery.net/abc123/def456/public"
]
author: "oh-eun-jin"
---
```

## 카테고리별 분류

### automotive/ (자동차)
- 자동차 관련 뉴스
- 신차 출시 소식
- 자동차 기술 동향

### economy/ (경제)
- 경제 뉴스
- 주식 시장 분석
- 금융 정보

### posts/ (기타)
- 분류되지 않은 게시물
- 일반 뉴스
- 기타 카테고리

## Hugo 프로젝트 적용

### 1. 파일 복사
```bash
# Hugo 프로젝트 루트에서
cp -r wp-to-hugo-migration/output/content/* content/
```

### 2. 빌드 및 배포
```bash
# Hugo 빌드
hugo --minify

# Git 커밋
git add .
git commit -m "WordPress 콘텐츠 마이그레이션 완료"
git push origin main
```

### 3. 확인사항
- [ ] 이미지 URL이 Cloudflare Images로 변환되었는지 확인
- [ ] 카테고리별 분류가 올바른지 확인
- [ ] Front Matter가 올바르게 생성되었는지 확인
- [ ] 한글 제목이 올바르게 처리되었는지 확인

## 통계 정보

마이그레이션 완료 후 다음 정보를 확인할 수 있습니다:
- 총 변환된 게시물 수
- 카테고리별 분포
- 작성자별 분포
- 이미지 처리 성공률

변환 결과는 `logs/` 폴더에서 확인할 수 있습니다. 