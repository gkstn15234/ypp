# 이콘밍글 (Econmingle) - 경제뉴스 미디어

## Overview

이콘밍글은 Hugo 정적 사이트 생성기를 기반으로 한 경제 전문 뉴스 미디어 웹사이트입니다. "Economy"와 "Mingle"의 합성어로, 복잡한 경제 소식을 독자들에게 쉽게 전달하는 것을 목표로 합니다.

## System Architecture

### Frontend Architecture
- **Static Site Generator**: Hugo (Go-based)
- **Templating**: Go Templates
- **CSS Framework**: Bootstrap 5 + Custom CSS
- **JavaScript**: Vanilla JS with modern ES6+ features
- **Icon Library**: Font Awesome
- **Typography**: Noto Sans KR (Korean web font)

### Content Management
- **Content Format**: Markdown files with YAML front matter
- **Content Structure**: Organized by categories (economy, securities, realestate, it, international)
- **Author Management**: Individual author profiles with specialized content
- **Taxonomy Support**: Tags, categories, and authors

### Responsive Design
- Mobile-first approach with Bootstrap grid system
- Dark mode support with CSS custom properties
- Progressive enhancement for JavaScript features

## Key Components

### Content Categories
1. **Economy** (`/economy/`) - 국내외 경제 동향, 정책, 시장 분석
2. **Securities** (`/securities/`) - 주식시장 동향, 기업 실적, 투자 정보
3. **Real Estate** (`/realestate/`) - 부동산 시장 동향, 정책 변화
4. **IT** (`/it/`) - IT 기술 동향, 반도체 산업, 디지털 혁신
5. **International** (`/international/`) - 글로벌 경제 동향, 국제 정세

### Layout Components
- **Hero Section**: Dynamic featured article display
- **Article Cards**: Responsive grid layout with category badges
- **Breaking News Ticker**: Real-time trending topics display
- **Breadcrumb Navigation**: Hierarchical navigation structure
- **Social Sharing**: Facebook, Twitter, Naver, copy link functionality
- **Reading Progress Bar**: Visual reading progress indicator

### Author System
- Individual author profiles with specialization areas
- Author-specific content filtering
- Bio and contact information management

### Interactive Features
- Dark/light mode toggle with localStorage persistence
- Newsletter subscription form
- Social media sharing buttons
- Search functionality (modal-based interface)
- Reading progress tracking

## Data Flow

### Content Creation Flow
1. Authors create Markdown files in appropriate category folders
2. Front matter includes metadata (title, description, author, tags, featured image)
3. Hugo processes Markdown + templates to generate static HTML
4. Content is organized by taxonomy (categories, tags, authors)

### User Experience Flow
1. Homepage displays hero article + featured content grid
2. Category pages show filtered article lists with pagination
3. Individual articles include related content and social sharing
4. Author pages aggregate all content by specific authors
5. Tag/category pages provide topical content discovery

## External Dependencies

### Core Dependencies
- Hugo (latest stable version)
- Bootstrap 5.x
- Font Awesome 6.x
- Noto Sans KR font from Google Fonts

### Potential Integrations
- Google Analytics for traffic monitoring
- Newsletter service integration (Mailchimp, ConvertKit)
- Social media APIs for enhanced sharing
- Search service (Algolia, Elasticsearch)
- Comment system (Disqus, Utterances)

## Deployment Strategy

### Static Hosting Options
- **Recommended**: Netlify or Vercel for automatic deployments
- GitHub Pages for simple hosting
- AWS S3 + CloudFront for enterprise solutions

### Build Process
1. Content authors commit Markdown files to repository
2. Git webhook triggers Hugo build process
3. Generated static files deployed to CDN
4. Cache invalidation for updated content

### Performance Optimization
- Image optimization and responsive images
- CSS/JS minification and bundling
- CDN delivery for static assets
- Lazy loading for images below the fold

## Changelog

- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.