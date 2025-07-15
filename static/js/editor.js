// Hugo 콘텐츠 에디터 JavaScript

// 전역 변수
let editor = null;
let currentContent = {
    title: '',
    description: '',
    author: '',
    category: '',
    tags: [],
    content: '',
    images: [],
    publishDate: null,
    draft: false
};

// 템플릿 데이터
const templates = {
    automotive: {
        title: '새로운 자동차 모델 출시',
        description: '자동차 업계의 최신 소식을 전해드립니다.',
        content: `
            <h2>주요 내용</h2>
            <p>새로운 자동차 모델이 출시되었습니다. 주요 특징은 다음과 같습니다:</p>
            <ul>
                <li>연비 향상</li>
                <li>안전성 강화</li>
                <li>편의 기능 추가</li>
            </ul>
            
            <h3>상세 분석</h3>
            <p>이번 모델은 기존 대비 다음과 같은 개선점을 보입니다:</p>
            
            <blockquote>
                <p>"고객의 요구사항을 충실히 반영한 모델입니다."</p>
            </blockquote>
            
            <h3>시장 전망</h3>
            <p>업계 전문가들은 이 모델이 시장에 미칠 영향을 다음과 같이 예측합니다:</p>
        `,
        tags: ['자동차', '신차', '업계소식']
    },
    economy: {
        title: '경제 동향 분석',
        description: '최근 경제 상황에 대한 전문가 분석을 제공합니다.',
        content: `
            <h2>경제 현황</h2>
            <p>최근 경제 지표를 분석한 결과 다음과 같은 동향이 나타났습니다:</p>
            
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th>지표</th>
                        <th>이전 분기</th>
                        <th>현재 분기</th>
                        <th>변화율</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>GDP</td>
                        <td>2.5%</td>
                        <td>2.8%</td>
                        <td>+0.3%</td>
                    </tr>
                </tbody>
            </table>
            
            <h3>전문가 의견</h3>
            <blockquote>
                <p>"현재 경제 상황은 안정적인 성장세를 보이고 있습니다."</p>
            </blockquote>
            
            <h3>향후 전망</h3>
            <p>앞으로의 경제 전망은 다음과 같습니다:</p>
        `,
        tags: ['경제', '분석', '전망']
    },
    policy: {
        title: '정책 분석 리포트',
        description: '새로운 정책의 영향과 시사점을 분석합니다.',
        content: `
            <h2>정책 개요</h2>
            <p>새로운 정책이 발표되었습니다. 주요 내용은 다음과 같습니다:</p>
            
            <h3>주요 변경사항</h3>
            <ul>
                <li>규제 완화</li>
                <li>세제 혜택</li>
                <li>지원 확대</li>
            </ul>
            
            <h3>영향 분석</h3>
            <p>이 정책이 각 분야에 미치는 영향을 분석하면:</p>
            
            <blockquote>
                <p>"업계에 긍정적인 영향을 미칠 것으로 예상됩니다."</p>
            </blockquote>
            
            <h3>결론</h3>
            <p>이번 정책은 다음과 같은 의미를 가집니다:</p>
        `,
        tags: ['정책', '분석', '리포트']
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    bindEventListeners();
    loadFromLocalStorage();
    setDefaultDate();
});

// TinyMCE 에디터 초기화
function initializeEditor() {
    tinymce.init({
        selector: '#content-editor',
        height: 500,
        language: 'ko_KR',
        plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
        ],
        toolbar: 'undo redo | formatselect | bold italic backcolor | \
            alignleft aligncenter alignright alignjustify | \
            bullist numlist outdent indent | removeformat | help | \
            link image media table | code preview fullscreen',
        content_style: 'body { font-family: "Noto Sans KR", sans-serif; font-size: 14px; }',
        menubar: false,
        branding: false,
        paste_data_images: true,
        automatic_uploads: true,
        file_picker_types: 'image',
        file_picker_callback: function(callback, value, meta) {
            if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.onchange = function() {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            callback(e.target.result, {
                                alt: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            }
        },
        setup: function(ed) {
            editor = ed;
            ed.on('change keyup', function() {
                updateWordCount();
                autoSave();
            });
        },
        init_instance_callback: function(editor) {
            console.log('TinyMCE 에디터가 초기화되었습니다.');
        }
    });
}

// 이벤트 리스너 바인딩
function bindEventListeners() {
    // 폼 입력 이벤트
    document.getElementById('title').addEventListener('input', updateCurrentContent);
    document.getElementById('description').addEventListener('input', updateCurrentContent);
    document.getElementById('author').addEventListener('change', updateCurrentContent);
    document.getElementById('category').addEventListener('change', updateCurrentContent);
    document.getElementById('tags').addEventListener('input', updateCurrentContent);
    document.getElementById('publishDate').addEventListener('change', updateCurrentContent);
    document.getElementById('draft').addEventListener('change', updateCurrentContent);
    
    // 대표 이미지 업로드
    document.getElementById('featured-image').addEventListener('change', handleFeaturedImage);
    
    // 드래그 앤 드롭 이벤트
    const editorContainer = document.getElementById('editor-container');
    editorContainer.addEventListener('dragover', handleDragOver);
    editorContainer.addEventListener('drop', handleDrop);
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 현재 콘텐츠 업데이트
function updateCurrentContent() {
    currentContent.title = document.getElementById('title').value;
    currentContent.description = document.getElementById('description').value;
    currentContent.author = document.getElementById('author').value;
    currentContent.category = document.getElementById('category').value;
    currentContent.tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    currentContent.publishDate = document.getElementById('publishDate').value;
    currentContent.draft = document.getElementById('draft').checked;
    
    if (editor) {
        currentContent.content = editor.getContent();
    }
    
    autoSave();
}

// 기본 발행일 설정
function setDefaultDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateString = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('publishDate').value = dateString;
}

// 단어 수 업데이트
function updateWordCount() {
    if (editor) {
        const content = editor.getContent({format: 'text'});
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = content.length;
        
        document.getElementById('wordCount').textContent = wordCount;
        document.getElementById('charCount').textContent = charCount;
    }
}

// 대표 이미지 처리
function handleFeaturedImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="대표 이미지" class="img-fluid">`;
            currentContent.images = [e.target.result];
            autoSave();
        };
        reader.readAsDataURL(file);
    }
}

// 드래그 앤 드롭 처리
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (editor) {
                    editor.insertContent(`<img src="${e.target.result}" alt="${file.name}" class="img-fluid">`);
                }
            };
            reader.readAsDataURL(file);
        }
    }
}

// 키보드 단축키 처리
function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case 's':
                event.preventDefault();
                saveToLocal();
                break;
            case 'p':
                event.preventDefault();
                previewContent();
                break;
            case 'Enter':
                event.preventDefault();
                generateMarkdown();
                break;
        }
    }
}

// 이미지 삽입 (툴바에서)
function insertImage() {
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

// 모달에서 이미지 삽입
function insertImageFromModal() {
    const imageUrl = document.getElementById('imageUrl').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const imageAlt = document.getElementById('imageAlt').value || '이미지';
    
    if (imageUrl) {
        if (editor) {
            editor.insertContent(`<img src="${imageUrl}" alt="${imageAlt}" class="img-fluid">`);
        }
        bootstrap.Modal.getInstance(document.getElementById('imageModal')).hide();
    } else if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (editor) {
                editor.insertContent(`<img src="${e.target.result}" alt="${imageAlt}" class="img-fluid">`);
            }
            bootstrap.Modal.getInstance(document.getElementById('imageModal')).hide();
        };
        reader.readAsDataURL(imageFile);
    }
    
    // 모달 입력 초기화
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageUpload').value = '';
    document.getElementById('imageAlt').value = '';
}

// 표 삽입
function insertTable() {
    if (editor) {
        const tableHtml = `
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th>제목1</th>
                        <th>제목2</th>
                        <th>제목3</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>내용1</td>
                        <td>내용2</td>
                        <td>내용3</td>
                    </tr>
                </tbody>
            </table>
        `;
        editor.insertContent(tableHtml);
    }
}

// 인용구 삽입
function insertQuote() {
    if (editor) {
        const quoteHtml = `
            <blockquote>
                <p>인용구 내용을 입력하세요.</p>
            </blockquote>
        `;
        editor.insertContent(quoteHtml);
    }
}

// 템플릿 로드
function loadTemplate(templateType) {
    if (templates[templateType]) {
        const template = templates[templateType];
        
        document.getElementById('title').value = template.title;
        document.getElementById('description').value = template.description;
        document.getElementById('tags').value = template.tags.join(', ');
        document.getElementById('category').value = templateType;
        
        if (editor) {
            editor.setContent(template.content);
        }
        
        updateCurrentContent();
        updateWordCount();
        
        showNotification('템플릿이 로드되었습니다.', 'success');
    }
}

// 미리보기
function previewContent() {
    updateCurrentContent();
    
    const previewContainer = document.getElementById('preview-container');
    const previewContent = document.getElementById('preview-content');
    
    let previewHtml = `
        <div class="article-header">
            <h1>${currentContent.title || '제목 없음'}</h1>
            <div class="article-meta">
                <span class="author">작성자: ${currentContent.author || '미정'}</span>
                <span class="category">카테고리: ${currentContent.category || '미정'}</span>
                <span class="date">발행일: ${formatDate(currentContent.publishDate)}</span>
            </div>
        </div>
    `;
    
    if (currentContent.description) {
        previewHtml += `<div class="article-description"><p>${currentContent.description}</p></div>`;
    }
    
    if (currentContent.images && currentContent.images.length > 0) {
        previewHtml += `<div class="article-image"><img src="${currentContent.images[0]}" alt="${currentContent.title}" class="img-fluid"></div>`;
    }
    
    previewHtml += `<div class="article-content">${currentContent.content}</div>`;
    
    if (currentContent.tags && currentContent.tags.length > 0) {
        previewHtml += `<div class="article-tags">`;
        currentContent.tags.forEach(tag => {
            previewHtml += `<span class="tag">#${tag}</span>`;
        });
        previewHtml += `</div>`;
    }
    
    previewContent.innerHTML = previewHtml;
    previewContainer.style.display = 'block';
    
    // 미리보기 영역으로 스크롤
    previewContainer.scrollIntoView({ behavior: 'smooth' });
}

// 마크다운 생성 및 다운로드
function generateMarkdown() {
    updateCurrentContent();
    
    if (!currentContent.title) {
        showNotification('제목을 입력해주세요.', 'danger');
        return;
    }
    
    let markdown = '---\n';
    markdown += `title: "${currentContent.title}"\n`;
    markdown += `description: "${currentContent.description || ''}"\n`;
    markdown += `date: ${formatDateForHugo(currentContent.publishDate)}\n`;
    
    if (currentContent.author) {
        markdown += `author: "${currentContent.author}"\n`;
    }
    
    if (currentContent.category) {
        markdown += `categories: ["${currentContent.category}"]\n`;
    }
    
    if (currentContent.tags && currentContent.tags.length > 0) {
        markdown += `tags: [${currentContent.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
    }
    
    if (currentContent.images && currentContent.images.length > 0) {
        markdown += `images: ["${currentContent.images[0]}"]\n`;
    }
    
    markdown += `draft: ${currentContent.draft}\n`;
    markdown += '---\n\n';
    
    // HTML을 마크다운으로 변환 (간단한 변환)
    let content = currentContent.content;
    content = content.replace(/<h1>/g, '\n# ').replace(/<\/h1>/g, '\n');
    content = content.replace(/<h2>/g, '\n## ').replace(/<\/h2>/g, '\n');
    content = content.replace(/<h3>/g, '\n### ').replace(/<\/h3>/g, '\n');
    content = content.replace(/<p>/g, '\n').replace(/<\/p>/g, '\n');
    content = content.replace(/<strong>/g, '**').replace(/<\/strong>/g, '**');
    content = content.replace(/<em>/g, '*').replace(/<\/em>/g, '*');
    content = content.replace(/<blockquote>/g, '\n> ').replace(/<\/blockquote>/g, '\n');
    content = content.replace(/<ul>/g, '\n').replace(/<\/ul>/g, '\n');
    content = content.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n');
    content = content.replace(/<br\s*\/?>/g, '\n');
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    
    markdown += content;
    
    // 파일 다운로드
    const filename = `${currentContent.title.replace(/[^a-zA-Z0-9가-힣]/g, '-')}.md`;
    downloadFile(markdown, filename, 'text/markdown');
    
    showNotification('마크다운 파일이 생성되었습니다.', 'success');
}

// 로컬 저장소에 저장
function saveToLocal() {
    updateCurrentContent();
    
    const saveData = {
        ...currentContent,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('hugo-editor-content', JSON.stringify(saveData));
    showNotification('로컬에 저장되었습니다.', 'success');
}

// 로컬 저장소에서 불러오기
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('hugo-editor-content');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        document.getElementById('title').value = data.title || '';
        document.getElementById('description').value = data.description || '';
        document.getElementById('author').value = data.author || '';
        document.getElementById('category').value = data.category || '';
        document.getElementById('tags').value = data.tags ? data.tags.join(', ') : '';
        document.getElementById('publishDate').value = data.publishDate || '';
        document.getElementById('draft').checked = data.draft || false;
        
        if (data.images && data.images.length > 0) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${data.images[0]}" alt="대표 이미지" class="img-fluid">`;
        }
        
        currentContent = data;
        
        // 에디터가 로드된 후 콘텐츠 설정
        const checkEditor = setInterval(() => {
            if (editor) {
                editor.setContent(data.content || '');
                updateWordCount();
                clearInterval(checkEditor);
            }
        }, 100);
    }
}

// 자동 저장
function autoSave() {
    const autoSaveData = {
        ...currentContent,
        autoSavedAt: new Date().toISOString()
    };
    
    localStorage.setItem('hugo-editor-autosave', JSON.stringify(autoSaveData));
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '미정';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hugo용 날짜 포맷팅
function formatDateForHugo(dateString) {
    if (!dateString) return new Date().toISOString();
    
    const date = new Date(dateString);
    return date.toISOString();
}

// 파일 다운로드
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fade-in`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 유틸리티 함수들
function clearEditor() {
    if (confirm('현재 작업을 초기화하시겠습니까?')) {
        document.getElementById('contentForm').reset();
        document.getElementById('image-preview').innerHTML = '';
        if (editor) {
            editor.setContent('');
        }
        currentContent = {
            title: '',
            description: '',
            author: '',
            category: '',
            tags: [],
            content: '',
            images: [],
            publishDate: null,
            draft: false
        };
        setDefaultDate();
        updateWordCount();
        showNotification('에디터가 초기화되었습니다.', 'info');
    }
}

function exportContent() {
    updateCurrentContent();
    const exportData = {
        ...currentContent,
        exportedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `${currentContent.title || 'untitled'}-export.json`;
    downloadFile(jsonString, filename, 'application/json');
    
    showNotification('콘텐츠가 내보내졌습니다.', 'success');
}

function importContent() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    document.getElementById('title').value = importData.title || '';
                    document.getElementById('description').value = importData.description || '';
                    document.getElementById('author').value = importData.author || '';
                    document.getElementById('category').value = importData.category || '';
                    document.getElementById('tags').value = importData.tags ? importData.tags.join(', ') : '';
                    document.getElementById('publishDate').value = importData.publishDate || '';
                    document.getElementById('draft').checked = importData.draft || false;
                    
                    if (importData.images && importData.images.length > 0) {
                        const preview = document.getElementById('image-preview');
                        preview.innerHTML = `<img src="${importData.images[0]}" alt="대표 이미지" class="img-fluid">`;
                    }
                    
                    if (editor) {
                        editor.setContent(importData.content || '');
                    }
                    
                    currentContent = importData;
                    updateWordCount();
                    
                    showNotification('콘텐츠가 가져와졌습니다.', 'success');
                } catch (error) {
                    showNotification('파일 형식이 올바르지 않습니다.', 'danger');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// 개발자 도구 함수들
function debugEditor() {
    console.log('현재 콘텐츠:', currentContent);
    console.log('에디터 상태:', editor ? '로드됨' : '로드 안됨');
    console.log('로컬 저장소:', localStorage.getItem('hugo-editor-content'));
}

// 전역 함수로 내보내기
window.editorAPI = {
    clearEditor,
    exportContent,
    importContent,
    debugEditor,
    showNotification
}; 