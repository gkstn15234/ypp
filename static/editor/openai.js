/**
 * OpenAI GPT-4.1 Mini API 연동 클래스
 */
class OpenAIWriter {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // GPT-4.1 mini 모델
    }

    /**
     * API 키 설정
     * @param {string} apiKey - OpenAI API 키
     */
    configure(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 경제와 자동차 카테고리 판별 함수
     * @param {string} title - 제목
     * @param {string} desc - 설명
     * @param {string} defaultCategory - 기본 카테고리
     * @returns {string} 판별된 카테고리
     */
    determineEconomyOrAutomotive(title, desc, defaultCategory) {
        const combinedText = (title + ' ' + desc).toLowerCase();
        
        // 경제 관련 키워드
        const economyKeywords = [
            '주식', '경제', '금리', '투자', '시장', '펀드', '주가', '재테크', '돈', '비트코인', '부동산', '증시',
            '금융', '은행', '외환', '환율', '원화', '달러', '기업', '실적', '수익', '매출', '영업이익', 'AI',
            '채권', '상장', '코스피', '코스닥', '나스닥', '다우', 'S&P', '기준금리', '인플레', '디플레이션',
            '세금', '유가', '물가', '가상화폐', '암호화폐', '전망', '실적', 'ETF', '채권', '테마주'
        ];
        
        // 자동차 관련 키워드
        const automotiveKeywords = [
            '자동차', '신차', '전기차', '테슬라', '현대', '기아', 'BMW', '벤츠', '도요타', '폭스바겐', 'SUV', '세단',
            '하이브리드', '자율주행', '모빌리티', '충전', '배터리', '출시', '엔진', '제네시스', '내연기관',
            '트렁크', '휠', '타이어', '연비', '주행', '운전', '정비', '마력', '토크', '판매량', '모델',
            '디젤', '가솔린', 'LPG', '스포츠카', 'EV', '리콜', '시승', '튜닝', '옵션', '트림'
        ];
        
        // 경제 키워드 매칭 확인
        const economyMatches = economyKeywords.filter(keyword => combinedText.includes(keyword)).length;
        
        // 자동차 키워드 매칭 확인
        const automotiveMatches = automotiveKeywords.filter(keyword => combinedText.includes(keyword)).length;
        
        // 매칭된 키워드가 많은 카테고리 반환
        if (economyMatches > automotiveMatches) {
            return 'economy';
        } else if (automotiveMatches > 0) {
            return 'automotive';
        }
        
        // 기본값은 제공된 카테고리 또는 자동차 뉴스
        return defaultCategory || 'automotive';
    }

    /**
     * 최적화된 이미지 alt 텍스트 생성
     * @param {string} title - 제목
     * @param {string} category - 카테고리
     * @param {number} index - 이미지 인덱스
     * @returns {string} 최적화된 alt 텍스트
     */
    getOptimizedAltText(title, category, index) {
        const keywords = title.split(' ')
            .filter(word => word.length > 1)
            .slice(0, 5)
            .join(' ');
        
        const altPrefixes = [
            '주목받는', '화제의', '최신', '인기'
        ];
        
        const categoryName = category === 'automotive' ? '자동차' : '경제';
        return `${altPrefixes[index % altPrefixes.length]} ${categoryName} ${keywords}`;
    }

    /**
     * JSON 인코딩 함수
     * @param {string} text - 인코딩할 텍스트
     * @returns {string} 인코딩된 텍스트
     */
    encodeForJSON(text) {
        if (!text) return '';
        return text
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
    }

    /**
     * 배열에서 랜덤 아이템 선택
     * @param {Array} array - 선택할 배열
     * @param {number} count - 선택할 개수
     * @returns {Array} 선택된 아이템들
     */
    getRandomItems(array, count) {
        if (!array || array.length === 0) return [];
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * 구조화된 데이터 템플릿 생성
     * @param {string} title - 제목
     * @param {string} desc - 설명
     * @param {string} category - 카테고리
     * @param {string} slug - 슬러그
     * @returns {string} 구조화된 데이터
     */
    generateStructuredData(title, desc, category, slug) {
        const categoryName = category === 'automotive' ? '자동차' : '경제';
        
        return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "${this.encodeForJSON(title)}",
  "description": "${this.encodeForJSON(desc)}",
  "datePublished": "${new Date().toISOString()}",
  "dateModified": "${new Date().toISOString()}",
  "author": {
    "@type": "Person",
                    "name": "오토데일프릭스 ${categoryName} 에디터"
  },
  "publisher": {
    "@type": "Organization",
                    "name": "오토데일프릭스",
    "logo": {
      "@type": "ImageObject",
      "url": "https://autodaiiy.com/logo.png"
    }
  },
  "image": [
    "/images/${slug}-1.jpg",
    "/images/${slug}-2.jpg",
    "/images/${slug}-3.jpg",
    "/images/${slug}-4.jpg"
  ],
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://autodaiiy.com/${category}/${slug}"
  }
}
</script>`;
    }

    /**
     * 시스템 프롬프트 생성
     * @param {Object} articleData - 기사 데이터
     * @returns {string} 시스템 프롬프트
     */
    generateSystemPrompt(articleData) {
        const { title, description, category, referenceContent, imageUrls } = articleData;
        
        // 카테고리 판별
        const categoryType = this.determineEconomyOrAutomotive(title, description, category);
        const categoryName = categoryType === 'automotive' ? '자동차 뉴스' : '경제 뉴스';
        
        // 감성 키워드 데이터베이스 - 카테고리별로 구분
        const emotionalKeywords = {
            '경제 뉴스': ['충격', '깜짝', '돌파', '폭등', '폭락', '대박', '급등', '급락', '흔들', '뒤집힌', '주목', '열풍', '비상', '파란불', '빨간불', '불안한', '역대급', '격변', '요동', '쏟아진'],
            '자동차 뉴스': ['파격', '역대급', '신차', '놀라운', '혁신', '전격', '출시', '완판', '돌풍', '대기록', '돌파', '신기록', '반전', '기대', '논란', '대반전', '대변신', '완벽', '압도적', '화제의', '완전히 새로운']
        };

        // 이미지 태그 생성 (Cloudflare 이미지 URL 우선)
        let imgTags;
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            imgTags = [0, 1].map(idx => `<img src=\"${imageUrls[idx] || imageUrls[0]}\" alt=\"${this.getOptimizedAltText(title, categoryType, idx)}\"/>`);
        } else {
            imgTags = ['IMG_URL_1', 'IMG_URL_2'].map((url, idx) => `<img src=\"${url}\" alt=\"${this.getOptimizedAltText(title, categoryType, idx)}\"/>`);
        }

        return `다음 기사를 오토데일프릭스 스타일로 재작성해 주세요. 반드시 아래 HTML 구조를 따릅니다.

1) <h1>제목</h1>
2) <div class="vertical-bar-text">소제목1<br>소제목2</div>
3) ${imgTags[0]}
4) <p>단락1 (3~4문장)</p>
5) <p>단락2 (3~4문장)</p>
6) <h2>요약 소제목 (간결하게)</h2>
7) ${imgTags[1]}
8) <p>단락3 (3~4문장)</p>
9) <p>단락4 (3~4문장)</p>
10) <h2>요약 소제목 (간결하게)</h2>
11) <p>단락5 (3~4문장)</p>
12) <p>단락6 (3~4문장)</p>
13) <h2>요약 소제목 (간결하게)</h2>
14) <p>단락7 (3~4문장)</p>
15) <p>단락8 (3~4문장)</p>

제목: ${title}
요약: ${description}
카테고리: ${categoryName}
${referenceContent ? `\n참고 자료:\n${referenceContent}\n` : ''}

필수 작성 규칙:
- 제목은 '"감성어+핵심사항"…보충설명' 형태로 작성 (예: "완전히 새로운 차원"…현대 IONIQ 9, 3열 전기 SUV 시장 혁신)
- 감성 키워드는 ${this.getRandomItems(emotionalKeywords[categoryName], 3).join(', ')} 등을 활용
- 큰따옴표 안에 짧고 강렬한 문구, 문장 끝 말줄임표(…) 필수
- 수직 막대 텍스트는 기사의 핵심을 짧게 2줄로 요약
- 문단은 3-4문장으로, 마지막 문장은 흥미/호기심을 유발하는 질문이나 흥미로운 사실로 마무리
- 각 소제목(h2)은 '어떻게', '왜', '얼마나' 등의 의문형이나 감탄형으로 작성 (예: 혁신적인 실내 공간 설계의 비밀)
- 일반 독자도 이해하기 쉽게 전문용어는 풀어서 설명
- 각 단락 내 핵심 문구는 <strong> 태그로 강조 (예: **110.3kWh 대용량 배터리**)
- 통계, 수치 등 구체적 정보를 포함하여 신뢰성 확보
- 첫 단락에 기사의 핵심을 요약하되, 흥미를 끌 수 있는 내용으로 구성
- 맨 마지막 단락은 향후 전망이나 소비자/독자에게 유용한 조언으로 마무리
- <img> 태그 src 값은 IMG_URL_1~2 플레이스홀더를 그대로 사용하고 수정·삭제하지 마세요.
- 태그 섹션, 관련 기사 섹션, SNS 공유 버튼을 포함하지 마세요.
- 코드 아이콘(</>)이나 기타 HTML 태그를 콘텐츠의 시작이나 끝에 추가하지 마세요.

또한, 아래 한글 제목을 SEO 최적화된 영어 슬러그로 변환해 주세요:

[변환할 제목]
${title}

[변환 규칙]
- 최대 5-6단어 이내 (짧을수록 좋음)
- 주요 키워드를 맨 앞에 배치
- 특수문자·따옴표 제거, 소문자, 띄어쓰기→하이픈, 중복 하이픈 제거
- 영문 슬러그 예시: hyundai-ioniq-9-three-row-electric-suv, hyundai-2025-lineup-innovation

응답은 반드시 JSON 형식으로만 제공하세요:
{
  "title": "완성된 제목 (h1 태그 포함)",
  "content": "완성된 HTML 콘텐츠 (div.vertical-bar-text부터 마지막 p태그까지)",
  "slug": "seo-friendly-slug"
}`;
    }

    /**
     * OpenAI API를 호출하여 기사 생성
     * @param {Object} articleData - 기사 데이터
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Object>} 생성된 기사 데이터
     */
    async generateArticle(articleData, onProgress = null) {
        if (!this.apiKey) {
            throw new Error('OpenAI API 키가 설정되지 않았습니다.');
        }

        if (onProgress) onProgress(10);

        const systemPrompt = this.generateSystemPrompt(articleData);
        
        if (onProgress) onProgress(30);

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '당신은 전문 기자입니다. 주어진 형식에 맞춰 정확하고 매력적인 기사를 작성합니다.'
                        },
                        {
                            role: 'user',
                            content: systemPrompt
                        }
                    ],
                    max_tokens: 3000,
                    temperature: 0.7
                })
            });

            if (onProgress) onProgress(70);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API 요청 실패: ${response.status}`);
            }

            const data = await response.json();
            
            if (onProgress) onProgress(90);

            const content = data.choices[0].message.content;
            
            // JSON 응답 파싱
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(content);
            } catch (e) {
                // JSON 파싱 실패시 수동으로 파싱 시도
                parsedResponse = this.parseResponse(content);
            }

            // 이미지 플레이스홀더를 실제 경로로 교체
            const processedContent = this.processImagePlaceholders(
                parsedResponse.content, 
                parsedResponse.slug, 
                articleData.title, 
                articleData.category
            );

            if (onProgress) onProgress(100);

            return {
                title: parsedResponse.title,
                content: processedContent,
                slug: parsedResponse.slug,
                structuredData: this.generateStructuredData(
                    articleData.title,
                    articleData.description,
                    articleData.category,
                    parsedResponse.slug
                )
            };

        } catch (error) {
            throw new Error(`기사 생성 실패: ${error.message}`);
        }
    }

    /**
     * 응답 수동 파싱 (JSON 파싱 실패시)
     * @param {string} content - 응답 내용
     * @returns {Object} 파싱된 응답
     */
    parseResponse(content) {
        // 기본 패턴 매칭으로 title, content, slug 추출
        const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/s);
        const slugMatch = content.match(/slug["']?\s*:\s*["']([^"']+)["']/);
        
        return {
            title: titleMatch ? `<h1>${titleMatch[1]}</h1>` : '<h1>제목을 생성할 수 없습니다</h1>',
            content: content,
            slug: slugMatch ? slugMatch[1] : 'generated-article'
        };
    }

    /**
     * 이미지 플레이스홀더를 실제 경로로 교체
     * @param {string} content - HTML 콘텐츠
     * @param {string} slug - 슬러그
     * @param {string} title - 제목
     * @param {string} category - 카테고리
     * @returns {string} 처리된 콘텐츠
     */
    processImagePlaceholders(content, slug, title, category) {
        // 이미지 플레이스홀더 교체 (프로젝트 양식에 맞춤 - 2개 이미지만)
        for (let i = 1; i <= 2; i++) {
            const placeholder = `IMG_URL_${i}`;
            const imagePath = `https://images.unsplash.com/photo-placeholder-${i}?w=1600&h=900&fit=crop&q=95`;
            
            content = content.replace(new RegExp(placeholder, 'g'), imagePath);
        }
        
        return content;
    }

    /**
     * 참고 기사를 기반으로 새 기사 생성
     * @param {string} referenceTitle - 참고 기사 제목
     * @param {string} referenceContent - 참고 기사 내용
     * @param {string} newTopic - 새 주제
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Object>} 생성된 기사 데이터
     */
    async generateFromReference(referenceTitle, referenceContent, newTopic, onProgress = null) {
        const category = this.determineEconomyOrAutomotive(newTopic, '', 'automotive');
        
        const articleData = {
            title: newTopic,
            description: `${newTopic}에 대한 상세 분석`,
            category: category
        };

        return await this.generateArticle(articleData, onProgress);
    }
}

// 전역 인스턴스 생성
window.openaiWriter = new OpenAIWriter(); 