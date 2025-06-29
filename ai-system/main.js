import { TrendCollector } from './trend-collector.js';
import { SafeImageCollector } from './image-collector.js';
import { AIArticleWriter } from './ai-article-writer.js';
import { HugoGenerator } from './hugo-generator.js';
import { CONFIG, UTILS } from './config.js';

export class AINewsSystem {
  constructor() {
    this.trendCollector = new TrendCollector();
    this.imageCollector = new SafeImageCollector();
    this.articleWriter = new AIArticleWriter();
    this.hugoGenerator = new HugoGenerator();
    
    this.isRunning = false;
    this.stats = {
      totalArticlesGenerated: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      categoryCounts: {},
      lastRunTime: null,
      totalRunTime: 0
    };
    
    this.scheduledJobs = [];
  }

  // 🚀 메인 실행 함수 - 전체 파이프라인 실행
  async runCompletePipeline(options = {}) {
    const startTime = Date.now();
    
    const defaultOptions = {
      articleCount: 5,
      categories: Object.keys(CONFIG.CATEGORIES),
      skipExisting: true,
      buildSite: false,
      verbose: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    console.log('🚀 AI 뉴스 생성 시스템 시작!');
    console.log(`📊 설정: ${config.articleCount}개 기사, 카테고리: ${config.categories.join(', ')}`);
    
    if (this.isRunning) {
      console.log('⚠️ 시스템이 이미 실행 중입니다.');
      return { success: false, message: '시스템이 이미 실행 중' };
    }
    
    this.isRunning = true;
    
    try {
      // 1단계: 트렌드 수집
      console.log('\n📈 1단계: 트렌드 토픽 수집 중...');
      const trendingTopics = await this.trendCollector.collectTrendingTopics(config.articleCount * 2);
      
      if (trendingTopics.length === 0) {
        throw new Error('수집된 트렌드 토픽이 없습니다');
      }
      
      console.log(`✅ ${trendingTopics.length}개 트렌드 토픽 수집 완료`);
      
      // 2단계: 카테고리별 토픽 필터링
      const filteredTopics = this.filterTopicsByCategory(trendingTopics, config.categories);
      const selectedTopics = filteredTopics.slice(0, config.articleCount);
      
      console.log(`📋 선별된 토픽: ${selectedTopics.length}개`);
      
      // 3단계: 기사 생성 (병렬 처리)
      console.log('\n✍️ 2단계: AI 기사 생성 중...');
      const articles = await this.generateArticlesBatch(selectedTopics, config.verbose);
      
      // 4단계: Hugo 마크다운 생성
      console.log('\n📝 3단계: Hugo 마크다운 생성 중...');
      const hugoResults = await this.hugoGenerator.generateBatch(articles);
      
      // 5단계: 사이트 빌드 (선택사항)
      if (config.buildSite) {
        console.log('\n🔨 4단계: Hugo 사이트 빌드 중...');
        try {
          await this.hugoGenerator.triggerHugoBuild();
        } catch (error) {
          console.log(`⚠️ Hugo 빌드 실패: ${error.message}`);
        }
      }
      
      // 통계 업데이트
      this.updateStats(articles, hugoResults, Date.now() - startTime);
      
      // 결과 정리
      const result = {
        success: true,
        summary: {
          trendsCollected: trendingTopics.length,
          articlesGenerated: articles.length,
          hugoPostsCreated: hugoResults.filter(r => r.success !== false).length,
          totalTime: Date.now() - startTime,
          categories: this.getGeneratedCategories(articles)
        },
        articles: articles.map(article => ({
          title: article.title,
          category: article.topic.category,
          wordCount: article.wordCount,
          readingTime: article.readingTime
        })),
        hugoResults: hugoResults
      };
      
      console.log('\n🎉 AI 뉴스 생성 완료!');
      console.log(`📊 결과: ${result.summary.articlesGenerated}개 기사, ${result.summary.hugoPostsCreated}개 Hugo 포스트 생성`);
      console.log(`⏱️ 총 소요시간: ${Math.round(result.summary.totalTime / 1000)}초`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ 파이프라인 실행 실패: ${error.message}`);
      
      this.stats.failedGenerations++;
      
      return {
        success: false,
        error: error.message,
        partialResults: this.stats
      };
      
    } finally {
      this.isRunning = false;
    }
  }

  // 🔄 배치 기사 생성 (병렬 처리 최적화)
  async generateArticlesBatch(topics, verbose = true) {
    const articles = [];
    const batchSize = 3; // 동시 처리 개수
    
    for (let i = 0; i < topics.length; i += batchSize) {
      const batch = topics.slice(i, i + batchSize);
      
      if (verbose) {
        console.log(`\n📰 배치 ${Math.floor(i / batchSize) + 1}: ${batch.length}개 기사 동시 생성 중...`);
      }
      
      // 배치 내 병렬 처리
      const promises = batch.map(async (topic, index) => {
        try {
          const actualIndex = i + index + 1;
          
          if (verbose) {
            console.log(`  📝 ${actualIndex}/${topics.length}: "${topic.title}" 처리 중...`);
          }
          
          // 이미지 수집
          const images = await this.imageCollector.collectCategoryOptimizedImages(
            topic.title, 
            topic.category, 
            4
          );
          
          // 상세 정보 수집 (선택사항)
          const detailedInfo = await this.trendCollector.enrichTopicDetails(topic);
          
          // 기사 생성
          const article = await this.articleWriter.generateArticle(topic, images, detailedInfo);
          
          if (verbose) {
            console.log(`  ✅ ${actualIndex}: "${article.title}" 완료 (${article.wordCount}자)`);
          }
          
          return article;
          
        } catch (error) {
          console.log(`  ❌ "${topic.title}" 생성 실패: ${error.message}`);
          return null;
        }
      });
      
      // 배치 결과 수집
      const batchResults = await Promise.all(promises);
      const successfulArticles = batchResults.filter(article => article !== null);
      
      articles.push(...successfulArticles);
      
      // 배치 간 지연 (API 제한 방지)
      if (i + batchSize < topics.length) {
        await UTILS.sleep(3000);
      }
    }
    
    return articles;
  }

  // 📋 카테고리별 토픽 필터링
  filterTopicsByCategory(topics, allowedCategories) {
    const filtered = topics.filter(topic => 
      allowedCategories.includes(topic.category)
    );
    
    // 카테고리별 균등 분배
    const categoryGroups = {};
    filtered.forEach(topic => {
      if (!categoryGroups[topic.category]) {
        categoryGroups[topic.category] = [];
      }
      categoryGroups[topic.category].push(topic);
    });
    
    // 각 카테고리에서 최소 1개씩 선택
    const balanced = [];
    const maxPerCategory = Math.ceil(CONFIG.SCHEDULE.DAILY_ARTICLES / allowedCategories.length);
    
    allowedCategories.forEach(category => {
      if (categoryGroups[category]) {
        const categoryTopics = categoryGroups[category]
          .sort((a, b) => b.trendScore - a.trendScore)
          .slice(0, maxPerCategory);
        balanced.push(...categoryTopics);
      }
    });
    
    return balanced.sort((a, b) => b.trendScore - a.trendScore);
  }

  // 📊 통계 업데이트
  updateStats(articles, hugoResults, executionTime) {
    this.stats.totalArticlesGenerated += articles.length;
    this.stats.successfulGenerations += articles.length;
    this.stats.lastRunTime = new Date().toISOString();
    this.stats.totalRunTime += executionTime;
    
    // 카테고리별 통계
    articles.forEach(article => {
      const category = article.topic.category;
      this.stats.categoryCounts[category] = (this.stats.categoryCounts[category] || 0) + 1;
    });
    
    // Hugo 생성 실패 통계
    const failedHugo = hugoResults.filter(r => r.success === false).length;
    this.stats.failedGenerations += failedHugo;
  }

  // 🕐 스케줄링 시스템 (내장 타이머 사용)
  setupScheduledGeneration() {
    console.log('⏰ 자동 스케줄링 설정 중...');
    
    // 기존 스케줄 정리
    this.scheduledJobs.forEach(timer => clearInterval(timer));
    this.scheduledJobs = [];
    
    // 매시간 체크하여 설정된 시간에 실행
    const checkAndRun = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (CONFIG.SCHEDULE.GENERATION_TIMES.includes(currentTime)) {
        console.log(`\n⏰ 스케줄된 생성 시작: ${currentTime}`);
        
        this.runCompletePipeline({
          articleCount: Math.floor(CONFIG.SCHEDULE.DAILY_ARTICLES / CONFIG.SCHEDULE.GENERATION_TIMES.length),
          buildSite: true,
          verbose: false
        }).catch(error => {
          console.error(`❌ 스케줄된 생성 실패: ${error.message}`);
        });
      }
    };
    
    // 매분마다 체크 (더 정확한 시간 매칭)
    const timer = setInterval(checkAndRun, 60000);
    this.scheduledJobs.push(timer);
    
    console.log(`✅ 스케줄 등록 완료: ${CONFIG.SCHEDULE.GENERATION_TIMES.join(', ')}`);
    console.log('📅 매일 설정된 시간에 자동 실행됩니다');
  }

  // 🛑 스케줄링 중지
  stopScheduledGeneration() {
    this.scheduledJobs.forEach(timer => clearInterval(timer));
    this.scheduledJobs = [];
    console.log('⏹️ 자동 스케줄링 중지됨');
  }

  // 📊 시스템 상태 조회
  getSystemStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      scheduledJobs: this.scheduledJobs.length,
      modules: {
        trendCollector: this.trendCollector.constructor.name,
        imageCollector: this.imageCollector.constructor.name,
        articleWriter: this.articleWriter.constructor.name,
        hugoGenerator: this.hugoGenerator.constructor.name
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // 🎯 단일 기사 생성 (테스트용)
  async generateSingleArticle(topic) {
    console.log(`📝 단일 기사 생성: "${topic}"`);
    
    try {
      // 트렌드 검색
      const topics = await this.trendCollector.collectTrendingTopics(10);
      const matchedTopic = topics.find(t => 
        t.title.toLowerCase().includes(topic.toLowerCase()) ||
        t.description.toLowerCase().includes(topic.toLowerCase())
      );
      
      if (!matchedTopic) {
        throw new Error(`"${topic}" 관련 트렌드를 찾을 수 없습니다`);
      }
      
      // 이미지 수집
      const images = await this.imageCollector.collectImages(matchedTopic.title, 4);
      
      // 기사 생성
      const article = await this.articleWriter.generateArticle(matchedTopic, images);
      
      // Hugo 포스트 생성
      const hugoResult = await this.hugoGenerator.generateHugoPost(article);
      
      console.log(`✅ 단일 기사 생성 완료: ${hugoResult.filePath}`);
      
      return {
        success: true,
        article: article,
        hugoResult: hugoResult
      };
      
    } catch (error) {
      console.error(`❌ 단일 기사 생성 실패: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🗂️ 생성된 카테고리 통계
  getGeneratedCategories(articles) {
    const categories = {};
    articles.forEach(article => {
      const category = article.topic.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  // 🧹 정리 작업
  async cleanup() {
    console.log('🧹 시스템 정리 중...');
    
    // 스케줄 정리
    this.stopScheduledGeneration();
    
    // 실행 중인 작업 대기
    while (this.isRunning) {
      await UTILS.sleep(1000);
    }
    
    console.log('✅ 시스템 정리 완료');
  }

  // 📈 성능 모니터링
  getPerformanceMetrics() {
    const avgGenerationTime = this.stats.totalRunTime / (this.stats.successfulGenerations || 1);
    const successRate = (this.stats.successfulGenerations / this.stats.totalArticlesGenerated) * 100;
    
    return {
      totalArticles: this.stats.totalArticlesGenerated,
      successRate: Math.round(successRate),
      avgGenerationTime: Math.round(avgGenerationTime),
      categoryDistribution: this.stats.categoryCounts,
      systemUptime: process.uptime(),
      memoryUsage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }
}

// 🚀 메인 실행부
async function main() {
  const system = new AINewsSystem();
  
  console.log('🎯 AI 뉴스 생성 시스템 v1.0');
  console.log('=' .repeat(50));
  
  // 명령행 인자 처리
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  try {
    switch (command) {
      case 'run':
        // 단일 실행
        const result = await system.runCompletePipeline({
          articleCount: parseInt(args[1]) || 3,
          buildSite: args.includes('--build'),
          verbose: !args.includes('--quiet')
        });
        
        if (result.success) {
          console.log('\n📊 최종 결과:');
          console.log(JSON.stringify(result.summary, null, 2));
        }
        break;
        
      case 'schedule':
        // 자동 스케줄링 시작
        system.setupScheduledGeneration();
        console.log('🔄 자동 스케줄링 모드 - Ctrl+C로 종료');
        
        // 종료 신호 처리
        process.on('SIGINT', async () => {
          console.log('\n⏹️ 종료 신호 수신...');
          await system.cleanup();
          process.exit(0);
        });
        
        // 무한 대기
        await new Promise(() => {});
        break;
        
      case 'single':
        // 단일 기사 생성
        const topic = args[1];
        if (!topic) {
          console.log('❌ 주제를 입력해주세요: npm run single "AI 기술"');
          break;
        }
        
        const singleResult = await system.generateSingleArticle(topic);
        console.log(singleResult.success ? '✅ 성공' : '❌ 실패');
        break;
        
      case 'status':
        // 시스템 상태 조회
        const status = system.getSystemStatus();
        const metrics = system.getPerformanceMetrics();
        
        console.log('\n📊 시스템 상태:');
        console.log(`실행 중: ${status.isRunning ? '예' : '아니오'}`);
        console.log(`스케줄 작업: ${status.scheduledJobs}개`);
        console.log(`총 생성 기사: ${metrics.totalArticles}개`);
        console.log(`성공률: ${metrics.successRate}%`);
        console.log(`평균 생성 시간: ${metrics.avgGenerationTime}ms`);
        console.log(`메모리 사용량: ${metrics.memoryUsage.used}MB / ${metrics.memoryUsage.total}MB`);
        break;
        
      default:
        console.log(`
🚀 AI 뉴스 생성 시스템 사용법:

기본 명령어:
  npm start                    - 기본 실행 (3개 기사 생성)
  npm start run 5              - 5개 기사 생성
  npm start run 5 --build      - 5개 기사 생성 + Hugo 빌드
  npm start schedule           - 자동 스케줄링 시작
  npm start single "AI 기술"   - 특정 주제 기사 1개 생성
  npm start status             - 시스템 상태 확인

추가 옵션:
  --build    Hugo 사이트 빌드 실행
  --quiet    상세 로그 숨기기
        `);
    }
    
  } catch (error) {
    console.error(`❌ 시스템 오류: ${error.message}`);
    process.exit(1);
  }
}

// ES 모듈 메인 실행 체크
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 