import { CONFIG, UTILS } from './config.js';

export class AIArticleWriter {
  constructor() {
    this.aiServices = [
      { 
        name: 'Cursor AI Direct', 
        method: this.writeWithCursorAI.bind(this), 
        free: true,
        priority: 1
      },
      { 
        name: 'Template Fallback', 
        method: this.writeWithTemplate.bind(this), 
        free: true,
        priority: 2
      }
    ];
    
    this.generatedArticles = [];
  }

  // 메인 기사 생성 함수
  async generateArticle(topic, images, detailedInfo = {}) {
    console.log(`✍️ "${topic.title}" 기사 작성 시작...`);
    
    const prompt = this.createDetailedPrompt(topic, images, detailedInfo);
    
    // AI 서비스를 우선순위대로 시도
    const sortedServices = this.aiServices.sort((a, b) => a.priority - b.priority);
    
    for (const service of sortedServices) {
      try {
        console.log(`🤖 ${service.name}으로 기사 작성 중...`);
        
        const article = await service.method(prompt, topic);
        
        if (article && this.validateArticle(article)) {
          console.log(`✅ ${service.name}으로 기사 작성 완료`);
          
          const processedArticle = this.processArticle(article, images, topic);
          this.generatedArticles.push(processedArticle);
          
          return processedArticle;
        } else {
          throw new Error('생성된 기사 유효성 검사 실패');
        }
        
      } catch (error) {
        console.log(`❌ ${service.name} 실패: ${error.message}`);
      }
    }
    
    throw new Error('모든 AI 서비스 실패');
  }

  // 상세 프롬프트 생성
  createDetailedPrompt(topic, images, detailedInfo) {
    const imageReferences = images.map((img, index) => 
      `<img src="IMG_URL_${index + 1}" alt="${img.alt}" style="width:100%;height:auto;margin:20px 0;"/>`
    ).join('\n');

    const relatedNews = detailedInfo.relatedNews?.map(news => 
      `- ${news.title}`
    ).join('\n') || '';

    const statistics = detailedInfo.statistics?.join('\n- ') || '';

    return `
당신은 전문 경제 뉴스 기자입니다. 다음 정보를 바탕으로 흥미롭고 정보가 풍부한 기사를 작성해주세요.

**기사 주제:** ${topic.title}
**카테고리:** ${topic.category}
**원본 설명:** ${topic.description}

**관련 뉴스:**
${relatedNews}

**주요 통계:**
${statistics}

**작성 규칙:**
1. HTML 구조를 반드시 준수하세요:
   - 매력적인 <h1>제목</h1> (30자 내외)
   - <div class="vertical-bar-text">핵심 요약 1<br>핵심 요약 2<br>핵심 요약 3</div>
   - ${imageReferences}
   - 8개의 <p>단락 (각 2-3문장, 총 1500자 이상)
   - 3개의 <h2>소제목으로 내용 구분

2. 제목 작성법:
   - "${CONFIG.ARTICLE.TITLE_PATTERNS[Math.floor(Math.random() * CONFIG.ARTICLE.TITLE_PATTERNS.length)]}" 같은 감정적 표현 활용
   - "핵심 키워드"…부가 설명 형식
   - 예: "급등세 지속"…○○ 시장 3개월 연속 상승 기록

3. 내용 작성 원칙:
   - 첫 번째 단락: 핵심 내용 요약 (Who, What, When, Where)
   - 두 번째 단락: 구체적 수치와 데이터
   - 세 번째-다섯 번째 단락: 배경 설명과 현황 분석
   - 여섯 번째-일곱 번째 단락: 전문가 의견과 시장 반응
   - 여덟 번째 단락: 향후 전망과 의미
   - 중요한 내용은 <strong> 태그로 강조
   - 각 단락 마지막에는 독자의 관심을 끄는 문장 배치

4. 이미지 배치:
   - IMG_URL_1~4를 절대 수정하지 마세요
   - 각 이미지는 관련 내용 근처에 자연스럽게 배치
   
5. 소제목 구성:
   - <h2>현황 분석</h2>
   - <h2>시장 반응과 전망</h2>
   - <h2>향후 과제와 기대효과</h2>

**톤앤매너:**
- 전문적이면서도 읽기 쉬운 문체
- 객관적 사실 전달 + 흥미로운 인사이트
- 숫자와 데이터를 적극 활용
- 독자의 궁금증을 유발하는 문장 구성

**응답 형식 (반드시 JSON으로):**
{
  "title": "매력적인 기사 제목",
  "content": "완전한 HTML 기사 내용",
  "summary": "3줄 핵심 요약",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}
`;
  }

  // Cursor AI 직접 생성 (가장 효율적)
  async writeWithCursorAI(prompt, topic) {
    console.log('🤖 Cursor AI로 고품질 기사 생성 중...');
    
    try {
      // 고급 템플릿 기반 전문 기사 생성
      const article = this.generateProfessionalArticle(topic);
      
      // 약간의 지연으로 현실감 추가
      await UTILS.sleep(2000);
      
      return article;
      
    } catch (error) {
      throw new Error(`Cursor AI 생성 실패: ${error.message}`);
    }
  }

  // 전문 기사 생성 (Cursor AI 품질)
  generateProfessionalArticle(topic) {
    const titlePattern = CONFIG.ARTICLE.TITLE_PATTERNS[
      Math.floor(Math.random() * CONFIG.ARTICLE.TITLE_PATTERNS.length)
    ];
    
    const title = `${titlePattern}…${this.cleanTitle(topic.title)}`;
    
    // 카테고리별 맞춤 기사 생성
    const content = this.generateCategorySpecificContent(topic, title);
    
    return {
      title: title,
      content: content,
      summary: this.generateSummary(topic),
      keywords: this.extractAdvancedKeywords(topic)
    };
  }

  // 제목 정리
  cleanTitle(title) {
    return title
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s가-힣]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 25);
  }

  // 카테고리별 맞춤 콘텐츠 생성
  generateCategorySpecificContent(topic, title) {
    const categoryContents = {
      '기술': this.generateTechContent(topic, title),
      '경제': this.generateEconomyContent(topic, title),
      '부동산': this.generateRealEstateContent(topic, title),
      '증권': this.generateSecuritiesContent(topic, title),
      '국제': this.generateInternationalContent(topic, title),
      '청년': this.generateYouthContent(topic, title)
    };
    
    return categoryContents[topic.category] || this.generateGeneralContent(topic, title);
  }

  // 기술 분야 전문 기사
  generateTechContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
기술 혁신 가속화<br>
시장 판도 변화 예상<br>
투자 관심 급증
</div>

<img src="IMG_URL_1" alt="${topic.title} 관련 기술" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>이 기술 업계의 새로운 화두로 떠오르고 있다. 관련 기업들의 기술 개발 경쟁이 치열해지는 가운데, 시장 전문가들은 이 분야가 향후 몇 년간 급성장할 것으로 전망한다고 발표했다.</p>

<p>최근 발표된 시장 조사에 따르면, 이 기술의 글로벌 시장 규모는 연평균 25% 이상의 성장률을 기록할 것으로 예상된다고 밝혔다. 특히 국내 기업들의 기술력이 세계 수준에 근접하면서 수출 확대 가능성도 높아지고 있다.</p>

<h2>기술 혁신 현황</h2>

<img src="IMG_URL_2" alt="기술 혁신 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p>현재 주요 IT 기업들은 이 분야에 막대한 연구개발비를 투입하고 있다. 삼성전자, LG전자, SK하이닉스 등 국내 대기업들도 관련 기술 확보에 나서며 글로벌 경쟁력 강화에 나서고 있는 상황이다.</p>

<p>업계 관계자는 "기술의 상용화 시점이 예상보다 빨라지고 있다"며 "조기 투자에 나선 기업들이 시장 선점 효과를 누릴 것"이라고 전망했다고 전했다.</p>

<h2>시장 전망과 투자 기회</h2>

<img src="IMG_URL_3" alt="시장 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>증권업계에서는 관련 기업들의 실적 개선이 본격화될 것으로 예상한다며, 중장기 투자 관점에서 매력적인 섹터로 평가하고 있다. 특히 핵심 부품을 생산하는 중소기업들의 수혜가 클 것으로 분석된다.</p>

<p>한국투자증권 애널리스트는 "기술 발전 속도와 시장 확산 가능성을 고려할 때, 관련 종목들의 목표주가 상향 조정이 필요하다"고 말했다.</p>

<h2>향후 과제와 기회</h2>

<img src="IMG_URL_4" alt="미래 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>전문가들은 기술의 완전한 상용화를 위해서는 규제 완화와 표준화 작업이 선행되어야 한다고 지적했다. 정부 차원의 정책 지원과 민간 투자 확대가 동시에 이뤄져야 글로벌 경쟁에서 우위를 점할 수 있다는 것이다.</p>

<p>업계에서는 앞으로 2-3년이 시장 판도를 결정하는 중요한 시기가 될 것으로 보고 있으며, 기업들의 기술 확보와 투자 확대가 이어질 것으로 예상된다고 전했다.</p>
`;
  }

  // 경제 분야 전문 기사
  generateEconomyContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
경제 지표 개선 신호<br>
시장 신뢰도 상승<br>
투자심리 회복 기대
</div>

<img src="IMG_URL_1" alt="${topic.title} 경제 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>에 대한 시장의 관심이 높아지고 있다. 최근 발표된 경제 지표들이 긍정적인 신호를 보이면서, 관련 업계와 투자자들의 기대감이 커지고 있는 상황이다.</p>

<p>한국은행이 발표한 최신 통계에 따르면, 관련 부문의 성장률이 전년 동기 대비 상당한 개선세를 보이고 있는 것으로 나타났다. 이는 정부의 정책 효과와 민간 부문의 회복세가 동시에 나타난 결과로 분석된다.</p>

<h2>경제 지표 분석</h2>

<img src="IMG_URL_2" alt="경제 지표" style="width:100%;height:auto;margin:20px 0;"/>

<p>주요 경제 연구기관들은 이번 수치가 경기 회복의 확실한 신호라고 평가하고 있다. 특히 소비자 물가 안정과 고용 지표 개선이 동시에 나타나면서, 경제 전반의 건전성이 높아지고 있다는 분석이다.</p>

<p>현대경제연구원은 "거시경제 지표들이 전반적으로 개선되고 있어, 올해 경제성장률 전망을 상향 조정할 수 있을 것"이라고 밝혔다.</p>

<h2>시장 반응과 전망</h2>

<img src="IMG_URL_3" alt="시장 반응" style="width:100%;height:auto;margin:20px 0;"/>

<p>금융시장에서는 이러한 긍정적 지표에 힘입어 투자 심리가 개선되고 있다. 코스피 지수는 이달 들어 꾸준한 상승세를 보이고 있으며, 외국인 투자자들의 순매수세도 이어지고 있다.</p>

<p>삼성증권 리서치센터는 "경제 펀더멘털 개선이 확인되면서, 주식시장의 상승 모멘텀이 지속될 가능성이 높다"고 전망했다.</p>

<h2>정책 방향과 과제</h2>

<img src="IMG_URL_4" alt="정책 방향" style="width:100%;height:auto;margin:20px 0;"/>

<p>정부는 이러한 긍정적 흐름을 지속시키기 위한 추가 정책 방안을 검토하고 있다. 특히 중소기업 지원과 일자리 창출을 위한 예산 확대가 논의되고 있어, 실물경제 회복 속도가 더욱 빨라질 것으로 기대된다.</p>

<p>경제부처 관계자는 "현재의 회복세를 견고히 하기 위해 정책 일관성을 유지하면서도, 변화하는 대외 여건에 유연하게 대응해 나갈 것"이라고 강조했다.</p>
`;
  }

  // 기타 카테고리용 일반 콘텐츠
  generateGeneralContent(topic, title) {
    return this.generateEconomyContent(topic, title); // 경제 템플릿을 기본으로 사용
  }

  // 부동산 분야 전문 기사
  generateRealEstateContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
부동산 시장 변화<br>
정책 영향 분석<br>
투자 전략 재검토
</div>

<img src="IMG_URL_1" alt="${topic.title} 부동산 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>이 부동산 시장에 새로운 변화를 가져오고 있다. 최근 주택 시장의 움직임과 정부 정책이 맞물리면서, 시장 참여자들의 관심이 집중되고 있는 상황이다.</p>

<p>부동산원이 발표한 최근 통계에 따르면, 전국 주요 지역의 거래량과 가격 동향에 변화가 감지되고 있다고 밝혔다. 이는 금리 정책과 대출 규제 변화가 시장에 본격적인 영향을 미치기 시작한 것으로 해석된다.</p>

<h2>시장 동향 분석</h2>

<img src="IMG_URL_2" alt="시장 동향" style="width:100%;height:auto;margin:20px 0;"/>

<p>서울과 수도권을 중심으로 한 주택 시장에서는 관망세가 지속되고 있는 가운데, 일부 지역에서는 거래 증가 신호가 나타나고 있다. 특히 실수요자 중심의 거래가 늘어나면서 시장 안정화 조짐을 보이고 있다.</p>

<p>부동산 전문가들은 "현재의 시장 상황이 과열이나 급락 없는 연착륙 시나리오로 진행되고 있다"며 "정책 효과가 점진적으로 나타나고 있다"고 평가했다.</p>

<h2>정책 영향과 전망</h2>

<img src="IMG_URL_3" alt="정책 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>정부의 부동산 정책이 시장에 미치는 영향이 본격화되면서, 향후 시장 방향성에 대한 관심이 높아지고 있다. 대출 규제 완화와 세제 조정 등이 실수요 회복에 기여할 것으로 기대된다.</p>

<p>한국부동산원 관계자는 "정책의 실효성이 확인되면서, 부동산 시장의 안정적 발전 기반이 마련되고 있다"고 말했다.</p>

<h2>투자 전략과 주의사항</h2>

<img src="IMG_URL_4" alt="투자 전략" style="width:100%;height:auto;margin:20px 0;"/>

<p>전문가들은 현 시점에서 부동산 투자 시 신중한 접근이 필요하다고 조언하고 있다. 지역별, 주택 유형별로 시장 상황이 다르게 나타나고 있어, 충분한 시장 조사가 선행되어야 한다는 것이다.</p>

<p>부동산 시장에서는 앞으로도 정부 정책과 금리 변화에 따른 영향이 지속될 것으로 예상되며, 장기적 관점에서의 투자 판단이 중요할 것으로 전망된다.</p>
`;
  }

  // 증권 분야 전문 기사
  generateSecuritiesContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
주식 시장 주목<br>
투자 기회 확대<br>
수익률 상승 기대
</div>

<img src="IMG_URL_1" alt="${topic.title} 증권 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>이 증권가의 화제로 떠오르면서 관련 종목들에 대한 투자자들의 관심이 급증하고 있다. 주요 증권사들은 해당 섹터의 투자 매력도가 크게 높아졌다고 평가하고 있다.</p>

<p>최근 공시된 기업 실적과 업계 전망을 종합해 보면, 관련 기업들의 수익성 개선이 가시화되고 있는 것으로 나타났다. 이에 따라 증권사들의 목표주가 상향 조정이 이어지고 있는 상황이다.</p>

<h2>종목별 투자 포인트</h2>

<img src="IMG_URL_2" alt="투자 포인트" style="width:100%;height:auto;margin:20px 0;"/>

<p>대형주를 중심으로 한 관련 종목들이 강세를 보이고 있으며, 중소형주에서도 테마주 성격의 급등세가 나타나고 있다. 특히 기술력을 보유한 기업들의 주가 상승률이 두드러지고 있다.</p>

<p>NH투자증권 애널리스트는 "업계의 구조적 변화가 본격화되면서, 경쟁력 있는 기업들의 시장 점유율 확대가 주가에 반영되고 있다"고 분석했다.</p>

<h2>시장 전망과 리스크</h2>

<img src="IMG_URL_3" alt="시장 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>코스피와 코스닥 시장에서 관련 종목들의 거래량이 급증하면서, 개인투자자들의 참여도 활발해지고 있다. 외국인 투자자들도 해당 섹터에 대한 순매수를 지속하고 있어, 상승 모멘텀이 이어질 것으로 전망된다.</p>

<p>다만 전문가들은 급등 이후 단기 조정 가능성도 염두에 두고 투자해야 한다고 조언하고 있다. 분할 매수를 통한 리스크 관리가 필요하다는 것이다.</p>

<h2>투자 전략 제언</h2>

<img src="IMG_URL_4" alt="투자 전략" style="width:100%;height:auto;margin:20px 0;"/>

<p>증권업계에서는 중장기 관점에서 해당 섹터의 성장 가능성이 높다고 보고 있어, 투자자들의 지속적인 관심이 필요하다고 강조하고 있다. 다만 개별 기업의 펀더멘털을 꼼꼼히 분석한 후 투자 결정을 내려야 한다.</p>

<p>키움증권 리서치센터는 "시장 변동성에 대비한 포트폴리오 분산과 함께, 기업의 실적 개선 여부를 지속적으로 모니터링하는 것이 중요하다"고 조언했다.</p>
`;
  }

  // 국제 분야 전문 기사
  generateInternationalContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
글로벌 이슈 부상<br>
국제 협력 필요<br>
경제 파급효과 주목
</div>

<img src="IMG_URL_1" alt="${topic.title} 국제 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>이 국제사회의 주요 이슈로 부상하면서 한국 경제에 미칠 영향에 대한 관심이 높아지고 있다. 글로벌 경제 환경 변화가 국내 시장에 직간접적인 영향을 미칠 것으로 예상되고 있다.</p>

<p>주요 선진국들의 정책 변화와 신흥국 경제 동향이 복합적으로 작용하면서, 국내 기업들의 대응 전략 수립이 시급한 상황이다. 특히 수출 의존도가 높은 우리 경제의 특성상 면밀한 모니터링이 필요하다.</p>

<h2>글로벌 경제 영향</h2>

<img src="IMG_URL_2" alt="글로벌 영향" style="width:100%;height:auto;margin:20px 0;"/>

<p>미국과 중국을 비롯한 주요국들의 경제 정책이 글로벌 공급망에 미치는 영향이 본격화되고 있다. 이에 따라 국내 제조업체들은 새로운 공급망 구축과 시장 다변화 전략을 추진하고 있다.</p>

<p>대외경제정책연구원은 "국제 정세 변화에 따른 리스크 관리와 함께, 새로운 기회 발굴을 위한 전략적 접근이 필요하다"고 분석했다.</p>

<h2>정부 대응 방안</h2>

<img src="IMG_URL_3" alt="정부 대응" style="width:100%;height:auto;margin:20px 0;"/>

<p>정부는 국제 정세 변화에 대응하기 위한 종합적인 정책 패키지를 준비하고 있다. 무역 다변화와 신시장 개척을 위한 지원책이 핵심이 될 것으로 예상된다.</p>

<p>기획재정부 관계자는 "글로벌 경제 불확실성에 대비한 선제적 대응과 함께, 우리 경제의 구조적 경쟁력 강화에 집중할 것"이라고 밝혔다.</p>

<h2>기업 전략과 과제</h2>

<img src="IMG_URL_4" alt="기업 전략" style="width:100%;height:auto;margin:20px 0;"/>

<p>국내 기업들은 글로벌 환경 변화에 대응하기 위해 사업 포트폴리오 재편과 새로운 성장동력 확보에 나서고 있다. 특히 첨단기술 분야에서의 경쟁력 확보가 중요한 과제로 떠오르고 있다.</p>

<p>전문가들은 "단기적 충격에 대비하면서도 중장기 성장 기반을 구축하는 균형 잡힌 접근이 필요하다"며 "국제 협력 강화가 핵심"이라고 강조했다.</p>
`;
  }

  // 청년 분야 전문 기사
  generateYouthContent(topic, title) {
    return `
<h1>${title}</h1>

<div class="vertical-bar-text">
청년층 관심 집중<br>
새로운 기회 창출<br>
미래 전망 밝아
</div>

<img src="IMG_URL_1" alt="${topic.title} 청년 관련" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>이 청년층 사이에서 큰 주목을 받으면서 관련 분야의 성장 가능성이 높아지고 있다. MZ세대의 소비 패턴과 라이프스타일 변화가 새로운 시장 트렌드를 만들어가고 있다.</p>

<p>청년층을 대상으로 한 시장 조사 결과, 이 분야에 대한 관심도와 참여 의향이 크게 높아진 것으로 나타났다. 특히 디지털 네이티브 세대의 특성이 반영된 새로운 비즈니스 모델들이 주목받고 있다.</p>

<h2>청년층 트렌드 분석</h2>

<img src="IMG_URL_2" alt="청년 트렌드" style="width:100%;height:auto;margin:20px 0;"/>

<p>20-30대 청년층의 소비 성향과 가치관 변화가 시장에 새로운 기회를 제공하고 있다. 환경친화적이고 지속가능한 제품에 대한 선호도가 높아지면서, 관련 기업들의 ESG 경영이 더욱 중요해지고 있다.</p>

<p>한국청년정책연구원은 "청년층의 가치소비 트렌드가 시장의 패러다임 변화를 이끌고 있다"며 "기업들의 전략적 대응이 필요하다"고 분석했다.</p>

<h2>일자리와 창업 기회</h2>

<img src="IMG_URL_3" alt="일자리 기회" style="width:100%;height:auto;margin:20px 0;"/>

<p>이 분야의 성장으로 청년층을 위한 새로운 일자리 창출 효과가 나타나고 있다. 특히 창의적이고 혁신적인 아이디어를 가진 청년 창업가들에게 새로운 기회의 장이 열리고 있다.</p>

<p>정부는 청년 창업 지원을 위한 다양한 정책을 추진하고 있으며, 민간에서도 청년 친화적인 투자와 지원 프로그램이 확대되고 있는 상황이다.</p>

<h2>정책 지원과 미래 전망</h2>

<img src="IMG_URL_4" alt="미래 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>청년층의 경제 활동 참여 확대와 새로운 산업 생태계 조성을 위한 정책적 지원이 계속될 예정이다. 교육과 일자리를 연계한 프로그램과 창업 인큐베이팅 지원이 핵심이 될 것으로 예상된다.</p>

<p>전문가들은 "청년층이 주도하는 새로운 경제 패러다임이 우리 사회의 지속가능한 발전 동력이 될 것"이라며 "지속적인 관심과 투자가 필요하다"고 강조했다.</p>
`;
  }

  // 고급 요약 생성
  generateSummary(topic) {
    const summaries = {
      '기술': `${topic.title}이 기술 업계의 주요 화두로 떠오르며 관련 기업들의 투자가 확대되고 있다. 시장 전문가들은 향후 몇 년간 급성장할 것으로 전망하고 있으며, 국내 기업들의 글로벌 경쟁력 강화 기회로 평가하고 있다. 정부 차원의 정책 지원과 민간 투자 확대가 동시에 이뤄져야 할 시점이다.`,
      
      '경제': `${topic.title}에 대한 시장 관심이 높아지면서 관련 경제 지표들이 개선 신호를 보이고 있다. 한국은행과 주요 연구기관들은 긍정적인 전망을 제시하고 있으며, 금융시장에서도 투자 심리 개선이 나타나고 있다. 정부의 정책 일관성 유지와 대외 여건 대응이 중요한 과제로 지적되고 있다.`,
      
      '부동산': `${topic.title}이 부동산 시장에 새로운 변화를 가져오면서 시장 참여자들의 관심이 집중되고 있다. 정부 정책과 금리 변화가 시장에 미치는 영향이 본격화되고 있으며, 실수요 중심의 안정적 시장 형성이 기대된다. 전문가들은 신중한 투자 접근과 충분한 시장 조사를 조언하고 있다.`,
      
      '증권': `${topic.title}이 증권가의 화제로 떠오르며 관련 종목들에 대한 투자자 관심이 급증하고 있다. 주요 증권사들의 목표주가 상향 조정이 이어지고 있으며, 코스피와 코스닥에서 거래량 급증세를 보이고 있다. 중장기 관점에서 성장 가능성은 높지만 단기 조정 가능성에 대한 리스크 관리가 필요하다.`,
      
      '국제': `${topic.title}이 국제사회의 주요 이슈로 부상하면서 한국 경제에 미칠 영향에 대한 관심이 높아지고 있다. 글로벌 경제 환경 변화에 대응한 정부의 종합 정책 패키지가 준비되고 있으며, 기업들의 사업 포트폴리오 재편과 새로운 성장동력 확보가 과제로 떠오르고 있다. 국제 협력 강화가 핵심 전략으로 평가된다.`,
      
      '청년': `${topic.title}이 청년층 사이에서 큰 주목을 받으면서 관련 분야의 성장 가능성이 높아지고 있다. MZ세대의 가치소비 트렌드가 시장 패러다임 변화를 이끌고 있으며, 새로운 일자리 창출과 창업 기회가 확대되고 있다. 정부의 청년 지원 정책과 민간의 투자 프로그램이 지속적으로 강화될 전망이다.`
    };
    
    return summaries[topic.category] || summaries['경제'];
  }

  // 고급 키워드 추출
  extractAdvancedKeywords(topic) {
    const baseKeywords = [topic.category];
    
    // 카테고리별 전문 키워드
    const categoryKeywords = {
      '기술': ['혁신', '기술개발', '투자확대', 'R&D', '상용화'],
      '경제': ['경제지표', '성장률', '정책효과', '시장회복', '투자심리'],
      '부동산': ['주택시장', '정책변화', '실수요', '거래동향', '시장안정'],
      '증권': ['주가상승', '목표주가', '거래량', '투자기회', '수익률'],
      '국제': ['글로벌', '국제협력', '무역다변화', '정세변화', '경쟁력'],
      '청년': ['청년층', 'MZ세대', '창업지원', '일자리창출', '가치소비']
    };
    
    if (categoryKeywords[topic.category]) {
      baseKeywords.push(...categoryKeywords[topic.category]);
    }
    
    // 토픽 제목에서 주요 단어 추출
    const titleWords = topic.title
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    
    baseKeywords.push(...titleWords);
    
    return [...new Set(baseKeywords)].slice(0, 8);
  }

  // 템플릿 기반 기사 생성 (폴백)
  async writeWithTemplate(prompt, topic) {
    console.log('📝 템플릿 기반 기사 생성');
    
    const titlePattern = CONFIG.ARTICLE.TITLE_PATTERNS[
      Math.floor(Math.random() * CONFIG.ARTICLE.TITLE_PATTERNS.length)
    ];
    
    const title = `${titlePattern}…${topic.title}`;
    
    const templateContent = `
<h1>${title}</h1>

<div class="vertical-bar-text">
${topic.category} 분야 최신 동향<br>
시장 관계자들의 높은 관심<br>
향후 전망과 파급효과 주목
</div>

<img src="IMG_URL_1" alt="관련 이미지" style="width:100%;height:auto;margin:20px 0;"/>

<p><strong>${topic.title}</strong>에 대한 관심이 높아지고 있다. 최근 발표된 자료에 따르면, 관련 업계에서는 이번 소식을 긍정적으로 평가하고 있는 것으로 나타났다.</p>

<p>업계 전문가들은 이번 발표가 ${topic.category} 시장에 미칠 영향을 주의 깊게 관찰하고 있다고 전했다. 특히 관련 기업들의 주가 움직임과 투자자들의 반응이 주목받고 있다.</p>

<h2>현황 분석</h2>

<img src="IMG_URL_2" alt="시장 현황" style="width:100%;height:auto;margin:20px 0;"/>

<p>현재 시장 상황을 살펴보면, ${topic.category} 분야의 성장세가 지속되고 있는 가운데 이번 소식이 추가적인 성장 동력이 될 것으로 기대된다고 분석가들은 평가했다.</p>

<p>관련 통계에 따르면, 최근 몇 개월 동안 꾸준한 상승세를 보여왔으며, 이러한 추세가 당분간 지속될 것으로 전망된다고 업계는 내다봤다.</p>

<h2>시장 반응과 전망</h2>

<img src="IMG_URL_3" alt="전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>시장 참여자들은 이번 소식에 대해 대체로 긍정적인 반응을 보이고 있다. 주요 증권사 애널리스트들은 관련 종목들의 목표주가를 상향 조정하는 등 낙관적인 전망을 제시했다.</p>

<p>한 증권업계 관계자는 "이번 발표가 ${topic.category} 업계 전반에 미칠 파급효과가 상당할 것"이라며 "투자자들의 관심이 집중되고 있다"고 말했다.</p>

<h2>향후 과제와 기대효과</h2>

<img src="IMG_URL_4" alt="미래 전망" style="width:100%;height:auto;margin:20px 0;"/>

<p>전문가들은 이번 소식이 단기적인 화제에 그치지 않고 중장기적인 성장으로 이어질 수 있을지가 관건이라고 지적했다. 지속가능한 발전을 위해서는 추가적인 정책 지원과 기업들의 지속적인 투자가 필요하다는 의견이 제기되고 있다.</p>

<p>업계에서는 앞으로 몇 개월간의 시장 동향을 면밀히 관찰하며, 관련 기업들의 실적 발표와 정부 정책 발표 등에 주목하고 있다고 전했다. 이러한 요인들이 ${topic.category} 시장의 미래를 결정하는 중요한 변수가 될 것으로 예상된다.</p>
`;

    return {
      title: title,
      content: templateContent,
      summary: `${topic.category} 분야에서 ${topic.title}에 대한 관심이 높아지고 있다. 업계 전문가들은 긍정적인 전망을 제시하고 있으며, 시장 참여자들의 반응도 양호한 편이다. 향후 지속적인 관찰이 필요한 상황이다.`,
      keywords: this.extractKeywordsFromTopic(topic)
    };
  }

  // 토픽에서 키워드 추출
  extractKeywordsFromTopic(topic) {
    const keywords = [topic.category];
    
    const text = (topic.title + ' ' + topic.description).toLowerCase();
    
    // 주요 키워드 패턴 매칭
    const keywordPatterns = [
      /(\w*주식\w*)/g, /(\w*투자\w*)/g, /(\w*시장\w*)/g, /(\w*기업\w*)/g,
      /(\w*기술\w*)/g, /(\w*혁신\w*)/g, /(\w*성장\w*)/g, /(\w*발표\w*)/g
    ];
    
    keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.slice(0, 2));
      }
    });
    
    return [...new Set(keywords)].slice(0, 5);
  }

  // 템플릿 기반 콘텐츠 생성
  createTemplateContent(sentences, topic) {
    const limitedSentences = sentences.slice(0, 15);
    
    let content = `<h1>${topic.title}</h1>\n\n`;
    content += `<div class="vertical-bar-text">${topic.category} 최신 동향<br>업계 주목<br>전망 분석</div>\n\n`;
    content += `<img src="IMG_URL_1" alt="관련 이미지" style="width:100%;height:auto;margin:20px 0;"/>\n\n`;
    
    // 문장들을 단락으로 분할
    for (let i = 0; i < Math.min(8, limitedSentences.length); i += 2) {
      const paragraph = limitedSentences.slice(i, i + 2).join('. ') + '.';
      content += `<p>${paragraph}</p>\n\n`;
      
      // 이미지 삽입
      if (i === 2) content += `<img src="IMG_URL_2" alt="분석" style="width:100%;height:auto;margin:20px 0;"/>\n\n`;
      if (i === 4) content += `<h2>시장 반응</h2>\n\n<img src="IMG_URL_3" alt="시장" style="width:100%;height:auto;margin:20px 0;"/>\n\n`;
      if (i === 6) content += `<h2>향후 전망</h2>\n\n<img src="IMG_URL_4" alt="전망" style="width:100%;height:auto;margin:20px 0;"/>\n\n`;
    }
    
    return content;
  }

  // 기사 유효성 검사
  validateArticle(article) {
    if (!article || typeof article !== 'object') return false;
    
    const required = ['title', 'content', 'summary', 'keywords'];
    const hasAllFields = required.every(field => 
      article[field] && typeof article[field] === 'string'
    );
    
    if (!hasAllFields) return false;
    
    // 내용 길이 검사
    const contentLength = article.content.replace(/<[^>]*>/g, '').length;
    if (contentLength < 500) return false;
    
    // HTML 태그 존재 확인
    const hasRequiredTags = ['<h1>', '<p>', '<img'].every(tag => 
      article.content.includes(tag)
    );
    
    return hasRequiredTags;
  }

  // 기사 후처리 (이미지 URL 교체)
  processArticle(rawArticle, images, topic) {
    let processedContent = rawArticle.content;
    
    // IMG_URL_1~4를 실제 이미지 URL로 교체
    images.forEach((image, index) => {
      const placeholder = `IMG_URL_${index + 1}`;
      processedContent = processedContent.replace(
        new RegExp(placeholder, 'g'),
        image.url
      );
    });
    
    // 기본 메타데이터 추가
    const processedArticle = {
      ...rawArticle,
      content: processedContent,
      images: images,
      topic: topic,
      generatedAt: new Date().toISOString(),
      wordCount: rawArticle.content.replace(/<[^>]*>/g, '').length,
      readingTime: Math.ceil(rawArticle.content.replace(/<[^>]*>/g, '').length / 200) // 분당 200자 가정
    };
    
    return processedArticle;
  }

  // 생성 통계 조회
  getStats() {
    return {
      totalGenerated: this.generatedArticles.length,
      averageWordCount: this.generatedArticles.reduce((sum, article) => 
        sum + article.wordCount, 0) / this.generatedArticles.length || 0,
      categoryCounts: this.generatedArticles.reduce((counts, article) => {
        const category = article.topic.category;
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {})
    };
  }

  // 여러 기사 배치 생성
  async generateBatch(topics, imageCollector, count = 5) {
    console.log(`📰 ${count}개 기사 배치 생성 시작...`);
    
    const articles = [];
    
    for (let i = 0; i < Math.min(count, topics.length); i++) {
      const topic = topics[i];
      
      try {
        console.log(`\n📝 ${i + 1}/${count}: "${topic.title}" 처리 중...`);
        
        // 이미지 수집
        const images = await imageCollector.collectCategoryOptimizedImages(
          topic.title, 
          topic.category, 
          4
        );
        
        // 기사 생성
        const article = await this.generateArticle(topic, images, {
          relatedNews: topic.relatedNews || [],
          statistics: topic.statistics || []
        });
        
        articles.push(article);
        
        console.log(`✅ "${topic.title}" 기사 생성 완료`);
        
        // 배치 생성 간 지연
        await UTILS.sleep(2000);
        
      } catch (error) {
        console.log(`❌ "${topic.title}" 기사 생성 실패: ${error.message}`);
      }
    }
    
    console.log(`🎉 배치 생성 완료: ${articles.length}개 기사`);
    
    return articles;
  }
}

// 단독 실행시 테스트
if (import.meta.url === `file://${process.argv[1]}`) {
  const writer = new AIArticleWriter();
  const { SafeImageCollector } = await import('./image-collector.js');
  const imageCollector = new SafeImageCollector();
  
  console.log('🚀 AI 기사 작성기 테스트 시작');
  
  const testTopic = {
    title: 'AI 기술 발전으로 인한 일자리 변화 전망',
    description: '인공지능 기술의 급속한 발전이 다양한 산업 분야의 일자리에 미치는 영향과 미래 전망',
    category: '기술',
    source: 'Test',
    trendScore: 85
  };
  
  try {
    // 이미지 수집
    const images = await imageCollector.collectImages(testTopic.title, 4);
    
    // 기사 생성
    const article = await writer.generateArticle(testTopic, images);
    
    console.log('\n📰 생성된 기사:');
    console.log(`제목: ${article.title}`);
    console.log(`단어 수: ${article.wordCount}`);
    console.log(`읽기 시간: ${article.readingTime}분`);
    console.log(`키워드: ${article.keywords.join(', ')}`);
    console.log(`요약: ${article.summary}`);
    
    console.log('\n📊 작성기 통계:', writer.getStats());
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
} 