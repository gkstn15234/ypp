# News Genres 자동화 시스템

## 📋 개요

Hugo 사이트에서 Google News 사이트맵을 위한 `<news:genres>` 요소를 **카테고리 기반으로 자동 분류**하는 시스템입니다.

콘텐츠 작성자가 개별적으로 `genre`를 설정할 필요 없이, 카테고리에 따라 적절한 Google News 장르가 자동으로 할당됩니다.

## 🎯 목적

- **관리 효율성**: 수동 genre 설정 불필요
- **일관성 보장**: 동일 카테고리 = 동일 genre  
- **실수 방지**: 휴먼 에러 최소화
- **Google News 최적화**: 올바른 장르 분류로 노출 향상

## 🔧 구현 위치

**파일**: `layouts/index.sitemapnews.xml`

```xml
{{ if eq .Section "securities" }}
<news:genres>PressRelease</news:genres>
{{ else if or (eq .Section "economy") (eq .Section "realestate") (eq .Section "it") (eq .Section "international") }}
<news:genres>OpEd</news:genres>
{{ else if .Params.genre }}
<!-- 개별 설정된 genre 처리 -->
{{ end }}
```

## 📊 자동 분류 규칙

### 카테고리별 Genre 매핑

| 카테고리 (Section) | 자동 할당 Genre | 설명 | 적용 이유 |
|-------------------|----------------|------|----------|
| `securities` | **PressRelease** | 증권/주식 | 기업 실적 발표, 공시 등 |
| `economy` | **OpEd** | 경제 | 경제 동향 분석, 전망 |
| `realestate` | **OpEd** | 부동산 | 부동산 시장 분석 |
| `it` | **OpEd** | IT/기술 | 기술 동향, 산업 분석 |
| `international` | **OpEd** | 국제 | 글로벌 경제 분석 |
| `youth` | *없음* | 청년 | 일반 뉴스로 처리 |

### Google News Genres 종류

- **PressRelease**: 보도자료, 기업 발표
- **OpEd**: 의견, 분석, 칼럼
- **Blog**: 블로그 형식
- **UserGenerated**: 사용자 생성 콘텐츠

## ⚡ 우선순위 체계

### 1순위: 개별 설정 (`front matter`에서 직접 지정)
```yaml
---
title: "기사 제목"
genre: "blog"  # 이 값이 최우선
---
```

### 2순위: 카테고리 자동 분류
```yaml
---
title: "테슬라 실적 발표"
categories: ["securities"]  # 자동으로 PressRelease 할당
---
```

### 3순위: genre 없음
- Google News에서 일반 뉴스로 처리
- `<news:genres>` 요소 생성되지 않음

## 💡 사용 방법

### 콘텐츠 작성자용

**✅ 권장 방법 (자동화 활용)**
```yaml
---
title: "현대차 Q3 실적 발표"
categories: ["securities"]  # PressRelease 자동 할당
---
```

**🔧 수동 설정 (특별한 경우)**
```yaml
---
title: "부동산 투자 후기"
categories: ["realestate"]
genre: "blog"  # 자동 분류(OpEd) 대신 Blog 사용
---
```

### 개발자용

**새 카테고리 추가 시**
1. `layouts/index.sitemapnews.xml` 편집
2. 해당 카테고리의 적절한 genre 결정
3. 조건문에 추가

```xml
{{ else if eq .Section "신규카테고리" }}
<news:genres>적절한Genre</news:genres>
```

## 📈 실제 출력 예시

### Securities 카테고리 기사
```xml
<news:news>
    <news:publication>
        <news:name>이콘밍글</news:name>
        <news:language>ko</news:language>
    </news:publication>
    <news:genres>PressRelease</news:genres>
    <news:publication_date>2025-06-29T14:15:00+09:00</news:publication_date>
    <news:title>테슬라 Q2 실적 발표</news:title>
</news:news>
```

### Economy 카테고리 기사  
```xml
<news:news>
    <news:publication>
        <news:name>이콘밍글</news:name>
        <news:language>ko</news:language>
    </news:publication>
    <news:genres>OpEd</news:genres>
    <news:publication_date>2025-06-29T10:30:00+09:00</news:publication_date>
    <news:title>전기차 시장 분석</news:title>
</news:news>
```

## 🔍 테스트 방법

### 1. 로컬 테스트
```bash
hugo server
# http://localhost:1313/sitemap-news.xml 확인
```

### 2. 생성된 사이트맵 확인
```bash
hugo --gc --minify
cat public/sitemap-news.xml | grep "news:genres"
```

### 3. Google News 검증
- [Google Publisher Center](https://publishercenter.google.com/) 에서 사이트맵 제출
- Google Search Console에서 색인 상태 확인

## ⚠️ 주의사항

### 1. 카테고리 일관성 유지
- 동일한 성격의 기사는 같은 카테고리 사용
- 카테고리명 오타 주의 (`securities` vs `security`)

### 2. Google News 정책 준수
- PressRelease: 실제 보도자료나 공식 발표만
- OpEd: 분석, 의견, 칼럼에만 사용
- 부적절한 분류 시 Google News 제재 가능

### 3. 성능 고려사항
- 뉴스 사이트맵은 최근 3일 기사만 포함
- 1000개 기사 제한 (현재 설정)

## 🛠️ 수정/확장 가이드

### 새 카테고리 추가
1. **분석**: 해당 카테고리의 주요 콘텐츠 성격 파악
2. **Genre 결정**: Google News 정책에 맞는 적절한 genre 선택
3. **코드 수정**: `layouts/index.sitemapnews.xml`에 조건 추가
4. **테스트**: 로컬에서 사이트맵 생성 확인
5. **문서 업데이트**: 이 문서의 매핑 테이블 업데이트

### Genre 변경
기존 카테고리의 genre를 변경할 때:
1. **영향 분석**: 해당 카테고리의 모든 기사에 영향
2. **Google News 재검토**: 변경된 분류가 적절한지 확인
3. **점진적 적용**: 가능하면 새 기사부터 적용

## 📚 참고 자료

- [Google News Publisher Guidelines](https://support.google.com/news/publisher-center/answer/9606710)
- [News Sitemap Guidelines](https://developers.google.com/search/docs/advanced/sitemaps/news-sitemap)
- [Hugo Template Documentation](https://gohugo.io/templates/)

## 📝 버전 히스토리

- **v1.0** (2025-01-30): 초기 자동화 시스템 구현
  - Securities → PressRelease 자동 분류
  - Economy, Realestate, IT, International → OpEd 자동 분류
  - 개별 설정 우선순위 지원

---

**마지막 업데이트**: 2025-01-30  
**담당자**: AI Assistant  
**리뷰 필요**: 새 카테고리 추가 시 