# 오토데일프릭스 기사 에디터

로그인 없이 빠르게 기사를 작성하고 GitHub 레포지토리에 업로드할 수 있는 웹 기반 에디터입니다.

## 🎯 주요 기능

- **🖊️ 마크다운 에디터**: 실시간 미리보기와 포맷팅 도구
- **📸 Cloudflare Images 연동**: 드래그 앤 드롭으로 이미지 업로드
- **👀 실시간 미리보기**: Hugo single.html 스타일 적용
- **📁 GitHub 업로드**: API를 통한 직접 업로드
- **💾 자동 저장**: 30초마다 임시 저장 (24시간 보관)
- **📱 반응형 디자인**: 모바일/태블릿 지원

## 🚀 시작하기

### 1. 에디터 열기
`editor/index.html` 파일을 웹 브라우저에서 엽니다.

### 2. Cloudflare Images 설정 (이미지 업로드 필요시)
첫 이미지 업로드 시 설정 창이 나타납니다:
- **Account ID**: Cloudflare 대시보드에서 확인
- **API Token**: Cloudflare Images API 토큰

#### Cloudflare 설정 방법
1. [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
2. 우측 상단 프로필 → **API 토큰**
3. **토큰 만들기** → **사용자 정의 토큰**
4. 권한 설정:
   - **계정** - Cloudflare Images:편집
   - **영역** - 영역:읽기 (선택사항)

### 3. GitHub 업로드 설정 (선택사항)
1. [GitHub Settings](https://github.com/settings/tokens) → **Personal access tokens**
2. **Generate new token (classic)**
3. 권한 선택: `repo` (전체 리포지토리 액세스)
4. 생성된 토큰을 에디터에서 사용

## 📝 사용법

### 기사 작성 단계

1. **기사 정보 입력**
   - 제목 (필수)
   - 카테고리: 자동차/경제
   - 작성자: 오은진/기타
   - 기사 요약 (150자 이내)
   - 태그 (최대 5개)

2. **이미지 업로드**
   - 드래그 앤 드롭 또는 클릭하여 업로드
   - 자동으로 Cloudflare Images에 최적화 저장
   - 반응형 이미지 URL 자동 생성

3. **본문 작성**
   - 마크다운 문법 사용
   - 실시간 미리보기 확인
   - 포맷팅 도구 활용

4. **발행**
   - **다운로드**: 마크다운 파일로 저장
   - **GitHub 업로드**: 직접 레포지토리에 업로드

### 키보드 단축키

- `Ctrl/Cmd + S`: 임시 저장
- `Ctrl/Cmd + Enter`: 파일 다운로드

### 마크다운 포맷팅 도구

- **굵게**: `**텍스트**`
- **기울임**: `*텍스트*`
- **링크**: `[텍스트](URL)`
- **제목**: `## 제목`
- **리스트**: `- 항목`

## 📁 파일 구조

```
editor/
├── index.html          # 메인 에디터 페이지
├── style.css          # 스타일시트
├── script.js          # 메인 로직
├── cloudflare.js      # Cloudflare Images API
└── README.md          # 사용법 (이 파일)
```

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Markdown Parser**: Marked.js
- **Icons**: Font Awesome
- **Image CDN**: Cloudflare Images
- **Version Control**: GitHub API

## 🎨 Cloudflare Images 활용

### 자동 최적화 기능
- **WebP/AVIF 변환**: 자동 최신 포맷 제공
- **반응형 이미지**: 디바이스별 최적 크기
- **글로벌 CDN**: 빠른 이미지 로딩

### 사용되는 이미지 변형
```javascript
// 썸네일 (300x200)
${imageUrl}/w=300,h=200,fit=cover

// 모바일 (800x600, WebP)
${imageUrl}/w=800,h=600,fit=cover,f=webp

// 데스크톱 (1200x800, WebP)
${imageUrl}/w=1200,h=800,fit=cover,f=webp
```

## 📱 Hugo 템플릿 연동

### single.html 최적화
에디터에서 생성된 이미지는 Hugo에서 자동으로 최적화됩니다:

```html
<picture>
    <!-- 데스크톱: 1200px 너비, WebP -->
    <source media="(min-width: 768px)" 
            srcset="{{ index .Params.images 0 }}/w=1200,f=webp">
    <!-- 모바일: 800px 너비, WebP -->
    <source media="(max-width: 767px)" 
            srcset="{{ index .Params.images 0 }}/w=800,f=webp">
    <!-- 기본 이미지 -->
    <img src="{{ index .Params.images 0 }}/w=1200" 
         alt="{{ .Title }}" loading="lazy">
</picture>
```

## 🔄 워크플로우

### 1. 기사 작성
```
에디터 열기 → 정보 입력 → 이미지 업로드 → 본문 작성 → 미리보기 확인
```

### 2. 발행 방법
**A. 다운로드 후 수동 업로드**
```
다운로드 → Git clone → 파일 복사 → commit & push
```

**B. 직접 GitHub 업로드**
```
GitHub 토큰 입력 → 업로드 버튼 → 자동 commit & push
```

## 🛡️ 보안 고려사항

- **토큰 저장**: Session Storage 사용 (브라우저 종료시 삭제)
- **CORS**: GitHub API는 CORS 지원
- **API 권한**: 최소 필요 권한만 요청

## 🔧 커스터마이징

### 카테고리 추가
`script.js`의 `generateFilename` 함수에서 한글→영문 매핑 추가:

```javascript
const koreanToEnglish = {
    '새카테고리': 'new-category',
    // ... 기존 매핑들
};
```

### 스타일 수정
`style.css`에서 색상, 폰트, 레이아웃 등 수정 가능

### GitHub 레포지토리 변경
`script.js`의 `uploadToGitHub` 함수에서 레포지토리 URL 수정:

```javascript
const response = await fetch('https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/contents/' + path, {
```

## 🐛 문제 해결

### 이미지 업로드 실패
1. Cloudflare Account ID와 API Token 확인
2. 파일 크기 10MB 이하 확인
3. 지원 형식 확인 (JPEG, PNG, GIF, WebP)

### GitHub 업로드 실패
1. Personal Access Token 권한 확인
2. 레포지토리 접근 권한 확인
3. 파일명 중복 확인

### 미리보기 오류
1. 브라우저 개발자 도구에서 오류 확인
2. Marked.js 라이브러리 로딩 확인

## 📞 지원

문제 발생시 GitHub Issues에 문의하거나 개발팀에 연락하세요.

---

**오토데일프릭스 기사 에디터** - 빠르고 효율적인 기사 작성을 위해 제작되었습니다. 