/**
 * 오토데일리 기사 에디터 메인 스크립트
 */

class ArticleEditor {
    constructor() {
        this.currentImageUrls = [];  // 다중 이미지 지원
        this.currentSlug = '';
        this.githubModal = null;
        this.aiWriteModal = null;
        this.openaiModal = null;
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadDraftFromStorage();
        this.initializeDateTime();
        this.setupGitHubModal();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 폼 입력 이벤트
        document.getElementById('title').addEventListener('input', () => this.updatePreview());
        document.getElementById('category').addEventListener('change', () => this.updatePreview());
        document.getElementById('author').addEventListener('change', () => this.updatePreview());
        document.getElementById('description').addEventListener('input', () => {
            this.updateCharCount();
            this.updatePreview();
        });
        document.getElementById('tags').addEventListener('input', () => this.updatePreview());
        document.getElementById('content').addEventListener('input', () => this.updatePreview());

        // 이미지 업로드 이벤트
        this.setupImageUpload();

        // 액션 버튼 이벤트
        document.getElementById('aiWriteBtn').addEventListener('click', () => this.showAIWriteModal());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadMarkdown());
        document.getElementById('uploadBtn').addEventListener('click', () => this.showGitHubModal());
        document.getElementById('confirmUpload').addEventListener('click', () => this.uploadToGitHub());
        
        // AI 관련 이벤트
        document.getElementById('generateArticle').addEventListener('click', () => this.generateAIArticle());
        document.getElementById('saveOpenaiKey').addEventListener('click', () => this.saveOpenAIKey());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveDraftToStorage();
                        this.showToast('임시저장 완료', 'success');
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.downloadMarkdown();
                        break;
                }
            }
        });
    }

    /**
     * 이미지 업로드 기능 설정 (다중 로컬 업로드)
     */
    setupImageUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageFiles');

        // 드래그 앤 드롭
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.handleMultipleImageUpload(files);
            }
        });

        // 클릭 업로드
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                this.handleMultipleImageUpload(files);
            }
        });
    }

    /**
     * 다중 이미지 업로드 처리
     * @param {Array} files - 업로드할 파일들
     */
    async handleMultipleImageUpload(files) {
        if (files.length > 4) {
            this.showToast('최대 4개의 이미지까지만 업로드 가능합니다.', 'error');
            return;
        }

        try {
            // 현재 슬러그가 없으면 임시 슬러그 생성
            if (!this.currentSlug) {
                this.currentSlug = this.generateTempSlug();
            }

            this.showUploadProgress(true);
            this.updateProgressText('이미지 최적화 중...');

            // 로컬 이미지 업로드 실행
            const imagePaths = await window.localImageUploader.uploadMultipleImages(
                files, 
                this.currentSlug, 
                (progress) => {
                    this.updateUploadProgress(progress);
                }
            );

            // 성공 처리
            this.currentImageUrls = imagePaths;
            this.showMultipleImagePreview(imagePaths);
            this.updatePreview();
            this.showToast(`${files.length}개 이미지 업로드 완료!`, 'success');

        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            this.showToast(`업로드 실패: ${error.message}`, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    /**
     * 임시 슬러그 생성
     * @returns {string} 임시 슬러그
     */
    generateTempSlug() {
        const now = new Date();
        return `temp-article-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    }

    /**
     * 업로드 진행률 표시
     * @param {boolean} show - 표시 여부
     */
    showUploadProgress(show) {
        const progressDiv = document.getElementById('uploadProgress');
        progressDiv.style.display = show ? 'block' : 'none';
    }

    /**
     * 업로드 진행률 업데이트
     * @param {number} progress - 진행률 (0-100)
     */
    updateUploadProgress(progress) {
        const progressBar = document.querySelector('#uploadProgress .progress-bar');
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
    }

    /**
     * 진행률 텍스트 업데이트
     * @param {string} text - 표시할 텍스트
     */
    updateProgressText(text) {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = text;
        }
    }

    /**
     * 다중 이미지 미리보기 표시
     * @param {Array} imagePaths - 이미지 경로들
     */
    showMultipleImagePreview(imagePaths) {
        const container = document.getElementById('imagePreviewContainer');
        const grid = document.getElementById('imagePreviewGrid');
        const pathsList = document.getElementById('imagePathsList');

        // 기존 내용 초기화
        grid.innerHTML = '';
        pathsList.innerHTML = '';

        imagePaths.forEach((path, index) => {
            // 이미지 미리보기 생성
            const col = document.createElement('div');
            col.className = 'col-6 col-md-3';
            
            const imageItem = document.createElement('div');
            imageItem.className = 'image-preview-item';
            
            // 로컬 저장소에서 이미지 데이터 가져오기
            const imageData = window.localImageUploader.getImagePreview(this.currentSlug, index + 1);
            
            imageItem.innerHTML = `
                <img src="${imageData || '/images/placeholder.jpg'}" alt="이미지 ${index + 1}">
                <div class="image-index">${index + 1}</div>
                <button class="remove-image" onclick="articleEditor.removeImage(${index})" title="이미지 삭제">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            col.appendChild(imageItem);
            grid.appendChild(col);

            // 이미지 경로 표시
            const pathItem = document.createElement('div');
            pathItem.className = 'image-path-item';
            pathItem.textContent = path;
            pathsList.appendChild(pathItem);
        });

        container.style.display = 'block';
    }

    /**
     * 이미지 삭제
     * @param {number} index - 삭제할 이미지 인덱스
     */
    removeImage(index) {
        if (confirm('이 이미지를 삭제하시겠습니까?')) {
            // 배열에서 제거
            this.currentImageUrls.splice(index, 1);
            
            // 로컬 저장소에서 삭제
            window.localImageUploader.clearArticleImages(this.currentSlug);
            
            // 남은 이미지들 다시 업로드 (인덱스 재정렬)
            if (this.currentImageUrls.length > 0) {
                this.showMultipleImagePreview(this.currentImageUrls);
            } else {
                document.getElementById('imagePreviewContainer').style.display = 'none';
                this.currentImageUrls = [];
            }
            
            this.updatePreview();
            this.showToast('이미지가 삭제되었습니다.', 'info');
        }
    }

    /**
     * 실시간 미리보기 업데이트
     */
    updatePreview() {
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const author = document.getElementById('author').value;
        const description = document.getElementById('description').value;
        const content = document.getElementById('content').value;
        const publishDate = document.getElementById('publishDate').value;

        if (!title && !content) {
            document.getElementById('preview').innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-eye fa-3x mb-3"></i>
                    <p>기사 정보를 입력하면 미리보기가 표시됩니다</p>
                </div>
            `;
            return;
        }

        // Hugo single.html 스타일로 미리보기 생성
        const previewHtml = this.generatePreviewHtml({
            title,
            category,
            author,
            description,
            content,
            publishDate,
            imageUrls: this.currentImageUrls
        });

        document.getElementById('preview').innerHTML = previewHtml;
    }

    /**
     * 미리보기 HTML 생성
     * @param {Object} data - 기사 데이터
     * @returns {string} HTML 문자열
     */
    generatePreviewHtml(data) {
        const categoryName = data.category === 'automotive' ? '자동차' : '경제';
        const formatDate = (dateStr) => {
            if (!dateStr) return new Date().toLocaleDateString('ko-KR');
            return new Date(dateStr).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return `
            <div class="single-article-page">
                <div class="container-fluid">
                    <article class="main-article-content">
                        <header class="article-header">
                            <div class="article-category-badge">${categoryName}</div>
                            <h1 class="article-main-title">${data.title || '제목을 입력하세요'}</h1>
                            
                            <div class="article-meta-info">
                                <div class="meta-left">
                                    <span class="author-name">${data.author}</span>
                                    <time class="publish-date">${formatDate(data.publishDate)}</time>
                                </div>
                                <div class="meta-right">
                                    <div class="social-share-inline">
                                        <button class="share-btn-inline facebook"><i class="fab fa-facebook-f"></i></button>
                                        <button class="share-btn-inline twitter"><i class="fab fa-twitter"></i></button>
                                        <button class="share-btn-inline copy"><i class="fas fa-link"></i></button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        ${data.imageUrls && data.imageUrls.length > 0 ? `
                        <div class="article-main-image">
                            <img src="${data.imageUrls[0]}" alt="${data.title}" class="img-fluid discover-optimized" 
                                 width="1200" height="675" data-discover="true">
                        </div>
                        ` : ''}

                        ${data.description ? `
                        <div class="article-summary">
                            <p>${data.description}</p>
                        </div>
                        ` : ''}

                        <div class="article-content">
                            ${data.content ? marked.parse(data.content) : '<p>본문을 입력하세요...</p>'}
                        </div>
                    </article>
                </div>
            </div>
        `;
    }

    /**
     * 글자 수 카운트 업데이트
     */
    updateCharCount() {
        const description = document.getElementById('description').value;
        const countSpan = document.getElementById('descLength');
        countSpan.textContent = description.length;
        
        if (description.length > 150) {
            countSpan.style.color = 'red';
        } else {
            countSpan.style.color = '';
        }
    }

    /**
     * 마크다운 에디터에 텍스트 삽입
     * @param {string} before - 앞에 삽입할 텍스트
     * @param {string} after - 뒤에 삽입할 텍스트
     */
    insertText(before, after) {
        const textarea = document.getElementById('content');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        const newText = before + selectedText + after;
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        
        // 커서 위치 조정
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        this.updatePreview();
    }

    /**
     * Hugo Front Matter 생성
     * @returns {Object} 기사 데이터와 파일명
     */
    generateHugoFrontMatter() {
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const author = document.getElementById('author').value;
        const description = document.getElementById('description').value;
        const tags = document.getElementById('tags').value;
        const content = document.getElementById('content').value;
        const publishDate = document.getElementById('publishDate').value;

        if (!title || !content) {
            throw new Error('제목과 본문은 필수입니다.');
        }

        // 태그 처리
        const tagArray = tags.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 5); // 최대 5개

        // 파일명 생성 (한글 -> 영문 변환)
        const filename = this.generateFilename(title);

        // Front Matter 생성
        const frontMatter = `---
title: "${title}"
description: "${description}"
author: "${author}"
date: ${publishDate ? new Date(publishDate).toISOString() : new Date().toISOString()}
${this.currentImageUrls.length > 0 ? `images: [${this.currentImageUrls.map(url => `"${url}"`).join(', ')}]` : ''}
${tagArray.length > 0 ? `tags: [${tagArray.map(tag => `"${tag}"`).join(', ')}]` : ''}
---

${content}`;

        return {
            content: frontMatter,
            filename: filename,
            category: category
        };
    }

    /**
     * 파일명 생성 (한글 -> 영문 변환)
     * @param {string} title - 기사 제목
     * @returns {string} 파일명
     */
    generateFilename(title) {
        // 간단한 한글->영문 변환 매핑
        const koreanToEnglish = {
            '현대': 'hyundai',
            '기아': 'kia',
            '제네시스': 'genesis',
            '쌍용': 'ssangyong',
            '한국': 'korea',
            '자동차': 'car',
            '전기차': 'electric-car',
            '신차': 'new-car',
            '출시': 'launch',
            '경제': 'economy',
            '시장': 'market',
            '판매': 'sales',
            '투자': 'investment',
            '성장': 'growth'
        };

        let filename = title.toLowerCase();
        
        // 한글 단어 변환
        Object.keys(koreanToEnglish).forEach(korean => {
            filename = filename.replace(new RegExp(korean, 'g'), koreanToEnglish[korean]);
        });

        // 한글이 남아있으면 로마자 변환 (간단한 방법)
        filename = filename
            .replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '') // 남은 한글 제거
            .replace(/[^a-z0-9\s-]/g, '') // 영문, 숫자, 공백, 하이픈만 남김
            .replace(/\s+/g, '-') // 공백을 하이픈으로
            .replace(/-+/g, '-') // 연속 하이픈 정리
            .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거

        // 기본 파일명이 없으면 날짜 사용
        if (!filename) {
            filename = 'article-' + new Date().toISOString().split('T')[0];
        }

        return filename + '.md';
    }

    /**
     * 마크다운 파일 다운로드
     */
    downloadMarkdown() {
        try {
            const result = this.generateHugoFrontMatter();
            
            const blob = new Blob([result.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('파일 다운로드 완료!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * GitHub 업로드 모달 표시
     */
    showGitHubModal() {
        if (!this.githubModal) {
            this.githubModal = new bootstrap.Modal(document.getElementById('githubModal'));
        }
        this.githubModal.show();
    }

    /**
     * GitHub 모달 설정
     */
    setupGitHubModal() {
        // 토큰 자동 저장/불러오기
        const tokenInput = document.getElementById('githubToken');
        tokenInput.value = sessionStorage.getItem('github_token') || '';
        
        tokenInput.addEventListener('input', () => {
            sessionStorage.setItem('github_token', tokenInput.value);
        });

        // OpenAI API 키 자동 불러오기
        const openaiKey = sessionStorage.getItem('openai_api_key');
        if (openaiKey) {
            window.openaiWriter.configure(openaiKey);
        }
    }

    /**
     * GitHub에 업로드
     */
    async uploadToGitHub() {
        const token = document.getElementById('githubToken').value;
        if (!token) {
            this.showToast('GitHub 토큰을 입력해주세요.', 'error');
            return;
        }

        try {
            const result = this.generateHugoFrontMatter();
            const path = `content/${result.category}/${result.filename}`;
            
            // GitHub API로 파일 업로드
            const response = await fetch('https://api.github.com/repos/gkstn15234/news/contents/' + path, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `새 기사 추가: ${document.getElementById('title').value}`,
                    content: btoa(unescape(encodeURIComponent(result.content)))
                })
            });

            if (response.ok) {
                this.showToast('GitHub 업로드 성공!', 'success');
                this.githubModal.hide();
                this.clearForm();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || '업로드 실패');
            }
        } catch (error) {
            console.error('GitHub 업로드 실패:', error);
            this.showToast(`업로드 실패: ${error.message}`, 'error');
        }
    }

    /**
     * 자동 저장 설정
     */
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveDraftToStorage();
        }, 30000); // 30초마다 자동 저장
    }

    /**
     * 임시저장
     */
    saveDraftToStorage() {
        const draft = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            author: document.getElementById('author').value,
            description: document.getElementById('description').value,
            tags: document.getElementById('tags').value,
            content: document.getElementById('content').value,
            publishDate: document.getElementById('publishDate').value,
            imageUrls: this.currentImageUrls,
            slug: this.currentSlug,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('article_draft', JSON.stringify(draft));
    }

    /**
     * 임시저장 불러오기
     */
    loadDraftFromStorage() {
        const draft = localStorage.getItem('article_draft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                
                // 24시간 이내 데이터만 복원
                const savedTime = new Date(data.timestamp);
                const now = new Date();
                if (now - savedTime < 24 * 60 * 60 * 1000) {
                    document.getElementById('title').value = data.title || '';
                    document.getElementById('category').value = data.category || 'automotive';
                    document.getElementById('author').value = data.author || '오은진';
                    document.getElementById('description').value = data.description || '';
                    document.getElementById('tags').value = data.tags || '';
                    document.getElementById('content').value = data.content || '';
                    document.getElementById('publishDate').value = data.publishDate || '';
                    this.currentImageUrls = data.imageUrls || [];
                    this.currentSlug = data.slug || '';
                    
                    this.updateCharCount();
                    this.updatePreview();
                    
                    this.showToast('임시저장된 내용을 복원했습니다.', 'info');
                }
            } catch (error) {
                console.error('임시저장 복원 실패:', error);
            }
        }
    }

    /**
     * 현재 시간으로 발행일시 초기화
     */
    initializeDateTime() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localTime = new Date(now.getTime() - offset);
        document.getElementById('publishDate').value = localTime.toISOString().slice(0, 16);
    }

    /**
     * 폼 초기화
     */
    clearForm() {
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('tags').value = '';
        document.getElementById('content').value = '';
        this.currentImageUrls = [];
        
        // 이미지 미리보기 숨기기
        document.getElementById('imagePreviewContainer').style.display = 'none';
        
        // 로컬 이미지 삭제
        if (this.currentSlug) {
            window.localImageUploader.clearArticleImages(this.currentSlug);
        }
        
        this.updateCharCount();
        this.updatePreview();
        this.initializeDateTime();
        
        localStorage.removeItem('article_draft');
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, error, info)
     */
    showToast(message, type = 'info') {
        // 간단한 토스트 구현
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                <div>${message}</div>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * AI 글작성 모달 표시
     */
    showAIWriteModal() {
        // OpenAI API 키 확인
        const apiKey = sessionStorage.getItem('openai_api_key');
        if (!apiKey) {
            this.showOpenAIModal();
            return;
        }

        if (!this.aiWriteModal) {
            this.aiWriteModal = new bootstrap.Modal(document.getElementById('aiWriteModal'));
        }
        this.aiWriteModal.show();
    }

    /**
     * OpenAI 설정 모달 표시
     */
    showOpenAIModal() {
        if (!this.openaiModal) {
            this.openaiModal = new bootstrap.Modal(document.getElementById('openaiModal'));
        }
        
        // 기존 키가 있으면 표시
        const existingKey = sessionStorage.getItem('openai_api_key');
        if (existingKey) {
            document.getElementById('openaiApiKey').value = existingKey;
        }
        
        this.openaiModal.show();
    }

    /**
     * OpenAI API 키 저장
     */
    saveOpenAIKey() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        if (!apiKey) {
            this.showToast('API 키를 입력해주세요.', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showToast('올바른 OpenAI API 키 형식이 아닙니다.', 'error');
            return;
        }

        // OpenAI 인스턴스에 설정
        window.openaiWriter.configure(apiKey);
        
        // 세션에 저장
        sessionStorage.setItem('openai_api_key', apiKey);
        
        this.openaiModal.hide();
        this.showToast('OpenAI API 키가 저장되었습니다.', 'success');

        // AI 글작성 모달 표시
        setTimeout(() => {
            this.showAIWriteModal();
        }, 500);
    }

    /**
     * AI 기사 생성
     */
    async generateAIArticle() {
        const title = document.getElementById('aiTitle').value.trim();
        const description = document.getElementById('aiDescription').value.trim();
        const category = document.getElementById('aiCategory').value;
        const referenceContent = document.getElementById('referenceContent').value.trim();

        if (!title) {
            this.showToast('기사 제목을 입력해주세요.', 'error');
            return;
        }

        try {
            this.showAIProgress(true);
            this.updateAIProgress(10, 'AI가 카테고리를 분석하고 있습니다...');

            // 카테고리 자동 분류
            let finalCategory = category;
            if (category === 'auto') {
                finalCategory = window.openaiWriter.determineEconomyOrAutomotive(title, description, 'automotive');
                this.updateAIProgress(30, 'AI가 기사 구조를 설계하고 있습니다...');
            }

            // 기사 데이터 준비
            const articleData = {
                title: title,
                description: description || `${title}에 대한 상세 분석`,
                category: finalCategory
            };

            this.updateAIProgress(50, 'AI가 기사를 작성하고 있습니다...');

            // AI 기사 생성
            const result = await window.openaiWriter.generateArticle(articleData, (progress) => {
                this.updateAIProgress(50 + (progress * 0.4), 'AI가 기사를 작성하고 있습니다...');
            });

            this.updateAIProgress(95, '생성된 기사를 에디터에 적용하고 있습니다...');

            // 생성된 내용을 폼에 적용
            this.applyAIGeneratedContent(result, finalCategory);

            this.updateAIProgress(100, '완료!');
            
            setTimeout(() => {
                this.showAIProgress(false);
                this.aiWriteModal.hide();
                this.showToast('AI 기사 생성이 완료되었습니다!', 'success');
            }, 1000);

        } catch (error) {
            console.error('AI 기사 생성 실패:', error);
            this.showAIProgress(false);
            this.showToast(`AI 기사 생성 실패: ${error.message}`, 'error');
        }
    }

    /**
     * AI 진행률 표시
     * @param {boolean} show - 표시 여부
     */
    showAIProgress(show) {
        const progressDiv = document.getElementById('aiProgress');
        progressDiv.style.display = show ? 'block' : 'none';
        
        if (!show) {
            this.updateAIProgress(0, '');
        }
    }

    /**
     * AI 진행률 업데이트
     * @param {number} progress - 진행률 (0-100)
     * @param {string} text - 진행 상태 텍스트
     */
    updateAIProgress(progress, text) {
        const progressBar = document.querySelector('#aiProgress .progress-bar');
        const progressText = document.getElementById('aiProgressText');
        
        progressBar.style.width = `${progress}%`;
        if (progressText && text) {
            progressText.textContent = text;
        }
    }

    /**
     * AI 생성 콘텐츠를 폼에 적용
     * @param {Object} result - AI 생성 결과
     * @param {string} category - 카테고리
     */
    applyAIGeneratedContent(result, category) {
        // 제목에서 h1 태그 제거
        const cleanTitle = result.title.replace(/<\/?h1[^>]*>/g, '');
        
        // 폼 필드 업데이트
        document.getElementById('title').value = cleanTitle;
        document.getElementById('category').value = category;
        document.getElementById('content').value = result.content;
        
        // 슬러그 업데이트
        this.currentSlug = result.slug;
        
        // 기사 요약을 AI 제목에서 추출 (간단한 방법)
        const titleMatch = cleanTitle.match(/^"([^"]+)"/);
        if (titleMatch) {
            document.getElementById('description').value = titleMatch[1];
        }
        
        // 미리보기 업데이트
        this.updateCharCount();
        this.updatePreview();
        
        // AI 모달 필드 초기화
        document.getElementById('aiTitle').value = '';
        document.getElementById('aiDescription').value = '';
        document.getElementById('referenceContent').value = '';
        document.getElementById('aiCategory').value = 'auto';
    }
}

// 전역 함수들
window.insertText = function(before, after) {
    if (window.articleEditor) {
        window.articleEditor.insertText(before, after);
    }
};

// 에디터 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.articleEditor = new ArticleEditor();
    
    // 전역 함수로 노출 (HTML에서 호출용)
    window.removeImage = (index) => {
        if (window.articleEditor) {
            window.articleEditor.removeImage(index);
        }
    };
}); 