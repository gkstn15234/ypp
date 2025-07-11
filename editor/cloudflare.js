/**
 * Cloudflare Images API 관리 클래스
 */
class CloudflareImages {
    constructor() {
        // Cloudflare 설정 (실제 사용시 환경변수나 설정 파일에서 가져와야 함)
        this.accountId = ''; // Cloudflare Account ID를 입력하세요
        this.apiToken = '';  // Cloudflare Images API Token을 입력하세요
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
        this.deliveryUrl = 'https://imagedelivery.net'; // Custom domain이 있다면 변경
    }

    /**
     * 설정 정보 업데이트
     * @param {string} accountId - Cloudflare Account ID
     * @param {string} apiToken - Cloudflare API Token
     * @param {string} customDomain - 커스텀 도메인 (선택사항)
     */
    configure(accountId, apiToken, customDomain = null) {
        this.accountId = accountId;
        this.apiToken = apiToken;
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
        
        if (customDomain) {
            this.deliveryUrl = customDomain;
        }
    }

    /**
     * 이미지 파일을 Cloudflare Images에 업로드
     * @param {File} file - 업로드할 이미지 파일
     * @param {Function} onProgress - 진행률 콜백 함수
     * @returns {Promise<Object>} 업로드 결과
     */
    async uploadImage(file, onProgress = null) {
        if (!this.accountId || !this.apiToken) {
            throw new Error('Cloudflare 설정이 필요합니다. configure() 메소드를 호출하세요.');
        }

        // 파일 검증
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('유효한 이미지 파일을 선택해주세요.');
        }

        // 파일 크기 검증 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // XMLHttpRequest를 사용하여 진행률 추적
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // 진행률 추적
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percentComplete = (e.loaded / e.total) * 100;
                            onProgress(percentComplete);
                        }
                    });
                }

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                resolve(this.formatResponse(response.result));
                            } else {
                                reject(new Error(response.errors?.[0]?.message || '업로드 실패'));
                            }
                        } catch (e) {
                            reject(new Error('응답 파싱 실패'));
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: 업로드 실패`));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('네트워크 오류'));
                };

                xhr.open('POST', this.baseUrl);
                xhr.setRequestHeader('Authorization', `Bearer ${this.apiToken}`);
                xhr.send(formData);
            });

        } catch (error) {
            throw new Error(`업로드 실패: ${error.message}`);
        }
    }

    /**
     * 응답 데이터를 포맷팅하여 사용하기 쉬운 형태로 변환
     * @param {Object} result - Cloudflare API 응답
     * @returns {Object} 포맷팅된 응답
     */
    formatResponse(result) {
        const baseUrl = `${this.deliveryUrl}/${this.accountId}/${result.id}`;
        
        return {
            id: result.id,
            filename: result.filename,
            uploaded: result.uploaded,
            baseUrl: baseUrl,
            variants: {
                original: baseUrl,
                thumbnail: `${baseUrl}/w=300,h=200,fit=cover`,
                mobile: `${baseUrl}/w=800,h=600,fit=cover,f=webp`,
                desktop: `${baseUrl}/w=1200,h=800,fit=cover,f=webp`,
                hero: `${baseUrl}/w=1600,h=900,fit=cover,f=webp`
            },
            // Hugo에서 사용할 URL (기본)
            hugoUrl: baseUrl
        };
    }

    /**
     * 특정 크기와 포맷으로 이미지 URL 생성
     * @param {string} baseUrl - 기본 이미지 URL
     * @param {Object} options - 이미지 변환 옵션
     * @returns {string} 변환된 이미지 URL
     */
    getVariantUrl(baseUrl, options = {}) {
        const params = [];
        
        if (options.width) params.push(`w=${options.width}`);
        if (options.height) params.push(`h=${options.height}`);
        if (options.fit) params.push(`fit=${options.fit}`);
        if (options.format) params.push(`f=${options.format}`);
        if (options.quality) params.push(`q=${options.quality}`);
        
        return params.length > 0 ? `${baseUrl}/${params.join(',')}` : baseUrl;
    }

    /**
     * 이미지 목록 조회
     * @param {number} page - 페이지 번호
     * @param {number} perPage - 페이지당 항목 수
     * @returns {Promise<Object>} 이미지 목록
     */
    async listImages(page = 1, perPage = 50) {
        if (!this.accountId || !this.apiToken) {
            throw new Error('Cloudflare 설정이 필요합니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}?page=${page}&per_page=${perPage}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return {
                    images: data.result.images.map(img => this.formatResponse(img)),
                    total: data.result_info?.total_count || 0,
                    page: page,
                    perPage: perPage
                };
            } else {
                throw new Error(data.errors?.[0]?.message || '목록 조회 실패');
            }
        } catch (error) {
            throw new Error(`목록 조회 실패: ${error.message}`);
        }
    }

    /**
     * 이미지 삭제
     * @param {string} imageId - 삭제할 이미지 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async deleteImage(imageId) {
        if (!this.accountId || !this.apiToken) {
            throw new Error('Cloudflare 설정이 필요합니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            throw new Error(`삭제 실패: ${error.message}`);
        }
    }
}

// 전역 인스턴스 생성
window.cloudflareImages = new CloudflareImages();

// 이미지 업로드 유틸리티 함수들
window.imageUtils = {
    /**
     * 파일 크기를 읽기 쉬운 형태로 변환
     * @param {number} bytes - 바이트 크기
     * @returns {string} 포맷팅된 크기
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

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

        // 파일 존재 확인
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

        // 파일 크기 확인 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            result.isValid = false;
            result.errors.push('파일 크기는 10MB를 초과할 수 없습니다.');
        }

        // 지원되는 형식 확인
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            result.isValid = false;
            result.errors.push('지원되는 형식: JPEG, PNG, GIF, WebP');
        }

        return result;
    }
}; 