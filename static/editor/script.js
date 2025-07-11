/**
 * 🚀 오토데일리 AI 에디터 Pro - 고급 기능 스크립트
 */

class AutoDailyEditor {
    constructor() {
        this.currentTheme = 'dark';
        this.articles = [];
        this.filteredArticles = [];
        this.currentFilter = 'all';
        this.githubToken = '';
        this.repoOwner = 'gkstn15234';
        this.repoName = 'news';
        
        this.init();
    }

    // 🎯 초기화
    init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.initializeDateTime();
        this.setupPreviewUpdate();
        this.loadStoredData();
        this.initializeArticleManagement();
        this.addAnimations();
    }

    // 🎨 이벤트 리스너 설정
    setupEventListeners() {
        // 테마 토글
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // AI 글작성 버튼
        document.getElementById('aiWriteBtn')?.addEventListener('click', () => {
            this.showAIWriteModal();
        });

        // 기사 관리 새로고침
        document.getElementById('refreshArticles')?.addEventListener('click', () => {
            this.loadArticles();
        });

        // 카테고리 필터
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterArticles(e.target.dataset.filter);
            });
        });

        // 탭 전환 시 기사 목록 로드
        document.getElementById('manage-tab')?.addEventListener('shown.bs.tab', () => {
            if (this.articles.length === 0) {
                this.loadArticles();
            }
        });

        // 글자 수 카운터
        document.getElementById('description')?.addEventListener('input', (e) => {
            document.getElementById('descLength').textContent = e.target.value.length;
        });

        // 드래그 앤 드롭
        this.setupDragAndDrop();

        // 폼 유효성 검사
        this.setupFormValidation();
    }

    // 🌙 테마 관리
    initializeTheme() {
        const savedTheme = localStorage.getItem('editor-theme') || 'dark';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // 애니메이션 효과
        document.body.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        const body = document.body;
        const html = document.documentElement;
        const themeIcon = document.getElementById('themeIcon');

        if (theme === 'light') {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fas fa-sun';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            html.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-moon';
        }

        localStorage.setItem('editor-theme', theme);
    }

    // ⏰ 날짜/시간 초기화
    initializeDateTime() {
        const now = new Date();
        const kstOffset = 9 * 60; // 한국 시간 오프셋 (분)
        const kstTime = new Date(now.getTime() + (kstOffset * 60 * 1000));
        
        const publishDateInput = document.getElementById('publishDate');
        if (publishDateInput) {
            const formattedDate = kstTime.toISOString().slice(0, 16);
            publishDateInput.value = formattedDate;
        }
    }

    // 👁️ 미리보기 업데이트
    setupPreviewUpdate() {
        const inputs = ['title', 'content', 'description', 'author', 'category'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updatePreview());
            }
        });
    }

    updatePreview() {
        const title = document.getElementById('title')?.value || '';
        const content = document.getElementById('content')?.value || '';
        const description = document.getElementById('description')?.value || '';
        const author = document.getElementById('author')?.value || '오은진';
        const category = document.getElementById('category')?.value || 'automotive';
        const publishDate = document.getElementById('publishDate')?.value || '';

        const previewContent = document.getElementById('preview');
        if (!previewContent) return;

        if (!title && !content && !description) {
            previewContent.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="fas fa-newspaper fa-4x mb-4 text-primary"></i>
                    <h5 class="text-light">실시간 미리보기</h5>
                    <p class="text-muted">기사 정보를 입력하면 여기에 미리보기가 표시됩니다</p>
                </div>
            `;
            return;
        }

        const categoryIcon = category === 'automotive' ? '🚗' : '📈';
        const categoryName = category === 'automotive' ? '자동차' : '경제';
        const formattedDate = publishDate ? new Date(publishDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        const markdownContent = content ? marked.parse(content) : '';

        previewContent.innerHTML = `
            <div class="article-preview fade-in-up">
                <div class="d-flex align-items-center mb-3">
                    <span class="badge bg-primary me-2">${categoryIcon} ${categoryName}</span>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                
                <h1 class="preview-title mb-3">${title}</h1>
                
                ${description ? `
                    <div class="alert glass-card border-info mb-4">
                        <i class="fas fa-quote-left text-info me-2"></i>
                        <em>${description}</em>
                    </div>
                ` : ''}
                
                <div class="preview-meta mb-4">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user-circle text-primary me-2"></i>
                        <span class="text-light">${author}</span>
                    </div>
                </div>
                
                <div class="preview-body">
                    ${markdownContent}
                </div>
            </div>
        `;
    }

    // 📂 기사 관리 초기화
    initializeArticleManagement() {
        this.loadStoredGithubToken();
    }

    // 📰 기사 목록 로드
    async loadArticles() {
        const gridElement = document.getElementById('articlesGrid');
        if (!gridElement) return;

        // 로딩 상태 표시
        gridElement.innerHTML = `
            <div class="col-12 text-center">
                <div class="glass-card">
                    <div class="card-body py-5">
                        <div class="loading-spinner mb-3"></div>
                        <p class="text-muted">기사 목록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;

        try {
            // Automotive 및 Economy 카테고리의 기사들을 가져옴
            const [automotiveFiles, economyFiles] = await Promise.all([
                this.fetchGithubContents('content/automotive'),
                this.fetchGithubContents('content/economy')
            ]);

            // MD 파일만 필터링하고 _index.md 제외
            const automotiveArticles = automotiveFiles
                .filter(file => file.name.endsWith('.md') && file.name !== '_index.md')
                .map(file => ({ ...file, category: 'automotive' }));

            const economyArticles = economyFiles
                .filter(file => file.name.endsWith('.md') && file.name !== '_index.md')
                .map(file => ({ ...file, category: 'economy' }));

            this.articles = [...automotiveArticles, ...economyArticles];
            
            // 각 기사의 메타데이터 로드
            await this.loadArticleMetadata();
            
            this.filterArticles(this.currentFilter);

        } catch (error) {
            console.error('기사 목록 로드 실패:', error);
            gridElement.innerHTML = `
                <div class="col-12 text-center">
                    <div class="glass-card">
                        <div class="card-body py-5">
                            <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                            <h5 class="text-warning mb-2">기사 목록을 불러올 수 없습니다</h5>
                            <p class="text-muted mb-3">GitHub 토큰을 설정해주세요</p>
                            <button class="btn btn-outline-primary btn-sm" onclick="editor.showGithubModal()">
                                <i class="fas fa-key me-1"></i>GitHub 토큰 설정
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 📡 GitHub API 호출
    async fetchGithubContents(path) {
        if (!this.githubToken) {
            throw new Error('GitHub 토큰이 필요합니다');
        }

        const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`, {
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API 오류: ${response.status}`);
        }

        return await response.json();
    }

    // 📄 기사 메타데이터 로드
    async loadArticleMetadata() {
        const promises = this.articles.map(async (article) => {
            try {
                const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/content/${article.category}/${article.name}`, {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = atob(data.content);
                    const metadata = this.parseFrontMatter(content);
                    
                    article.metadata = metadata;
                    article.content = content;
                    article.sha = data.sha; // 삭제를 위해 필요
                }
            } catch (error) {
                console.warn(`기사 메타데이터 로드 실패: ${article.name}`, error);
                article.metadata = {
                    title: article.name.replace('.md', '').replace(/-/g, ' '),
                    date: '날짜 없음',
                    author: '알 수 없음'
                };
            }
        });

        await Promise.all(promises);
    }

    // 📑 Front Matter 파싱
    parseFrontMatter(content) {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontMatterMatch) return {};

        const frontMatterText = frontMatterMatch[1];
        const lines = frontMatterText.split('\n');
        const metadata = {};

        lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // 따옴표 제거
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                metadata[key] = value;
            }
        });

        return metadata;
    }

    // 🔍 기사 필터링
    filterArticles(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 업데이트
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // 기사 필터링
        this.filteredArticles = filter === 'all' 
            ? this.articles 
            : this.articles.filter(article => article.category === filter);

        this.renderArticles();
    }

    // 🎨 기사 목록 렌더링
    renderArticles() {
        const gridElement = document.getElementById('articlesGrid');
        if (!gridElement) return;

        if (this.filteredArticles.length === 0) {
            gridElement.innerHTML = `
                <div class="col-12 text-center">
                    <div class="glass-card">
                        <div class="card-body py-5">
                            <i class="fas fa-search fa-2x text-muted mb-3"></i>
                            <h5 class="text-muted">기사가 없습니다</h5>
                            <p class="text-muted">선택한 카테고리에 기사가 없습니다</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const articlesHtml = this.filteredArticles.map((article, index) => {
            const metadata = article.metadata || {};
            const title = metadata.title || article.name.replace('.md', '').replace(/-/g, ' ');
            const date = metadata.date || '날짜 없음';
            const author = metadata.author || '알 수 없음';
            const description = metadata.description || '설명 없음';
            const categoryIcon = article.category === 'automotive' ? '🚗' : '📈';
            const categoryName = article.category === 'automotive' ? '자동차' : '경제';

            return `
                <div class="col-lg-4 col-md-6 mb-4 fade-in-up" style="animation-delay: ${index * 0.1}s">
                    <div class="article-card h-100" onclick="editor.showArticleModal('${article.name}', '${article.category}')">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-primary">${categoryIcon} ${categoryName}</span>
                            <small class="text-muted">${date}</small>
                        </div>
                        
                        <h5 class="article-title mb-2">${title}</h5>
                        
                        <div class="article-meta mb-3">
                            <i class="fas fa-user text-primary me-1"></i>
                            <span>${author}</span>
                        </div>
                        
                        <p class="article-excerpt mb-3">${description}</p>
                        
                        <div class="article-actions mt-auto">
                            <button class="btn btn-outline-warning btn-sm" onclick="event.stopPropagation(); editor.editArticle('${article.name}', '${article.category}')">
                                <i class="fas fa-edit me-1"></i>편집
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); editor.deleteArticle('${article.name}', '${article.category}')">
                                <i class="fas fa-trash me-1"></i>삭제
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        gridElement.innerHTML = articlesHtml;
    }

    // ✏️ 기사 편집
    editArticle(filename, category) {
        const article = this.articles.find(a => a.name === filename && a.category === category);
        if (!article) return;

        // 기사 작성 탭으로 이동
        const writeTab = document.getElementById('write-tab');
        if (writeTab) {
            writeTab.click();
            
            // 잠시 후 데이터 채우기 (탭 전환 애니메이션 완료 후)
            setTimeout(() => {
                this.populateEditor(article);
            }, 300);
        }
    }

    // 📝 에디터에 기사 데이터 채우기
    populateEditor(article) {
        const metadata = article.metadata || {};
        
        document.getElementById('title').value = metadata.title || '';
        document.getElementById('category').value = article.category || 'automotive';
        document.getElementById('author').value = metadata.author || '오은진';
        document.getElementById('description').value = metadata.description || '';
        document.getElementById('tags').value = (metadata.tags || []).join(', ');
        
        if (metadata.date) {
            const date = new Date(metadata.date);
            document.getElementById('publishDate').value = date.toISOString().slice(0, 16);
        }

        // 본문 내용 (Front Matter 제거)
        const content = article.content.replace(/^---\n[\s\S]*?\n---\n/, '');
        document.getElementById('content').value = content;

        // 미리보기 업데이트
        this.updatePreview();

        // 성공 메시지
        this.showNotification('기사를 불러왔습니다. 편집 후 다시 업로드하세요.', 'info');
    }

    // 🗑️ 기사 삭제
    async deleteArticle(filename, category) {
        if (!confirm(`정말로 "${filename}" 기사를 삭제하시겠습니까?`)) {
            return;
        }

        const article = this.articles.find(a => a.name === filename && a.category === category);
        if (!article || !article.sha) {
            this.showNotification('기사 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/content/${category}/${filename}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete article: ${filename}`,
                    sha: article.sha
                })
            });

            if (response.ok) {
                this.showNotification('기사가 성공적으로 삭제되었습니다.', 'success');
                this.loadArticles(); // 목록 새로고침
            } else {
                throw new Error(`삭제 실패: ${response.status}`);
            }
        } catch (error) {
            console.error('기사 삭제 오류:', error);
            this.showNotification('기사 삭제에 실패했습니다.', 'error');
        }
    }

    // 🎭 기사 상세 모달 표시
    showArticleModal(filename, category) {
        const article = this.articles.find(a => a.name === filename && a.category === category);
        if (!article) return;

        const modal = new bootstrap.Modal(document.getElementById('articleModal'));
        const modalTitle = document.getElementById('articleModalTitle');
        const modalBody = document.getElementById('articleModalBody');

        const metadata = article.metadata || {};
        const title = metadata.title || filename;
        const content = article.content.replace(/^---\n[\s\S]*?\n---\n/, '');

        modalTitle.innerHTML = `<i class="fas fa-eye text-info me-2"></i>${title}`;
        modalBody.innerHTML = `
            <div class="article-detail">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong class="text-light">카테고리:</strong>
                        <span class="badge bg-primary ms-2">
                            ${category === 'automotive' ? '🚗 자동차' : '📈 경제'}
                        </span>
                    </div>
                    <div class="col-md-6">
                        <strong class="text-light">작성자:</strong>
                        <span class="text-muted ms-2">${metadata.author || '알 수 없음'}</span>
                    </div>
                </div>
                
                <div class="mb-3">
                    <strong class="text-light">발행일:</strong>
                    <span class="text-muted ms-2">${metadata.date || '날짜 없음'}</span>
                </div>
                
                ${metadata.description ? `
                    <div class="mb-3">
                        <strong class="text-light">요약:</strong>
                        <p class="text-muted mt-1">${metadata.description}</p>
                    </div>
                ` : ''}
                
                <div class="content-preview glass-card p-3" style="max-height: 400px; overflow-y: auto;">
                    ${marked.parse(content)}
                </div>
            </div>
        `;

        modal.show();
    }

    // 📂 드래그 앤 드롭 설정
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('imageFiles').files = files;
                // 이미지 업로드 처리는 local-upload.js에서 담당
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // ✅ 폼 유효성 검사
    setupFormValidation() {
        const requiredFields = ['title', 'category', 'author', 'publishDate', 'description'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
            }
        });
    }

    validateField(field) {
        const isValid = field.value.trim() !== '';
        field.classList.toggle('is-invalid', !isValid);
        field.classList.toggle('is-valid', isValid);
    }

    // 💾 저장된 데이터 로드
    loadStoredData() {
        // GitHub 토큰 로드
        this.loadStoredGithubToken();
        
        // 폼 데이터 자동 저장/복원
        const formFields = ['title', 'description', 'tags', 'content'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // 저장된 값 복원
                const savedValue = localStorage.getItem(`editor-${fieldId}`);
                if (savedValue) {
                    field.value = savedValue;
                }
                
                // 자동 저장 설정
                field.addEventListener('input', () => {
                    localStorage.setItem(`editor-${fieldId}`, field.value);
                });
            }
        });
    }

    loadStoredGithubToken() {
        this.githubToken = localStorage.getItem('github-token') || '';
        const tokenInput = document.getElementById('githubToken');
        if (tokenInput && this.githubToken) {
            tokenInput.value = this.githubToken;
        }
    }

    // 🎨 애니메이션 효과
    addAnimations() {
        // 스크롤 애니메이션
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        // 카드 요소들에 애니메이션 관찰자 추가
        document.querySelectorAll('.glass-card').forEach(card => {
            observer.observe(card);
        });

        // 버튼 호버 효과
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // 🎭 모달 관리
    showAIWriteModal() {
        const openaiKey = localStorage.getItem('openai-api-key');
        if (!openaiKey) {
            this.showOpenAIModal();
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('aiWriteModal'));
        modal.show();
    }

    showOpenAIModal() {
        const modal = new bootstrap.Modal(document.getElementById('openaiModal'));
        modal.show();
    }

    showGithubModal() {
        const modal = new bootstrap.Modal(document.getElementById('githubModal'));
        modal.show();
    }

    // 📢 알림 메시지
    showNotification(message, type = 'info') {
        const alertTypes = {
            success: 'alert-success',
            error: 'alert-danger',
            warning: 'alert-warning',
            info: 'alert-info'
        };

        const alertHtml = `
            <div class="alert ${alertTypes[type]} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHtml);

        // 3초 후 자동 제거
        setTimeout(() => {
            const alert = document.querySelector('.alert:last-of-type');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }

    // 🚀 유틸리티 메서드들
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength = 100) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // 🎯 마크다운 텍스트 삽입 헬퍼
    insertText(before, after = '') {
        const textarea = document.getElementById('content');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacementText = before + selectedText + after;

        textarea.value = textarea.value.substring(0, start) + replacementText + textarea.value.substring(end);
        
        // 커서 위치 조정
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();

        // 미리보기 업데이트
        this.updatePreview();
    }
}

// 🌟 전역 인스턴스 생성
const editor = new AutoDailyEditor();

// 🔧 전역 함수들 (HTML에서 호출용)
function insertText(before, after = '') {
    editor.insertText(before, after);
}

// 🏁 초기화 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 오토데일리 AI 에디터 Pro 로드 완료!');
    
    // 초기 미리보기 업데이트
    setTimeout(() => {
        editor.updatePreview();
    }, 100);
}); 