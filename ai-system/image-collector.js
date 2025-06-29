import https from 'https';
import http from 'http';
import { CONFIG, UTILS } from './config.js';

export class SafeImageCollector {
  constructor() {
    this.collectedImages = [];
    this.failedAttempts = 0;
  }

  // 메인 이미지 수집 함수 (실제 구글 검색)
  async collectImages(topic, count = 4) {
    console.log(`🖼️ "${topic}" 관련 이미지 ${count}개 검색 중...`);
    
    const images = [];
    const searchQueries = this.generateSearchQueries(topic);
    
    for (let i = 0; i < count; i++) {
      const query = searchQueries[i] || topic;
      
      try {
        console.log(`🔍 구글에서 "${query}" 검색 중...`);
        
        // 구글 이미지 검색
        const image = await this.searchGoogleImages(query);
        
        if (image) {
          images.push({
            ...image,
            searchQuery: query,
            index: i + 1
          });
          console.log(`✅ 이미지 수집 성공: ${image.alt}`);
        } else {
          // 실패시 플레이스홀더 사용
          const placeholder = this.createHighQualityPlaceholder(topic, i + 1);
          images.push(placeholder);
          console.log(`⚠️ 플레이스홀더 사용: ${placeholder.alt}`);
        }
        
        // 요청 간 지연 (구글 차단 방지)
        await UTILS.sleep(1000 + Math.random() * 1000);
        
      } catch (error) {
        console.log(`❌ 이미지 검색 실패: ${error.message}`);
        const placeholder = this.createHighQualityPlaceholder(topic, i + 1);
        images.push(placeholder);
      }
    }
    
    console.log(`✅ 총 ${images.length}개 이미지 수집 완료`);
    
    return images;
  }

  // 구글 이미지 검색 (내장 https 모듈 사용)
  async searchGoogleImages(query) {
    return new Promise((resolve, reject) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:l`;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.google.com/',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      };
      
      const req = https.get(searchUrl, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            // 구글 이미지 URL 패턴 추출
            const imageUrl = this.extractImageUrl(data);
            
            if (imageUrl) {
              resolve({
                url: imageUrl,
                alt: `${query} 관련 이미지`,
                width: 800,
                height: 600,
                source: 'Google Images'
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        });
      });
      
      req.on('error', (error) => {
        resolve(null);
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      
      req.setTimeout(10000);
    });
  }

  // 구글 HTML에서 이미지 URL 추출
  extractImageUrl(html) {
    // 다양한 구글 이미지 URL 패턴 시도
    const patterns = [
      /"ou":"([^"]+)"/,
      /"tu":"([^"]+)"/,
      /imgurl=([^&]+)/,
      /"(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp)[^"]*?)"/gi,
      /src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*?)"/gi
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imageUrl = decodeURIComponent(match[1]);
        
        // 유효한 이미지 URL인지 확인
        if (this.isValidImageUrl(imageUrl)) {
          return imageUrl;
        }
      }
    }
    
    return null;
  }

  // 검색 쿼리 변형 생성
  generateSearchQueries(topic) {
    const baseKeyword = this.extractMainKeyword(topic);
    
    const queries = [
      `${baseKeyword} 이미지`,
      `${baseKeyword} 사진`,
      `${baseKeyword} 뉴스`,
      `${baseKeyword} 최신`,
      `${baseKeyword}`,
      `${baseKeyword} 한국`,
      `${baseKeyword} 2025`,
      `${baseKeyword} 업계`
    ];
    
    return queries.slice(0, 6);
  }

  // 이미지 URL 유효성 검사
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // 이미지 확장자 확인
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    // 차단된 도메인 확인
    const blockedDomains = ['localhost', '127.0.0.1', 'data:', 'blob:', 'file:'];
    const isBlocked = blockedDomains.some(domain => 
      url.toLowerCase().includes(domain)
    );
    
    return hasImageExtension && !isBlocked && url.length < 2000;
  }

  // 고품질 플레이스홀더 이미지 생성
  createHighQualityPlaceholder(topic, index) {
    const keyword = this.extractMainKeyword(topic);
    
    // 카테고리별 색상 매핑
    const categoryColors = {
      '기술': ['007acc', '0066cc', '0099ff'],
      '경제': ['28a745', '20c997', '17a2b8'],
      '부동산': ['dc3545', 'e83e8c', 'fd7e14'],
      '증권': ['6f42c1', '6610f2', 'e83e8c'],
      '국제': ['ffc107', 'fd7e14', 'f8f9fa'],
      '청년': ['20c997', '17a2b8', '6f42c1']
    };
    
    // 카테고리 감지
    let category = '경제'; // 기본값
    for (const [cat, keywords] of Object.entries(CONFIG.CATEGORIES)) {
      if (keywords.some(kw => topic.toLowerCase().includes(kw))) {
        category = cat;
        break;
      }
    }
    
    const colors = categoryColors[category] || categoryColors['경제'];
    const color = colors[(index - 1) % colors.length];
    
    // 다양한 플레이스홀더 서비스 사용
    const services = [
      `https://via.placeholder.com/800x600/${color}/ffffff?text=${encodeURIComponent(keyword)}`,
      `https://picsum.photos/800/600?random=${index}`,
      `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center`,
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center`
    ];
    
    return {
      url: services[(index - 1) % services.length],
      alt: `${keyword} 관련 이미지 ${index}`,
      width: 800,
      height: 600,
      isPlaceholder: true,
      source: 'High Quality Placeholder',
      index,
      category
    };
  }

  // 플레이스홀더 이미지 생성
  createPlaceholder(topic, index) {
    const keyword = this.extractMainKeyword(topic);
    const colors = ['007acc', '28a745', 'dc3545', 'ffc107', '6f42c1', 'fd7e14'];
    const color = colors[index % colors.length];
    
    return {
      url: `https://via.placeholder.com/800x600/${color}/ffffff?text=${encodeURIComponent(keyword)}`,
      alt: `${keyword} 관련 이미지 ${index}`,
      width: 800,
      height: 600,
      isPlaceholder: true,
      source: 'Placeholder',
      index
    };
  }

  // 주요 키워드 추출
  extractMainKeyword(topic) {
    // HTML 태그 제거
    let cleanText = topic.replace(/<[^>]*>/g, '');
    
    // 특수문자 제거 및 단어 추출
    const words = cleanText
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 상위 2개 단어 선택
    return words.slice(0, 2).join(' ') || 'News';
  }

  // 이미지 다운로드 및 로컬 저장 (선택사항)
  async downloadImage(imageUrl, filename) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': UTILS.getRandomUserAgent()
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.buffer();
      
      // static/images 폴더에 저장
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const imagePath = path.join('./static/images/ai-generated', filename);
      await fs.ensureDir(path.dirname(imagePath));
      await fs.writeFile(imagePath, buffer);
      
      console.log(`💾 이미지 저장 완료: ${imagePath}`);
      
      return `/images/ai-generated/${filename}`;
      
    } catch (error) {
      console.log(`❌ 이미지 다운로드 실패: ${error.message}`);
      return null;
    }
  }

  // 카테고리별 최적화된 이미지 검색
  async collectCategoryOptimizedImages(topic, category, count = 4) {
    const categoryKeywords = {
      '기술': ['technology', 'innovation', 'digital', 'tech'],
      '경제': ['economy', 'business', 'finance', 'market'],
      '부동산': ['real estate', 'property', 'housing', 'building'],
      '증권': ['stock', 'investment', 'securities', 'trading'],
      '국제': ['international', 'global', 'world', 'foreign'],
      '청년': ['youth', 'young', 'millennial', 'generation']
    };
    
    const optimizedQueries = [];
    const baseKeyword = this.extractMainKeyword(topic);
    
    // 기본 쿼리
    optimizedQueries.push(baseKeyword);
    
    // 카테고리 특화 쿼리
    if (categoryKeywords[category]) {
      categoryKeywords[category].forEach(keyword => {
        optimizedQueries.push(`${baseKeyword} ${keyword}`);
      });
    }
    
    console.log(`🎯 카테고리 [${category}] 최적화 이미지 수집`);
    
    return await this.collectImages(optimizedQueries.join(' '), count);
  }

  // 수집 통계 조회
  getStats() {
    return {
      totalCollected: this.collectedImages.length,
      failedAttempts: this.failedAttempts,
      successRate: this.collectedImages.length / (this.collectedImages.length + this.failedAttempts) * 100
    };
  }
}

// 단독 실행시 테스트
if (import.meta.url === `file://${process.argv[1]}`) {
  const collector = new SafeImageCollector();
  
  console.log('🚀 이미지 수집기 테스트 시작');
  
  const testTopics = [
    'AI 기술 혁신',
    '경제 성장률',
    '부동산 시장 동향'
  ];
  
  for (const topic of testTopics) {
    console.log(`\n📸 "${topic}" 이미지 수집 테스트`);
    
    const images = await collector.collectImages(topic, 3);
    
    console.log('수집된 이미지:');
    images.forEach((img, index) => {
      console.log(`${index + 1}. ${img.source}: ${img.url.substring(0, 80)}...`);
      console.log(`   Alt: ${img.alt}`);
      console.log(`   플레이스홀더: ${img.isPlaceholder ? 'Yes' : 'No'}`);
    });
  }
  
  console.log('\n📊 최종 통계:', collector.getStats());
} 