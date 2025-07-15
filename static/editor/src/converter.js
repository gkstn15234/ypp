#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const WordPressParser = require('./parser');
const ImageProcessor = require('./imageProcessor');
const CloudflareImages = require('./cloudflareImages');
const HugoFormatter = require('./hugoFormatter');

class WordPressToHugoConverter {
    constructor() {
        this.parser = new WordPressParser();
        this.imageProcessor = new ImageProcessor();
        this.hugoFormatter = new HugoFormatter();
        this.cloudflareImages = null;
        
        this.config = {
            inputPath: './input',
            outputPath: './output',
            logPath: './logs',
            postsFile: '1.txt',
            attachmentsFile: '2.txt',
            batchSize: parseInt(process.env.BATCH_SIZE) || 3,
            isDryRun: false,
            isTestMode: false,
            uploadImages: false,
            resumeMode: false
        };
        
        this.stats = {
            totalPosts: 0,
            processedPosts: 0,
            successfulPosts: 0,
            failedPosts: 0,
            totalImages: 0,
            processedImages: 0,
            successfulImages: 0,
            failedImages: 0
        };
        
        this.startTime = Date.now();
    }

    /**
     * 메인 실행 함수
     */
    async main() {
        try {
            console.log(chalk.cyan('🚀 WordPress → Hugo 마이그레이션 시작...\n'));
            
            // 명령행 인수 처리
            this.parseArguments();
            
            // 환경 검증
            await this.validateEnvironment();
            
            // 디렉토리 생성
            await this.createDirectories();
            
            // 로그 파일 초기화
            await this.initializeLogging();
            
            // Cloudflare Images 초기화
            if (this.config.uploadImages) {
                this.initializeCloudflareImages();
            }
            
            // 1단계: XML 파일 파싱
            console.log(chalk.blue('📄 1단계: WordPress XML 파일 파싱'));
            const { posts, attachments } = await this.parseWordPressFiles();
            
            // 2단계: 이미지 추출 및 업로드
            console.log(chalk.blue('\n🖼️  2단계: 이미지 처리'));
            const imageMap = await this.processImages(posts, attachments);
            
            // 3단계: 게시물 변환 및 생성
            console.log(chalk.blue('\n📝 3단계: 게시물 변환'));
            await this.convertPosts(posts, imageMap);
            
            // 4단계: 결과 출력
            console.log(chalk.blue('\n📊 4단계: 결과 요약'));
            this.printFinalResults();
            
            console.log(chalk.green('\n✅ 마이그레이션이 성공적으로 완료되었습니다!'));
            
        } catch (error) {
            console.error(chalk.red(`\n❌ 마이그레이션 실패: ${error.message}`));
            console.error(chalk.red('스택 트레이스:'), error.stack);
            process.exit(1);
        }
    }

    /**
     * 명령행 인수 처리
     */
    parseArguments() {
        const args = process.argv.slice(2);
        
        this.config.isDryRun = args.includes('--dry-run');
        this.config.isTestMode = args.includes('--test');
        this.config.uploadImages = args.includes('--upload-images');
        this.config.resumeMode = args.includes('--resume');
        
        if (this.config.isDryRun) {
            console.log(chalk.yellow('⚠️  DRY RUN 모드: 실제 파일을 생성하지 않습니다.'));
        }
        
        if (this.config.isTestMode) {
            console.log(chalk.yellow('🧪 테스트 모드: 처음 5개 게시물만 처리합니다.'));
        }
        
        if (this.config.uploadImages) {
            console.log(chalk.blue('☁️  이미지 업로드 모드: Cloudflare Images에 업로드합니다.'));
        }
        
        if (this.config.resumeMode) {
            console.log(chalk.green('🔄 이어서 실행 모드: 기존 업로드된 이미지를 제외하고 이어서 진행합니다.'));
            this.config.uploadImages = true; // resume 모드에서는 자동으로 이미지 업로드 활성화
        }
    }

    /**
     * 환경 검증
     */
    async validateEnvironment() {
        // 필수 파일 확인
        const postsFilePath = path.join(this.config.inputPath, this.config.postsFile);
        const attachmentsFilePath = path.join(this.config.inputPath, this.config.attachmentsFile);
        
        if (!await fs.pathExists(postsFilePath)) {
            throw new Error(`게시물 파일을 찾을 수 없습니다: ${postsFilePath}`);
        }
        
        if (!await fs.pathExists(attachmentsFilePath)) {
            console.warn(chalk.yellow(`⚠️  첨부파일을 찾을 수 없습니다: ${attachmentsFilePath}`));
        }
        
        // Cloudflare 설정 확인
        if (this.config.uploadImages) {
            const requiredEnvVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_IMAGES_API_TOKEN', 'CLOUDFLARE_HASH'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                throw new Error(`Cloudflare 환경변수가 누락되었습니다: ${missingVars.join(', ')}`);
            }
        }
        
        console.log(chalk.green('✅ 환경 검증 완료'));
    }

    /**
     * 디렉토리 생성
     */
    async createDirectories() {
        const directories = [
            this.config.inputPath,
            this.config.outputPath,
            this.config.logPath,
            path.join(this.config.outputPath, 'content'),
            path.join(this.config.outputPath, 'content', 'posts'),
            path.join(this.config.outputPath, 'content', 'automotive'),
            path.join(this.config.outputPath, 'content', 'economy'),
            path.join(this.config.outputPath, 'content', 'entertainment')
        ];
        
        for (const dir of directories) {
            await fs.ensureDir(dir);
        }
        
        console.log(chalk.green('✅ 디렉토리 생성 완료'));
    }

    /**
     * 로그 초기화
     */
    async initializeLogging() {
        const logFile = path.join(this.config.logPath, `migration-${Date.now()}.log`);
        const logData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                cwd: process.cwd()
            }
        };
        
        await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
        console.log(chalk.gray(`📝 로그 파일: ${logFile}`));
    }

    /**
     * Cloudflare Images 초기화
     */
    initializeCloudflareImages() {
        this.cloudflareImages = new CloudflareImages(
            process.env.CLOUDFLARE_ACCOUNT_ID,
            process.env.CLOUDFLARE_IMAGES_API_TOKEN,
            process.env.CLOUDFLARE_HASH
        );
        
        console.log(chalk.green('✅ Cloudflare Images 초기화 완료'));
    }

    /**
     * WordPress 파일 파싱
     */
    async parseWordPressFiles() {
        const postsFilePath = path.join(this.config.inputPath, this.config.postsFile);
        const attachmentsFilePath = path.join(this.config.inputPath, this.config.attachmentsFile);
        
        // 게시물 파일 파싱
        const postsItems = await this.parser.parseWordPressXML(postsFilePath);
        const filteredPosts = this.parser.filterPosts(postsItems);
        
        // 첨부파일 파싱 (파일이 존재하는 경우)
        let attachments = [];
        if (await fs.pathExists(attachmentsFilePath)) {
            const attachmentsItems = await this.parser.parseWordPressXML(attachmentsFilePath);
            attachments = this.parser.filterAttachments(attachmentsItems);
        }
        
        // 게시물 메타데이터 추출
        const posts = filteredPosts.map(item => this.parser.extractPostMetadata(item));
        
        // 첨부파일 메타데이터 추출
        const attachmentMetadata = attachments.map(item => this.parser.extractAttachmentMetadata(item));
        
        // 테스트 모드인 경우 5개만 처리
        const finalPosts = this.config.isTestMode ? posts.slice(0, 5) : posts;
        
        this.stats.totalPosts = finalPosts.length;
        console.log(chalk.green(`✅ 파싱 완료: 게시물 ${finalPosts.length}개, 첨부파일 ${attachmentMetadata.length}개`));
        
        return { posts: finalPosts, attachments: attachmentMetadata };
    }

    /**
     * 이미지 처리
     */
    async processImages(posts, attachments) {
        const imageMap = new Map();
        
        if (!this.config.uploadImages) {
            console.log(chalk.yellow('⚠️  이미지 업로드 건너뜀 (--upload-images 옵션 없음)'));
            return imageMap;
        }
        
        // 모든 게시물에서 이미지 URL 추출
        const allImageUrls = new Set();
        
        posts.forEach(post => {
            const imageData = this.imageProcessor.extractImagesWithPosition(post.content);
            imageData.forEach(img => {
                if (img.originalUrl) {
                    allImageUrls.add(img.originalUrl);
                }
            });
        });
        
        // 첨부파일에서 이미지 URL 추가
        attachments.forEach(attachment => {
            if (attachment.url && this.imageProcessor.isExternalImage(attachment.url)) {
                allImageUrls.add(attachment.url);
            }
        });
        
        const imageUrls = Array.from(allImageUrls);
        this.stats.totalImages = imageUrls.length;
        
        if (imageUrls.length === 0) {
            console.log(chalk.yellow('⚠️  처리할 이미지가 없습니다.'));
            return imageMap;
        }
        
        // 배치 업로드 (resume 모드에서는 중복 체크 활성화)
        const uploadedImageMap = await this.cloudflareImages.batchUploadImages(
            imageUrls, 
            this.config.batchSize,
            this.config.resumeMode || true // resume 모드이거나 기본적으로 중복 체크 활성화
        );
        
        return uploadedImageMap;
    }

    /**
     * 게시물 변환
     */
    async convertPosts(posts, imageMap) {
        const results = [];
        
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            const progress = ((i + 1) / posts.length * 100).toFixed(1);
            
            console.log(chalk.blue(`📝 처리 중 (${progress}%): ${post.title}`));
            
            try {
                // 이미지 URL 교체
                let processedContent = post.content;
                if (imageMap.size > 0) {
                    processedContent = this.imageProcessor.replaceImageUrls(processedContent, imageMap);
                }
                
                // Hugo 형식으로 변환
                const convertedContent = this.hugoFormatter.convertToHugoMarkdown(processedContent);
                
                // 업데이트된 포스트 객체 생성
                const updatedPost = {
                    ...post,
                    content: convertedContent
                };
                
                // Front Matter 생성
                const frontMatter = this.hugoFormatter.generateHugoFrontMatter(updatedPost);
                
                // 파일명 생성
                const filename = this.hugoFormatter.generateFilename(updatedPost);
                
                // 최종 마크다운 콘텐츠
                const finalContent = `${frontMatter}\n\n${convertedContent}`;
                
                // 파일 저장
                if (!this.config.isDryRun) {
                    await this.saveMarkdownFile(finalContent, filename, updatedPost);
                }
                
                results.push({
                    status: 'success',
                    post: updatedPost,
                    filename: filename,
                    message: this.config.isDryRun ? 'DRY RUN 완료' : '변환 완료'
                });
                
                this.stats.successfulPosts++;
                
            } catch (error) {
                console.error(chalk.red(`❌ 변환 실패: ${post.title} - ${error.message}`));
                
                results.push({
                    status: 'error',
                    post: post,
                    error: error.message
                });
                
                this.stats.failedPosts++;
            }
            
            this.stats.processedPosts++;
        }
        
        // 변환 결과 저장
        if (!this.config.isDryRun) {
            await this.saveConversionResults(results);
        }
        
        return results;
    }

    /**
     * 마크다운 파일 저장
     */
    async saveMarkdownFile(content, filename, post) {
        // 모든 글을 entertainment 카테고리로 통일
        const categoryPath = 'entertainment';
        
        const filepath = path.join(this.config.outputPath, 'content', categoryPath, filename);
        await fs.writeFile(filepath, content, 'utf8');
        
        console.log(chalk.gray(`💾 저장: ${filepath}`));
    }

    /**
     * 변환 결과 저장
     */
    async saveConversionResults(results) {
        const resultFile = path.join(this.config.logPath, `conversion-results-${Date.now()}.json`);
        const resultData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            stats: this.stats,
            results: results
        };
        
        await fs.writeFile(resultFile, JSON.stringify(resultData, null, 2));
        console.log(chalk.gray(`📊 결과 저장: ${resultFile}`));
    }

    /**
     * 최종 결과 출력
     */
    printFinalResults() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
        const successRate = this.stats.totalPosts > 0 
            ? ((this.stats.successfulPosts / this.stats.totalPosts) * 100).toFixed(1)
            : 0;
        
        console.log(chalk.cyan('\n🎉 마이그레이션 완료 결과:'));
        console.log(chalk.white(`⏱️  소요 시간: ${duration}초`));
        console.log(chalk.white(`📝 총 게시물: ${this.stats.totalPosts}개`));
        console.log(chalk.green(`✅ 성공: ${this.stats.successfulPosts}개`));
        console.log(chalk.red(`❌ 실패: ${this.stats.failedPosts}개`));
        console.log(chalk.cyan(`📊 성공률: ${successRate}%`));
        
        if (this.config.uploadImages) {
            console.log(chalk.white(`🖼️  총 이미지: ${this.stats.totalImages}개`));
            console.log(chalk.green(`☁️  업로드 성공: ${this.cloudflareImages.uploadStats.success}개`));
            console.log(chalk.red(`💥 업로드 실패: ${this.cloudflareImages.uploadStats.failed}개`));
        }
        
        console.log(chalk.cyan('\n📁 생성된 파일:'));
        console.log(chalk.white(`   ${path.resolve(this.config.outputPath)}/content/`));
        console.log(chalk.white(`   ├── automotive/ (자동차 카테고리)`));
        console.log(chalk.white(`   ├── economy/ (경제 카테고리)`));
        console.log(chalk.white(`   ├── entertainment/ (엔터테인먼트 카테고리)`));
        console.log(chalk.white(`   └── posts/ (기타 카테고리)`));
        
        if (this.config.isDryRun) {
            console.log(chalk.yellow('\n⚠️  DRY RUN 모드였습니다. 실제 파일은 생성되지 않았습니다.'));
        } else {
            console.log(chalk.green('\n✅ 파일이 성공적으로 생성되었습니다!'));
            console.log(chalk.white('   다음 단계: Hugo 프로젝트에 복사하여 사용하세요.'));
        }
    }
}

// 메인 실행
if (require.main === module) {
    const converter = new WordPressToHugoConverter();
    converter.main().catch(error => {
        console.error(chalk.red('치명적 오류:'), error);
        process.exit(1);
    });
}

module.exports = WordPressToHugoConverter; 