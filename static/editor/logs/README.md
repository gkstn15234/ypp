# 마이그레이션 로그 폴더

마이그레이션 실행 로그와 결과가 이 폴더에 저장됩니다.

## 로그 파일 구조

```
logs/
├── migration-1704067200000.log          # 마이그레이션 실행 로그
├── conversion-results-1704067200000.json # 변환 결과 상세 정보
└── README.md                            # 이 파일
```

## 로그 파일 설명

### migration-{timestamp}.log
마이그레이션 실행 시 생성되는 기본 로그
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "config": {
    "inputPath": "./input",
    "outputPath": "./output",
    "batchSize": 3,
    "isDryRun": false,
    "isTestMode": false,
    "uploadImages": true
  },
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "cwd": "/path/to/project"
  }
}
```

### conversion-results-{timestamp}.json
변환 결과 상세 정보
```json
{
  "timestamp": "2024-01-15T10:35:00.000Z",
  "config": { ... },
  "stats": {
    "totalPosts": 1247,
    "processedPosts": 1247,
    "successfulPosts": 1245,
    "failedPosts": 2,
    "totalImages": 3456,
    "successfulImages": 3398,
    "failedImages": 58
  },
  "results": [
    {
      "status": "success",
      "post": {
        "id": "123",
        "title": "현대자동차 신모델 출시",
        "categories": ["자동차"],
        "tags": ["현대자동차", "전기차"]
      },
      "filename": "2024-01-15-hyundai-new-model.md",
      "message": "변환 완료"
    },
    {
      "status": "error",
      "post": {
        "id": "456",
        "title": "오류 발생한 게시물"
      },
      "error": "이미지 다운로드 실패"
    }
  ]
}
```

## 로그 분석

### 성공률 확인
```bash
# 성공/실패 통계
grep -c "success" logs/conversion-results-*.json
grep -c "error" logs/conversion-results-*.json
```

### 오류 분석
```bash
# 실패한 게시물 목록
jq '.results[] | select(.status == "error")' logs/conversion-results-*.json
```

### 이미지 처리 현황
```bash
# 이미지 업로드 통계
jq '.stats | {totalImages, successfulImages, failedImages}' logs/conversion-results-*.json
```

## 디버깅 팁

### 1. 상세 로그 확인
```bash
# 최근 로그 파일 확인
tail -f logs/migration-*.log
```

### 2. 특정 게시물 오류 조사
```bash
# 특정 제목으로 오류 검색
jq '.results[] | select(.post.title | contains("검색어"))' logs/conversion-results-*.json
```

### 3. 카테고리별 분포 확인
```bash
# 카테고리별 게시물 수
jq '.results[] | select(.status == "success") | .post.categories[]' logs/conversion-results-*.json | sort | uniq -c
```

## 로그 보관

- 로그 파일은 자동으로 삭제되지 않습니다.
- 필요에 따라 수동으로 정리하세요.
- 중요한 마이그레이션 결과는 백업하는 것을 권장합니다.

## 성능 모니터링

### 처리 시간 분석
```bash
# 평균 처리 시간 계산
jq '.results | length' logs/conversion-results-*.json
```

### 메모리 사용량 확인
```bash
# Node.js 프로세스 모니터링
ps aux | grep node
```

이 로그들을 통해 마이그레이션 과정을 분석하고 최적화할 수 있습니다. 