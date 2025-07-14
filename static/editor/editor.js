/**
 * 워드프레스 스타일 간편 에디터
 */
class SimpleEditor {
    constructor() {
        this.quill = null;
        this.uploadedImages = [];
        this.mediaLibrary = [];
        this.filteredMedia = [];
        this.mediaView = 'grid';
        this.settings = {
            openaiApiKey: localStorage.getItem('openai-api-key') || '',
            githubToken: localStorage.getItem('github-token') || ''
            // Cloudflare 설정은 이제 서버에서 처리됩니다
        };
        
        this.init();
    }

    // 초기화
    init() {
        this.setupQuillEditor();
        this.setupEventListeners();
        this.setupAutoSave();
        this.setupWordPressImport();
        this.loadDraft();
        this.loadRecentArticles();
        this.loadSettings();
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
        // Cloudflare settings removed - now handled server-side
        document.getElementById('publishFromPreview').addEventListener('click', () => this.publishArticle());
        
        // 미디어 관리 기능 제거됨 - 간단한 업로드만 유지

        // 임시 저장 관리 이벤트
        document.getElementById('refreshDraftsBtn').addEventListener('click', () => this.loadDraftList());
        document.getElementById('cleanOldDraftsBtn').addEventListener('click', () => this.cleanOldDrafts());
        document.getElementById('draftManagerModal').addEventListener('shown.bs.modal', () => {
            this.loadDraftList();
        });

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

        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                this.showToast(`${file.name}은(는) 이미지 파일이 아닙니다.`, 'warning');
                return false;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                this.showToast(`${file.name}의 크기가 너무 큽니다 (최대 5MB).`, 'error');
                return false;
            }
            
            return true;
        });

        if (validFiles.length === 0) return;

        this.showLoading(`이미지 업로드 중... (${validFiles.length}개)`);
        
        try {
            const uploadPromises = validFiles.map(async (file, index) => {
                try {
                    const imageUrl = await this.uploadToCloudflare(file);
                    this.addUploadedImage(imageUrl, file.name);
                    return { success: true, file: file.name, url: imageUrl };
                } catch (error) {
                    console.error(`${file.name} 업로드 실패:`, error);
                    return { success: false, file: file.name, error: error.message };
                }
            });

            const results = await Promise.all(uploadPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            if (successful.length > 0) {
                this.showToast(`${successful.length}개 이미지가 성공적으로 업로드되었습니다.`, 'success');
            }
            
            if (failed.length > 0) {
                this.showToast(`${failed.length}개 이미지 업로드에 실패했습니다.`, 'error');
            }

        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            this.showToast('이미지 업로드에 실패했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Cloudflare Images 업로드 (서버리스 함수 사용)
    async uploadToCloudflare(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('업로드 오류:', errorData);
                throw new Error(`업로드 실패: ${errorData.error || response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(`업로드 실패: ${result.error || '알 수 없는 오류'}`);
            }

            // 업로드 성공 시 최적화된 이미지 URL 반환
            this.showToast('이미지가 성공적으로 업로드되었습니다.', 'success');
            return result.url;
            
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            this.showToast(`이미지 업로드 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    // 업로드된 이미지 추가 및 자동 삽입
    addUploadedImage(imageUrl, fileName) {
        this.uploadedImages.push({ url: imageUrl, name: fileName });
        
        const container = document.getElementById('uploadedImages');
        const imageDiv = document.createElement('div');
        imageDiv.className = 'uploaded-image fade-in';
        imageDiv.innerHTML = `
            <img src="${imageUrl}" alt="${fileName}" title="${fileName}">
            <div class="image-info">
                <small class="text-muted">${fileName}</small>
                <div class="image-url">
                    <input type="text" class="form-control form-control-sm" value="${imageUrl}" readonly>
                    <button class="btn btn-sm btn-outline-secondary" onclick="editor.copyImageUrl('${imageUrl}')" title="URL 복사">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="image-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="editor.insertImageToEditor('${imageUrl}', '${fileName}')" title="다시 삽입">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="editor.removeImage('${imageUrl}')" title="목록에서 제거">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(imageDiv);
        
        // 에디터에 자동으로 이미지 삽입
        this.insertImageToEditor(imageUrl, fileName);
        
        // 성공 메시지에 URL 정보 포함
        this.showToast(`이미지가 업로드되어 에디터에 삽입되었습니다!`, 'success');
    }

    // 이미지 URL 복사 기능
    async copyImageUrl(imageUrl) {
        try {
            await navigator.clipboard.writeText(imageUrl);
            this.showToast('이미지 URL이 클립보드에 복사되었습니다!', 'success');
        } catch (error) {
            console.error('URL 복사 실패:', error);
            this.showToast('URL 복사에 실패했습니다.', 'error');
        }
    }

    // 에디터에 이미지 삽입
    insertImageToEditor(imageUrl, fileName) {
        const range = this.quill.getSelection() || { index: this.quill.getLength() };
        
        // 이미지 삽입
        this.quill.insertEmbed(range.index, 'image', imageUrl);
        
        // 이미지 다음 줄로 커서 이동
        this.quill.setSelection(range.index + 1);
        
        this.showToast('이미지가 에디터에 삽입되었습니다.', 'success');
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

    // 임시 저장 (GitHub 기반)
    async saveDraft(silent = false) {
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

        try {
            // 로컬 스토리지에도 백업 저장 (즉시 복구용)
            localStorage.setItem('article-draft', JSON.stringify(draft));
            
            // GitHub에 임시 저장 (영구 보관용)
            if (this.settings.githubToken) {
                await this.saveDraftToGitHub(draft);
                if (!silent) {
                    this.showToast('임시 저장되었습니다. (클라우드 동기화 완료)', 'success');
                }
            } else {
                if (!silent) {
                    this.showToast('임시 저장되었습니다. (로컬만)', 'warning');
                }
            }
        } catch (error) {
            console.error('임시 저장 오류:', error);
            // 로컬 저장은 성공했으므로 경고만 표시
            if (!silent) {
                this.showToast('로컬에 임시 저장되었습니다. (클라우드 동기화 실패)', 'warning');
            }
        }
    }

    // GitHub에 임시 저장
    async saveDraftToGitHub(draft) {
        const draftId = this.generateDraftId();
        const filename = `draft-${draftId}.json`;
        const path = `drafts/${filename}`;
        
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(draft, null, 2))));
        
        // 기존 임시 저장 파일이 있는지 확인
        let sha = null;
        try {
            const existingResponse = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
                headers: {
                    'Authorization': `token ${this.settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (existingResponse.ok) {
                const existingData = await existingResponse.json();
                sha = existingData.sha;
            }
        } catch (error) {
            // 파일이 없으면 새로 생성
        }

        const response = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.settings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Save draft: ${draft.title || 'Untitled'}`,
                content: encodedContent,
                branch: 'main',
                ...(sha && { sha }) // 기존 파일이 있으면 SHA 포함
            })
        });

        if (!response.ok) {
            throw new Error(`GitHub 임시 저장 실패: ${response.status}`);
        }

        // 현재 임시 저장 ID를 로컬에 저장
        localStorage.setItem('current-draft-id', draftId);
        
        return response.json();
    }

    // 임시 저장 ID 생성
    generateDraftId() {
        // 기존 ID가 있으면 재사용, 없으면 새로 생성
        let draftId = localStorage.getItem('current-draft-id');
        if (!draftId) {
            draftId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        }
        return draftId;
    }

    // 임시 저장 불러오기 (GitHub 우선)
    async loadDraft() {
        try {
            // 먼저 GitHub에서 불러오기 시도
            if (this.settings.githubToken) {
                const cloudDraft = await this.loadDraftFromGitHub();
                if (cloudDraft) {
                    this.restoreFromDraft(cloudDraft);
                    this.showToast('클라우드에서 임시 저장 데이터를 불러왔습니다.', 'info');
                    return;
                }
            }
            
            // GitHub에 없으면 로컬에서 불러오기
            const draft = localStorage.getItem('article-draft');
            if (!draft) return;

            const data = JSON.parse(draft);
            
            // 24시간 이내 저장된 것만 불러오기
            const saveTime = new Date(data.timestamp);
            const now = new Date();
            const diffHours = (now - saveTime) / (1000 * 60 * 60);
            
            if (diffHours > 24) {
                localStorage.removeItem('article-draft');
                return;
            }

            this.restoreFromDraft(data);
            this.showToast('로컬에서 임시 저장 데이터를 불러왔습니다.', 'info');

        } catch (error) {
            console.error('임시 저장 데이터 로드 오류:', error);
        }
    }

    // GitHub에서 임시 저장 불러오기
    async loadDraftFromGitHub() {
        const draftId = localStorage.getItem('current-draft-id');
        if (!draftId) return null;

        const filename = `draft-${draftId}.json`;
        const path = `drafts/${filename}`;

        try {
            const response = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
                headers: {
                    'Authorization': `token ${this.settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                return null; // 파일이 없거나 접근 실패
            }

            const data = await response.json();
            const content = atob(data.content);
            const draft = JSON.parse(content);

            // 7일 이내 저장된 것만 불러오기 (클라우드는 더 오래 보관)
            const saveTime = new Date(draft.timestamp);
            const now = new Date();
            const diffDays = (now - saveTime) / (1000 * 60 * 60 * 24);
            
            if (diffDays > 7) {
                return null;
            }

            return draft;

        } catch (error) {
            console.error('GitHub 임시 저장 로드 오류:', error);
            return null;
        }
    }

    // 임시 저장 데이터로 폼 복원
    restoreFromDraft(data) {
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
            
            // 기사 카테고리 폴더만 처리 (authors, about 등 제외)
            const articleCategories = ['automotive', 'economy'];
            
            for (const folder of folders.filter(f => f.type === 'dir' && articleCategories.includes(f.name))) {
                const folderResponse = await fetch(folder.url);
                const files = await folderResponse.json();
                
                files.filter(f => f.name.endsWith('.md') && f.name !== '_index.md').forEach(file => {
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
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-file-alt fa-2x mb-2"></i>
                    <p class="small">아직 작성된 기사가 없습니다</p>
                </div>
            `;
            return;
        }

        // 카테고리별 한국어 이름 매핑
        const categoryMap = {
            'automotive': '자동차',
            'economy': '경제'
        };

        // 최신 날짜순으로 정렬 (파일명의 날짜 기준)
        articles.sort((a, b) => {
            const dateA = this.extractDateFromFilename(a.name);
            const dateB = this.extractDateFromFilename(b.name);
            return dateB - dateA;
        });

        container.innerHTML = articles.map(article => `
            <div class="recent-article">
                <h6>${this.formatArticleTitle(article.name)}</h6>
                <div class="meta">
                    <span class="badge ${article.category === 'automotive' ? 'bg-primary' : 'bg-success'}">${categoryMap[article.category] || article.category}</span>
                    <small class="text-muted ms-2">${this.formatDateFromFilename(article.name)}</small>
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

    // Cloudflare 설정은 이제 서버-사이드에서 처리됩니다

    // 설정 로드
    loadSettings() {
        // OpenAI API 키 로드
        if (this.settings.openaiApiKey) {
            document.getElementById('openaiApiKey').value = this.settings.openaiApiKey;
        }
        
        // GitHub 토큰 로드
        if (this.settings.githubToken) {
            document.getElementById('githubToken').value = this.settings.githubToken;
        }
        
        // Cloudflare 설정은 이제 서버에서 관리됩니다
    }

    // 미디어 관리 기능 제거됨 - 간단한 업로드만 유지

    // 업로드 전용 모드 표시 (미사용 - 미디어 관리 모달 제거됨)
    // 기존의 복잡한 미디어 관리 기능들이 모두 제거되었습니다.
    // 이제 "이미지 추가" 버튼을 통한 직접 업로드만 지원합니다.

    // 이전의 미디어 라이브러리 렌더링 기능들은 제거되었습니다
    // 이제 간단한 드래그 앤 드롭 업로드만 지원합니다

    // 이미지 URL 복사
    async copyImageUrl(imageUrl) {
        try {
            await navigator.clipboard.writeText(imageUrl);
            this.showToast('이미지 URL이 클립보드에 복사되었습니다.', 'success');
        } catch (error) {
            this.showToast('URL 복사에 실패했습니다.', 'error');
        }
    }

    // 미디어 삭제 기능은 제거되었습니다 - Cloudflare 대시보드에서 관리하세요

    // 미디어 필터링
    filterMedia(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredMedia = [...this.mediaLibrary];
        } else {
            this.filteredMedia = this.mediaLibrary.filter(image => 
                image.filename.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        this.renderMediaLibrary();
        document.getElementById('mediaCount').textContent = `총 ${this.filteredMedia.length}개 이미지`;
    }

    // 미디어 정렬
    sortMedia(sortType) {
        this.filteredMedia.sort((a, b) => {
            switch (sortType) {
                case 'date-desc':
                    return new Date(b.uploaded) - new Date(a.uploaded);
                case 'date-asc':
                    return new Date(a.uploaded) - new Date(b.uploaded);
                case 'name-asc':
                    return a.filename.localeCompare(b.filename);
                case 'size-desc':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });
        this.renderMediaLibrary();
    }

    // 미디어 뷰 설정
    setMediaView(viewType) {
        this.mediaView = viewType;
        
        // 버튼 활성화 상태 업데이트
        document.getElementById('gridViewBtn').classList.toggle('active', viewType === 'grid');
        document.getElementById('listViewBtn').classList.toggle('active', viewType === 'list');
        
        this.renderMediaLibrary();
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 임시 저장 목록 로드
    async loadDraftList() {
        const loadingIndicator = document.getElementById('draftLoadingIndicator');
        const draftList = document.getElementById('draftList');
        const emptyState = document.getElementById('draftEmptyState');
        
        loadingIndicator.style.display = 'block';
        draftList.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            const drafts = [];
            
            // 로컬 임시 저장 추가
            const localDraft = localStorage.getItem('article-draft');
            if (localDraft) {
                try {
                    const data = JSON.parse(localDraft);
                    drafts.push({
                        id: 'local',
                        type: 'local',
                        title: data.title || '제목 없음',
                        timestamp: data.timestamp,
                        description: data.description || '',
                        category: data.category || 'automotive'
                    });
                } catch (error) {
                    console.error('로컬 임시 저장 파싱 오류:', error);
                }
            }

            // GitHub 임시 저장 목록 로드
            if (this.settings.githubToken) {
                const cloudDrafts = await this.loadCloudDraftList();
                drafts.push(...cloudDrafts);
            }

            this.renderDraftList(drafts);
            document.getElementById('draftCount').textContent = `총 ${drafts.length}개 임시저장`;

        } catch (error) {
            console.error('임시 저장 목록 로드 오류:', error);
            this.showToast('임시 저장 목록을 불러올 수 없습니다.', 'error');
            emptyState.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // GitHub 임시 저장 목록 로드
    async loadCloudDraftList() {
        try {
            const response = await fetch('https://api.github.com/repos/gkstn15234/123/contents/drafts', {
                headers: {
                    'Authorization': `token ${this.settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                return []; // drafts 폴더가 없으면 빈 배열 반환
            }

            const files = await response.json();
            const drafts = [];

            for (const file of files.filter(f => f.name.startsWith('draft-') && f.name.endsWith('.json'))) {
                try {
                    const fileResponse = await fetch(file.download_url);
                    const content = await fileResponse.text();
                    const draft = JSON.parse(content);
                    
                    drafts.push({
                        id: file.name.replace('draft-', '').replace('.json', ''),
                        type: 'cloud',
                        title: draft.title || '제목 없음',
                        timestamp: draft.timestamp,
                        description: draft.description || '',
                        category: draft.category || 'automotive',
                        sha: file.sha
                    });
                } catch (error) {
                    console.error(`임시 저장 파일 ${file.name} 파싱 오류:`, error);
                }
            }

            return drafts;
        } catch (error) {
            console.error('클라우드 임시 저장 목록 로드 오류:', error);
            return [];
        }
    }

    // 임시 저장 목록 렌더링
    renderDraftList(drafts) {
        const draftList = document.getElementById('draftList');
        const emptyState = document.getElementById('draftEmptyState');
        
        if (drafts.length === 0) {
            draftList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        draftList.style.display = 'block';
        emptyState.style.display = 'none';

        // 최신순으로 정렬
        drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        draftList.innerHTML = drafts.map(draft => `
            <div class="draft-item border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${draft.title}</h6>
                        <p class="text-muted small mb-2">${draft.description || '요약 없음'}</p>
                        <div class="d-flex gap-2">
                            <span class="badge ${draft.category === 'automotive' ? 'bg-primary' : 'bg-success'}">${draft.category === 'automotive' ? '자동차' : '경제'}</span>
                            <span class="badge ${draft.type === 'cloud' ? 'bg-info' : 'bg-secondary'}">${draft.type === 'cloud' ? '클라우드' : '로컬'}</span>
                            <small class="text-muted">${this.formatDate(draft.timestamp)}</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="editor.loadSpecificDraft('${draft.id}', '${draft.type}')" title="불러오기">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="editor.deleteSpecificDraft('${draft.id}', '${draft.type}')" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 특정 임시 저장 불러오기
    async loadSpecificDraft(draftId, type) {
        try {
            let draft = null;

            if (type === 'local') {
                const localDraft = localStorage.getItem('article-draft');
                if (localDraft) {
                    draft = JSON.parse(localDraft);
                }
            } else if (type === 'cloud') {
                const filename = `draft-${draftId}.json`;
                const path = `drafts/${filename}`;

                const response = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${this.settings.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = atob(data.content);
                    draft = JSON.parse(content);
                    
                    // 클라우드에서 불러온 것을 현재 작업으로 설정
                    localStorage.setItem('current-draft-id', draftId);
                }
            }

            if (draft) {
                this.restoreFromDraft(draft);
                this.showToast('임시 저장 데이터를 불러왔습니다.', 'success');
                
                // 모달 닫기
                const modal = bootstrap.Modal.getInstance(document.getElementById('draftManagerModal'));
                modal?.hide();
            } else {
                this.showToast('임시 저장 데이터를 찾을 수 없습니다.', 'error');
            }

        } catch (error) {
            console.error('임시 저장 불러오기 오류:', error);
            this.showToast('임시 저장 데이터를 불러올 수 없습니다.', 'error');
        }
    }

    // 특정 임시 저장 삭제
    async deleteSpecificDraft(draftId, type) {
        if (!confirm('이 임시 저장을 삭제하시겠습니까?')) {
            return;
        }

        try {
            if (type === 'local') {
                localStorage.removeItem('article-draft');
                localStorage.removeItem('current-draft-id');
            } else if (type === 'cloud') {
                const filename = `draft-${draftId}.json`;
                const path = `drafts/${filename}`;

                // 파일 정보 먼저 가져오기 (SHA 필요)
                const getResponse = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${this.settings.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    
                    // 파일 삭제
                    const deleteResponse = await fetch(`https://api.github.com/repos/gkstn15234/123/contents/${path}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `token ${this.settings.githubToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Delete draft: ${draftId}`,
                            sha: fileData.sha,
                            branch: 'main'
                        })
                    });

                    if (!deleteResponse.ok) {
                        throw new Error('클라우드 임시 저장 삭제 실패');
                    }
                }
            }

            this.showToast('임시 저장이 삭제되었습니다.', 'success');
            this.loadDraftList(); // 목록 새로고침

        } catch (error) {
            console.error('임시 저장 삭제 오류:', error);
            this.showToast('임시 저장 삭제에 실패했습니다.', 'error');
        }
    }

    // 오래된 임시 저장 정리
    async cleanOldDrafts() {
        if (!confirm('7일 이상 된 임시 저장을 모두 삭제하시겠습니까?')) {
            return;
        }

        try {
            const now = new Date();
            let deletedCount = 0;

            // 로컬 임시 저장 확인
            const localDraft = localStorage.getItem('article-draft');
            if (localDraft) {
                try {
                    const data = JSON.parse(localDraft);
                    const saveTime = new Date(data.timestamp);
                    const diffDays = (now - saveTime) / (1000 * 60 * 60 * 24);
                    
                    if (diffDays > 7) {
                        localStorage.removeItem('article-draft');
                        deletedCount++;
                    }
                } catch (error) {
                    // 파싱 오류 시 삭제
                    localStorage.removeItem('article-draft');
                    deletedCount++;
                }
            }

            // 클라우드 임시 저장 정리
            if (this.settings.githubToken) {
                const cloudDrafts = await this.loadCloudDraftList();
                
                for (const draft of cloudDrafts) {
                    const saveTime = new Date(draft.timestamp);
                    const diffDays = (now - saveTime) / (1000 * 60 * 60 * 24);
                    
                    if (diffDays > 7) {
                        await this.deleteSpecificDraft(draft.id, 'cloud');
                        deletedCount++;
                    }
                }
            }

            this.showToast(`${deletedCount}개의 오래된 임시 저장을 정리했습니다.`, 'success');
            this.loadDraftList(); // 목록 새로고침

        } catch (error) {
            console.error('임시 저장 정리 오류:', error);
            this.showToast('임시 저장 정리에 실패했습니다.', 'error');
        }
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

    // 워드프레스 가져오기 기능
    setupWordPressImport() {
        const wpFileInput = document.getElementById('wpExportFile');
        const startImportBtn = document.getElementById('startWpImport');
        const selectAllCheckbox = document.getElementById('selectAllPosts');
        
        if (wpFileInput) {
            wpFileInput.addEventListener('change', (e) => this.handleWpFileSelect(e));
        }
        
        if (startImportBtn) {
            startImportBtn.addEventListener('click', () => this.startWordPressImport());
        }
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.toggleAllPosts(e.target.checked));
        }
    }

    async handleWpFileSelect(event) {
        const files = event.target.files;
        if (!files.length) {
            document.getElementById('wpFilePreview').style.display = 'none';
            document.getElementById('startWpImport').disabled = true;
            return;
        }

        // 로딩 상태 표시
        const statusDiv = document.getElementById('wpImportStatus');
        const progressDiv = document.getElementById('wpImportProgress');
        
        statusDiv.textContent = '파일을 분석하는 중...';
        progressDiv.style.display = 'block';

        try {
            const parsedPosts = [];
            let totalFiles = files.length;
            let processedFiles = 0;
            
            for (const file of files) {
                // 파일 크기 검증 (50MB 제한)
                if (file.size > 50 * 1024 * 1024) {
                    throw new Error(`파일이 너무 큽니다: ${file.name} (최대 50MB)`);
                }

                // 파일 형식 검증
                if (!file.name.match(/\.(xml|json)$/i)) {
                    throw new Error(`지원하지 않는 파일 형식: ${file.name}`);
                }

                statusDiv.textContent = `파일 분석 중: ${file.name} (${processedFiles + 1}/${totalFiles})`;
                
                const posts = await this.parseWordPressFile(file);
                parsedPosts.push(...posts);
                processedFiles++;

                // 진행률 업데이트
                const progress = (processedFiles / totalFiles) * 100;
                document.getElementById('wpImportProgressBar').style.width = `${progress}%`;
            }

            if (parsedPosts.length === 0) {
                throw new Error('가져올 수 있는 발행된 글이 없습니다.');
            }

            this.displayWordPressPosts(parsedPosts);
            document.getElementById('startWpImport').disabled = false;
            progressDiv.style.display = 'none';
            
            this.showToast(`${parsedPosts.length}개의 글을 발견했습니다.`, 'success');
            
        } catch (error) {
            console.error('파일 파싱 오류:', error);
            this.showToast('파일 분석 실패: ' + error.message, 'error');
            document.getElementById('wpFilePreview').style.display = 'none';
            document.getElementById('startWpImport').disabled = true;
            progressDiv.style.display = 'none';
        }
    }

    async parseWordPressFile(file) {
        const text = await this.readFileAsText(file);
        
        if (file.name.endsWith('.xml')) {
            return this.parseWordPressXML(text);
        } else if (file.name.endsWith('.json')) {
            return this.parseWordPressJSON(text);
        } else {
            throw new Error('지원되지 않는 파일 형식입니다.');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'utf-8');
        });
    }

    parseWordPressXML(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        
        const items = doc.querySelectorAll('item');
        const posts = [];
        const attachments = [];

        // 먼저 모든 첨부파일 정보 수집
        items.forEach(item => {
            const postType = this.getElementText(item, 'wp:post_type');
            const status = this.getElementText(item, 'wp:status');
            
            if (postType === 'attachment') {
                const attachment = {
                    id: this.getElementText(item, 'wp:post_id'),
                    title: this.getElementText(item, 'title'),
                    url: this.getElementText(item, 'wp:attachment_url'),
                    parent: this.getElementText(item, 'wp:post_parent'),
                    description: this.getElementText(item, 'content:encoded'),
                    alt: this.getElementText(item, 'wp:postmeta wp:meta_value'), // _wp_attachment_image_alt
                    caption: this.getElementText(item, 'excerpt:encoded')
                };
                attachments.push(attachment);
            }
        });

        // 포스트 파싱 및 첨부파일 연결
        items.forEach(item => {
            const postType = this.getElementText(item, 'wp:post_type');
            const status = this.getElementText(item, 'wp:status');
            
            if (postType === 'post' && status === 'publish') {
                const postId = this.getElementText(item, 'wp:post_id');
                const relatedAttachments = attachments.filter(att => att.parent === postId);
                
                const post = {
                    id: postId,
                    title: this.getElementText(item, 'title'),
                    content: this.getElementText(item, 'content:encoded'),
                    excerpt: this.getElementText(item, 'excerpt:encoded'),
                    author: this.getElementText(item, 'dc:creator'),
                    pubDate: this.getElementText(item, 'pubDate'),
                    categories: this.extractCategories(item),
                    tags: this.extractTags(item),
                    slug: this.getElementText(item, 'wp:post_name'),
                    status: status,
                    attachments: relatedAttachments,
                    featuredImage: this.extractFeaturedImage(item, attachments)
                };
                posts.push(post);
            }
        });

        return posts;
    }

    extractFeaturedImage(item, attachments) {
        // _thumbnail_id 메타값 찾기
        const metaElements = item.querySelectorAll('wp\\:postmeta, postmeta');
        for (const meta of metaElements) {
            const key = this.getElementText(meta, 'wp:meta_key') || this.getElementText(meta, 'meta_key');
            const value = this.getElementText(meta, 'wp:meta_value') || this.getElementText(meta, 'meta_value');
            
            if (key === '_thumbnail_id' && value) {
                const featuredAttachment = attachments.find(att => att.id === value);
                return featuredAttachment ? featuredAttachment.url : null;
            }
        }
        return null;
    }

    parseWordPressJSON(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            
            // WP REST API 형식 또는 WP CLI 형식 지원
            const posts = data.posts || data || [];
            
            return posts.filter(post => post.status === 'publish').map(post => ({
                title: post.title?.rendered || post.title,
                content: post.content?.rendered || post.content,
                excerpt: post.excerpt?.rendered || post.excerpt,
                author: post.author_name || post.author,
                pubDate: post.date || post.post_date,
                categories: post.categories || [],
                tags: post.tags || [],
                slug: post.slug || post.post_name,
                status: post.status
            }));
        } catch (error) {
            throw new Error('JSON 파싱 실패: ' + error.message);
        }
    }

    getElementText(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent : '';
    }

    extractCategories(item) {
        const categories = [];
        const categoryElements = item.querySelectorAll('category[domain="category"]');
        categoryElements.forEach(cat => {
            const nicename = cat.getAttribute('nicename');
            if (nicename) categories.push(nicename);
        });
        return categories;
    }

    extractTags(item) {
        const tags = [];
        const tagElements = item.querySelectorAll('category[domain="post_tag"]');
        tagElements.forEach(tag => {
            const nicename = tag.getAttribute('nicename');
            if (nicename) tags.push(nicename);
        });
        return tags;
    }

    displayWordPressPosts(posts) {
        const preview = document.getElementById('wpFilePreview');
        const postsList = document.getElementById('wpPostsList');
        
        if (!preview || !postsList) return;

        postsList.innerHTML = '';
        
        posts.forEach((post, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input post-checkbox" 
                           data-index="${index}" checked>
                </td>
                <td>
                    <div class="fw-bold">${this.escapeHtml(post.title)}</div>
                    <small class="text-muted">${this.escapeHtml(post.slug)}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${post.categories.join(', ') || '미분류'}</span>
                </td>
                <td>
                    <small>${new Date(post.pubDate).toLocaleDateString('ko-KR')}</small>
                </td>
                <td>
                    <span class="badge bg-success">${post.status}</span>
                </td>
            `;
            postsList.appendChild(row);
        });

        this.wordPressPosts = posts;
        preview.style.display = 'block';
    }

    toggleAllPosts(checked) {
        const checkboxes = document.querySelectorAll('.post-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    async startWordPressImport() {
        const selectedPosts = this.getSelectedPosts();
        if (!selectedPosts.length) {
            this.showToast('가져올 글을 선택해주세요.', 'warning');
            return;
        }

        // 설정 검증
        const importImages = document.getElementById('importImages').checked;
        const convertToHugo = document.getElementById('convertToHugo').checked;
        const categoryMapping = document.getElementById('categoryMapping').value;
        const authorMapping = document.getElementById('authorMapping').value;
        const publishImmediately = document.getElementById('publishImmediately').checked;

        // 이미지 가져오기는 이제 서버에서 자동으로 처리됩니다

        // GitHub 설정 확인 (즉시 발행 옵션이 켜져있는 경우)
        if (publishImmediately) {
            const githubToken = localStorage.getItem('githubToken');
            if (!githubToken) {
                this.showToast('즉시 발행을 위해 GitHub 연동을 완료해주세요.', 'warning');
                return;
            }
        }

        const progressDiv = document.getElementById('wpImportProgress');
        const progressBar = document.getElementById('wpImportProgressBar');
        const statusDiv = document.getElementById('wpImportStatus');
        const resultsDiv = document.getElementById('wpImportResults');
        const resultsList = document.getElementById('wpImportResultsList');

        // UI 초기화
        progressDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        resultsList.innerHTML = '';
        document.getElementById('startWpImport').disabled = true;

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const startTime = Date.now();

        try {
            for (let i = 0; i < selectedPosts.length; i++) {
                const post = selectedPosts[i];
                const progress = ((i + 1) / selectedPosts.length) * 100;
                
                progressBar.style.width = `${progress}%`;
                statusDiv.textContent = `처리 중: ${this.truncateText(post.title, 30)} (${i + 1}/${selectedPosts.length})`;

                try {
                    // 중복 확인
                    const isDuplicate = await this.checkDuplicatePost(post);
                    if (isDuplicate) {
                        skippedCount++;
                        this.addImportResult(post.title, 'warning', '이미 존재하는 글입니다 (건너뜀).');
                        continue;
                    }

                    await this.importSinglePost(post, {
                        importImages,
                        convertToHugo,
                        categoryMapping,
                        authorMapping,
                        publishImmediately
                    });
                    
                    successCount++;
                    this.addImportResult(post.title, 'success', 
                        publishImmediately ? '성공적으로 발행했습니다.' : '임시저장에 성공했습니다.');
                    
                } catch (error) {
                    errorCount++;
                    const errorMsg = this.getReadableErrorMessage(error);
                    this.addImportResult(post.title, 'error', errorMsg);
                    console.error(`${post.title} 가져오기 실패:`, error);
                }

                // API 제한 방지를 위한 적응형 지연
                const delay = importImages ? 1000 : 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            }

        } catch (error) {
            console.error('가져오기 프로세스 오류:', error);
            this.showToast('가져오기 중 심각한 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            // 완료 처리
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000);
            
            statusDiv.textContent = `완료 (${duration}초): 성공 ${successCount}개, 실패 ${errorCount}개, 건너뜀 ${skippedCount}개`;
            resultsDiv.style.display = 'block';
            document.getElementById('startWpImport').disabled = false;
            
            // 결과에 따른 메시지
            if (errorCount === 0 && skippedCount === 0) {
                this.showToast(`모든 글을 성공적으로 가져왔습니다! (${successCount}개)`, 'success');
            } else if (successCount > 0) {
                this.showToast(`가져오기 완료: 성공 ${successCount}개, 실패 ${errorCount}개, 건너뜀 ${skippedCount}개`, 'warning');
            } else {
                this.showToast('가져오기에 실패했습니다. 설정을 확인해주세요.', 'error');
            }
        }
    }

    async checkDuplicatePost(post) {
        // 간단한 중복 확인 로직 (제목 기반)
        // 실제로는 GitHub API를 통해 파일 존재 여부를 확인할 수 있음
        try {
            const date = new Date(post.pubDate);
            const slug = post.slug || this.generateSlug(post.title);
            const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${slug}.md`;
            
            // 로컬 스토리지에서 최근 업로드된 파일명 확인
            const recentUploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
            return recentUploads.includes(filename);
        } catch (error) {
            return false; // 에러 시 중복이 아닌 것으로 간주
        }
    }

    getReadableErrorMessage(error) {
        if (error.message.includes('fetch')) {
            return '네트워크 연결 오류';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
            return 'GitHub 토큰이 유효하지 않습니다';
        } else if (error.message.includes('rate limit')) {
            return 'API 요청 한도 초과 (잠시 후 다시 시도)';
        } else if (error.message.includes('Cloudflare')) {
            return 'Cloudflare 이미지 업로드 실패';
        } else {
            return error.message || '알 수 없는 오류';
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getSelectedPosts() {
        const checkboxes = document.querySelectorAll('.post-checkbox:checked');
        const selectedPosts = [];
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            if (this.wordPressPosts && this.wordPressPosts[index]) {
                selectedPosts.push(this.wordPressPosts[index]);
            }
        });
        
        return selectedPosts;
    }

    async importSinglePost(post, options) {
        // 이미지 처리 및 URL 매핑 정보 수집
        let content = post.content;
        let imageUrlMap = new Map(); // 원본 URL -> Cloudflare URL 매핑
        
        if (options.importImages) {
            const result = await this.processPostImagesWithMapping(content, post);
            content = result.content;
            imageUrlMap = result.urlMap;
        }

        // Hugo 형식으로 변환
        if (options.convertToHugo) {
            content = this.convertToHugoFormat(content);
        }

        // 카테고리 매핑
        const category = this.mapCategory(post.categories, options.categoryMapping);
        
        // 이미지 URL 업데이트된 포스트 객체 생성
        const updatedPost = {
            ...post,
            content,
            processedImages: this.updateImageUrls(post, imageUrlMap)
        };
        
        // 메타데이터 생성
        const frontMatter = this.generateFrontMatter(updatedPost, {
            category,
            author: options.authorMapping
        });

        // 파일명 생성
        const date = new Date(post.pubDate);
        const slug = post.slug || this.generateSlug(post.title);
        const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${slug}.md`;

        // 최종 콘텐츠
        const finalContent = frontMatter + '\n\n' + content;

        // GitHub에 업로드
        if (options.publishImmediately) {
            await this.uploadToGitHub(finalContent, filename, category);
        } else {
            // 임시저장으로 처리
            const draftData = {
                title: post.title,
                content: finalContent,
                filename: filename,
                category: category,
                created: new Date().toISOString()
            };
            await this.saveDraftToGitHub(draftData);
        }
    }

    async processPostImagesWithMapping(content, post) {
        const imageData = [];
        const urlMap = new Map();

        // 본문 이미지 수집
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
            const originalUrl = match[1];
            if (originalUrl.startsWith('http')) {
                imageData.push({
                    originalUrl,
                    promise: this.downloadAndUploadImage(originalUrl)
                });
            }
        }

        // Featured Image 처리
        if (post.featuredImage && post.featuredImage.startsWith('http')) {
            imageData.push({
                originalUrl: post.featuredImage,
                promise: this.downloadAndUploadImage(post.featuredImage)
            });
        }

        // 첨부파일 이미지 처리
        if (post.attachments) {
            post.attachments.forEach(attachment => {
                if (this.isImageFile(attachment.url) && attachment.url.startsWith('http')) {
                    imageData.push({
                        originalUrl: attachment.url,
                        promise: this.downloadAndUploadImage(attachment.url)
                    });
                }
            });
        }

        // 모든 이미지 업로드 완료 대기
        const uploadResults = await Promise.allSettled(imageData.map(data => data.promise));
        
        // URL 매핑 생성 및 본문 URL 교체
        let processedContent = content;
        uploadResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                const originalUrl = imageData[index].originalUrl;
                const cloudflareUrl = result.value;
                urlMap.set(originalUrl, cloudflareUrl);
                processedContent = processedContent.replace(new RegExp(this.escapeRegex(originalUrl), 'g'), cloudflareUrl);
            }
        });

        return {
            content: processedContent,
            urlMap
        };
    }

    updateImageUrls(post, urlMap) {
        const images = [];
        
        // Featured Image URL 업데이트
        if (post.featuredImage) {
            const updatedUrl = urlMap.get(post.featuredImage) || post.featuredImage;
            images.push(updatedUrl);
        }

        // 본문 이미지 URL 업데이트
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        const addedUrls = new Set(images);
        
        while ((match = imgRegex.exec(post.content)) !== null) {
            const originalUrl = match[1];
            const updatedUrl = urlMap.get(originalUrl) || originalUrl;
            
            if (!addedUrls.has(updatedUrl) && images.length < 3) {
                images.push(updatedUrl);
                addedUrls.add(updatedUrl);
            }
        }

        // 첨부파일 이미지 URL 업데이트
        if (post.attachments) {
            post.attachments.forEach(attachment => {
                if (this.isImageFile(attachment.url)) {
                    const updatedUrl = urlMap.get(attachment.url) || attachment.url;
                    
                    if (!addedUrls.has(updatedUrl) && images.length < 3) {
                        images.push(updatedUrl);
                        addedUrls.add(updatedUrl);
                    }
                }
            });
        }

        return images;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async processPostImages(content) {
        // WordPress 이미지 URL 찾기
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        const imageData = [];

        while ((match = imgRegex.exec(content)) !== null) {
            const originalUrl = match[1];
            
            // 외부 이미지인 경우 Cloudflare로 업로드
            if (originalUrl.startsWith('http')) {
                imageData.push({
                    originalUrl,
                    promise: this.downloadAndUploadImage(originalUrl)
                });
            }
        }

        // 모든 이미지 처리 완료 대기
        const uploadResults = await Promise.allSettled(imageData.map(data => data.promise));
        
        // URL 교체
        let processedContent = content;
        uploadResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                const originalUrl = imageData[index].originalUrl;
                processedContent = processedContent.replace(originalUrl, result.value);
            }
        });

        return processedContent;
    }

    async downloadAndUploadImage(imageUrl) {
        try {
            // 이미지 다운로드
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('이미지 다운로드 실패');
            
            const blob = await response.blob();
            const filename = this.extractFilenameFromUrl(imageUrl);
            
            // Cloudflare에 업로드
            const uploadedUrl = await this.uploadToCloudflare(new File([blob], filename));
            return uploadedUrl;
            
        } catch (error) {
            console.error('이미지 처리 실패:', imageUrl, error);
            return imageUrl; // 원본 URL 유지
        }
    }

    extractFilenameFromUrl(url) {
        const pathname = new URL(url).pathname;
        const filename = pathname.split('/').pop();
        return filename || 'image.jpg';
    }

    convertToHugoFormat(content) {
        // WordPress 특화 태그를 Hugo 형식으로 변환
        let converted = content;
        
        // [caption] 단축코드 처리
        converted = converted.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, (match, content) => {
            const imgMatch = content.match(/<img[^>]+>/);
            const captionMatch = content.match(/>(.*?)$/s);
            
            if (imgMatch && captionMatch) {
                return `${imgMatch[0]}\n*${captionMatch[1].trim()}*`;
            }
            return content;
        });

        // WordPress 갤러리를 단순 이미지 리스트로 변환
        converted = converted.replace(/\[gallery[^\]]*\]/g, '<!-- WordPress Gallery -->');
        
        // 불필요한 WordPress 클래스 제거
        converted = converted.replace(/class="[^"]*wp-[^"]*"/g, '');
        
        return converted;
    }

    mapCategory(categories, mapping) {
        if (mapping === 'auto' && categories.length > 0) {
            // 기본 카테고리 매핑 로직
            const categoryMap = {
                'automotive': 'automotive',
                'car': 'automotive',
                'vehicle': 'automotive',
                'economy': 'economy',
                'business': 'economy',
                'finance': 'economy',
                'technology': 'technology',
                'tech': 'technology',
                'lifestyle': 'lifestyle',
                'life': 'lifestyle'
            };
            
            for (const cat of categories) {
                const mapped = categoryMap[cat.toLowerCase()];
                if (mapped) return mapped;
            }
            
            return categories[0]; // 첫 번째 카테고리 사용
        }
        
        return mapping === 'auto' ? 'automotive' : mapping;
    }

    generateFrontMatter(post, options) {
        const date = new Date(post.pubDate);
        
        // 현재 프로젝트 구조에 맞춘 Front Matter 생성
        const frontMatter = [
            '---',
            `title: "${this.escapeYaml(post.title)}"`,
            `description: "${this.escapeYaml(this.extractDescription(post))}"`,
            `date: ${date.toISOString()}`,
            `draft: false`,
            `categories: ["${this.getKoreanCategoryName(options.category)}"]`,
            `tags: [${post.tags.map(tag => `"${this.escapeYaml(tag)}"`).join(', ')}]`
        ];

        // 이미지 배열 추가 (현재 프로젝트 구조와 동일)
        const images = this.generateImageArray(post);
        if (images.length > 0) {
            frontMatter.push(`images: [`);
            images.forEach(img => {
                frontMatter.push(`  "${img}"`);
            });
            frontMatter.push(`]`);
        }

        frontMatter.push(`author: "${this.mapAuthorName(post.author)}"`);
        frontMatter.push('---');
        
        return frontMatter.join('\n');
    }

    getKoreanCategoryName(category) {
        const categoryMap = {
            'automotive': '자동차',
            'economy': '경제',
            'technology': '기술',
            'lifestyle': '라이프스타일',
            'politics': '정치',
            'society': '사회',
            'culture': '문화',
            'sports': '스포츠'
        };
        
        return categoryMap[category] || '자동차';
    }

    generateImageArray(post) {
        // 이미 처리된 이미지 배열이 있으면 사용
        if (post.processedImages) {
            return post.processedImages;
        }

        const images = [];
        
        // 대표 이미지 (Featured Image) 먼저 추가
        if (post.featuredImage) {
            images.push(post.featuredImage);
        }

        // 본문에서 이미지 추출
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
            const imgUrl = match[1];
            if (!images.includes(imgUrl) && images.length < 3) {
                images.push(imgUrl);
            }
        }

        // 첨부파일에서 이미지 추가 (최대 3개까지)
        if (post.attachments) {
            post.attachments.forEach(attachment => {
                if (this.isImageFile(attachment.url) && !images.includes(attachment.url) && images.length < 3) {
                    images.push(attachment.url);
                }
            });
        }

        return images;
    }

    isImageFile(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const urlLower = url.toLowerCase();
        return imageExtensions.some(ext => urlLower.includes(ext));
    }

    mapAuthorName(wpAuthor) {
        // 한국어 작성자명을 영문 slug로 매핑
        const authorMap = {
            '오은진': 'oh-eun-jin',
            '김철수': 'kim-chul-su',
            '박영희': 'park-young-hee',
            '이민수': 'lee-min-su',
            '정하나': 'jung-ha-na'
        };
        
        // 워드프레스 작성자명이 한국어인 경우 매핑
        if (authorMap[wpAuthor]) {
            return authorMap[wpAuthor];
        }
        
        // 영문인 경우 소문자로 변환하고 공백을 하이픈으로 변경
        return wpAuthor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    extractDescription(post) {
        // excerpt가 있으면 사용, 없으면 내용에서 추출
        if (post.excerpt && post.excerpt.trim()) {
            return this.stripHtml(post.excerpt).substring(0, 160);
        }
        
        const plainText = this.stripHtml(post.content);
        return plainText.substring(0, 160);
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    escapeYaml(text) {
        if (!text) return '';
        return text.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addImportResult(title, type, message) {
        const resultsList = document.getElementById('wpImportResultsList');
        if (!resultsList) return;

        const li = document.createElement('li');
        li.className = `import-result ${type}`;
        
        let icon;
        switch(type) {
            case 'success':
                icon = 'fa-check-circle text-success';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle text-warning';
                break;
            case 'error':
                icon = 'fa-exclamation-circle text-danger';
                break;
            default:
                icon = 'fa-info-circle text-info';
        }
        
        li.innerHTML = `
            <i class="fas ${icon} me-2"></i>
            <strong>${this.escapeHtml(title)}</strong>: ${this.escapeHtml(message)}
        `;
        
        resultsList.appendChild(li);
    }

    // 유틸리티 메서드들
    formatArticleTitle(filename) {
        return filename
            .replace('.md', '')
            .replace(/^\d{4}-\d{2}-\d{2}-/, '') // 날짜 제거
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()); // 단어 첫글자 대문자
    }

    extractDateFromFilename(filename) {
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? new Date(match[1]) : new Date(0);
    }

    formatDateFromFilename(filename) {
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const date = new Date(match[1]);
            return date.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
        return '';
    }
}

// 에디터 인스턴스 생성
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new SimpleEditor();
}); 