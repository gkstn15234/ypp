const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class CloudflareImages {
    constructor(accountId, apiToken, hash) {
        this.accountId = accountId;
        this.apiToken = apiToken;
        this.hash = hash;
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
        this.deliveryUrl = `https://imagedelivery.net/${hash}`;
        this.retryCount = 0;
        this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
        this.uploadStats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0
        };
    }

    /**
     * 이미지 다운로드
     */
    async downloadImage(imageUrl, timeout = 30000) {
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'stream',
                timeout: timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 스트림을 버퍼로 변환
            const chunks = [];
            return new Promise((resolve, reject) => {
                response.data.on('data', chunk => chunks.push(chunk));
                response.data.on('end', () => resolve(Buffer.concat(chunks)));
                response.data.on('error', reject);
            });

        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`이미지 다운로드 타임아웃: ${imageUrl}`);
            }
            throw new Error(`이미지 다운로드 실패: ${error.message}`);
        }
    }

    /**
     * Cloudflare Images에 업로드
     */
    async uploadToCloudflare(imageBuffer, filename, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', imageBuffer, {
                filename: this.sanitizeFilename(filename),
                contentType: this.getMimeType(filename)
            });

            // 메타데이터 추가
            if (metadata.alt) {
                formData.append('metadata', JSON.stringify({
                    alt: metadata.alt,
                    title: metadata.title || '',
                    caption: metadata.caption || ''
                }));
            }

            const response = await axios.post(this.baseUrl, formData, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    ...formData.getHeaders()
                },
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (response.data.success) {
                const imageId = response.data.result.id;
                const publicUrl = `${this.deliveryUrl}/${imageId}/public`;
                
                console.log(chalk.green(`✅ 업로드 성공: ${filename}`));
                this.uploadStats.success++;
                
                return {
                    success: true,
                    url: publicUrl,
                    id: imageId,
                    filename: filename,
                    size: imageBuffer.length,
                    variants: response.data.result.variants
                };
            } else {
                throw new Error(response.data.errors?.[0]?.message || 'Unknown error');
            }

        } catch (error) {
            console.error(chalk.red(`❌ 업로드 실패: ${filename} - ${error.message}`));
            this.uploadStats.failed++;
            
            if (error.response?.status === 429) {
                throw new Error('API 제한 초과. 잠시 후 다시 시도해주세요.');
            }
            
            throw error;
        }
    }

    /**
     * 단일 이미지 처리 (재시도 포함)
     */
    async processImage(imageUrl, filename, metadata = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // 이미지 다운로드
                const imageBuffer = await this.downloadImage(imageUrl);
                
                // 파일 크기 검증 (5MB 제한)
                if (imageBuffer.length > 5 * 1024 * 1024) {
                    console.warn(chalk.yellow(`⚠️  파일 크기 초과 (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB): ${filename}`));
                    this.uploadStats.skipped++;
                    return { success: false, url: imageUrl, reason: 'File too large' };
                }

                // Cloudflare Images 업로드
                const result = await this.uploadToCloudflare(imageBuffer, filename, metadata);
                return result;

            } catch (error) {
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 지수 백오프
                    console.log(chalk.yellow(`⏳ 재시도 ${attempt}/${this.maxRetries} (${delay}ms 후): ${filename}`));
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(chalk.red(`❌ 최종 실패: ${filename}`));
                    this.uploadStats.failed++;
                }
            }
        }

        return { success: false, url: imageUrl, error: lastError.message };
    }

    /**
     * 배치 이미지 업로드 (중복 제거 포함)
     */
    async batchUploadImages(imageUrls, batchSize = 3, skipDuplicates = true) {
        const imageMap = new Map();
        let processUrls = imageUrls;
        
        // 중복 제거 옵션이 활성화된 경우 기존 업로드된 이미지 제외
        if (skipDuplicates) {
            processUrls = await this.filterNewImages(imageUrls);
        }
        
        const total = processUrls.length;
        this.uploadStats.total = total;
        
        if (total === 0) {
            console.log(chalk.yellow('⚠️  업로드할 새로운 이미지가 없습니다.'));
            return imageMap;
        }
        
        console.log(chalk.cyan(`🚀 이미지 업로드 시작: ${total}개`));
        
        for (let i = 0; i < total; i += batchSize) {
            const batch = processUrls.slice(i, i + batchSize);
            const batchPromises = batch.map(async (imageUrl) => {
                const filename = this.extractFilename(imageUrl);
                return {
                    url: imageUrl,
                    result: await this.processImage(imageUrl, filename)
                };
            });

            // 배치 처리
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(({ status, value }) => {
                if (status === 'fulfilled') {
                    const { url, result } = value;
                    imageMap.set(url, result.success ? result.url : url);
                } else {
                    console.error(chalk.red(`❌ 배치 처리 실패: ${status}`));
                }
            });

            // 진행률 출력
            const processed = Math.min(i + batchSize, total);
            const progress = ((processed / total) * 100).toFixed(1);
            console.log(chalk.blue(`📊 진행률: ${processed}/${total} (${progress}%)`));

            // API 제한 방지를 위한 지연
            if (i + batchSize < total) {
                const delay = parseInt(process.env.DELAY_BETWEEN_BATCHES) || 2000;
                console.log(chalk.gray(`⏳ ${delay}ms 대기 중...`));
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        this.printUploadStats();
        return imageMap;
    }

    /**
     * 파일명 정리
     */
    sanitizeFilename(filename) {
        if (!filename) return `image-${Date.now()}.jpg`;
        
        // 한글 URL 디코딩
        try {
            filename = decodeURIComponent(filename);
        } catch (e) {
            // 디코딩 실패 시 원본 사용
        }
        
        // 파일명 정리
        return filename
            .replace(/[^a-zA-Z0-9가-힣._-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100);
    }

    /**
     * URL에서 파일명 추출
     */
    extractFilename(url) {
        if (!url) return `image-${Date.now()}.jpg`;
        
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            return filename || `image-${Date.now()}.jpg`;
        } catch (e) {
            return url.split('/').pop() || `image-${Date.now()}.jpg`;
        }
    }

    /**
     * MIME 타입 추출
     */
    getMimeType(filename) {
        const extension = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.bmp': 'image/bmp'
        };
        
        return mimeTypes[extension] || 'image/jpeg';
    }

    /**
     * 업로드 통계 출력
     */
    printUploadStats() {
        console.log(chalk.cyan('\n📊 업로드 통계:'));
        console.log(chalk.white(`   총 이미지: ${this.uploadStats.total}개`));
        console.log(chalk.green(`   성공: ${this.uploadStats.success}개`));
        console.log(chalk.red(`   실패: ${this.uploadStats.failed}개`));
        console.log(chalk.yellow(`   건너뜀: ${this.uploadStats.skipped}개`));
        
        const successRate = this.uploadStats.total > 0 
            ? ((this.uploadStats.success / this.uploadStats.total) * 100).toFixed(1)
            : 0;
        console.log(chalk.cyan(`   성공률: ${successRate}%`));
    }

    /**
     * 이미지 메타데이터 확인
     */
    async getImageInfo(imageId) {
        try {
            const response = await axios.get(`${this.baseUrl}/${imageId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            return response.data.result;
        } catch (error) {
            console.error(chalk.red(`❌ 이미지 정보 조회 실패: ${imageId}`));
            return null;
        }
    }

    /**
     * 기존 업로드된 이미지 목록 가져오기
     */
    async getUploadedImages() {
        try {
            const uploadedImages = new Set();
            let page = 1;
            let hasMore = true;
            
            console.log(chalk.cyan('📋 기존 업로드된 이미지 목록 확인 중...'));
            
            while (hasMore) {
                const response = await axios.get(`${this.baseUrl}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`
                    },
                    params: {
                        page: page,
                        per_page: 100
                    }
                });

                const images = response.data.result.images || [];
                
                images.forEach(image => {
                    if (image.filename) {
                        uploadedImages.add(image.filename);
                    }
                });

                console.log(chalk.blue(`📄 페이지 ${page}: ${images.length}개 이미지 확인`));
                
                hasMore = images.length === 100;
                page++;
            }

            console.log(chalk.green(`✅ 총 ${uploadedImages.size}개의 업로드된 이미지 확인 완료`));
            return uploadedImages;
        } catch (error) {
            console.error(chalk.red(`❌ 업로드된 이미지 목록 조회 실패: ${error.message}`));
            return new Set();
        }
    }

    /**
     * 중복 제거된 이미지 목록 필터링
     */
    async filterNewImages(imageUrls) {
        const uploadedImages = await this.getUploadedImages();
        const newImages = [];
        
        for (const imageUrl of imageUrls) {
            const filename = this.extractFilename(imageUrl);
            
            if (!uploadedImages.has(filename)) {
                newImages.push(imageUrl);
            } else {
                console.log(chalk.yellow(`⏭️  이미 업로드됨: ${filename}`));
                this.uploadStats.skipped++;
            }
        }
        
        console.log(chalk.cyan(`🔍 필터링 결과: ${newImages.length}개의 새로운 이미지 발견`));
        return newImages;
    }

    /**
     * 이미지 삭제
     */
    async deleteImage(imageId) {
        try {
            await axios.delete(`${this.baseUrl}/${imageId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            console.log(chalk.green(`✅ 이미지 삭제 성공: ${imageId}`));
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ 이미지 삭제 실패: ${imageId}`));
            return false;
        }
    }
}

module.exports = CloudflareImages; 