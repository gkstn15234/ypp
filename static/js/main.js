// Main JavaScript functionality for Econmingle

document.addEventListener('DOMContentLoaded', function() {
    initializeReadingProgress();
    initializeDarkMode();
    initializeSearch();
    initializeSocialShare();
    initializeUpNext();
    initializeNewsletter();
    initializeClickableCards();
});

// Reading Progress Bar
function initializeReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', function() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const trackLength = documentHeight - windowHeight;
        const pctScrolled = Math.floor((scrollTop / trackLength) * 100);
        
        progressBar.style.width = pctScrolled + '%';
    });
}

// Dark Mode Toggle
function initializeDarkMode() {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateDarkModeIcon(currentTheme === 'dark');
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeIcon(newTheme === 'dark');
}

function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('.dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Search Functionality
function initializeSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch(searchInput.value);
        });
    }
}

function performSearch(query) {
    if (!query.trim()) return;
    
    // Simple client-side search implementation
    // In a real implementation, this would connect to a search API
    const searchUrl = `/search/?q=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
}

// Social Share Functions
function initializeSocialShare() {
    // Social share buttons are handled by the shareArticle function
    // called from the HTML buttons
}

function shareArticle(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const description = encodeURIComponent(document.querySelector('meta[name="description"]')?.content || '');
    
    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
        case 'naver':
            shareUrl = `https://share.naver.com/web/shareView.nhn?url=${url}&title=${title}`;
            break;
        case 'copy':
            copyToClipboard(window.location.href);
            showNotification('링크가 복사되었습니다!');
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showNotification(message) {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 250px;';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Up Next Sticky Component
function initializeUpNext() {
    const upNext = document.getElementById('upNext');
    if (!upNext) return;

    let isVisible = false;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = (scrolled / (documentHeight - windowHeight)) * 100;
        
        if (scrollPercentage > 70 && !isVisible) {
            showUpNext();
            isVisible = true;
        } else if (scrollPercentage <= 70 && isVisible) {
            hideUpNext();
            isVisible = false;
        }
    });
}

function showUpNext() {
    const upNext = document.getElementById('upNext');
    if (upNext) {
        upNext.style.display = 'block';
        
        // Load next article content (simplified)
        const nextArticleContent = document.getElementById('nextArticleContent');
        if (nextArticleContent && !nextArticleContent.innerHTML) {
            nextArticleContent.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0 me-3">
                        <img src="/images/placeholder.jpg" alt="Next Article" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">다음 추천 기사</h6>
                        <p class="mb-0 small text-muted">계속 읽어보세요</p>
                    </div>
                </div>
            `;
        }
    }
}

function hideUpNext() {
    const upNext = document.getElementById('upNext');
    if (upNext) {
        upNext.style.display = 'none';
    }
}

// Newsletter Subscription
function initializeNewsletter() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (validateEmail(email)) {
                subscribeNewsletter(email);
                emailInput.value = '';
            } else {
                showNotification('올바른 이메일 주소를 입력해주세요.');
            }
        });
    });
}

// Clickable Cards
function initializeClickableCards() {
    const clickableCards = document.querySelectorAll('.clickable-card');
    
    clickableCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on an actual link or button
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
                e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            const href = this.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        });
        
        // Add keyboard support for accessibility
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const href = this.getAttribute('data-href');
                if (href) {
                    window.location.href = href;
                }
            }
        });
        
        // Make card focusable for keyboard navigation
        if (!card.getAttribute('tabindex')) {
            card.setAttribute('tabindex', '0');
        }
    });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function subscribeNewsletter(email) {
    // In a real implementation, this would send the email to a backend service
    // TODO: Implement backend newsletter subscription
    showNotification('뉴스레터 구독이 완료되었습니다!');
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Image Lazy Loading (for browsers that don't support loading="lazy")
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // For data-src images (fallback)
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                    }
                    
                    // Add loaded class when image loads
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });
                    
                    // Handle error case
                    img.addEventListener('error', () => {
                        img.classList.add('loaded'); // Still remove placeholder
                        console.log('Image failed to load:', img.src);
                    });
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            root: null,
            rootMargin: '50px', // Load images 50px before they enter viewport
            threshold: 0.1
        });

        // Observe all lazy images
        document.querySelectorAll('img[loading="lazy"], img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Immediate loading for images that are already in viewport
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        }
    });
}

// Performance: Preload critical resources
function preloadCriticalResources() {
    // Preload next page in sequence for better UX
    const nextPageLink = document.querySelector('.pagination .page-item:not(.active) + .page-item .page-link');
    if (nextPageLink) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = nextPageLink.href;
        document.head.appendChild(link);
    }
    
    // Preload critical images
    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = heroImage.src;
        document.head.appendChild(link);
    }
}

// Initialize performance optimizations immediately
initializeLazyLoading();
preloadCriticalResources();

// Initialize performance optimizations with slight delay for non-critical items
setTimeout(() => {
    // Additional performance optimizations can go here
}, 1000);

// Accessibility: Skip to content
function addSkipToContent() {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-to-content';
    skipLink.href = '#main';
    skipLink.textContent = '본문으로 건너뛰기';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
        border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

addSkipToContent();

// Global error handling
window.addEventListener('error', function(e) {
    // In production, you might want to send this to an error tracking service
    // TODO: Implement error tracking (e.g., Sentry, LogRocket)
});

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                // Service worker registered successfully
            })
            .catch(function(registrationError) {
                // Service worker registration failed
            });
    });
}
