const cheerio = require('cheerio');
const chalk = require('chalk');

class ImageProcessor {
    constructor() {
        this.imagePatterns = [
            /<img[^>]+src="([^"]+)"[^>]*>/g,                           // HTML img 태그
            /!\[([^\]]*)\]\(([^)]+)\)/g,                               // Markdown 이미지
            /\[caption[^\]]*\].*?<img[^>]+src="([^"]+)".*?\[\/caption\]/g  // WordPress caption
        ];
    }

    /**
     * 본문에서 모든 이미지 URL 추출 (위치 정보 포함)
     */
    extractImagesWithPosition(content) {
        const imageData = [];
        const $ = cheerio.load(content);
        
        // HTML img 태그 추출
        $('img').each((index, element) => {
            const $img = $(element);
            const src = $img.attr('src');
            
            if (src && this.isExternalImage(src)) {
                imageData.push({
                    originalUrl: src,
                    type: 'img',
                    position: content.indexOf($img.toString()),
                    element: $img.toString(),
                    attributes: {
                        alt: $img.attr('alt') || '',
                        title: $img.attr('title') || '',
                        class: $img.attr('class') || '',
                        style: $img.attr('style') || '',
                        width: $img.attr('width') || '',
                        height: $img.attr('height') || ''
                    }
                });
            }
        });

        // WordPress caption 처리
        const captionRegex = /\[caption[^\]]*\](.*?)\[\/caption\]/gs;
        let captionMatch;
        
        while ((captionMatch = captionRegex.exec(content)) !== null) {
            const captionContent = captionMatch[1];
            const imgMatch = captionContent.match(/<img[^>]+src="([^"]+)"[^>]*>/);
            
            if (imgMatch && this.isExternalImage(imgMatch[1])) {
                imageData.push({
                    originalUrl: imgMatch[1],
                    type: 'caption',
                    position: captionMatch.index,
                    element: captionMatch[0],
                    captionText: captionContent.replace(/<img[^>]*>/, '').trim()
                });
            }
        }

        // 갤러리 이미지 처리
        const galleryRegex = /\[gallery[^\]]*\]/g;
        let galleryMatch;
        
        while ((galleryMatch = galleryRegex.exec(content)) !== null) {
            imageData.push({
                originalUrl: null,
                type: 'gallery',
                position: galleryMatch.index,
                element: galleryMatch[0]
            });
        }

        console.log(chalk.blue(`🖼️  이미지 ${imageData.length}개 발견`));
        return imageData.sort((a, b) => a.position - b.position);
    }

    /**
     * 이미지 위치 보존하면서 URL만 교체
     */
    replaceImageUrls(content, imageMap) {
        let updatedContent = content;
        
        // 정확한 URL 매칭으로 교체
        for (const [originalUrl, cloudflareUrl] of imageMap) {
            if (originalUrl && cloudflareUrl && originalUrl !== cloudflareUrl) {
                const urlRegex = new RegExp(this.escapeRegExp(originalUrl), 'g');
                updatedContent = updatedContent.replace(urlRegex, cloudflareUrl);
                
                console.log(chalk.gray(`🔄 URL 교체: ${originalUrl.substring(0, 50)}... → ${cloudflareUrl.substring(0, 50)}...`));
            }
        }
        
        return updatedContent;
    }

    /**
     * 이미지 속성 보존하면서 URL 교체
     */
    preserveImageAttributes(content, imageMap) {
        const $ = cheerio.load(content);
        
        $('img').each((index, element) => {
            const $img = $(element);
            const originalSrc = $img.attr('src');
            
            if (originalSrc && imageMap.has(originalSrc)) {
                const newSrc = imageMap.get(originalSrc);
                $img.attr('src', newSrc);
                
                // 속성 보존 확인
                const preservedAttrs = ['alt', 'title', 'class', 'style', 'width', 'height'];
                preservedAttrs.forEach(attr => {
                    const value = $img.attr(attr);
                    if (value) {
                        $img.attr(attr, value);
                    }
                });
            }
        });
        
        return $.html();
    }

    /**
     * WordPress 특화 이미지 처리
     */
    processWordPressImages(content, imageMap) {
        let processedContent = content;
        
        // [caption] 숏코드 처리
        processedContent = processedContent.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, (match, captionContent) => {
            const imgMatch = captionContent.match(/<img[^>]+src="([^"]+)"[^>]*>/);
            const captionMatch = captionContent.match(/>(.*?)$/s);
            
            if (imgMatch && captionMatch) {
                const originalUrl = imgMatch[1];
                const newUrl = imageMap.get(originalUrl) || originalUrl;
                const updatedImg = imgMatch[0].replace(originalUrl, newUrl);
                
                return `<figure class="wp-caption">
    ${updatedImg}
    <figcaption class="wp-caption-text">${captionMatch[1].trim()}</figcaption>
</figure>`;
            }
            return match;
        });

        // [gallery] 숏코드 처리
        processedContent = processedContent.replace(/\[gallery[^\]]*\]/g, (match) => {
            return `<!-- WordPress Gallery: ${match} -->`;
        });

        return processedContent;
    }

    /**
     * 이미지 메타데이터 생성
     */
    generateImageMetadata(imageData, imageMap) {
        const metadata = [];
        
        imageData.forEach(img => {
            if (img.originalUrl && imageMap.has(img.originalUrl)) {
                metadata.push({
                    original: img.originalUrl,
                    cloudflare: imageMap.get(img.originalUrl),
                    type: img.type,
                    attributes: img.attributes || {},
                    position: img.position
                });
            }
        });
        
        return metadata;
    }

    /**
     * 외부 이미지 URL 확인
     */
    isExternalImage(url) {
        if (!url) return false;
        
        // HTTP/HTTPS로 시작하는 외부 URL
        const isExternal = url.startsWith('http://') || url.startsWith('https://');
        
        // 이미지 확장자 확인
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
        
        return isExternal && hasImageExtension;
    }

    /**
     * 정규표현식 이스케이프
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 이미지 최적화 정보 생성
     */
    generateOptimizedImageInfo(imageMap) {
        const info = {
            totalImages: imageMap.size,
            successfulUploads: 0,
            failedUploads: 0,
            originalUrls: [],
            cloudflareUrls: []
        };

        for (const [original, cloudflare] of imageMap) {
            if (original !== cloudflare) {
                info.successfulUploads++;
                info.cloudflareUrls.push(cloudflare);
            } else {
                info.failedUploads++;
            }
            info.originalUrls.push(original);
        }

        return info;
    }

    /**
     * 이미지 URL 정리
     */
    cleanImageUrls(content) {
        // 중복 URL 제거
        const cleanedContent = content.replace(/src="([^"]*)"[^>]*src="([^"]*)"/g, 'src="$1"');
        
        // 빈 src 속성 제거
        return cleanedContent.replace(/<img[^>]*src=""[^>]*>/g, '');
    }

    /**
     * 이미지 처리 통계 출력
     */
    printImageStats(imageData, imageMap) {
        const stats = this.generateOptimizedImageInfo(imageMap);
        
        console.log(chalk.cyan('\n📊 이미지 처리 통계:'));
        console.log(chalk.white(`   총 이미지: ${stats.totalImages}개`));
        console.log(chalk.green(`   성공: ${stats.successfulUploads}개`));
        console.log(chalk.red(`   실패: ${stats.failedUploads}개`));
        console.log(chalk.yellow(`   성공률: ${((stats.successfulUploads / stats.totalImages) * 100).toFixed(1)}%`));
    }
}

module.exports = ImageProcessor; 