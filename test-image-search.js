import { SafeImageCollector } from './ai-system/image-collector.js';

async function testImageSearch() {
  const collector = new SafeImageCollector();
  console.log('🔍 아이유 관련 이미지 검색 시작...');
  
  try {
    // 아이유 관련 키워드들로 이미지 검색
    const keywords = [
      '아이유 IU 콘서트',
      '아이유 무대',
      'IU 최신 사진',
      'K-POP 아티스트'
    ];
    
    for (const keyword of keywords) {
      console.log(`\n🔍 "${keyword}" 검색 중...`);
      
      const images = await collector.collectImages(keyword, 1);
      
      if (images.length > 0) {
        const img = images[0];
        console.log(`✅ 찾은 이미지: ${img.url}`);
        console.log(`   Alt: ${img.alt}`);
        console.log(`   Source: ${img.source || 'Placeholder'}`);
        
        // 실제 이미지인지 확인
        if (!img.isPlaceholder) {
          console.log(`🎯 실제 구글 이미지 URL: ${img.url}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 이미지 검색 실패:', error.message);
  }
}

testImageSearch(); 