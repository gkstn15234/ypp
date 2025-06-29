// AI 뉴스 시스템 설정
export const CONFIG = {
  // 뉴스 수집 설정
  NEWS_SOURCES: {
    RSS_FEEDS: [
      'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko', // 기술
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko', // 경제
      'https://rss.cnn.com/rss/edition.rss',
      'https://feeds.bbci.co.uk/news/rss.xml'
    ],
    TRENDING_KEYWORDS: [
      '화제', '돌풍', '급등', '깜짝', '대박', '신기록', 
      '혁신', '최초', '역대급', '파격', '논란', '반전',
      '상승', '하락', '발표', '출시', '계획', '투자'
    ]
  },

  // 카테고리 매핑
  CATEGORIES: {
    '기술': ['ai', '인공지능', '기술', '스마트폰', '앱', '소프트웨어', 'it', '테크', '디지털'],
    '경제': ['주식', '경제', '금리', '투자', '기업', '매출', '수익', '재정', '금융', '시장'],
    '부동산': ['부동산', '아파트', '집값', '매매', '전세', '임대', '분양', '청약'],
    '증권': ['증권', '코스피', '코스닥', '주가', '상장', '펀드', '채권', '배당'],
    '국제': ['국제', '해외', '미국', '중국', '일본', '유럽', '글로벌', '수출', '수입'],
    '청년': ['청년', '취업', '일자리', '구직', '스타트업', '창업', '알바', '직장']
  },

  // AI 기사 작성 설정
  ARTICLE: {
    MIN_PARAGRAPHS: 8,
    MIN_IMAGES: 3,
    MAX_IMAGES: 4,
    TITLE_PATTERNS: [
      '깜짝 발표',
      '급등세',
      '대박 출시',
      '화제집중',
      '논란 가중',
      '신기록 달성',
      '파격 혜택',
      '역대급 성과'
    ]
  },

  // 이미지 수집 설정
  IMAGES: {
    SEARCH_ENGINES: [
      { name: 'Google', baseUrl: 'https://www.google.com/search?q={query}&tbm=isch' },
      { name: 'Bing', baseUrl: 'https://www.bing.com/images/search?q={query}' },
      { name: 'DuckDuckGo', baseUrl: 'https://duckduckgo.com/?q={query}&t=h_&iax=images&ia=images' }
    ],
    USER_AGENTS: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ],
    DELAYS: {
      GOOGLE: 3000,
      BING: 2000,
      DUCKDUCKGO: 1000
    }
  },

  // AI 서비스 설정 (Cursor AI 직접 생성)
  AI_SERVICES: [
    {
      name: 'Cursor AI Direct',
      method: 'direct',
      free: true,
      maxTokens: 4000
    },
    {
      name: 'Template Fallback',
      method: 'template',
      free: true,
      maxTokens: 2000
    }
  ],

  // Hugo 설정
  HUGO: {
    CONTENT_PATH: './content',
    DEFAULT_AUTHOR: 'AI 뉴스봇',
    DEFAULT_TAGS: ['AI생성', '자동발행']
  },

  // 스케줄링 설정
  SCHEDULE: {
    DAILY_ARTICLES: 5,
    GENERATION_TIMES: ['09:00', '12:00', '15:00', '18:00', '21:00'],
    TIMEZONE: 'Asia/Seoul'
  }
};

// 환경변수 설정
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HUGO_BASE_URL: process.env.HUGO_BASE_URL || 'http://localhost:1313'
};

// 유틸리티 함수
export const UTILS = {
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  getRandomUserAgent: () => {
    const agents = CONFIG.IMAGES.USER_AGENTS;
    return agents[Math.floor(Math.random() * agents.length)];
  },
  
  getCurrentDateTime: () => {
    return new Date().toISOString().split('T')[0];
  },
  
  generateSlug: (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}; 