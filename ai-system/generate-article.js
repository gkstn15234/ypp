import { AINewsSystem } from './main.js';

// 간단한 기사 생성 테스트
async function testGeneration() {
  console.log('🚀 AI 뉴스 생성 시스템 테스트');
  console.log('================================');
  
  const system = new AINewsSystem();
  
  try {
    // 1개 기사 생성 테스트
    const result = await system.runCompletePipeline({
      articleCount: 1,
      verbose: true,
      buildSite: false
    });
    
    if (result.success) {
      console.log('\n🎉 테스트 성공!');
      console.log('📰 생성된 기사:', result.articles[0].title);
      console.log('📝 카테고리:', result.articles[0].category);
      console.log('📊 단어 수:', result.articles[0].wordCount);
      console.log('⏰ 소요 시간:', Math.round(result.summary.totalTime / 1000) + '초');
    } else {
      console.log('❌ 테스트 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 시스템 오류:', error.message);
  }
}

// 스크립트 실행
testGeneration(); 