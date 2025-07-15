const moment = require('moment');
const slugify = require('slugify');
const chalk = require('chalk');

class HugoFormatter {
    constructor(config = {}) {
        this.config = {
            dateFormat: 'YYYY-MM-DDTHH:mm:ss+09:00',
            slugifyOptions: {
                lower: true,
                strict: true,
                locale: 'ko'
            },
            defaultAuthor: '김현지',
            defaultCategory: '자동차',
            ...config
        };
        
        this.categoryMap = this.loadCategoryMap();
        this.authorMap = this.loadAuthorMap();
    }

    /**
     * Hugo Front Matter 생성
     */
    generateHugoFrontMatter(post) {
        const frontMatter = [];
        
        frontMatter.push('---');
        frontMatter.push(`title: "${this.escapeYaml(post.title)}"`);
        frontMatter.push(`description: "${this.escapeYaml(this.generateDescription(post))}"`);
        frontMatter.push(`date: ${this.formatDate(post.date)}`);
        frontMatter.push(`draft: false`);
        
        // 카테고리 매핑
        const categories = this.mapCategories(post.categories);
        frontMatter.push(`categories: [${categories.map(c => `"${c}"`).join(', ')}]`);
        
        // 태그 처리
        const tags = this.processTags(post.tags);
        if (tags.length > 0) {
            frontMatter.push(`tags: [${tags.map(t => `"${this.escapeYaml(t)}"`).join(', ')}]`);
        }
        
        // 이미지 배열 추가
        const images = this.extractImages(post.content);
        if (images.length > 0) {
            frontMatter.push(`images: [`);
            images.forEach(img => {
                frontMatter.push(`  "${img}"`);
            });
            frontMatter.push(`]`);
        }
        
        // 작성자 매핑
        const author = this.mapAuthor(post.author);
        frontMatter.push(`author: "${author}"`);
        
        // 슬러그 추가
        if (post.slug) {
            frontMatter.push(`slug: "${post.slug}"`);
        }
        
        frontMatter.push('---');
        
        return frontMatter.join('\n');
    }

    /**
     * WordPress HTML → Hugo Markdown 변환
     */
    convertToHugoMarkdown(content) {
        let convertedContent = content;
        
        // WordPress 블록 에디터 주석 제거
        convertedContent = this.removeBlockEditorComments(convertedContent);
        
        // [caption] 숏코드 변환
        convertedContent = this.convertCaptionShortcodes(convertedContent);
        
        // [gallery] 숏코드 변환
        convertedContent = this.convertGalleryShortcodes(convertedContent);
        
        // WordPress CSS 클래스 정리
        convertedContent = this.cleanWordPressClasses(convertedContent);
        
        // 불필요한 HTML 태그 정리
        convertedContent = this.cleanHtmlTags(convertedContent);
        
        // 줄바꿈 정리
        convertedContent = this.normalizeLineBreaks(convertedContent);
        
        return convertedContent;
    }

    /**
     * 파일명 생성
     */
    generateFilename(post) {
        const date = moment(post.date).format('YYYY-MM-DD');
        const slug = post.slug || this.generateSlug(post.title);
        
        return `${date}-${slug}.md`;
    }

    /**
     * 카테고리 매핑
     */
    mapCategories(categories) {
        if (!categories || categories.length === 0) {
            return [this.config.defaultCategory];
        }
        
        const mappedCategories = categories.map(cat => {
            const lowerCat = cat.toLowerCase();
            return this.categoryMap[lowerCat] || cat;
        });
        
        return [...new Set(mappedCategories)]; // 중복 제거
    }

    /**
     * 작성자 매핑
     */
    mapAuthor(author) {
        if (!author) return this.config.defaultAuthor;
        
        const mappedAuthor = this.authorMap[author];
        if (mappedAuthor) return mappedAuthor;
        
        // 영문 변환 및 정리
        return author
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30);
    }

    /**
     * 태그 처리
     */
    processTags(tags) {
        if (!tags || tags.length === 0) return [];
        
        return tags
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // 최대 10개 태그
    }

    /**
     * 설명 생성
     */
    generateDescription(post) {
        if (post.excerpt && post.excerpt.trim()) {
            return this.stripHtml(post.excerpt).substring(0, 150);
        }
        
        // 본문에서 첫 번째 단락 추출
        const firstParagraph = this.extractFirstParagraph(post.content);
        return firstParagraph.substring(0, 150);
    }

    /**
     * 이미지 URL 추출
     */
    extractImages(content) {
        const images = [];
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        
        while ((match = imgRegex.exec(content)) !== null) {
            const src = match[1];
            if (src && !images.includes(src)) {
                images.push(src);
            }
        }
        
        return images.slice(0, 5); // 최대 5개 이미지
    }

    /**
     * 블록 에디터 주석 제거
     */
    removeBlockEditorComments(content) {
        return content
            .replace(/<!-- wp:[^>]+ -->/g, '')
            .replace(/<!-- \/wp:[^>]+ -->/g, '')
            .replace(/<!-- wp:[^>]+\/-->/g, '');
    }

    /**
     * [caption] 숏코드 변환
     */
    convertCaptionShortcodes(content) {
        return content.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, (match, captionContent) => {
            const imgMatch = captionContent.match(/<img[^>]+>/);
            const captionMatch = captionContent.match(/>(.*?)$/s);
            
            if (imgMatch && captionMatch) {
                const caption = captionMatch[1].trim();
                if (caption) {
                    return `<figure class="wp-caption">
    ${imgMatch[0]}
    <figcaption class="wp-caption-text">${caption}</figcaption>
</figure>`;
                }
                return imgMatch[0];
            }
            return match;
        });
    }

    /**
     * [gallery] 숏코드 변환
     */
    convertGalleryShortcodes(content) {
        return content.replace(/\[gallery[^\]]*\]/g, (match) => {
            return `<!-- WordPress Gallery: ${match} -->`;
        });
    }

    /**
     * WordPress CSS 클래스 정리
     */
    cleanWordPressClasses(content) {
        return content
            .replace(/class="[^"]*wp-[^"]*"/g, '')
            .replace(/class="[^"]*alignleft[^"]*"/g, 'class="float-left"')
            .replace(/class="[^"]*alignright[^"]*"/g, 'class="float-right"')
            .replace(/class="[^"]*aligncenter[^"]*"/g, 'class="text-center"')
            .replace(/class=""/g, '');
    }

    /**
     * HTML 태그 정리
     */
    cleanHtmlTags(content) {
        return content
            .replace(/<p>\s*<\/p>/g, '') // 빈 단락 제거
            .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p>\n\n<p>') // 연속 br을 단락으로
            .replace(/&nbsp;/g, ' ') // 공백 문자 정리
            .replace(/\s+/g, ' '); // 연속 공백 정리
    }

    /**
     * 줄바꿈 정리
     */
    normalizeLineBreaks(content) {
        return content
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /**
     * 슬러그 생성
     */
    generateSlug(title) {
        if (!title) return 'untitled';
        
        // 한글 제목 처리
        const koreanSlug = title
            .replace(/[^\w\s가-힣-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 50);
        
        // 영문 슬러그 생성
        const englishSlug = slugify(title, this.config.slugifyOptions);
        
        return englishSlug || koreanSlug;
    }

    /**
     * 날짜 포맷
     */
    formatDate(date) {
        return moment(date).format(this.config.dateFormat);
    }

    /**
     * YAML 이스케이프
     */
    escapeYaml(str) {
        if (!str) return '';
        
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    /**
     * HTML 태그 제거
     */
    stripHtml(html) {
        if (!html) return '';
        
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 첫 번째 단락 추출
     */
    extractFirstParagraph(content) {
        const pMatch = content.match(/<p[^>]*>(.*?)<\/p>/s);
        if (pMatch) {
            return this.stripHtml(pMatch[1]);
        }
        
        // p 태그가 없는 경우 첫 번째 텍스트 블록 사용
        const textMatch = content.match(/^([^<]+)/);
        return textMatch ? textMatch[1].trim() : '';
    }

    /**
     * 카테고리 매핑 로드
     */
    loadCategoryMap() {
        try {
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../config/categories.json');
            
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return config.categoryMappings.wordpress;
            }
        } catch (error) {
            console.log('카테고리 설정 파일을 읽는 중 오류 발생, 기본값 사용');
        }
        
        // 모든 카테고리를 entertainment로 매핑
        return {
            'automotive': 'entertainment',
            'car': 'entertainment',
            'vehicle': 'entertainment',
            'auto': 'entertainment',
            'economy': 'entertainment',
            'business': 'entertainment',
            'finance': 'entertainment',
            'money': 'entertainment',
            'technology': 'entertainment',
            'tech': 'entertainment',
            'it': 'entertainment',
            'lifestyle': 'entertainment',
            'life': 'entertainment',
            'health': 'entertainment',
            'food': 'entertainment',
            'travel': 'entertainment',
            'sports': 'entertainment',
            'politics': 'entertainment',
            'society': 'entertainment',
            'culture': 'entertainment',
            'entertainment': 'entertainment',
            'ent': 'entertainment',
            '연예': 'entertainment',
            '영화': 'entertainment',
            '음악': 'entertainment',
            '드라마': 'entertainment',
            'movie': 'entertainment',
            'music': 'entertainment',
            'drama': 'entertainment',
            'tv': 'entertainment',
            'show': 'entertainment',
            'celebrity': 'entertainment',
            'star': 'entertainment',
            '운동': 'entertainment',
            'exercise': 'entertainment',
            'fitness': 'entertainment',
            '건강': 'entertainment',
            '다이어트': 'entertainment',
            '스트레칭': 'entertainment',
            '홈트': 'entertainment',
            '요가': 'entertainment',
            '필라테스': 'entertainment'
        };
    }

    /**
     * 작성자 매핑 로드
     */
    loadAuthorMap() {
        return {
            '오은진': '김현지',
            '김현지': '김현지',
            '김철수': '김철수',
            '박영희': '박영희',
            '이민수': '이민수',
            '정하나': '정하나',
            'admin': '김현지',
            'administrator': '김현지'
        };
    }

    /**
     * 변환 통계 생성
     */
    generateConversionStats(posts) {
        const stats = {
            totalPosts: posts.length,
            categories: {},
            authors: {},
            tags: {},
            averageContentLength: 0,
            postsWithImages: 0
        };

        let totalContentLength = 0;

        posts.forEach(post => {
            // 카테고리 통계
            post.categories.forEach(cat => {
                stats.categories[cat] = (stats.categories[cat] || 0) + 1;
            });

            // 작성자 통계
            stats.authors[post.author] = (stats.authors[post.author] || 0) + 1;

            // 태그 통계
            post.tags.forEach(tag => {
                stats.tags[tag] = (stats.tags[tag] || 0) + 1;
            });

            // 콘텐츠 길이
            totalContentLength += post.content.length;

            // 이미지 포함 글
            if (post.content.includes('<img')) {
                stats.postsWithImages++;
            }
        });

        stats.averageContentLength = Math.round(totalContentLength / posts.length);

        return stats;
    }

    /**
     * 변환 결과 출력
     */
    printConversionStats(stats) {
        console.log(chalk.cyan('\n📊 변환 통계:'));
        console.log(chalk.white(`   총 게시물: ${stats.totalPosts}개`));
        console.log(chalk.white(`   평균 콘텐츠 길이: ${stats.averageContentLength}자`));
        console.log(chalk.white(`   이미지 포함 글: ${stats.postsWithImages}개`));
        
        console.log(chalk.cyan('\n📁 카테고리별 분포:'));
        Object.entries(stats.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([category, count]) => {
                console.log(chalk.white(`   ${category}: ${count}개`));
            });
        
        console.log(chalk.cyan('\n✍️  작성자별 분포:'));
        Object.entries(stats.authors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([author, count]) => {
                console.log(chalk.white(`   ${author}: ${count}개`));
            });
    }
}

module.exports = HugoFormatter; 