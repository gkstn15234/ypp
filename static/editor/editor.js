/**
 * 워드프레스 스타일 간편 에디터
 */
class SimpleEditor {
    constructor() {
        this.quill = null;
        this.uploadedImages = [];
        this.settings = {
            openaiApiKey: localStorage.getItem('openai-api-key') || '',
            githubToken: localStorage.getItem('github-token') || '',
            cloudflareAccountId: localStorage.getItem('cf-account-id') || '',
            cloudflareApiToken: localStorage.getItem('cf-api-token') || ''
        };
        
        this.init();
    }

    // 초기화
    init() {
        this.setupQuillEditor();
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadDraft();
        this.loadRecentArticles();
    }

    // Quill 에디터 설정
    setupQuillEditor() {
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            ['link', 'image'],
            ['clean']
        ];

        this.quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: '기사 내용을 작성하세요...',
            modules: {
                toolbar: toolbarOptions
            }
        });

        // 이미지 업로드 핸들러
        this.quill.getModule('toolbar').addHandler('image', () => {
            this.showImageUpload();
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 제목 입력 시 URL 생성
        document.getElementById('articleTitle').addEventListener('input', (e) => {
            this.updatePermalink(e.target.value);
        });

        // 요약 글자수 카운터
        document.getElementById('description').addEventListener('input', (e) => {
            this.updateDescriptionCount(e.target.value.length);
        });

        // 버튼 이벤트
        document.getElementById('saveDraftBtn').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishBtn').addEventListener('click', () => this.showPublishOptions());
        document.getElementById('aiWriteBtn').addEventListener('click', () => this.showAIOptions());
        document.getElementById('addImageBtn').addEventListener('click', () => this.showImageUpload());
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('generateAIBtn').addEventListener('click', () => this.generateAIArticle());
        
        // 모달 이벤트
        document.getElementById('saveAISettings').addEventListener('click', () => this.saveAISettings());
        document.getElementById('saveGithubSettings').addEventListener('click', () => this.saveGithubSettings());
        document.getElementById('publishFromPreview').addEventListener('click', () => this.publishArticle());

        // 이미지 업로드
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e.target.files));
        this.setupImageDropZone();

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDraft();
            }
        });
    }

    // 자동 저장 설정
    setupAutoSave() {
        setInterval(() => {
            this.saveDraft(true); // 조용한 저장
        }, 30000); // 30초마다
    }

    // 제목에서 URL 생성
    updatePermalink(title) {
        if (!title) {
            document.getElementById('permalink').textContent = '제목을 입력하면 URL이 생성됩니다';
            return;
        }

        const slug = this.generateSlug(title);
        const category = document.getElementById('category').value;
        const baseUrl = 'https://autodaily.com'; // 실제 도메인으로 변경
        
        document.getElementById('permalink').innerHTML = 
            `<a href="${baseUrl}/${category}/${slug}/" target="_blank">${baseUrl}/${category}/${slug}/</a>`;
    }

    // 슬러그 생성
    generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // 요약 글자수 업데이트
    updateDescriptionCount(count) {
        document.getElementById('descriptionCount').textContent = count;
        const counter = document.getElementById('descriptionCount').parentElement;
        
        if (count > 150) {
            counter.style.color = 'var(--danger-color)';
        } else if (count > 120) {
            counter.style.color = 'var(--warning-color)';
        } else {
            counter.style.color = 'var(--text-muted)';
        }
    }

    // 이미지 드롭존 설정
    setupImageDropZone() {
        const dropzone = document.getElementById('uploadDropzone');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleImageUpload(files);
        });

        dropzone.addEventListener('click', () => {
            document.getElementById('imageInput').click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 이미지 업로드 영역 표시
    showImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        uploadArea.style.display = uploadArea.style.display === 'none' ? 'block' : 'none';
    }

    // 이미지 업로드 처리
    async handleImageUpload(files) {
        if (!files.length) return;

        this.showLoading('이미지 업로드 중...');
        
        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                    this.showToast('파일 크기는 5MB 이하만 가능합니다.', 'error');
                    continue;
                }

                const imageUrl = await this.uploadToCloudflare(file);
                this.addUploadedImage(imageUrl, file.name);
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            this.showToast('이미지 업로드에 실패했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Cloudflare Images 업로드
    async uploadToCloudflare(file) {
        const { cloudflareAccountId, cloudflareApiToken } = this.settings;
        
        if (!cloudflareAccountId || !cloudflareApiToken) {
            // 설정이 없으면 로컬 URL 생성 (데모용)
            return URL.createObjectURL(file);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cloudflareApiToken}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Cloudflare 업로드 실패');
        }

        const result = await response.json();
        return result.result.variants[0]; // 첫 번째 변형 사용
    }

    // 업로드된 이미지 추가
    addUploadedImage(imageUrl, fileName) {
        this.uploadedImages.push({ url: imageUrl, name: fileName });
        
        const container = document.getElementById('uploadedImages');
        const imageDiv = document.createElement('div');
        imageDiv.className = 'uploaded-image fade-in';
        imageDiv.innerHTML = `
            <img src="${imageUrl}" alt="${fileName}">
            <button class="remove-btn" onclick="editor.removeImage('${imageUrl}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(imageDiv);
        
        // 에디터에 이미지 삽입
        const range = this.quill.getSelection();
        this.quill.insertEmbed(range ? range.index : 0, 'image', imageUrl);
    }

    // 이미지 제거
    removeImage(imageUrl) {
        this.uploadedImages = this.uploadedImages.filter(img => img.url !== imageUrl);
        
        // DOM에서 제거
        const images = document.querySelectorAll('.uploaded-image img');
        images.forEach(img => {
            if (img.src === imageUrl) {
                img.parentElement.remove();
            }
        });
    }

    // AI 옵션 표시
    showAIOptions() {
        if (!this.settings.openaiApiKey) {
            const modal = new bootstrap.Modal(document.getElementById('aiSettingsModal'));
            modal.show();
        } else {
            // AI 도우미 카드로 스크롤
            document.querySelector('.card .fa-robot').closest('.card').scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    // AI 기사 생성
    async generateAIArticle() {
        const topic = document.getElementById('aiTopic').value.trim();
        
        if (!topic) {
            this.showToast('기사 주제를 입력해주세요.', 'error');
            return;
        }

        if (!this.settings.openaiApiKey) {
            this.showToast('OpenAI API 키를 설정해주세요.', 'error');
            return;
        }

        this.showLoading('AI가 기사를 생성하고 있습니다...');

        try {
            const article = await this.generateWithOpenAI(topic);
            
            // 생성된 내용으로 폼 채우기
            document.getElementById('articleTitle').value = article.title;
            document.getElementById('description').value = article.description;
            this.quill.root.innerHTML = article.content;
            
            this.updatePermalink(article.title);
            this.updateDescriptionCount(article.description.length);
            
            this.showToast('AI 기사가 생성되었습니다!', 'success');
            
            // 주제 입력창 초기화
            document.getElementById('aiTopic').value = '';
            
        } catch (error) {
            console.error('AI 생성 오류:', error);
            this.showToast('AI 기사 생성에 실패했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // OpenAI API 호출
    async generateWithOpenAI(topic) {
        const category = document.getElementById('category').value;
        const categoryName = category === 'automotive' ? '자동차' : '경제';
        
        const prompt = `다음 주제로 ${categoryName} 분야의 뉴스 기사를 작성해주세요:

주제: ${topic}

요구사항:
1. 제목은 간결하고 흥미로우며 SEO에 최적화되어야 합니다
2. 기사 요약은 150자 이내로 작성해주세요
3. 본문은 전문적이고 정확한 정보를 포함해야 합니다
4. HTML 형식으로 작성하되, 제목은 h2, h3 태그를 사용해주세요
5. 한국어로 작성해주세요

응답 형식:
{
  "title": "기사 제목",
  "description": "기사 요약",
  "content": "HTML 형식의 본문 내용"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: '당신은 전문 뉴스 기자입니다. 정확하고 객관적인 기사를 작성해주세요.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API 호출 실패');
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (e) {
            // JSON 파싱 실패 시 기본 구조로 반환
            return {
                title: topic,
                description: content.substring(0, 150),
                content: content
            };
        }
    }

    // 미리보기 표시
    showPreview() {
        const title = document.getElementById('articleTitle').value;
        const content = this.quill.root.innerHTML;
        
        if (!title.trim()) {
            this.showToast('제목을 입력해주세요.', 'error');
            return;
        }

        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = `
            <h1>${title}</h1>
            <div class="article-meta mb-4">
                <span class="badge bg-primary">${document.getElementById('category').options[document.getElementById('category').selectedIndex].text}</span>
                <span class="text-muted ms-2">작성자: ${document.getElementById('author').options[document.getElementById('author').selectedIndex].text}</span>
            </div>
            ${content}
        `;

        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();
    }

    // 발행 옵션 표시
    showPublishOptions() {
        if (!this.validateForm()) {
            return;
        }

        if (!this.settings.githubToken) {
            const modal = new bootstrap.Modal(document.getElementById('githubSettingsModal'));
            modal.show();
        } else {
            this.publishArticle();
        }
    }

    // 폼 유효성 검사
    validateForm() {
        const title = document.getElementById('articleTitle').value.trim();
        const content = this.quill.getText().trim();

        if (!title) {
            this.showToast('제목을 입력해주세요.', 'error');
            return false;
        }

        if (content.length < 50) {
            this.showToast('내용을 더 자세히 작성해주세요. (최소 50자)', 'error');
            return false;
        }

        return true;
    }

    // 기사 발행
    async publishArticle() {
        if (!this.validateForm()) {
            return;
        }

        this.showLoading('기사를 발행하고 있습니다...');

        try {
            const markdown = this.generateMarkdown();
            const filename = this.generateFilename();
            const category = document.getElementById('category').value;
            
            await this.uploadToGitHub(markdown, filename, category);
            
            this.showToast('기사가 성공적으로 발행되었습니다!', 'success');
            
            // 모달 닫기
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            });
            
            // 폼 초기화 여부 확인
            if (confirm('발행이 완료되었습니다. 새 기사를 작성하시겠습니까?')) {
                this.clearForm();
            }
            
        } catch (error) {
            console.error('발행 오류:', error);
            this.showToast('발행에 실패했습니다. 다시 시도해주세요.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 마크다운 생성
    generateMarkdown() {
        const title = document.getElementById('articleTitle').value;
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const author = document.getElementById('author').value;
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const content = this.quill.root.innerHTML;
        
        // 이미지 URL 수집
        const images = this.uploadedImages.map(img => img.url);
        
        const frontMatter = {
            title,
            description: description || title,
            author,
            date: new Date().toISOString(),
            categories: [category],
            tags,
            images
        };

        const yamlFrontMatter = Object.entries(frontMatter)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `${key}:\n${value.map(v => `  - "${v}"`).join('\n')}`;
                }
                return `${key}: "${value}"`;
            })
            .join('\n');

        return `---\n${yamlFrontMatter}\n---\n\n${content}`;
    }

    // 파일명 생성
    generateFilename() {
        const title = document.getElementById('articleTitle').value;
        const slug = this.generateSlug(title);
        return `${slug}.md`;
    }

    // GitHub 업로드
    async uploadToGitHub(content, filename, category) {
        const path = `content/${category}/${filename}`;
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        const response = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.settings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add new article: ${filename}`,
                content: encodedContent,
                branch: 'main'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `업로드 실패: ${response.status}`);
        }

        return response.json();
    }

    // 임시 저장
    saveDraft(silent = false) {
        const draft = {
            title: document.getElementById('articleTitle').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            author: document.getElementById('author').value,
            tags: document.getElementById('tags').value,
            content: this.quill.root.innerHTML,
            images: this.uploadedImages,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('article-draft', JSON.stringify(draft));
        
        if (!silent) {
            this.showToast('임시 저장되었습니다.', 'success');
        }
    }

    // 임시 저장 불러오기
    loadDraft() {
        const draft = localStorage.getItem('article-draft');
        if (!draft) return;

        try {
            const data = JSON.parse(draft);
            
            // 24시간 이내 저장된 것만 불러오기
            const saveTime = new Date(data.timestamp);
            const now = new Date();
            const diffHours = (now - saveTime) / (1000 * 60 * 60);
            
            if (diffHours > 24) {
                localStorage.removeItem('article-draft');
                return;
            }

            // 폼에 데이터 복원
            document.getElementById('articleTitle').value = data.title || '';
            document.getElementById('description').value = data.description || '';
            document.getElementById('category').value = data.category || 'automotive';
            document.getElementById('author').value = data.author || 'oh-eun-jin';
            document.getElementById('tags').value = data.tags || '';
            this.quill.root.innerHTML = data.content || '';
            
            if (data.images && data.images.length > 0) {
                this.uploadedImages = data.images;
                this.renderUploadedImages();
            }

            if (data.title) {
                this.updatePermalink(data.title);
            }
            
            if (data.description) {
                this.updateDescriptionCount(data.description.length);
            }

        } catch (error) {
            console.error('임시 저장 데이터 로드 오류:', error);
        }
    }

    // 업로드된 이미지 렌더링
    renderUploadedImages() {
        const container = document.getElementById('uploadedImages');
        container.innerHTML = '';
        
        this.uploadedImages.forEach(image => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'uploaded-image';
            imageDiv.innerHTML = `
                <img src="${image.url}" alt="${image.name}">
                <button class="remove-btn" onclick="editor.removeImage('${image.url}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(imageDiv);
        });
    }

    // 최근 기사 불러오기
    async loadRecentArticles() {
        try {
            // GitHub API로 최근 기사 목록 가져오기
            const response = await fetch('https://api.github.com/repos/gkstn15234/123/contents/content');
            const folders = await response.json();
            
            const articles = [];
            
            for (const folder of folders.filter(f => f.type === 'dir')) {
                const folderResponse = await fetch(folder.url);
                const files = await folderResponse.json();
                
                files.filter(f => f.name.endsWith('.md')).forEach(file => {
                    articles.push({
                        name: file.name,
                        category: folder.name,
                        path: file.path,
                        url: file.html_url
                    });
                });
            }

            this.renderRecentArticles(articles.slice(0, 5)); // 최근 5개만
            
        } catch (error) {
            console.error('최근 기사 로드 오류:', error);
        }
    }

    // 최근 기사 렌더링
    renderRecentArticles(articles) {
        const container = document.getElementById('recentArticles');
        
        if (articles.length === 0) {
            return;
        }

        container.innerHTML = articles.map(article => `
            <div class="recent-article">
                <h6>${article.name.replace('.md', '').replace(/-/g, ' ')}</h6>
                <div class="meta">
                    <span class="badge ${article.category === 'automotive' ? 'bg-primary' : 'bg-success'}">${article.category === 'automotive' ? '자동차' : '경제'}</span>
                </div>
            </div>
        `).join('');
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('articleTitle').value = '';
        document.getElementById('description').value = '';
        document.getElementById('tags').value = '';
        this.quill.setText('');
        this.uploadedImages = [];
        document.getElementById('uploadedImages').innerHTML = '';
        document.getElementById('permalink').textContent = '제목을 입력하면 URL이 생성됩니다';
        this.updateDescriptionCount(0);
        
        // 임시 저장 데이터 삭제
        localStorage.removeItem('article-draft');
    }

    // AI 설정 저장
    saveAISettings() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        
        if (!apiKey) {
            this.showToast('API 키를 입력해주세요.', 'error');
            return;
        }

        this.settings.openaiApiKey = apiKey;
        localStorage.setItem('openai-api-key', apiKey);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('aiSettingsModal'));
        modal.hide();
        
        this.showToast('AI 설정이 저장되었습니다.', 'success');
    }

    // GitHub 설정 저장
    saveGithubSettings() {
        const token = document.getElementById('githubToken').value.trim();
        
        if (!token) {
            this.showToast('GitHub 토큰을 입력해주세요.', 'error');
            return;
        }

        this.settings.githubToken = token;
        localStorage.setItem('github-token', token);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('githubSettingsModal'));
        modal.hide();
        
        this.showToast('GitHub 설정이 저장되었습니다.', 'success');
    }

    // 로딩 표시
    showLoading(text = '처리 중...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.textContent = text;
        overlay.style.display = 'flex';
    }

    // 로딩 숨기기
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    // 토스트 알림 표시
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type} fade-in`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 350px;
        `;

        const typeColors = {
            success: 'var(--success-color)',
            error: 'var(--danger-color)',
            warning: 'var(--warning-color)',
            info: 'var(--primary-color)'
        };

        toast.style.borderLeftColor = typeColors[type];
        toast.style.borderLeftWidth = '4px';
        toast.textContent = message;

        document.body.appendChild(toast);

        // 3초 후 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 에디터 인스턴스 생성
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new SimpleEditor();
}); 