/**
 * 로컬 이미지 업로드 관리 클래스
 */
class LocalImageUploader {
    constructor() {
        this.uploadedImages = [];
        this.currentSlug = '';
    }

    /**
     * 이미지를 로컬 static/images 폴더에 저장
     * @param {File} file - 업로드할 이미지 파일
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스 (1-4)
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<string>} 저장된 이미지 경로
     */
    async uploadLocalImage(file, slug, index, onProgress = null) {
        return new Promise((resolve, reject) => {
            try {
                if (onProgress) onProgress(10);

                // 파일 검증
                const validation = this.validateImageFile(file);
                if (!validation.isValid) {
                    reject(new Error(validation.errors.join('\n')));
                    return;
                }

                if (onProgress) onProgress(30);

                // FileReader로 이미지 읽기
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        if (onProgress) onProgress(70);

                        // 이미지 최적화 및 저장
                        this.processAndSaveImage(e.target.result, file.type, slug, index)
                            .then(imagePath => {
                                if (onProgress) onProgress(100);
                                resolve(imagePath);
                            })
                            .catch(reject);
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    reject(new Error('파일 읽기 실패'));
                };

                reader.readAsDataURL(file);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 이미지 파일 유효성 검사
     * @param {File} file - 검사할 파일
     * @returns {Object} 검사 결과
     */
    validateImageFile(file) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!file) {
            result.isValid = false;
            result.errors.push('파일이 선택되지 않았습니다.');
            return result;
        }

        // 이미지 파일 확인
        if (!file.type.startsWith('image/')) {
            result.isValid = false;
            result.errors.push('이미지 파일만 업로드 가능합니다.');
        }

        // 파일 크기 확인 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            result.isValid = false;
            result.errors.push('파일 크기는 5MB를 초과할 수 없습니다.');
        }

        // 지원되는 형식 확인
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            result.isValid = false;
            result.errors.push('지원되는 형식: JPEG, PNG, GIF, WebP');
        }

        return result;
    }

    /**
     * 이미지 처리 및 저장 (구글 디스커버 최적화)
     * @param {string} dataUrl - 이미지 데이터 URL
     * @param {string} mimeType - MIME 타입
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스
     * @returns {Promise<string>} 저장된 이미지 경로
     */
    async processAndSaveImage(dataUrl, mimeType, slug, index) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // 구글 디스커버 권장 크기: 1200x675 (16:9 비율)
                    const targetWidth = 1200;
                    const targetHeight = 675;

                    // 캔버스 크기 설정
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    // 이미지 크기 계산 (비율 유지하며 크롭)
                    const { drawX, drawY, drawWidth, drawHeight } = this.calculateCropDimensions(
                        img.width, img.height, targetWidth, targetHeight
                    );

                    // 배경을 흰색으로 설정 (투명 배경 방지)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);

                    // 이미지 그리기 (크롭 및 리사이즈)
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);

                    // 품질 최적화하여 JPEG로 변환
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    
                    // 로컬 저장소에 저장 (실제 파일 시스템 저장 시뮬레이션)
                    const imagePath = `/images/${slug}-${index}.jpg`;
                    
                    // localStorage에 이미지 데이터 저장 (실제 구현에서는 서버 업로드)
                    this.saveToLocalStorage(slug, index, optimizedDataUrl);
                    
                    // 업로드된 이미지 목록에 추가
                    this.uploadedImages.push({
                        slug: slug,
                        index: index,
                        path: imagePath,
                        dataUrl: optimizedDataUrl,
                        originalSize: this.getDataUrlSize(dataUrl),
                        optimizedSize: this.getDataUrlSize(optimizedDataUrl)
                    });

                    resolve(imagePath);

                } catch (error) {
                    reject(new Error(`이미지 처리 실패: ${error.message}`));
                }
            };

            img.onerror = () => {
                reject(new Error('이미지 로드 실패'));
            };

            img.src = dataUrl;
        });
    }

    /**
     * 크롭 치수 계산 (중앙 정렬)
     * @param {number} imgWidth - 원본 이미지 너비
     * @param {number} imgHeight - 원본 이미지 높이
     * @param {number} targetWidth - 목표 너비
     * @param {number} targetHeight - 목표 높이
     * @returns {Object} 그리기 좌표 및 크기
     */
    calculateCropDimensions(imgWidth, imgHeight, targetWidth, targetHeight) {
        const targetRatio = targetWidth / targetHeight;
        const imgRatio = imgWidth / imgHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgRatio > targetRatio) {
            // 이미지가 더 넓은 경우 - 좌우 크롭
            drawHeight = imgHeight;
            drawWidth = imgHeight * targetRatio;
            drawX = (imgWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            // 이미지가 더 높은 경우 - 상하 크롭
            drawWidth = imgWidth;
            drawHeight = imgWidth / targetRatio;
            drawX = 0;
            drawY = (imgHeight - drawHeight) / 2;
        }

        return { drawX, drawY, drawWidth, drawHeight };
    }

    /**
     * Data URL 크기 계산
     * @param {string} dataUrl - Data URL
     * @returns {number} 바이트 크기
     */
    getDataUrlSize(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        return Math.round(base64.length * 0.75);
    }

    /**
     * localStorage에 이미지 저장
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스
     * @param {string} dataUrl - 이미지 데이터
     */
    saveToLocalStorage(slug, index, dataUrl) {
        const key = `article_image_${slug}_${index}`;
        try {
            localStorage.setItem(key, dataUrl);
        } catch (error) {
            console.warn('localStorage 저장 실패:', error);
            // localStorage 용량 부족시 경고
            if (error.name === 'QuotaExceededError') {
                throw new Error('저장소 용량이 부족합니다. 기존 이미지를 삭제해주세요.');
            }
        }
    }

    /**
     * localStorage에서 이미지 불러오기
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스
     * @returns {string|null} 이미지 데이터 URL
     */
    loadFromLocalStorage(slug, index) {
        const key = `article_image_${slug}_${index}`;
        return localStorage.getItem(key);
    }

    /**
     * 기사의 모든 이미지 생성
     * @param {FileList} files - 업로드할 파일들 (최대 4개)
     * @param {string} slug - 기사 슬러그
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Array>} 업로드된 이미지 경로들
     */
    async uploadMultipleImages(files, slug, onProgress = null) {
        if (files.length > 4) {
            throw new Error('최대 4개의 이미지까지만 업로드 가능합니다.');
        }

        const uploadPromises = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageIndex = i + 1;

            const uploadPromise = this.uploadLocalImage(file, slug, imageIndex, (progress) => {
                if (onProgress) {
                    const totalProgress = ((i * 100) + progress) / totalFiles;
                    onProgress(Math.round(totalProgress));
                }
            });

            uploadPromises.push(uploadPromise);
        }

        try {
            const imagePaths = await Promise.all(uploadPromises);
            return imagePaths;
        } catch (error) {
            throw new Error(`다중 이미지 업로드 실패: ${error.message}`);
        }
    }

    /**
     * 업로드된 이미지 미리보기 생성
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스
     * @returns {string|null} 미리보기 이미지 URL
     */
    getImagePreview(slug, index) {
        return this.loadFromLocalStorage(slug, index);
    }

    /**
     * 기사의 모든 이미지 삭제
     * @param {string} slug - 기사 슬러그
     */
    clearArticleImages(slug) {
        for (let i = 1; i <= 4; i++) {
            const key = `article_image_${slug}_${i}`;
            localStorage.removeItem(key);
        }

        // 업로드된 이미지 목록에서 제거
        this.uploadedImages = this.uploadedImages.filter(img => img.slug !== slug);
    }

    /**
     * 저장된 모든 이미지 목록 조회
     * @returns {Array} 이미지 목록
     */
    getAllImages() {
        const images = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('article_image_')) {
                const [, , slug, index] = key.split('_');
                const dataUrl = localStorage.getItem(key);
                images.push({
                    slug,
                    index: parseInt(index),
                    path: `/images/${slug}-${index}.jpg`,
                    dataUrl,
                    size: this.getDataUrlSize(dataUrl)
                });
            }
        }
        return images.sort((a, b) => a.slug.localeCompare(b.slug) || a.index - b.index);
    }

    /**
     * 저장소 사용량 조회
     * @returns {Object} 저장소 정보
     */
    getStorageInfo() {
        const images = this.getAllImages();
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        const imageCount = images.length;

        // localStorage 최대 용량 (보통 5-10MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        const usagePercent = (totalSize / maxSize) * 100;

        return {
            imageCount,
            totalSize,
            maxSize,
            usagePercent: Math.round(usagePercent * 100) / 100,
            formattedSize: this.formatFileSize(totalSize),
            formattedMaxSize: this.formatFileSize(maxSize)
        };
    }

    /**
     * 파일 크기 포맷팅
     * @param {number} bytes - 바이트 크기
     * @returns {string} 포맷된 크기
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 실제 파일 다운로드 생성 (개발용)
     * @param {string} slug - 기사 슬러그
     * @param {number} index - 이미지 인덱스
     */
    downloadImage(slug, index) {
        const dataUrl = this.loadFromLocalStorage(slug, index);
        if (!dataUrl) {
            throw new Error('이미지를 찾을 수 없습니다.');
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${slug}-${index}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 인스턴스 생성
window.localImageUploader = new LocalImageUploader(); 