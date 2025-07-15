// 이미지 처리 유틸리티

class ImageUtils {
    constructor() {
        this.maxWidth = 1200;
        this.maxHeight = 675;
        this.quality = 0.8;
    }

    // 이미지 리사이즈
    resizeImage(file, maxWidth = this.maxWidth, maxHeight = this.maxHeight, quality = this.quality) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const { width, height } = this.calculateNewDimensions(img.width, img.height, maxWidth, maxHeight);
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 새로운 이미지 크기 계산
    calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }

    // 이미지 형식 변환
    convertImageFormat(file, format = 'jpeg', quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                if (format === 'jpeg') {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, `image/${format}`, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 메타데이터 추출
    extractMetadata(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const metadata = {
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    type: file.type,
                    name: file.name,
                    lastModified: file.lastModified,
                    aspectRatio: (img.width / img.height).toFixed(2)
                };
                resolve(metadata);
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 압축
    compressImage(file, compressionLevel = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', compressionLevel);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 필터 적용
    applyFilter(file, filterType = 'none') {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                switch (filterType) {
                    case 'grayscale':
                        ctx.filter = 'grayscale(100%)';
                        break;
                    case 'sepia':
                        ctx.filter = 'sepia(100%)';
                        break;
                    case 'blur':
                        ctx.filter = 'blur(2px)';
                        break;
                    case 'brightness':
                        ctx.filter = 'brightness(120%)';
                        break;
                    case 'contrast':
                        ctx.filter = 'contrast(120%)';
                        break;
                    case 'saturate':
                        ctx.filter = 'saturate(150%)';
                        break;
                    default:
                        ctx.filter = 'none';
                }
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 크롭
    cropImage(file, cropData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = cropData.width;
                canvas.height = cropData.height;
                
                ctx.drawImage(
                    img,
                    cropData.x,
                    cropData.y,
                    cropData.width,
                    cropData.height,
                    0,
                    0,
                    cropData.width,
                    cropData.height
                );
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 회전
    rotateImage(file, angle) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const radians = (angle * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                
                canvas.width = Math.abs(img.width * cos) + Math.abs(img.height * sin);
                canvas.height = Math.abs(img.width * sin) + Math.abs(img.height * cos);
                
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(radians);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Base64로 변환
    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    // 이미지 URL 생성
    createImageURL(file) {
        return URL.createObjectURL(file);
    }

    // 이미지 URL 해제
    revokeImageURL(url) {
        URL.revokeObjectURL(url);
    }

    // 이미지 유효성 검사
    validateImage(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        const errors = [];
        
        if (!validTypes.includes(file.type)) {
            errors.push('지원되지 않는 이미지 형식입니다.');
        }
        
        if (file.size > maxSize) {
            errors.push('이미지 크기가 10MB를 초과합니다.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 이미지 로드 상태 확인
    isImageLoaded(img) {
        return img.complete && img.naturalWidth !== 0;
    }

    // 이미지 프리로드
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
}

// 이미지 갤러리 관리자
class ImageGallery {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
    }

    // 이미지 추가
    addImage(file, metadata = {}) {
        const imageData = {
            id: Date.now().toString(),
            file: file,
            url: URL.createObjectURL(file),
            metadata: metadata,
            createdAt: new Date().toISOString()
        };
        
        this.images.push(imageData);
        return imageData;
    }

    // 이미지 제거
    removeImage(id) {
        const index = this.images.findIndex(img => img.id === id);
        if (index !== -1) {
            URL.revokeObjectURL(this.images[index].url);
            this.images.splice(index, 1);
            return true;
        }
        return false;
    }

    // 이미지 가져오기
    getImage(id) {
        return this.images.find(img => img.id === id);
    }

    // 모든 이미지 가져오기
    getAllImages() {
        return this.images;
    }

    // 갤러리 초기화
    clear() {
        this.images.forEach(img => URL.revokeObjectURL(img.url));
        this.images = [];
        this.currentIndex = 0;
    }

    // 이미지 개수
    count() {
        return this.images.length;
    }

    // 다음 이미지
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        return this.images[this.currentIndex];
    }

    // 이전 이미지
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        return this.images[this.currentIndex];
    }

    // 현재 이미지
    current() {
        return this.images[this.currentIndex];
    }
}

// 전역 인스턴스 생성
const imageUtils = new ImageUtils();
const imageGallery = new ImageGallery();

// 전역 함수로 내보내기
window.imageUtils = imageUtils;
window.imageGallery = imageGallery; 