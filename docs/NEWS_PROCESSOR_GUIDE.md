# iruinss 스타일 뉴스 처리 시스템 사용 가이드

## 개요
이 시스템은 일반 뉴스 데이터를 **iruinss.co.kr** 스타일의 매력적이고 감성적인 기사로 변환하는 도구입니다.

## 파일 위치
```
static/js/news-processor.js
```

## 기본 사용법

### 1. HTML에서 스크립트 로드
```html
<script src="/js/news-processor.js"></script>
```

### 2. 뉴스 아이템 처리
```javascript
// 샘플 뉴스 데이터
const newsItems = [
  {
    json: {
      title: "전기차 시장 급성장",
      description: "전기차 판매량이 전년 대비 50% 증가했습니다.",
      pubDate: "2025-06-30",
      source: { name: "경제신문" }
    }
  }
];

// iruinss 스타일로 변환
const processedItems = IruinssNewsProcessor.processNewsItems(newsItems);
console.log(processedItems[0].json.prompt);
```

## 주요 기능

### 1. 카테고리 자동 판별
```javascript
// 제목과 내용을 분석하여 '경제 뉴스' 또는 '자동차 뉴스'로 분류
const category = IruinssNewsProcessor.determineEconomyOrAutomotive(
  "현대차 신차 출시",
  "전기차 시장에서 혁신적인 변화",
  "기본카테고리"
);
// 결과: "자동차 뉴스"
```

### 2. SEO 친화적 슬러그 생성
```javascript
const slug = IruinssNewsProcessor.generateSEOSlug("현대차 역대급 실적 발표");
// 결과: "현대차-역대급-실적-발표"
```

### 3. 감성적 제목 스타일
시스템이 생성하는 iruinss 스타일 제목 예시:
- `"깜짝 실적 발표"…현대차 3분기 영업이익 2조 돌파`
- `"완판 행진 돌입"…출시부터 품귀현상 빚은 신차는?`

### 4. 구조화된 HTML 템플릿
생성되는 HTML 구조:
```html
<h1>제목</h1>
<div class="vertical-bar-text">핵심요약<br>부가설명</div>
<img src="IMG_URL_1" alt="주목받는 경제 뉴스 키워드"/>
<p>첫 번째 단락...</p>
<h2>소제목</h2>
<!-- 이미지, 단락들 반복 -->
<div class="tag_wrap">태그 섹션</div>
<div class="other_article_wrap">관련 기사</div>
<div class="sns_share">SNS 공유</div>
```

## 카테고리별 특성

### 경제 뉴스
- **감성 키워드**: 충격, 깜짝, 돌파, 폭등, 폭락, 대박, 급등, 급락
- **수직바 텍스트**: "주목해야 할 시장 동향<br>전문가들의 다양한 의견 총정리"
- **관련 키워드**: 주식, 경제, 금리, 투자, 시장, 펀드, 주가, 재테크

### 자동차 뉴스  
- **감성 키워드**: 파격, 역대급, 신차, 놀라운, 혁신, 전격, 출시, 완판
- **수직바 텍스트**: "주목할 만한 신차 특징<br>달라진 점과 핵심 포인트"
- **관련 키워드**: 자동차, 신차, 전기차, 테슬라, 현대, 기아, BMW

## 실제 적용 예시

### Hugo 블로그에서 사용
```javascript
// content/economy/ 폴더의 마크다운 파일에 적용
document.addEventListener('DOMContentLoaded', function() {
  const articles = document.querySelectorAll('.article-content');
  
  articles.forEach(article => {
    // 기존 콘텐츠를 iruinss 스타일로 재구성
    const title = article.querySelector('h1').textContent;
    const category = IruinssNewsProcessor.determineEconomyOrAutomotive(title, '', '');
    
    // 태그 섹션 추가
    const tagSection = IruinssNewsProcessor.generateIruinssTags(title, category);
    article.insertAdjacentHTML('beforeend', tagSection);
  });
});
```

### API 연동 시 사용
```javascript
// 외부 뉴스 API 데이터를 가져와서 처리
async function fetchAndProcessNews() {
  const response = await fetch('/api/news');
  const newsData = await response.json();
  
  // iruinss 스타일로 변환
  const processedNews = IruinssNewsProcessor.processNewsItems(newsData);
  
  // 변환된 데이터로 화면 렌더링
  renderNews(processedNews);
}
```

## 커스터마이징

### 감성 키워드 추가
```javascript
// news-processor.js 파일에서 emotionalKeywords 객체 수정
const emotionalKeywords = {
  '경제 뉴스': ['충격', '깜짝', '새로운키워드'], // 키워드 추가
  '자동차 뉴스': ['파격', '역대급', '새로운키워드']
};
```

### 새로운 카테고리 추가
```javascript
// determineEconomyOrAutomotive 함수를 확장하여 새 카테고리 지원
static determineCategory(title, desc, defaultCategory) {
  // IT 뉴스 키워드 추가
  const itKeywords = ['AI', '인공지능', '스마트폰', '앱', '소프트웨어'];
  // 카테고리 판별 로직 확장
}
```

## 주의사항

1. **이미지 플레이스홀더**: `IMG_URL_1~4`는 실제 이미지 URL로 교체 필요
2. **링크 경로**: `ARTICLE_SLUG`는 실제 기사 URL로 교체 필요  
3. **브랜딩**: `HugoDiscoverPro`를 실제 사이트명으로 변경
4. **CSS**: iruinss 스타일 CSS 클래스들이 정의되어 있어야 함

## 파일 구조
```
HugoDiscoverPro/
├── static/js/
│   └── news-processor.js          # 메인 처리 시스템
├── docs/
│   └── NEWS_PROCESSOR_GUIDE.md    # 이 가이드 파일
├── content/
│   ├── economy/                   # 경제 뉴스 폴더
│   └── it/                        # IT 뉴스 폴더
└── layouts/
    └── partials/
        └── article-card.html      # 기사 카드 템플릿
```

## 활용 팁

1. **Hugo 숏코드와 연동**: Hugo 숏코드를 만들어 마크다운에서 직접 사용
2. **자동화**: GitHub Actions으로 새 기사 생성 시 자동 처리
3. **A/B 테스트**: 기존 스타일과 iruinss 스타일 비교 테스트
4. **SEO 최적화**: 생성된 구조화 데이터로 검색엔진 최적화

이제 `/static/js/news-processor.js`를 로드하고 `IruinssNewsProcessor` 클래스를 사용하면 됩니다! 🚀 