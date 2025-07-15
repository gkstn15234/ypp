# WordPress XML 파일 입력 폴더

이 폴더에 WordPress 내보내기 파일을 배치하세요.

## 파일 구조

```
input/
├── 1.txt          # WordPress 게시물 내보내기 파일
├── 2.txt          # WordPress 첨부파일 내보내기 파일 (선택사항)
└── README.md      # 이 파일
```

## WordPress 내보내기 방법

### 1. 게시물 내보내기 (1.txt)
1. WordPress 관리자 → 도구 → 내보내기
2. "모든 콘텐츠" 선택
3. "내보내기 파일 다운로드" 클릭
4. 다운로드된 XML 파일을 `1.txt`로 이름 변경
5. 이 폴더에 배치

### 2. 첨부파일 내보내기 (2.txt) - 선택사항
1. WordPress 관리자 → 도구 → 내보내기
2. "미디어" 선택
3. "내보내기 파일 다운로드" 클릭
4. 다운로드된 XML 파일을 `2.txt`로 이름 변경
5. 이 폴더에 배치

## 지원되는 파일 형식

- ✅ WordPress XML 내보내기 파일 (.xml)
- ✅ WP REST API JSON 파일 (.json)
- ✅ 최대 파일 크기: 50MB

## 주의사항

- 파일명을 정확히 `1.txt`, `2.txt`로 설정해주세요.
- 첨부파일 (2.txt)은 선택사항입니다.
- 파일 크기가 50MB를 초과하면 오류가 발생합니다.
- 한글 파일명이 포함된 경우 자동으로 처리됩니다.

## 예시

```bash
# WordPress 파일 복사
cp wordpress-export.xml input/1.txt
cp wordpress-media.xml input/2.txt

# 파일 확인
ls -la input/
# 1.txt  (16.5MB)
# 2.txt  (9.9MB)
```

이제 마이그레이션을 실행할 준비가 완료되었습니다! 