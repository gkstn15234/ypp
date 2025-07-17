import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re
import os
from urllib.parse import urljoin, urlparse
from datetime import datetime
import time
import random
import sys

def clean_filename(title):
    """제목을 파일명으로 사용할 수 있도록 정리"""
    # 특수문자 제거 및 공백을 하이픈으로 변경
    filename = re.sub(r'[^\w\s-]', '', title)
    filename = re.sub(r'[-\s]+', '-', filename)
    return filename.strip('-').lower()

def download_image(img_url, save_path):
    """이미지 다운로드"""
    try:
        response = requests.get(img_url, timeout=10)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        with open(save_path, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"이미지 다운로드 실패 {img_url}: {e}")
        return False

def extract_content_from_url(url):
    """URL에서 기사 내용 추출"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        
        # 제목 추출 (여러 가능한 선택자 시도)
        title = None
        title_selectors = [
            'h1.entry-title',
            'h1.post-title', 
            'h1.title',
            'h1',
            '.entry-title',
            '.post-title',
            '.title',
            'title'
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                title = title_elem.get_text().strip()
                break
        
        if not title:
            print(f"제목을 찾을 수 없습니다: {url}")
            return None
        
        # 내용 추출 (여러 가능한 선택자 시도)
        content_elem = None
        content_selectors = [
            'div.entry-content',
            'div.post-content',
            'div.content',
            '.entry-content',
            '.post-content',
            '.content',
            'article',
            '.article-content',
            '.main-content',
            '#content'
        ]
        
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                break
        
        if not content_elem:
            print(f"본문 내용을 찾을 수 없습니다: {url}")
            return None
        
        # 광고 및 불필요한 요소 제거
        for unwanted in content_elem.find_all(['div'], class_=['repoad', 'ad', 'advertisement']):
            unwanted.decompose()
        
        # 파일명 생성
        article_slug = clean_filename(title)
        
        # 이미지 처리
        for i, img in enumerate(content_elem.find_all('img')):
            img_src = img.get('src') or img.get('data-src')
            if img_src:
                # 절대 URL로 변환
                full_img_url = urljoin(base_url, img_src)
                
                # 이미지 파일명 생성
                img_extension = os.path.splitext(urlparse(full_img_url).path)[1] or '.jpg'
                img_filename = f"{article_slug}-{i+1}{img_extension}"
                
                # 이미지 저장 경로
                img_save_path = os.path.join('static', 'images', 'car', img_filename)
                
                # 이미지 다운로드
                if download_image(full_img_url, img_save_path):
                    # Hugo에서 사용할 이미지 경로
                    hugo_img_path = f"/images/car/{img_filename}"
                    img['src'] = hugo_img_path
                    
                    # 불필요한 속성 제거
                    for attr in ['data-src', 'srcset', 'sizes']:
                        if img.get(attr):
                            del img[attr]
        
        # 불필요한 태그 제거
        for tag in content_elem(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()
        
        # 불필요한 출처 정보 제거
        for figcaption in content_elem.find_all('figcaption'):
            caption_text = figcaption.get_text()
            # "출처-온라인커뮤니티" 등의 출처 정보 제거
            if '출처-' in caption_text or '/ 출처' in caption_text:
                figcaption.decompose()
        
        # 광고 관련 코드 제거
        for ad in content_elem.find_all(['ins', 'div'], class_=['adsbygoogle', 'code-block']):
            ad.decompose()
        
        # HTML 내용을 문자열로 변환
        content = str(content_elem)
        
        # 요약문 생성 (첫 번째 텍스트에서)
        text_content = content_elem.get_text().strip()
        description = text_content[:100] + "..." if text_content else ""
        
        return {
            'title': title,
            'description': description,
            'content': content,
            'url': url
        }
    
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return None

def create_markdown_file(article_data, output_dir):
    """마크다운 파일 생성"""
    filename = clean_filename(article_data['title'])
    filepath = os.path.join(output_dir, f"{filename}.md")
    
    # 현재 날짜 사용
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    # 마크다운 내용 생성
    markdown_content = f"""---
title: "{article_data['title']}"
description: "{article_data['description']}"
date: {current_date}
author: "김한수"
categories: ["자동차"]
tags: ["자동차", "뉴스"]
draft: false
---

{article_data['content']}
"""
    
    # 파일 저장
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Created: {filepath}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python scraper.py <sitemap_url>")
        sys.exit(1)
    
    sitemap_url = sys.argv[1]
    
    # 사이트맵 XML 다운로드
    try:
        print(f"Downloading sitemap from: {sitemap_url}")
        response = requests.get(sitemap_url)
        response.raise_for_status()
        sitemap_content = response.text
        print(f"Downloaded {len(sitemap_content)} bytes")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading sitemap: {e}")
        sys.exit(1)
    
    # XML 파싱하여 URL 추출
    urls = []
    try:
        root = ET.fromstring(sitemap_content)
        
        # XML 네임스페이스 처리
        namespaces = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_elem in root.findall('.//ns:url', namespaces):
            loc_elem = url_elem.find('ns:loc', namespaces)
            if loc_elem is not None:
                url = loc_elem.text
                if url and not url.endswith('.xml'):
                    urls.append(url)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        # 대안: 간단한 텍스트 파싱
        lines = sitemap_content.split('\n')
        for line in lines:
            if '<loc>' in line and '</loc>' in line:
                start = line.find('<loc>') + 5
                end = line.find('</loc>')
                if start > 4 and end > start:
                    url = line[start:end]
                    if not url.endswith('.xml'):
                        urls.append(url)
    
    # 중복 제거
    urls = list(set(urls))
    
    # 출력 디렉토리 설정
    output_dir = 'content/car'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 이미지 디렉토리 생성
    img_dir = 'static/images/car'
    if not os.path.exists(img_dir):
        os.makedirs(img_dir)
    
    print(f"Found {len(urls)} URLs to process")
    
    # 5개 URL만 처리
    processed = 0
    max_articles = 5
    
    for i, url in enumerate(urls[:max_articles]):
        print(f"Processing {i+1}/{max_articles}: {url}")
        article_data = extract_content_from_url(url)
        
        if article_data:
            create_markdown_file(article_data, output_dir)
            processed += 1
            print(f"Successfully processed: {article_data['title']}")
        else:
            print(f"Failed to process: {url}")
            
        # 서버 부하 방지를 위한 대기
        time.sleep(random.uniform(1, 3))
    
    print(f"\nProcessed {processed} articles successfully!")

if __name__ == "__main__":
    main() 