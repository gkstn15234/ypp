# 구글 디스커버 이미지 가이드라인

## 🎯 구글 디스커버 노출을 위한 이미지 최적화 가이드

구글 디스커버에서 기사가 노출되려면 **고품질의 큰 이미지**가 필수입니다. 이 가이드를 따라 이미지를 최적화하여 구글 디스커버 노출 확률을 높이세요.

## 📏 이미지 크기 요구사항

### 필수 요구사항
- **최소 너비**: 1200픽셀 이상
- **권장 너비**: 1600픽셀 이상
- **종횡비**: 16:9 (1.78:1) 권장
- **파일 형식**: JPG, PNG, WebP
- **품질**: 고화질 (95% 이상)

### 권장 이미지 크기
```
소형 썸네일: 480x270px
중형 썸네일: 800x450px
구글 디스커버용: 1200x675px ⭐ (최소 요구사항)
고화질 이미지: 1600x900px ⭐ (권장)
소셜 공유용: 1200x630px
```

## 🖼️ 이미지 품질 가이드라인

### ✅ 좋은 이미지 예시
- 선명하고 고화질인 이미지
- 기사 내용과 직접적으로 관련된 이미지
- 사람의 얼굴이나 감정이 드러나는 이미지
- 시각적으로 매력적이고 흥미로운 이미지
- 적절한 조명과 구성을 가진 이미지

### ❌ 피해야 할 이미지
- 사이트 로고만 있는 이미지
- 텍스트가 대부분인 이미지
- 흐릿하거나 저화질인 이미지
- 기사 내용과 관련 없는 이미지
- 너무 작은 이미지 (1200px 미만)

## 📝 기사 작성 시 이미지 설정

### Front Matter 설정
```yaml
---
title: "기사 제목"
description: "기사 요약"
date: 2025-01-30T10:00:00+09:00
images: 
  - "https://example.com/high-quality-image-1600x900.jpg"
  - "https://example.com/alternative-image-1200x675.jpg"
author: "김현지"
---
```

### 이미지 최적화 숏코드 사용
```markdown
{{< discover-image src="images/article-image.jpg" alt="기사 관련 이미지" caption="이미지 설명" >}}
```

## 🔧 기술적 구현 사항

### 이미 적용된 메타 태그
```html
<!-- 구글 디스커버 최적화 -->
<meta name="robots" content="max-image-preview:large">
<meta name="googlebot" content="max-image-preview:large">

<!-- Open Graph 이미지 -->
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- 구조화된 데이터 -->
"image": {
  "@type": "ImageObject",
  "url": "{{ .Params.image | absURL }}",
  "width": 1200,
  "height": 630
}
```

### Hugo 이미지 처리 설정
```yaml
imaging:
  resampleFilter: lanczos
  quality: 95
  anchor: smart
  sizes:
    - "1200x675"  # 구글 디스커버 권장
    - "1600x900"  # 고화질
    - "1200x630"  # 소셜 공유
```

## 📊 이미지 성능 체크리스트

### 기사 발행 전 확인사항
- [ ] 이미지 너비가 1200px 이상인가?
- [ ] 이미지가 기사 내용과 관련이 있는가?
- [ ] 이미지가 선명하고 고화질인가?
- [ ] 적절한 alt 텍스트가 설정되었는가?
- [ ] Open Graph 이미지가 설정되었는가?
- [ ] 이미지 파일 크기가 적절한가? (권장: 500KB 이하)

### 구글 디스커버 노출 확인 방법
1. **Google Search Console** 접속
2. **실적 > 검색 결과** 메뉴 확인
3. **Discover** 탭에서 노출 현황 확인
4. **페이지** 탭에서 개별 기사 성과 분석

## 🎨 이미지 최적화 도구 추천

### 온라인 도구
- **TinyPNG**: 이미지 압축
- **Squoosh**: 구글 이미지 최적화 도구
- **Canva**: 이미지 편집 및 리사이징
- **Unsplash**: 고품질 무료 이미지

### 이미지 소스 추천
- **Unsplash**: 무료 고품질 이미지
- **Pexels**: 무료 스톡 이미지
- **Pixabay**: 무료 이미지 및 벡터
- **Getty Images**: 프리미엄 이미지 (유료)

## 📈 성과 측정

### 주요 지표
- **구글 디스커버 노출 수**
- **클릭률 (CTR)**
- **평균 노출 순위**
- **사용자 참여도**

### 모니터링 도구
- Google Search Console
- Google Analytics
- Google PageSpeed Insights
- 구글 리치 결과 테스트

## 🚀 추가 최적화 팁

### 이미지 SEO
- 파일명에 키워드 포함 (예: `hyundai-ioniq-7-review.jpg`)
- 적절한 alt 텍스트 작성
- 이미지 주변 텍스트와 연관성 확보
- 이미지 사이트맵 생성

### 성능 최적화
- 이미지 지연 로딩 (lazy loading) 적용
- WebP 형식 사용 (지원 브라우저)
- CDN을 통한 이미지 배포
- 적절한 캐싱 정책 설정

---

**💡 중요**: 구글 디스커버는 알고리즘이 지속적으로 업데이트되므로, 정기적으로 Google Search Console을 확인하고 성과를 모니터링하는 것이 중요합니다. 