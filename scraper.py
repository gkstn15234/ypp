import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re
import os
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

def extract_content_from_url(url):
    """URL에서 기사 내용 추출"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 제목 추출
        title_elem = soup.find('h1', class_='entry-title')
        if not title_elem:
            return None
        title = title_elem.get_text().strip()
        
        # 내용 추출
        content_elem = soup.find('div', class_='entry-content')
        if not content_elem:
            return None
        
        # 광고 제거
        for ad in content_elem.find_all('div', class_='repoad'):
            ad.decompose()
        
        # 이미지 추출
        images = []
        for img in content_elem.find_all('img'):
            img_src = img.get('src')
            if img_src and 'wp-content/uploads' in img_src:
                images.append(img_src)
        
        # 텍스트 내용 및 이미지 추출 (순서 유지)
        paragraphs = []
        for elem in content_elem.children:
            if hasattr(elem, 'name') and elem.name:
                if elem.name == 'figure':
                    # 이미지 figure 처리
                    img_tag = elem.find('img')
                    if img_tag:
                        img_src = img_tag.get('src')
                        img_alt = img_tag.get('alt', '')
                        if img_src:
                            # 상대 경로를 절대 경로로 변환
                            if img_src.startswith('//'):
                                img_src = 'https:' + img_src
                            elif img_src.startswith('/'):
                                img_src = 'https://www.reportera.co.kr' + img_src
                            elif not img_src.startswith('http'):
                                img_src = 'https://www.reportera.co.kr/' + img_src
                            
                            # 캡션 추출
                            caption_elem = elem.find('figcaption')
                            caption = caption_elem.get_text().strip() if caption_elem else img_alt
                            
                            # 마크다운 이미지 형식으로 추가
                            paragraphs.append(f"![{img_alt}]({img_src})")
                            if caption:
                                paragraphs.append(f"*{caption}*")
                
                elif elem.name == 'p':
                    # p 태그 내의 이미지 확인
                    img_tag = elem.find('img')
                    if img_tag:
                        img_src = img_tag.get('src')
                        img_alt = img_tag.get('alt', '')
                        if img_src:
                            # 상대 경로를 절대 경로로 변환
                            if img_src.startswith('//'):
                                img_src = 'https:' + img_src
                            elif img_src.startswith('/'):
                                img_src = 'https://www.reportera.co.kr' + img_src
                            elif not img_src.startswith('http'):
                                img_src = 'https://www.reportera.co.kr/' + img_src
                            
                            paragraphs.append(f"![{img_alt}]({img_src})")
                    
                    # <br> 태그를 줄바꿈으로 변환
                    for br in elem.find_all('br'):
                        br.replace_with('\n')
                    
                    # 텍스트 내용도 추가
                    text = elem.get_text().strip()
                    if text and not text.startswith('(adsbygoogle'):
                        # 사진 출처 텍스트를 이미지 캡션으로 변환
                        if text.startswith('*사진 =') or text.startswith('사진 ='):
                            paragraphs.append(f"*{text}*")
                        else:
                            paragraphs.append(text)
                
                elif elem.name in ['h2', 'h3', 'h4', 'h5']:
                    # <br> 태그를 줄바꿈으로 변환
                    for br in elem.find_all('br'):
                        br.replace_with('\n')
                    text = elem.get_text().strip()
                    if text and not text.startswith('(adsbygoogle'):
                        paragraphs.append(f"\n## {text}\n")
                
                else:
                    # 다른 요소에서도 이미지 찾기
                    for img in elem.find_all('img'):
                        img_src = img.get('src')
                        img_alt = img.get('alt', '')
                        if img_src:
                            # 상대 경로를 절대 경로로 변환
                            if img_src.startswith('//'):
                                img_src = 'https:' + img_src
                            elif img_src.startswith('/'):
                                img_src = 'https://www.reportera.co.kr' + img_src
                            elif not img_src.startswith('http'):
                                img_src = 'https://www.reportera.co.kr/' + img_src
                            
                            paragraphs.append(f"![{img_alt}]({img_src})")
                    
                    # <br> 태그를 줄바꿈으로 변환
                    for br in elem.find_all('br'):
                        br.replace_with('\n')
                    text = elem.get_text().strip()
                    if text and not text.startswith('(adsbygoogle'):
                        # 사진 출처 텍스트를 이미지 캡션으로 변환
                        if text.startswith('*사진 =') or text.startswith('사진 ='):
                            paragraphs.append(f"*{text}*")
                        else:
                            paragraphs.append(text)
        
        content = '\n\n'.join(paragraphs)
        
        # 요약문 생성 (첫 번째 문단에서)
        description = paragraphs[0][:100] + "..." if paragraphs else ""
        
        return {
            'title': title,
            'description': description,
            'content': content,
            'images': images,
            'url': url
        }
    
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return None

def create_markdown_file(article_data, output_dir):
    """마크다운 파일 생성"""
    filename = clean_filename(article_data['title'])
    filepath = os.path.join(output_dir, f"{filename}.md")
    
    # 기존 파일이 있으면 덮어쓰기 (테스트를 위해)
    # counter = 1
    # while os.path.exists(filepath):
    #     filepath = os.path.join(output_dir, f"{filename}-{counter}.md")
    #     counter += 1
    
    # 현재 날짜 사용
    current_date = datetime.now().strftime("%Y-%m-%dT%H:%M:%S+09:00")
    
    # 마크다운 내용 생성
    markdown_content = f"""---
title: "{article_data['title']}"
description: "{article_data['description']}"
date: {current_date}
author: "김한수"
categories: ["자동차"]
tags: ["뉴스", "이슈", "트렌드"]
"""
    
    # 이미지가 있으면 첫 번째 이미지를 썸네일로 사용
    if article_data['images']:
        markdown_content += f'images: ["{article_data["images"][0]}"]\n'
    
    markdown_content += f"""
draft: false
---

# {article_data['title']}

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
        from xml.etree import ElementTree as ET
        root = ET.fromstring(sitemap_content)
        
        # XML 네임스페이스 처리
        namespaces = {'': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_elem in root.findall('.//url', namespaces):
            loc_elem = url_elem.find('loc', namespaces)
            if loc_elem is not None:
                url = loc_elem.text
                if url and url.startswith('https://www.reportera.co.kr/') and not url.endswith('.xml'):
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
                    if url.startswith('https://www.reportera.co.kr/') and not url.endswith('.xml'):
                        urls.append(url)
    
    # 중복 제거
    urls = list(set(urls))
    
    # 출력 디렉토리 설정
    output_dir = 'content/car'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print(f"Found {len(urls)} URLs to process")
    
    # 모든 URL 처리
    processed = 0
    for i, url in enumerate(urls):
        print(f"Processing {i+1}/{len(urls)}: {url}")
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