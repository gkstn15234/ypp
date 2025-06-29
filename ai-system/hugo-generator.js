import fs from 'fs';
import path from 'path';
import { CONFIG, UTILS } from './config.js';

export class HugoGenerator {
  constructor() {
    this.contentPath = CONFIG.HUGO.CONTENT_PATH;
    this.generatedFiles = [];
    this.categoryMappings = {
      '기술': 'it',
      '경제': 'economy', 
      '부동산': 'realestate',
      '증권': 'securities',
      '국제': 'international',
      '청년': 'youth'
    };
  }

  // 메인 Hugo 마크다운 생성 함수
  async generateHugoPost(article) {
    console.log(`📝 Hugo 포스트 생성: "${article.title}"`);
    
    try {
      // 1. 슬러그 생성
      const slug = this.generateSlug(article.title);
      
      // 2. 카테고리 경로 결정
      const categoryPath = this.getCategoryPath(article.topic.category);
      
      // 3. 파일 경로 생성
      const filePath = this.generateFilePath(categoryPath, slug);
      
      // 4. 마크다운 콘텐츠 생성
      const markdownContent = this.generateMarkdownContent(article);
      
      // 5. 파일 저장
      await this.saveMarkdownFile(filePath, markdownContent);
      
      // 6. 생성 기록 저장
      const generatedFile = {
        title: article.title,
        slug: slug,
        category: article.topic.category,
        filePath: filePath,
        generatedAt: new Date().toISOString(),
        wordCount: article.wordCount,
        readingTime: article.readingTime
      };
      
      this.generatedFiles.push(generatedFile);
      
      console.log(`✅ Hugo 포스트 생성 완료: ${filePath}`);
      
      return generatedFile;
      
    } catch (error) {
      console.error(`❌ Hugo 포스트 생성 실패: ${error.message}`);
      throw error;
    }
  }

  // 슬러그 생성 (URL 친화적) - 내장 구현
  generateSlug(title) {
    // HTML 태그 제거
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    
    // 한글 slug 생성 (직접 구현)
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/-+/g, '-') // 연속 하이픈 정리
      .replace(/^-|-$/g, '') // 시작/끝 하이픈 제거
      .substring(0, 50); // 길이 제한
    
    // 날짜 접두어 추가 (중복 방지)
    const datePrefix = new Date().toISOString().split('T')[0];
    
    return `${datePrefix}-${slug}`;
  }

  // 카테고리 경로 매핑
  getCategoryPath(category) {
    return this.categoryMappings[category] || 'general';
  }

  // 파일 경로 생성
  generateFilePath(categoryPath, slug) {
    return path.join(this.contentPath, categoryPath, `${slug}.md`);
  }

  // 마크다운 콘텐츠 생성
  generateMarkdownContent(article) {
    const frontMatter = this.generateFrontMatter(article);
    const content = this.processContentForMarkdown(article.content);
    
    return `---
${frontMatter}
---

${content}
`;
  }

  // Hugo Front Matter 생성
  generateFrontMatter(article) {
    const publishDate = new Date().toISOString();
    const lastMod = publishDate;
    
    // 이미지에서 대표 이미지 선택
    const featuredImage = article.images?.find(img => !img.isPlaceholder)?.url || 
                         article.images?.[0]?.url || '';
    
    const frontMatter = {
      title: this.escapeYamlString(article.title),
      description: this.escapeYamlString(article.summary),
      date: publishDate,
      lastmod: lastMod,
      draft: false,
      weight: Math.floor(Math.random() * 100) + 1,
      images: featuredImage ? [featuredImage] : [],
      contributors: [CONFIG.HUGO.DEFAULT_AUTHOR],
      pinned: false,
      homepage: false,
      keywords: article.keywords || [],
      tags: [...(article.keywords || []), ...CONFIG.HUGO.DEFAULT_TAGS],
      categories: [article.topic.category],
      series: [],
      toc: true,
      math: false,
      lightgallery: true,
      comment: true,
      // 커스텀 메타데이터
      ai_generated: true,
      source_topic: this.escapeYamlString(article.topic.title),
      trend_score: article.topic.trendScore || 0,
      word_count: article.wordCount,
      reading_time: article.readingTime,
      generated_at: article.generatedAt
    };
    
    return this.objectToYaml(frontMatter);
  }

  // YAML 문자열 이스케이프
  escapeYamlString(str) {
    if (!str) return '';
    
    // 특수문자가 포함된 경우 따옴표로 감싸기
    if (/[:\-\[\]{}|>*&!%@`]/.test(str)) {
      return `"${str.replace(/"/g, '\\"')}"`;
    }
    
    return str;
  }

  // 객체를 YAML 형식으로 변환
  objectToYaml(obj, indent = 0) {
    const indentStr = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          yaml += `${indentStr}${key}: []\n`;
        } else {
          yaml += `${indentStr}${key}:\n`;
          value.forEach(item => {
            yaml += `${indentStr}  - ${this.escapeYamlString(String(item))}\n`;
          });
        }
      } else if (typeof value === 'object') {
        yaml += `${indentStr}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else {
        yaml += `${indentStr}${key}: ${this.escapeYamlString(String(value))}\n`;
      }
    }
    
    return yaml;
  }

  // 마크다운용 콘텐츠 처리
  processContentForMarkdown(htmlContent) {
    let content = htmlContent;
    
    // HTML을 마크다운으로 변환
    content = this.convertHtmlToMarkdown(content);
    
    // 이미지 최적화
    content = this.optimizeImagesForHugo(content);
    
    // Hugo 단축코드 적용
    content = this.applyHugoShortcodes(content);
    
    return content;
  }

  // HTML을 마크다운으로 변환
  convertHtmlToMarkdown(html) {
    let markdown = html;
    
    // 기본 HTML 태그 변환
    const conversions = [
      // 제목
      [/<h1[^>]*>(.*?)<\/h1>/gi, '# $1'],
      [/<h2[^>]*>(.*?)<\/h2>/gi, '## $1'],
      [/<h3[^>]*>(.*?)<\/h3>/gi, '### $1'],
      
      // 강조
      [/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**'],
      [/<b[^>]*>(.*?)<\/b>/gi, '**$1**'],
      [/<em[^>]*>(.*?)<\/em>/gi, '*$1*'],
      [/<i[^>]*>(.*?)<\/i>/gi, '*$1*'],
      
      // 단락
      [/<p[^>]*>(.*?)<\/p>/gi, '$1\n'],
      
      // 줄바꿈
      [/<br\s*\/?>/gi, '\n'],
      
      // 링크
      [/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)'],
      
      // 목록
      [/<ul[^>]*>(.*?)<\/ul>/gis, '$1'],
      [/<ol[^>]*>(.*?)<\/ol>/gis, '$1'],
      [/<li[^>]*>(.*?)<\/li>/gi, '- $1'],
      
      // 인용
      [/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1'],
      
      // 코드
      [/<code[^>]*>(.*?)<\/code>/gi, '`$1`'],
      [/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```']
    ];
    
    conversions.forEach(([pattern, replacement]) => {
      markdown = markdown.replace(pattern, replacement);
    });
    
    return markdown;
  }

  // Hugo용 이미지 최적화
  optimizeImagesForHugo(content) {
    // 이미지 태그를 Hugo figure 단축코드로 변환
    const imageRegex = /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
    
    return content.replace(imageRegex, (match, src, alt) => {
      // 외부 이미지는 그대로 유지, 로컬 이미지는 Hugo 경로로 변환
      const imageSrc = src.startsWith('http') ? src : src;
      
      return `{{< figure src="${imageSrc}" alt="${alt}" caption="${alt}" >}}`;
    });
  }

  // Hugo 단축코드 적용
  applyHugoShortcodes(content) {
    // vertical-bar-text div를 Hugo 단축코드로 변환
    content = content.replace(
      /<div class="vertical-bar-text">(.*?)<\/div>/gis,
      '{{< alert "info" >}}\n$1\n{{< /alert >}}'
    );
    
    // 중요한 정보를 alert 박스로 변환
    content = content.replace(
      /<div class="alert[^>]*">(.*?)<\/div>/gis,
      '{{< alert "warning" >}}\n$1\n{{< /alert >}}'
    );
    
    return content;
  }

  // 마크다운 파일 저장 (내장 fs 사용)
  async saveMarkdownFile(filePath, content) {
    try {
      // 디렉토리 생성 (재귀적으로)
      const dirPath = path.dirname(filePath);
      await fs.promises.mkdir(dirPath, { recursive: true });
      
      // 파일 저장
      await fs.promises.writeFile(filePath, content, 'utf8');
      
      console.log(`💾 마크다운 파일 저장 완료: ${filePath}`);
      
    } catch (error) {
      throw new Error(`파일 저장 실패: ${error.message}`);
    }
  }

  // 배치 생성
  async generateBatch(articles) {
    console.log(`📚 ${articles.length}개 기사 배치 Hugo 포스트 생성 시작...`);
    
    const results = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        console.log(`\n📝 ${i + 1}/${articles.length}: "${article.title}" 처리 중...`);
        
        const result = await this.generateHugoPost(article);
        results.push(result);
        
        // 파일 생성 간 지연
        await UTILS.sleep(500);
        
      } catch (error) {
        console.log(`❌ "${article.title}" Hugo 포스트 생성 실패: ${error.message}`);
        
        results.push({
          title: article.title,
          error: error.message,
          success: false
        });
      }
    }
    
    const successCount = results.filter(r => r.success !== false).length;
    console.log(`🎉 배치 생성 완료: ${successCount}/${articles.length}개 성공`);
    
    return results;
  }

  // 기존 포스트 업데이트
  async updateExistingPost(slug, updatedArticle) {
    const existingFile = this.generatedFiles.find(f => f.slug === slug);
    
    if (!existingFile) {
      throw new Error(`기존 포스트를 찾을 수 없음: ${slug}`);
    }
    
    console.log(`🔄 기존 포스트 업데이트: ${existingFile.title}`);
    
    // 새로운 콘텐츠 생성
    const markdownContent = this.generateMarkdownContent(updatedArticle);
    
    // 파일 업데이트
    await this.saveMarkdownFile(existingFile.filePath, markdownContent);
    
    // 기록 업데이트
    Object.assign(existingFile, {
      lastUpdated: new Date().toISOString(),
      wordCount: updatedArticle.wordCount,
      readingTime: updatedArticle.readingTime
    });
    
    console.log(`✅ 포스트 업데이트 완료: ${existingFile.filePath}`);
    
    return existingFile;
  }

  // 포스트 삭제
  async deletePost(slug) {
    const existingFile = this.generatedFiles.find(f => f.slug === slug);
    
    if (!existingFile) {
      throw new Error(`삭제할 포스트를 찾을 수 없음: ${slug}`);
    }
    
    try {
      await fs.promises.unlink(existingFile.filePath);
      
      // 기록에서 제거
      const index = this.generatedFiles.indexOf(existingFile);
      this.generatedFiles.splice(index, 1);
      
      console.log(`🗑️ 포스트 삭제 완료: ${existingFile.title}`);
      
      return true;
      
    } catch (error) {
      throw new Error(`포스트 삭제 실패: ${error.message}`);
    }
  }

  // 생성된 파일 목록 조회
  listGeneratedPosts() {
    return this.generatedFiles.map(file => ({
      title: file.title,
      slug: file.slug,
      category: file.category,
      generatedAt: file.generatedAt,
      wordCount: file.wordCount,
      readingTime: file.readingTime
    }));
  }

  // 카테고리별 통계
  getCategoryStats() {
    const stats = {};
    
    this.generatedFiles.forEach(file => {
      const category = file.category;
      
      if (!stats[category]) {
        stats[category] = {
          count: 0,
          totalWords: 0,
          totalReadingTime: 0
        };
      }
      
      stats[category].count++;
      stats[category].totalWords += file.wordCount || 0;
      stats[category].totalReadingTime += file.readingTime || 0;
    });
    
    // 평균 계산
    Object.keys(stats).forEach(category => {
      const categoryStats = stats[category];
      categoryStats.avgWords = Math.round(categoryStats.totalWords / categoryStats.count);
      categoryStats.avgReadingTime = Math.round(categoryStats.totalReadingTime / categoryStats.count);
    });
    
    return stats;
  }

  // Hugo 사이트 빌드 트리거 (선택사항)
  async triggerHugoBuild() {
    console.log('🔨 Hugo 사이트 빌드 시작...');
    
    try {
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const hugo = spawn('hugo', ['--gc', '--minify'], {
          cwd: path.resolve('.'),
          stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        hugo.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        hugo.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        hugo.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Hugo 빌드 완료');
            console.log(output);
            resolve(output);
          } else {
            console.error('❌ Hugo 빌드 실패');
            console.error(errorOutput);
            reject(new Error(`Hugo 빌드 실패: ${errorOutput}`));
          }
        });
      });
      
    } catch (error) {
      throw new Error(`Hugo 빌드 실행 실패: ${error.message}`);
    }
  }

  // 개발 서버 시작 (선택사항)
  async startDevServer() {
    console.log('🚀 Hugo 개발 서버 시작...');
    
    try {
      const { spawn } = await import('child_process');
      
      const hugo = spawn('hugo', ['server', '--buildDrafts', '--buildFuture'], {
        cwd: path.resolve('.'),
        stdio: 'inherit'
      });
      
      console.log('📡 Hugo 개발 서버가 http://localhost:1313 에서 실행 중...');
      
      return hugo;
      
    } catch (error) {
      throw new Error(`Hugo 개발 서버 시작 실패: ${error.message}`);
    }
  }
}

// 단독 실행시 테스트
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new HugoGenerator();
  
  console.log('🚀 Hugo 생성기 테스트 시작');
  
  // 테스트 기사 데이터
  const testArticle = {
    title: 'AI 기술 혁신으로 달라지는 미래 일자리 전망',
    content: `
      <h1>AI 기술 혁신으로 달라지는 미래 일자리 전망</h1>
      
      <div class="vertical-bar-text">
      인공지능 기술 급속 발전<br>
      기존 일자리 구조 변화<br>
      새로운 직업군 등장 예상
      </div>
      
      <img src="https://via.placeholder.com/800x600/007acc/ffffff?text=AI+Technology" alt="AI 기술" style="width:100%;height:auto;margin:20px 0;"/>
      
      <p><strong>인공지능(AI) 기술의 급속한 발전</strong>이 노동 시장에 혁신적인 변화를 가져오고 있다. 전문가들은 기존 일자리 구조가 크게 바뀔 것으로 전망한다고 발표했다.</p>
      
      <p>최근 발표된 연구에 따르면, AI 기술은 단순 반복 업무를 대체하는 동시에 새로운 형태의 직업을 창출하고 있는 것으로 나타났다.</p>
      
      <h2>현황 분석</h2>
      
      <p>현재 시장에서는 AI 관련 전문 인력에 대한 수요가 급증하고 있다. 데이터 사이언티스트, AI 엔지니어 등의 직종이 주목받고 있다.</p>
    `,
    summary: 'AI 기술 발전으로 기존 일자리 구조가 변화하고 있으며, 새로운 직업군이 등장하고 있다. 전문가들은 이러한 변화에 대비한 준비가 필요하다고 강조했다.',
    keywords: ['AI', '기술', '일자리', '미래', '혁신'],
    topic: {
      title: 'AI 기술 발전으로 인한 일자리 변화',
      category: '기술',
      trendScore: 95
    },
    images: [
      { url: 'https://via.placeholder.com/800x600/007acc/ffffff?text=AI+Technology', alt: 'AI 기술', isPlaceholder: true }
    ],
    wordCount: 850,
    readingTime: 4,
    generatedAt: new Date().toISOString()
  };
  
  try {
    // Hugo 포스트 생성 테스트
    const result = await generator.generateHugoPost(testArticle);
    
    console.log('\n📰 생성된 Hugo 포스트:');
    console.log(`제목: ${result.title}`);
    console.log(`슬러그: ${result.slug}`);
    console.log(`카테고리: ${result.category}`);
    console.log(`파일 경로: ${result.filePath}`);
    console.log(`단어 수: ${result.wordCount}`);
    
    console.log('\n📊 생성 통계:');
    console.log('생성된 포스트 목록:', generator.listGeneratedPosts());
    console.log('카테고리별 통계:', generator.getCategoryStats());
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
} 