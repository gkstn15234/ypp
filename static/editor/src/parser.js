const xml2js = require('xml2js');
const fs = require('fs-extra');
const chalk = require('chalk');
const moment = require('moment');

class WordPressParser {
    constructor() {
        this.parser = new xml2js.Parser({
            trim: true,
            ignoreAttrs: false,
            explicitArray: false,
            charkey: 'text',
            attrkey: 'attr'
        });
    }

    /**
     * WordPress XML 파일 파싱
     */
    async parseWordPressXML(filePath) {
        try {
            console.log(chalk.blue(`📄 파싱 시작: ${filePath}`));
            
            const xmlContent = await fs.readFile(filePath, 'utf8');
            const result = await this.parser.parseStringPromise(xmlContent);
            
            if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
                throw new Error('유효하지 않은 WordPress XML 파일입니다.');
            }

            const items = Array.isArray(result.rss.channel.item) 
                ? result.rss.channel.item 
                : [result.rss.channel.item];

            console.log(chalk.green(`✅ 총 ${items.length}개 아이템 발견`));
            
            return items;
        } catch (error) {
            console.error(chalk.red(`❌ XML 파싱 실패: ${error.message}`));
            throw error;
        }
    }

    /**
     * 게시물 데이터 정제
     */
    filterPosts(items) {
        const posts = items.filter(item => {
            const postType = this.getElementText(item, 'wp:post_type');
            const status = this.getElementText(item, 'wp:status');
            const content = this.getElementText(item, 'content:encoded');
            
            return postType === 'post' && 
                   status === 'publish' && 
                   content && 
                   content.trim().length > 0;
        });

        console.log(chalk.green(`📝 발행된 게시물: ${posts.length}개`));
        return posts;
    }

    /**
     * 첨부파일 데이터 정제
     */
    filterAttachments(items) {
        const attachments = items.filter(item => {
            const postType = this.getElementText(item, 'wp:post_type');
            const attachmentUrl = this.getElementText(item, 'wp:attachment_url');
            
            return postType === 'attachment' && 
                   attachmentUrl && 
                   this.isImageFile(attachmentUrl);
        });

        console.log(chalk.green(`🖼️  이미지 첨부파일: ${attachments.length}개`));
        return attachments;
    }

    /**
     * 게시물 메타데이터 추출
     */
    extractPostMetadata(item) {
        const post = {
            id: this.getElementText(item, 'wp:post_id'),
            title: this.decodeHtml(this.getElementText(item, 'title')),
            content: this.getElementText(item, 'content:encoded'),
            excerpt: this.getElementText(item, 'excerpt:encoded'),
            author: this.getElementText(item, 'dc:creator'),
            pubDate: this.getElementText(item, 'wp:post_date'),
            slug: this.getElementText(item, 'wp:post_name'),
            categories: this.extractCategories(item),
            tags: this.extractTags(item),
            postType: this.getElementText(item, 'wp:post_type'),
            status: this.getElementText(item, 'wp:status')
        };

        // 날짜 형식 변환
        post.date = moment(post.pubDate).format('YYYY-MM-DDTHH:mm:ss') + '+09:00';
        
        // 슬러그 생성 (없는 경우)
        if (!post.slug) {
            post.slug = this.generateSlug(post.title);
        }

        return post;
    }

    /**
     * 첨부파일 메타데이터 추출
     */
    extractAttachmentMetadata(item) {
        const attachment = {
            id: this.getElementText(item, 'wp:post_id'),
            title: this.decodeHtml(this.getElementText(item, 'title')),
            url: this.getElementText(item, 'wp:attachment_url'),
            parent: this.getElementText(item, 'wp:post_parent'),
            description: this.getElementText(item, 'content:encoded'),
            caption: this.getElementText(item, 'excerpt:encoded'),
            altText: this.getPostMeta(item, '_wp_attachment_image_alt'),
            filename: this.extractFilenameFromUrl(this.getElementText(item, 'wp:attachment_url')),
            mimeType: this.getPostMeta(item, '_wp_attached_file') || this.getMimeTypeFromUrl(this.getElementText(item, 'wp:attachment_url'))
        };

        return attachment;
    }

    /**
     * 카테고리 추출
     */
    extractCategories(item) {
        const categories = [];
        const categoryElements = item.category;
        
        if (categoryElements) {
            const categoryArray = Array.isArray(categoryElements) ? categoryElements : [categoryElements];
            categoryArray.forEach(cat => {
                if (cat.attr && cat.attr.domain === 'category') {
                    categories.push(this.decodeHtml(cat.text || cat));
                }
            });
        }
        
        return categories;
    }

    /**
     * 태그 추출
     */
    extractTags(item) {
        const tags = [];
        const categoryElements = item.category;
        
        if (categoryElements) {
            const categoryArray = Array.isArray(categoryElements) ? categoryElements : [categoryElements];
            categoryArray.forEach(cat => {
                if (cat.attr && cat.attr.domain === 'post_tag') {
                    tags.push(this.decodeHtml(cat.text || cat));
                }
            });
        }
        
        return tags;
    }

    /**
     * 포스트 메타데이터 추출
     */
    getPostMeta(item, metaKey) {
        const postMeta = item['wp:postmeta'];
        if (!postMeta) return null;

        const metaArray = Array.isArray(postMeta) ? postMeta : [postMeta];
        const meta = metaArray.find(m => m['wp:meta_key'] === metaKey);
        
        return meta ? meta['wp:meta_value'] : null;
    }

    /**
     * XML 요소 텍스트 추출
     */
    getElementText(item, elementName) {
        const element = item[elementName];
        if (!element) return '';
        
        if (typeof element === 'string') return element;
        if (element.text) return element.text;
        if (element._) return element._;
        
        return element.toString();
    }

    /**
     * HTML 디코딩
     */
    decodeHtml(html) {
        if (!html) return '';
        
        return html
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');
    }

    /**
     * 한글 URL 디코딩
     */
    decodeKoreanUrl(url) {
        try {
            return decodeURIComponent(url);
        } catch (e) {
            return url;
        }
    }

    /**
     * 슬러그 생성 (Windows 파일명 길이 제한 해결)
     */
    generateSlug(title) {
        // 간단한 숫자 ID 기반 파일명 생성
        const timestamp = Date.now().toString(36);
        const randomId = Math.random().toString(36).substr(2, 6);
        return `post-${timestamp}-${randomId}`;
    }

    /**
     * URL에서 파일명 추출
     */
    extractFilenameFromUrl(url) {
        if (!url) return '';
        
        try {
            const decodedUrl = this.decodeKoreanUrl(url);
            const pathname = new URL(decodedUrl).pathname;
            return pathname.split('/').pop() || '';
        } catch (e) {
            return url.split('/').pop() || '';
        }
    }

    /**
     * 이미지 파일 확인
     */
    isImageFile(url) {
        if (!url) return false;
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const lowerUrl = url.toLowerCase();
        
        return imageExtensions.some(ext => lowerUrl.includes(ext));
    }

    /**
     * MIME 타입 추출
     */
    getMimeTypeFromUrl(url) {
        if (!url) return '';
        
        const extension = url.toLowerCase().split('.').pop();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp'
        };
        
        return mimeTypes[extension] || 'image/jpeg';
    }
}

module.exports = WordPressParser; 