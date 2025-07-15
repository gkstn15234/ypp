require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const WordPressToHugoConverter = require('./src/converter.js');

class BatchImageUploader {
    constructor() {
        this.converter = new WordPressToHugoConverter();
        this.batchSize = 100;
        this.delayBetweenBatches = 5 * 60 * 1000; // 5분
        this.maxRetries = 3;
        this.currentBatch = 0;
        this.processedImages = new Set();
    }

    async initialize() {
        // 환경 변수 확인
        if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
            throw new Error('Cloudflare 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
        }

        // 컨버터 초기화
        await this.converter.createDirectories();
        await this.converter.initializeLogging();
        this.converter.initializeCloudflareImages();
    }

    async getAllImageUrls() {
        console.log(chalk.blue('📄 WordPress 파일 파싱 중...'));
        const { posts, attachments } = await this.converter.parseWordPressFiles();
        
        console.log(chalk.blue('🔍 이미지 URL 추출 중...'));
        const allImageUrls = new Set();
        
        // 게시물에서 이미지 추출
        posts.forEach(post => {
            const imageData = this.converter.imageProcessor.extractImagesWithPosition(post.content);
            imageData.forEach(img => allImageUrls.add(img.originalUrl));
        });

        // 첨부파일에서 이미지 추출
        attachments.forEach(attachment => {
            if (attachment.url) {
                allImageUrls.add(attachment.url);
            }
        });

        return Array.from(allImageUrls);
    }

    async getUploadedImages() {
        console.log(chalk.blue('☁️  기존 업로드된 이미지 확인 중...'));
        try {
            const uploadedImages = await this.converter.cloudflareImages.getUploadedImages();
            return new Set(uploadedImages);
        } catch (error) {
            console.warn(chalk.yellow('⚠️  업로드된 이미지 목록 가져오기 실패:', error.message));
            return new Set();
        }
    }

    async filterNewImages(imageUrls) {
        const uploadedImages = await this.getUploadedImages();
        const newImages = imageUrls.filter(url => {
            const filename = this.converter.cloudflareImages.extractFilename(url);
            return !uploadedImages.has(filename);
        });
        
        console.log(chalk.cyan(`📊 총 이미지: ${imageUrls.length}개`));
        console.log(chalk.cyan(`☁️  업로드 완료: ${uploadedImages.size}개`));
        console.log(chalk.cyan(`🆕 새로운 이미지: ${newImages.length}개`));
        
        return newImages;
    }

    async processBatch(imageUrls, batchNumber) {
        console.log(chalk.blue(`\n🚀 배치 ${batchNumber} 시작 (${imageUrls.length}개 이미지)`));
        console.log(chalk.gray(`시작 시간: ${new Date().toLocaleTimeString()}`));
        
        const startTime = Date.now();
        
        try {
            const uploadedImageMap = await this.converter.cloudflareImages.batchUploadImages(
                imageUrls,
                5, // 내부 배치 크기를 5로 설정 (안전성 확보)
                true // 중복 체크 활성화
            );
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log(chalk.green(`✅ 배치 ${batchNumber} 완료!`));
            console.log(chalk.gray(`소요 시간: ${duration.toFixed(1)}초`));
            console.log(chalk.gray(`성공: ${this.converter.cloudflareImages.uploadStats.success}개`));
            console.log(chalk.gray(`실패: ${this.converter.cloudflareImages.uploadStats.failed}개`));
            
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ 배치 ${batchNumber} 실패:`, error.message));
            return false;
        }
    }

    async waitForNextBatch() {
        console.log(chalk.yellow(`\n⏳ 다음 배치까지 ${this.delayBetweenBatches / 1000}초 대기 중...`));
        console.log(chalk.yellow(`다음 시작 시간: ${new Date(Date.now() + this.delayBetweenBatches).toLocaleTimeString()}`));
        
        // 진행 상황 표시
        const totalSeconds = this.delayBetweenBatches / 1000;
        const intervalSeconds = 30; // 30초마다 업데이트
        
        for (let i = 0; i < totalSeconds; i += intervalSeconds) {
            const remaining = totalSeconds - i;
            if (remaining > 0) {
                console.log(chalk.gray(`   남은 시간: ${remaining}초`));
                await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
            }
        }
    }

    async saveBatchLog(batchNumber, imageUrls, success) {
        const logData = {
            batchNumber,
            timestamp: new Date().toISOString(),
            imageCount: imageUrls.length,
            success,
            uploadStats: this.converter.cloudflareImages.uploadStats
        };
        
        const logPath = path.join(this.converter.config.logPath, `batch-${batchNumber}-${Date.now()}.json`);
        await fs.writeJson(logPath, logData, { spaces: 2 });
    }

    async main() {
        try {
            console.log(chalk.blue('🎬 배치 이미지 업로드 시작'));
            
            // 초기화
            await this.initialize();
            
            // 모든 이미지 URL 가져오기
            const allImageUrls = await this.getAllImageUrls();
            
            // 새로운 이미지만 필터링
            const newImageUrls = await this.filterNewImages(allImageUrls);
            
            if (newImageUrls.length === 0) {
                console.log(chalk.yellow('🎉 모든 이미지가 이미 업로드되었습니다!'));
                return;
            }
            
            // 배치로 나누기
            const totalBatches = Math.ceil(newImageUrls.length / this.batchSize);
            console.log(chalk.blue(`📦 총 ${totalBatches}개 배치로 나누어 처리합니다.`));
            
            for (let i = 0; i < totalBatches; i++) {
                const startIndex = i * this.batchSize;
                const endIndex = Math.min(startIndex + this.batchSize, newImageUrls.length);
                const batchUrls = newImageUrls.slice(startIndex, endIndex);
                
                const batchNumber = i + 1;
                console.log(chalk.cyan(`\n📋 배치 ${batchNumber}/${totalBatches} 준비 중...`));
                
                let success = false;
                let retryCount = 0;
                
                // 재시도 로직
                while (!success && retryCount < this.maxRetries) {
                    if (retryCount > 0) {
                        console.log(chalk.yellow(`🔄 재시도 ${retryCount}/${this.maxRetries}`));
                    }
                    
                    success = await this.processBatch(batchUrls, batchNumber);
                    
                    if (!success) {
                        retryCount++;
                        if (retryCount < this.maxRetries) {
                            console.log(chalk.yellow(`⏳ 재시도 전 1분 대기...`));
                            await new Promise(resolve => setTimeout(resolve, 60000));
                        }
                    }
                }
                
                // 배치 로그 저장
                await this.saveBatchLog(batchNumber, batchUrls, success);
                
                if (!success) {
                    console.error(chalk.red(`❌ 배치 ${batchNumber} 최종 실패`));
                    // 실패해도 다음 배치 진행
                }
                
                // 마지막 배치가 아니면 대기
                if (i < totalBatches - 1) {
                    await this.waitForNextBatch();
                }
            }
            
            console.log(chalk.green('\n🎉 배치 이미지 업로드 완료!'));
            
        } catch (error) {
            console.error(chalk.red('❌ 배치 업로드 실패:'), error);
            process.exit(1);
        }
    }
}

// 메인 실행
if (require.main === module) {
    const uploader = new BatchImageUploader();
    uploader.main().catch(error => {
        console.error(chalk.red('치명적 오류:'), error);
        process.exit(1);
    });
}

module.exports = BatchImageUploader; 