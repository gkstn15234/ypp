import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re
import os
from datetime import datetime
import time
import random

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
        
        # 텍스트 내용 추출
        paragraphs = []
        for elem in content_elem.find_all(['p', 'h2', 'h3', 'h4', 'h5']):
            text = elem.get_text().strip()
            if text and not text.startswith('(adsbygoogle'):
                if elem.name.startswith('h'):
                    paragraphs.append(f"\n## {text}\n")
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
    
    # 중복 파일명 처리
    counter = 1
    while os.path.exists(filepath):
        filepath = os.path.join(output_dir, f"{filename}-{counter}.md")
        counter += 1
    
    # 현재 날짜 사용
    current_date = datetime.now().strftime("%Y-%m-%dT%H:%M:%S+09:00")
    
    # 마크다운 내용 생성
    markdown_content = f"""---
title: "{article_data['title']}"
description: "{article_data['description']}"
date: {current_date}
author: "김현지"
categories: ["엔터테인먼트"]
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
    # 사이트맵 XML 데이터 (제공된 데이터에서 URL 추출)
    sitemap_data = """https://www.reportera.co.kr/sports/worried-about-the-trade-in-baseball/ 2025-06-25T09:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/Worried-about-the-trade-in-baseball.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/롯데-이정훈-2.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/한화-중견수-3.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/KBO리그-4.jpg https://www.reportera.co.kr/news/kf-21-rolls-royce-engine/ 2025-06-25T10:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/kf-21-Rolls-Royce-Engine.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/kf-21-3.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/kf-21-1-1.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/kf-21-2.jpg https://www.reportera.co.kr/news/samsung-electronics-foundry/ 2025-06-25T08:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/samsung-electronics-foundry.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/삼성-3.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/TSMC.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/삼성-2-1.jpg https://www.reportera.co.kr/news/differences-in-wall-mounted-air-conditioner-performance/ 2025-06-25T06:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/Differences-in-wall-mounted-air-conditioner-performance.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/에어컨-2.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/에어컨-3.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/창문.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/에어컨화재.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/에어컨-1.jpg https://www.reportera.co.kr/news/relaxation-of-qualifications-for-local-housing-associations/ 2025-06-25T04:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/Relaxation-of-qualifications-for-local-housing-associations.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/지역주택조합-2.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/재건축-1.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/부동산-7.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/아파트-7.jpg https://www.reportera.co.kr/sports/a-change-in-football-regulations/ 2025-06-25T05:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/goal-keeper-001.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/한국프로축구연맹-이사회-2.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/축구-경기-4.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/골키퍼-3.jpg https://www.reportera.co.kr/sports/an-increase-in-the-national-soccer-teams-allowance/ 2025-06-25T01:37:22+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/an-increase-in-the-national-soccer-teams-allowance.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/축구-남자-대표팀-2-1.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/축구-여자-대표팀-4-1.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/축구-팀-훈련-4.jpg https://www.reportera.co.kr/car/hyundai-exports-from-the-u-s/ 2025-06-25T05:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/Hyundai-Motor-exports-from-the-U.S.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/수출.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/캐나다.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/현대차-아반떼.jpg https://www.reportera.co.kr/car/hyundai-motor-byd-battery/ 2025-06-25T01:00:00+00:00 https://www.reportera.co.kr/wp-content/uploads/2025/06/Hyundai-Motor-BYD-Battery.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/BYD-1.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/beijing-hyundai-elexio.jpg https://www.reportera.co.kr/wp-content/uploads/2025/06/beijing-hyundai-elexio-1.jpg"""
    
    # URL 추출
    urls = []
    lines = sitemap_data.strip().split('\n')
    for line in lines:
        if line.strip():
            parts = line.split()
            for part in parts:
                if part.startswith('https://www.reportera.co.kr/') and not part.endswith('.jpg'):
                    urls.append(part)
    
    # 중복 제거
    urls = list(set(urls))
    
    # 출력 디렉토리 설정
    output_dir = 'content/entertainment'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print(f"Found {len(urls)} URLs to process")
    
    # 각 URL에서 기사 추출 (처음 5개만 처리)
    processed = 0
    for url in urls[:5]:  # 처음 5개만 처리
        print(f"Processing: {url}")
        article_data = extract_content_from_url(url)
        
        if article_data:
            create_markdown_file(article_data, output_dir)
            processed += 1
            
        # 서버 부하 방지를 위한 대기
        time.sleep(random.uniform(1, 3))
    
    print(f"\nProcessed {processed} articles successfully!")

if __name__ == "__main__":
    main() 