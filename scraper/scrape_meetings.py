#!/usr/bin/env python3
"""
Boulder City Council Meeting Minutes Scraper
Scrapes meeting minutes and extracts decisions with member assignments
"""

import os
import sys
import json
import logging
import re
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from supabase import create_client, Client
from dotenv import load_dotenv
import PyPDF2
import io

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BoulderMeetingScraper:
    def __init__(self):
        """Initialize the scraper with Supabase connection"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.base_url = "https://documents.bouldercolorado.gov"
        self.meetings_url = f"{self.base_url}/WebLink/Browse.aspx?id=10888&dbid=0&repo=LF8PROD2"
        
        # Common decision patterns
        self.decision_patterns = [
            r'(?:MOTION|motion)\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'(?:SECOND|second)\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'(?:VOTE|vote):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*(YEA|NAY|ABSTAIN|ABSENT)',
            r'(?:Council Member|Mayor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:moved|seconded|voted)',
            r'(?:Moved|Seconded)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        
        # Outcome patterns
        self.outcome_patterns = [
            r'(?:MOTION|motion)\s+(?:PASSED|passed|APPROVED|approved|DENIED|denied|TABLED|tabled)',
            r'(?:RESOLUTION|resolution)\s+(?:ADOPTED|adopted|APPROVED|approved)',
            r'(?:ORDINANCE|ordinance)\s+(?:PASSED|passed|APPROVED|approved)',
            r'(?:VOTE|vote)\s+RESULT:\s*(PASSED|passed|FAILED|failed|TABLED|tabled)',
        ]
        
        # Load existing members for name matching
        self.members = self._load_existing_members()
        
    def _load_existing_members(self) -> List[Dict]:
        """Load existing members from database for name matching"""
        try:
            result = self.supabase.table('members').select('id,name').execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error loading members: {e}")
            return []
    
    def _find_member_by_name(self, name: str) -> Optional[Dict]:
        """Find a member by name (fuzzy matching)"""
        if not name or len(name.strip()) < 2:
            return None
            
        name = name.strip()
        
        # Exact match first
        for member in self.members:
            if member['name'].lower() == name.lower():
                return member
        
        # Partial match
        for member in self.members:
            if name.lower() in member['name'].lower() or member['name'].lower() in name.lower():
                return member
        
        # Split name and try matching parts
        name_parts = name.split()
        for member in self.members:
            member_parts = member['name'].split()
            if any(part.lower() in [mp.lower() for mp in member_parts] for part in name_parts):
                return member
        
        return None
    
    def scrape_meetings_list(self) -> List[Dict]:
        """Scrape the meetings list page to get meeting URLs by navigating through folders"""
        logger.info("Scraping meetings list page...")
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=False)  # Set to False for debugging
                page = browser.new_page()
                
                # Navigate to the meetings page
                logger.info(f"Navigating to: {self.meetings_url}")
                page.goto(self.meetings_url, wait_until='networkidle')
                
                # Wait a bit for the page to load
                page.wait_for_timeout(5000)
                
                # Take a screenshot for debugging
                page.screenshot(path="meetings_page.png")
                logger.info("Screenshot saved as meetings_page.png")
                
                # Get the page content to see what's actually there
                page_content = page.content()
                logger.info(f"Page title: {page.title()}")
                
                # Look for folder links and navigate through them
                meetings = []
                
                # First, look for year folders or main category folders
                folder_links = page.query_selector_all('a[href*="Browse.aspx"]')
                logger.info(f"Found {len(folder_links)} potential folder links")
                
                # Store folder information before navigation
                folder_info = []
                for folder_link in folder_links[:5]:  # Limit to first 5 folders for testing
                    try:
                        folder_text = folder_link.inner_text().strip()
                        folder_href = folder_link.get_attribute('href')
                        
                        if folder_href and not folder_text.lower() in ['back', 'up', 'home']:
                            folder_info.append({
                                'text': folder_text,
                                'href': folder_href
                            })
                    except Exception as e:
                        logger.error(f"Error extracting folder info: {e}")
                        continue
                
                # Process each folder to find meeting PDFs
                for i, folder in enumerate(folder_info):
                    try:
                        logger.info(f"Processing folder {i+1}: '{folder['text']}' -> {folder['href']}")
                        
                        # Navigate to the folder
                        folder_url = f"{self.base_url}/WebLink/{folder['href']}" if not folder['href'].startswith('http') else folder['href']
                        logger.info(f"Navigating to folder: {folder_url}")
                        
                        page.goto(folder_url, wait_until='networkidle')
                        page.wait_for_timeout(3000)
                        
                        # Take a screenshot of the folder page for debugging
                        page.screenshot(path=f"folder_{folder['text']}.png")
                        logger.info(f"Screenshot saved as folder_{folder['text']}.png")
                        
                        # Wait a bit more for any dynamic content to load
                        page.wait_for_timeout(2000)
                        
                        # Check if there are iframes
                        iframes = page.query_selector_all('iframe')
                        logger.info(f"Found {len(iframes)} iframes in folder '{folder['text']}'")
                        
                        # Look for all links in this folder to see what's available
                        all_links = page.query_selector_all('a')
                        logger.info(f"Found {len(all_links)} total links in folder '{folder['text']}'")
                        
                        # Look for meeting entries in the table
                        # Based on the text preview, meetings are listed in a table with "Minutes - Date" format
                        meeting_entries = page.query_selector_all('tr')
                        logger.info(f"Found {len(meeting_entries)} table rows in folder '{folder['text']}'")
                        
                        # Look for rows that contain meeting information
                        for row in meeting_entries:
                            try:
                                row_text = row.inner_text().strip()
                                if 'Minutes' in row_text and any(char.isdigit() for char in row_text):
                                    # This looks like a meeting entry
                                    logger.info(f"Found meeting entry: {row_text}")
                                    
                                    # Look for clickable elements in this row
                                    row_links = row.query_selector_all('a')
                                    for link in row_links:
                                        link_text = link.inner_text().strip()
                                        link_href = link.get_attribute('href')
                                        
                                        if link_href and link_text and 'Minutes' in link_text:
                                            logger.info(f"  Clickable meeting link: '{link_text}' -> {link_href}")
                                            
                                            # Try to extract date from the meeting title
                                            meeting_date = self._extract_date_from_filename(link_text)
                                            
                                            # Store the meeting information
                                            meetings.append({
                                                'title': link_text,
                                                'date': meeting_date,
                                                'url': f"{self.base_url}{link_href}" if not link_href.startswith('http') else link_href,
                                                'type': 'Meeting Minutes',
                                                'folder': folder['text']
                                            })
                                            
                                            logger.info(f"Added meeting: '{link_text}'")
                            except Exception as e:
                                logger.error(f"Error processing row: {e}")
                                continue
                        
                        # Also look for any PDF links that might be direct
                        pdf_links = page.query_selector_all('a[href*=".pdf"], a[href*=".PDF"]')
                        logger.info(f"Found {len(pdf_links)} direct PDF links in folder '{folder['text']}'")
                        
                        for pdf_link in pdf_links:
                            try:
                                pdf_text = pdf_link.inner_text().strip()
                                pdf_href = pdf_link.get_attribute('href')
                                
                                if pdf_href and pdf_text:
                                    # Try to extract date from the PDF filename or text
                                    meeting_date = self._extract_date_from_filename(pdf_text)
                                    
                                    meetings.append({
                                        'title': pdf_text,
                                        'date': meeting_date,
                                        'url': f"{self.base_url}{pdf_href}" if not pdf_href.startswith('http') else pdf_href,
                                        'type': 'Meeting Minutes',
                                        'folder': folder['text']
                                    })
                                    
                                    logger.info(f"Found direct PDF: '{pdf_text}' -> {pdf_href}")
                                    
                            except Exception as e:
                                logger.error(f"Error processing PDF link: {e}")
                                continue
                        
                        # Go back to main page
                        page.goto(self.meetings_url, wait_until='networkidle')
                        page.wait_for_timeout(2000)
                        
                    except Exception as e:
                        logger.error(f"Error processing folder {i+1}: {e}")
                        # Try to go back to main page
                        try:
                            page.goto(self.meetings_url, wait_until='networkidle')
                            page.wait_for_timeout(2000)
                        except:
                            pass
                        continue
                
                browser.close()
                logger.info(f"Found {len(meetings)} meetings across all folders")
                return meetings
                
        except Exception as e:
            logger.error(f"Error scraping meetings list: {e}")
            return []
    
    def _extract_date_from_filename(self, filename: str) -> Optional[date]:
        """Extract date from PDF filename"""
        if not filename:
            return None
        
        # First, try to extract date from "Minutes - Apr-04-2000" format
        minutes_date_pattern = r'Minutes\s*-\s*([A-Za-z]+)-(\d{1,2})-(\d{4})'
        match = re.search(minutes_date_pattern, filename)
        if match:
            try:
                month_name, day, year = match.groups()
                # Convert month name to number
                month_map = {
                    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                }
                month = month_map.get(month_name[:3])
                if month:
                    return date(int(year), month, int(day))
            except ValueError:
                pass
        
        # Common date patterns in filenames
        date_patterns = [
            r'(\d{1,2})[-_](\d{1,2})[-_](\d{4})',  # MM-DD-YYYY or MM_DD_YYYY
            r'(\d{4})[-_](\d{1,2})[-_](\d{1,2})',  # YYYY-MM-DD or YYYY_MM_DD
            r'(\d{1,2})[-_](\d{1,2})[-_](\d{2})',  # MM-DD-YY or MM_DD_YY
            r'(\d{4})(\d{2})(\d{2})',  # YYYYMMDD
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # MM/DD/YYYY or MM-DD-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, filename)
            if match:
                try:
                    if len(match.groups()) == 3:
                        if len(match.group(1)) == 4:  # YYYY-MM-DD format
                            year, month, day = match.groups()
                        else:  # MM-DD-YYYY format
                            month, day, year = match.groups()
                        
                        # Handle 2-digit years
                        if len(year) == 2:
                            year = '20' + year
                        
                        return date(int(year), int(month), int(day))
                except ValueError:
                    continue
        
        # If no date found, try to extract from text content
        return self._parse_date(filename)
    
    def _parse_date(self, date_text: str) -> Optional[date]:
        """Parse date from various formats"""
        if not date_text:
            return None
            
        # Common date formats
        date_formats = [
            '%m/%d/%Y',
            '%m-%d-%Y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%Y-%m-%d'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_text.strip(), fmt).date()
            except ValueError:
                continue
        
        # Try to extract date using regex
        date_patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',
            r'(\d{1,2})-(\d{1,2})-(\d{4})',
            r'(\d{4})-(\d{1,2})-(\d{1,2})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_text)
            if match:
                try:
                    if len(match.groups()) == 3:
                        month, day, year = match.groups()
                        return date(int(year), int(month), int(day))
                except ValueError:
                    continue
        
        logger.warning(f"Could not parse date: {date_text}")
        return None
    
    def scrape_meeting_minutes(self, meeting_url: str) -> Optional[Dict]:
        """Scrape individual meeting minutes using Playwright"""
        logger.info(f"Scraping meeting minutes: {meeting_url}")
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                
                # Navigate to the meeting document
                logger.info(f"Navigating to: {meeting_url}")
                page.goto(meeting_url, wait_until='networkidle', timeout=30000)
                page.wait_for_timeout(5000)
                
                # Take a screenshot for debugging
                screenshot_path = f"meeting_{meeting_url.split('id=')[1].split('&')[0]}.png"
                page.screenshot(path=screenshot_path)
                logger.info(f"Screenshot saved as {screenshot_path}")
                
                # Look for download buttons specifically - try multiple approaches
                download_buttons = []
                
                # Method 1: Look for all buttons and inputs
                try:
                    download_buttons.extend(page.query_selector_all('button'))
                    download_buttons.extend(page.query_selector_all('input[type="button"]'))
                    download_buttons.extend(page.query_selector_all('input[type="submit"]'))
                    download_buttons.extend(page.query_selector_all('input[type="image"]'))
                except:
                    pass
                
                # Method 2: Look for links that might be download buttons
                try:
                    download_buttons.extend(page.query_selector_all('a'))
                except:
                    pass
                
                # Method 3: Look for any clickable elements with download-related text or attributes
                try:
                    # Look for elements with download-related text
                    download_text_elements = page.query_selector_all('*:has-text("Download"), *:has-text("download"), *:has-text("Save"), *:has-text("save")')
                    download_buttons.extend(download_text_elements)
                    
                    # Look for elements with download-related attributes
                    download_attr_elements = page.query_selector_all('[onclick*="download"], [onclick*="Download"], [href*="download"], [href*="Download"]')
                    download_buttons.extend(download_attr_elements)
                except:
                    pass
                
                # Filter and deduplicate download buttons
                unique_buttons = []
                seen_texts = set()
                
                for btn in download_buttons:
                    if not btn:
                        continue
                    try:
                        btn_text = btn.inner_text().strip().lower()
                        btn_href = btn.get_attribute('href') or ''
                        btn_onclick = btn.get_attribute('onclick') or ''
                        
                        # Check if this looks like a download button
                        is_download = any(word in btn_text for word in ['download', 'save', 'get', 'export', 'pdf']) or \
                                    any(word in btn_href.lower() for word in ['download', 'save', 'get', 'export', 'pdf']) or \
                                    any(word in btn_onclick.lower() for word in ['download', 'save', 'get', 'export', 'pdf'])
                        
                        if is_download and btn_text not in seen_texts:
                            unique_buttons.append(btn)
                            seen_texts.add(btn_text)
                    except:
                        continue
                
                download_buttons = unique_buttons
                logger.info(f"Found {len(download_buttons)} download buttons")
                
                # Also look for any elements that might contain "View plain text" or similar
                view_text_elements = page.query_selector_all('*:has-text("View plain text"), *:has-text("view plain text")')
                logger.info(f"Found {len(view_text_elements)} 'View plain text' elements")
                
                # Add these to download buttons if they might lead to text content
                for elem in view_text_elements:
                    try:
                        elem_text = elem.inner_text().strip().lower()
                        if 'view plain text' in elem_text:
                            download_buttons.append(elem)
                            logger.info(f"Added 'View plain text' element: {elem_text}")
                    except:
                        continue
                
                # Also look for download links
                download_links = page.query_selector_all('a[href*="download"], a[href*="Download"], a[href*="view"], a[href*="View"]')
                logger.info(f"Found {len(download_links)} download/view links")
                
                # Check if there's a PDF viewer or download link
                pdf_links = page.query_selector_all('a[href*=".pdf"], a[href*=".PDF"]')
                logger.info(f"Found {len(pdf_links)} PDF links")
                
                # Check download buttons first - these are likely the actual PDF download buttons
                for download_button in download_buttons:
                    try:
                        button_text = download_button.inner_text().strip()
                        logger.info(f"Found download button: '{button_text}'")
                        
                        # Special handling for "View plain text" button
                        if 'view plain text' in button_text.lower():
                            logger.info(f"Clicking 'View plain text' button to get meeting content")
                            download_button.click()
                            
                            # Wait for the text content to load
                            page.wait_for_timeout(3000)
                            
                            # Get the updated page content after clicking
                            updated_page_text = page.inner_text('body')
                            logger.info(f"Page text after clicking 'View plain text': {len(updated_page_text)} characters")
                            
                            # Check if we got substantial content
                            if len(updated_page_text) > 1000:
                                logger.info(f"Successfully got meeting content from 'View plain text' button")
                                logger.info(f"Content preview: {updated_page_text[:500]}...")
                                
                                # Parse the text content directly
                                return self._extract_decisions_from_text(updated_page_text, meeting_url)
                            else:
                                logger.warning("'View plain text' button clicked but no substantial content found")
                        else:
                            # Handle other download buttons (PDF downloads)
                            logger.info(f"Clicking download button: '{button_text}'")
                            
                            # Set up download handling
                            download_path = f"downloads/"
                            os.makedirs(download_path, exist_ok=True)
                            
                            # Configure the page to handle downloads
                            page.set_default_timeout(60000)  # 60 seconds for downloads
                            
                            download_button.click()
                            
                            # Wait for download to start
                            page.wait_for_timeout(3000)
                            
                            # Check if a file was downloaded
                            downloaded_files = [f for f in os.listdir(download_path) if f.endswith('.pdf')]
                            if downloaded_files:
                                # Get the most recent PDF file
                                latest_pdf = max(downloaded_files, key=lambda f: os.path.getctime(os.path.join(download_path, f)))
                                pdf_file_path = os.path.join(download_path, latest_pdf)
                                
                                logger.info(f"Successfully downloaded PDF: {latest_pdf}")
                                
                                # Read the PDF file
                                with open(pdf_file_path, 'rb') as pdf_file:
                                    pdf_content = pdf_file.read()
                                
                                # Parse the PDF content
                                return self._parse_pdf_minutes(pdf_content, meeting_url)
                            else:
                                logger.warning("Download button clicked but no PDF file found")
                            
                    except Exception as e:
                        logger.error(f"Error clicking download button: {e}")
                        continue
                
                # Check download links for PDF content
                for download_link in download_links:
                    try:
                        download_href = download_link.get_attribute('href')
                        download_text = download_link.inner_text().strip()
                        if download_href:
                            logger.info(f"Found download link: '{download_text}' -> {download_href}")
                            
                            # Try to access the download link
                            download_url = f"{self.base_url}{download_href}" if not download_href.startswith('http') else download_href
                            logger.info(f"Trying download URL: {download_url}")
                            
                            download_page = browser.new_page()
                            download_page.goto(download_url, wait_until='networkidle', timeout=30000)
                            
                            # Check if this returns PDF content
                            content_type = download_page.evaluate("() => document.contentType || 'unknown'")
                            page_title = download_page.title()
                            page_text = download_page.inner_text('body')
                            
                            logger.info(f"Download link result - Content type: {content_type}, Title: {page_title}, Text length: {len(page_text)}")
                            
                            if 'pdf' in content_type.lower() or 'pdf' in page_title.lower() or len(page_text) > 1000:
                                # This looks like a PDF or contains substantial content
                                download_page.close()
                                logger.info(f"Successfully found content from download link")
                                return self._parse_html_minutes(download_page.content().encode('utf-8'), download_url)
                            else:
                                download_page.close()
                                
                    except Exception as e:
                        logger.error(f"Error checking download link: {e}")
                        continue
                
                # Look for iframes that might contain the PDF viewer
                iframes = page.query_selector_all('iframe')
                logger.info(f"Found {len(iframes)} iframes")
                
                # Check iframes for PDF content
                for iframe in iframes:
                    try:
                        iframe_src = iframe.get_attribute('src')
                        if iframe_src:
                            logger.info(f"Found iframe with src: {iframe_src}")
                            
                            # Try to get the iframe content by examining the page source more carefully
                            try:
                                # Wait for iframe to load
                                page.wait_for_timeout(3000)
                                
                                # Get the page HTML to see if we can find the iframe content
                                page_html = page.content()
                                logger.info(f"Page HTML length: {len(page_html)} characters")
                                
                                # Look for PDF content in the page HTML
                                if 'application/pdf' in page_html or 'pdf' in page_html.lower():
                                    logger.info("Found PDF references in page HTML")
                                    
                                    # Try to find the actual PDF URL by looking for common patterns
                                    pdf_patterns = [
                                        r'src="([^"]*\.pdf[^"]*)"',
                                        r'href="([^"]*\.pdf[^"]*)"',
                                        r'data="([^"]*\.pdf[^"]*)"',
                                        r'url="([^"]*\.pdf[^"]*)"'
                                    ]
                                    
                                    for pattern in pdf_patterns:
                                        matches = re.findall(pattern, page_html, re.IGNORECASE)
                                        if matches:
                                            logger.info(f"Found PDF URLs with pattern {pattern}: {matches}")
                                            for pdf_url in matches:
                                                try:
                                                    # Construct full URL
                                                    full_pdf_url = f"{self.base_url}{pdf_url}" if not pdf_url.startswith('http') else pdf_url
                                                    logger.info(f"Trying PDF URL: {full_pdf_url}")
                                                    
                                                    pdf_page = browser.new_page()
                                                    pdf_page.goto(full_pdf_url, wait_until='networkidle', timeout=30000)
                                                    pdf_content = pdf_page.content()
                                                    pdf_page.close()
                                                    
                                                    # Check if this is actually PDF content
                                                    if 'pdf' in pdf_content.lower() or len(pdf_content) > 1000:
                                                        logger.info(f"Successfully found PDF content from URL: {full_pdf_url}")
                                                        return self._parse_pdf_minutes(pdf_content.encode('utf-8'), full_pdf_url)
                                                except Exception as e:
                                                    logger.error(f"Error accessing PDF URL {pdf_url}: {e}")
                                                    continue
                                
                                # If no PDF URLs found, try to access the iframe directly
                                logger.info("Trying to access iframe directly")
                                
                                # Try different URL construction methods for the iframe
                                iframe_urls_to_try = []
                                
                                if iframe_src.startswith('http'):
                                    iframe_urls_to_try.append(iframe_src)
                                elif iframe_src.startswith('/'):
                                    iframe_urls_to_try.append(f"{self.base_url}{iframe_src}")
                                else:
                                    iframe_urls_to_try.append(f"{self.base_url}/{iframe_src}")
                                    iframe_urls_to_try.append(f"{self.base_url}/WebLink/{iframe_src}")
                                
                                logger.info(f"Will try iframe URLs: {iframe_urls_to_try}")
                                
                                for iframe_url in iframe_urls_to_try:
                                    try:
                                        logger.info(f"Trying iframe URL: {iframe_url}")
                                        
                                        iframe_page = browser.new_page()
                                        iframe_page.goto(iframe_url, wait_until='networkidle', timeout=30000)
                                        
                                        # Take a screenshot of the iframe content
                                        iframe_screenshot = f"iframe_{meeting_url.split('id=')[1].split('&')[0]}.png"
                                        iframe_page.screenshot(path=iframe_screenshot)
                                        logger.info(f"Iframe screenshot saved as {iframe_screenshot}")
                                        
                                        # Check if this iframe contains PDF content
                                        iframe_text = iframe_page.inner_text('body')
                                        logger.info(f"Iframe text length: {len(iframe_text)} characters")
                                        
                                        # Also check the iframe HTML content
                                        iframe_html = iframe_page.content()
                                        logger.info(f"Iframe HTML length: {len(iframe_html)} characters")
                                        
                                        if len(iframe_text) > 1000:  # Likely contains meeting content
                                            logger.info(f"Iframe contains substantial content: {iframe_text[:200]}...")
                                            iframe_page.close()
                                            return self._parse_html_minutes(iframe_html.encode('utf-8'), meeting_url)
                                        else:
                                            logger.info(f"Iframe text content: {iframe_text}")
                                            logger.info(f"Iframe HTML preview: {iframe_html[:500]}...")
                                            
                                            # Check if there are any PDF elements or embedded content
                                            pdf_elements = iframe_page.query_selector_all('embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"]')
                                            if pdf_elements:
                                                logger.info(f"Found {len(pdf_elements)} PDF elements in iframe")
                                                for pdf_elem in pdf_elements:
                                                    pdf_src = pdf_elem.get_attribute('src') or pdf_elem.get_attribute('data')
                                                    if pdf_src:
                                                        logger.info(f"PDF element source: {pdf_src}")
                                                        # Try to access the PDF directly
                                                        pdf_url = f"{self.base_url}{pdf_src}" if not pdf_src.startswith('http') else pdf_src
                                                        try:
                                                            pdf_page = browser.new_page()
                                                            pdf_page.goto(pdf_url, wait_until='networkidle', timeout=30000)
                                                            pdf_content = pdf_page.content()
                                                            pdf_page.close()
                                                            logger.info(f"Successfully accessed PDF content from iframe")
                                                            return self._parse_pdf_minutes(pdf_content.encode('utf-8'), pdf_url)
                                                        except Exception as e:
                                                            logger.error(f"Error accessing PDF from iframe: {e}")
                                                            continue
                                            
                                            iframe_page.close()
                                            break  # Successfully accessed this iframe URL
                                            
                                    except Exception as e:
                                        logger.error(f"Error accessing iframe URL {iframe_url}: {e}")
                                        iframe_page.close()
                                        continue
                                        
                            except Exception as e:
                                logger.error(f"Error examining iframe content: {e}")
                                continue
                                    
                    except Exception as e:
                        logger.error(f"Error checking iframe: {e}")
                        continue
                
                # If we still haven't found content, try to construct the PDF URL directly
                # Based on the URL structure, try to find the actual PDF
                logger.info("Trying to construct PDF URL directly")
                
                # Extract document ID from the meeting URL
                doc_id_match = re.search(r'id=(\d+)', meeting_url)
                if doc_id_match:
                    doc_id = doc_id_match.group(1)
                    logger.info(f"Extracted document ID: {doc_id}")
                    
                    # Try different PDF URL patterns based on the document ID
                    pdf_url_patterns = [
                        f"{self.base_url}/WebLink/GetDocument.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                        f"{self.base_url}/WebLink/Download.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                        f"{self.base_url}/WebLink/ViewDocument.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                        f"{self.base_url}/WebLink/GetFile.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                        f"{self.base_url}/WebLink/Document.aspx?id={doc_id}&dbid=0&repo=LF8PROD2"
                    ]
                    
                    logger.info(f"Will try PDF URL patterns: {pdf_url_patterns}")
                    
                    for pdf_url in pdf_url_patterns:
                        try:
                            logger.info(f"Trying PDF URL pattern: {pdf_url}")
                            
                            pdf_page = browser.new_page()
                            pdf_page.goto(pdf_url, wait_until='networkidle', timeout=30000)
                            
                            # Check if this is actually PDF content
                            pdf_content = pdf_page.content()
                            pdf_page.close()
                            
                            # Check if this looks like PDF content
                            if len(pdf_content) > 1000 and ('pdf' in pdf_content.lower() or 'application/pdf' in pdf_content.lower()):
                                logger.info(f"Successfully found PDF content from URL: {pdf_url}")
                                return self._parse_pdf_minutes(pdf_content.encode('utf-8'), pdf_url)
                            else:
                                logger.info(f"URL {pdf_url} returned content length: {len(pdf_content)}")
                                
                        except Exception as e:
                            logger.error(f"Error accessing PDF URL pattern {pdf_url}: {e}")
                            continue
                
                if pdf_links:
                    # Found PDF links, try to get the PDF content
                    for pdf_link in pdf_links:
                        try:
                            pdf_href = pdf_link.get_attribute('href')
                            if pdf_href:
                                pdf_url = f"{self.base_url}{pdf_href}" if not pdf_href.startswith('http') else pdf_href
                                logger.info(f"Found PDF link: {pdf_url}")
                                
                                # Try to download the PDF using Playwright instead of requests
                                pdf_page = browser.new_page()
                                pdf_page.goto(pdf_url, wait_until='networkidle', timeout=30000)
                                
                                # Check if this is actually a PDF
                                content_type = pdf_page.evaluate("() => document.contentType || 'unknown'")
                                logger.info(f"Content type: {content_type}")
                                
                                if 'pdf' in content_type.lower():
                                    # Get the PDF content
                                    pdf_content = pdf_page.content()
                                    pdf_page.close()
                                    return self._parse_pdf_minutes(pdf_content.encode('utf-8'), pdf_url)
                                else:
                                    pdf_page.close()
                                    
                        except Exception as e:
                            logger.error(f"Error accessing PDF link: {e}")
                            continue
                
                # If no PDF links found, try to get the page content
                page_content = page.content()
                page_text = page.inner_text('body')
                
                logger.info(f"Page text length: {len(page_text)} characters")
                if len(page_text) > 200:
                    logger.info(f"Page text preview: {page_text[:200]}...")
                
                browser.close()
                
                # Check if the content looks like meeting minutes
                if 'minutes' in page_text.lower() or 'meeting' in page_text.lower():
                    return self._parse_html_minutes(page_content.encode('utf-8'), meeting_url)
                else:
                    logger.warning(f"Page content doesn't appear to be meeting minutes")
                    
                    # Try to construct the actual PDF URL by modifying the DocView URL
                    if 'DocView.aspx' in meeting_url:
                        try:
                            # Extract the document ID from the URL
                            doc_id = meeting_url.split('id=')[1].split('&')[0]
                            
                            # Try different PDF URL patterns
                            pdf_url_patterns = [
                                f"{self.base_url}/WebLink/GetDocument.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                                f"{self.base_url}/WebLink/Download.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                                f"{self.base_url}/WebLink/ViewDocument.aspx?id={doc_id}&dbid=0&repo=LF8PROD2",
                                f"{self.base_url}/WebLink/DocView.aspx?id={doc_id}&dbid=0&repo=LF8PROD2&format=pdf"
                            ]
                            
                            for pdf_url in pdf_url_patterns:
                                try:
                                    logger.info(f"Trying PDF URL pattern: {pdf_url}")
                                    pdf_page = browser.new_page()
                                    pdf_page.goto(pdf_url, wait_until='networkidle', timeout=30000)
                                    
                                    # Check if this returns PDF content
                                    content_type = pdf_page.evaluate("() => document.contentType || 'unknown'")
                                    page_title = pdf_page.title()
                                    logger.info(f"PDF URL pattern result - Content type: {content_type}, Title: {page_title}")
                                    
                                    if 'pdf' in content_type.lower() or 'pdf' in page_title.lower():
                                        # This looks like a PDF, try to get the content
                                        pdf_content = pdf_page.content()
                                        pdf_page.close()
                                        logger.info(f"Successfully found PDF content from URL pattern")
                                        return self._parse_pdf_minutes(pdf_content.encode('utf-8'), pdf_url)
                                    else:
                                        pdf_page.close()
                                        
                                except Exception as e:
                                    logger.error(f"Error trying PDF URL pattern {pdf_url}: {e}")
                                    continue
                                    
                        except Exception as e:
                            logger.error(f"Error constructing PDF URL patterns: {e}")
                    
                    return None
                
        except Exception as e:
            logger.error(f"Error scraping meeting minutes: {e}")
            return None
    
    def _parse_pdf_minutes(self, pdf_content: bytes, meeting_url: str) -> Optional[Dict]:
        """Parse PDF meeting minutes"""
        try:
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"
            
            return self._extract_decisions_from_text(text_content, meeting_url)
            
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            return None
    
    def _parse_html_minutes(self, html_content: bytes, meeting_url: str) -> Optional[Dict]:
        """Parse HTML meeting minutes"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            text_content = soup.get_text()
            return self._extract_decisions_from_text(text_content, meeting_url)
            
        except Exception as e:
            logger.error(f"Error parsing HTML: {e}")
            return None
    
    def _extract_decisions_from_text(self, text: str, meeting_url: str) -> Dict:
        """Extract decisions and member involvement from text"""
        decisions = []
        
        # Split text into paragraphs/sections
        sections = text.split('\n\n')
        logger.info(f"Processing {len(sections)} text sections")
        
        for i, section in enumerate(sections):
            section = section.strip()
            if len(section) < 50:  # Skip very short sections
                continue
            
            logger.info(f"Processing section {i+1}: {section[:100]}...")
            
            # Look for decision patterns
            decision_info = self._identify_decision(section)
            if decision_info:
                logger.info(f"Found decision in section {i+1}: {decision_info['title']}")
                decisions.append(decision_info)
            else:
                # Log why this section wasn't identified as a decision
                text_upper = section.upper()
                decision_indicators = ['MOTION', 'RESOLUTION', 'ORDINANCE', 'VOTE', 'DECISION', 'APPROVED', 'DENIED', 'PASSED', 'FAILED', 'TABLED', 'SECOND', 'MOVE', 'MOVED']
                found_indicators = [indicator for indicator in decision_indicators if indicator in text_upper]
                if found_indicators:
                    logger.info(f"Section {i+1} has indicators {found_indicators} but wasn't identified as decision")
        
        logger.info(f"Extracted {len(decisions)} decisions from text")
        return {
            'decisions': decisions,
            'source_url': meeting_url,
            'raw_text': text[:1000] + "..." if len(text) > 1000 else text  # Store first 1000 chars
        }
    
    def _identify_decision(self, text: str) -> Optional[Dict]:
        """Identify if a text section contains a decision"""
        text_upper = text.upper()
        
        # Skip header/title sections that don't contain actual decisions
        # But be more careful about sections that might contain both headers AND decisions
        header_indicators = ['MINUTES', 'CALL TO ORDER', 'ROLL CALL', 'PUBLIC', 'ADJOURNMENT']
        
        # Only skip if the section is ONLY a header (very short or just contains header text)
        if len(text.strip()) < 50:
            return None
            
        # Check if this is just a header section
        text_words = text_upper.split()
        if len(text_words) < 10 and all(word in header_indicators for word in text_words if len(word) > 3):
            return None
        
        # Check if this looks like a decision
        decision_indicators = ['MOTION', 'RESOLUTION', 'ORDINANCE', 'VOTE', 'DECISION', 'APPROVED', 'DENIED', 'PASSED', 'FAILED', 'TABLED', 'SECOND', 'MOVE', 'MOVED']
        if not any(indicator in text_upper for indicator in decision_indicators):
            return None
        
        # Skip very short sections that are likely just headers
        if len(text.strip()) < 100:
            return None
        
        # Extract decision type
        decision_type = self._extract_decision_type(text)
        
        # Extract outcome
        outcome = self._extract_outcome(text)
        
        # Extract member involvement
        member_involvement = self._extract_member_involvement(text)
        
        # For now, don't require member involvement to be present
        # Some decisions might not have clear member assignments
        
        # Create decision title from first sentence
        first_sentence = text.split('.')[0] if '.' in text else text[:100]
        
        return {
            'title': first_sentence.strip(),
            'description': text[:500] + "..." if len(text) > 500 else text,
            'decision_type': decision_type,
            'outcome': outcome,
            'source_text': text,
            'member_involvement': member_involvement or []
        }
    
    def _extract_decision_type(self, text: str) -> str:
        """Extract the type of decision"""
        text_upper = text.upper()
        
        if 'MOTION' in text_upper:
            return 'motion'
        elif 'RESOLUTION' in text_upper:
            return 'resolution'
        elif 'ORDINANCE' in text_upper:
            return 'ordinance'
        elif 'PROCLAMATION' in text_upper:
            return 'proclamation'
        elif 'VOTE' in text_upper:
            return 'vote'
        else:
            return 'decision'
    
    def _extract_outcome(self, text: str) -> str:
        """Extract the outcome of the decision"""
        text_upper = text.upper()
        
        if any(word in text_upper for word in ['APPROVED', 'PASSED', 'ADOPTED', 'ACCEPTED']):
            return 'approved'
        elif any(word in text_upper for word in ['DENIED', 'REJECTED', 'FAILED']):
            return 'denied'
        elif any(word in text_upper for word in ['TABLED', 'POSTPONED', 'DEFERRED']):
            return 'tabled'
        elif any(word in text_upper for word in ['REFERRED', 'SENT TO COMMITTEE']):
            return 'referred'
        else:
            return 'unknown'
    
    def _extract_member_involvement(self, text: str) -> List[Dict]:
        """Extract member involvement from decision text"""
        involvement = []
        
        # Look for motion makers
        motion_pattern = r'(?:MOTION|motion)\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        motion_matches = re.findall(motion_pattern, text, re.IGNORECASE)
        
        for name in motion_matches:
            member = self._find_member_by_name(name)
            if member:
                involvement.append({
                    'member_id': member['id'],
                    'member_name': member['name'],
                    'role': 'mover',
                    'vote_value': None
                })
        
        # Look for seconders
        second_pattern = r'(?:SECOND|second)\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        second_matches = re.findall(second_pattern, text, re.IGNORECASE)
        
        for name in second_matches:
            member = self._find_member_by_name(name)
            if member:
                involvement.append({
                    'member_id': member['id'],
                    'member_name': member['name'],
                    'role': 'seconder',
                    'vote_value': None
                })
        
        # Look for individual votes
        vote_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-:]\s*(YEA|NAY|ABSTAIN|ABSENT)'
        vote_matches = re.findall(vote_pattern, text, re.IGNORECASE)
        
        for name, vote in vote_matches:
            member = self._find_member_by_name(name)
            if member:
                involvement.append({
                    'member_id': member['id'],
                    'member_name': member['name'],
                    'role': 'voter',
                    'vote_value': vote.upper()
                })
        
        return involvement
    
    def save_meeting_to_supabase(self, meeting_data: Dict, decisions_data: Dict) -> bool:
        """Save meeting and decisions to Supabase"""
        try:
            # First, save or update the meeting
            meeting_record = {
                'date': meeting_data['date'].isoformat() if meeting_data['date'] else None,
                'title': meeting_data['title'],
                'meeting_type': meeting_data['type'],
                'minutes_url': meeting_data['url']
            }
            
            # Check if meeting already exists
            existing = self.supabase.table('meetings').select('id').eq('date', meeting_data['date']).eq('title', meeting_data['title']).execute()
            
            if existing.data:
                # Update existing meeting
                meeting_id = existing.data[0]['id']
                result = self.supabase.table('meetings').update(meeting_record).eq('id', meeting_id).execute()
                logger.info(f"Updated meeting: {meeting_data['title']}")
            else:
                # Insert new meeting
                result = self.supabase.table('meetings').insert(meeting_record).execute()
                meeting_id = result.data[0]['id'] if result.data else None
                logger.info(f"Inserted new meeting: {meeting_data['title']}")
            
            if not meeting_id:
                logger.error("Failed to get meeting ID")
                return False
            
            # Save decisions
            for decision in decisions_data.get('decisions', []):
                decision_record = {
                    'meeting_id': meeting_id,
                    'title': decision['title'],
                    'description': decision['description'],
                    'decision_type': decision['decision_type'],
                    'outcome': decision['outcome'],
                    'source_text': decision['source_text']
                }
                
                # Insert decision
                decision_result = self.supabase.table('decisions').insert(decision_record).execute()
                if not decision_result.data:
                    logger.error(f"Failed to insert decision: {decision['title']}")
                    continue
                
                decision_id = decision_result.data[0]['id']
                
                # Save member involvement
                for involvement in decision.get('member_involvement', []):
                    involvement_record = {
                        'decision_id': decision_id,
                        'member_id': involvement['member_id'],
                        'role': involvement['role'],
                        'vote_value': involvement['vote_value']
                    }
                    
                    self.supabase.table('decision_members').insert(involvement_record).execute()
            
            logger.info(f"Successfully saved meeting and {len(decisions_data.get('decisions', []))} decisions")
            return True
            
        except Exception as e:
            logger.error(f"Error saving meeting to Supabase: {e}")
            return False
    
    def run(self, max_meetings: int = 10) -> bool:
        """Run the complete meeting scraping process"""
        logger.info("Starting Boulder City Council meeting scraping...")
        
        try:
            # Scrape meetings list
            meetings = self.scrape_meetings_list()
            
            if not meetings:
                logger.error("No meetings found during scraping")
                return False
            
            # Limit to recent meetings
            meetings = sorted(meetings, key=lambda x: x['date'] if x['date'] else date.min, reverse=True)[:max_meetings]
            
            successful_meetings = 0
            
            for meeting in meetings:
                try:
                    # Scrape meeting minutes
                    decisions_data = self.scrape_meeting_minutes(meeting['url'])
                    
                    if decisions_data and decisions_data.get('decisions'):
                        # Save to Supabase
                        success = self.save_meeting_to_supabase(meeting, decisions_data)
                        if success:
                            successful_meetings += 1
                            logger.info(f"Successfully processed meeting: {meeting['title']}")
                        else:
                            logger.error(f"Failed to save meeting: {meeting['title']}")
                    else:
                        logger.warning(f"No decisions found in meeting: {meeting['title']}")
                        
                except Exception as e:
                    logger.error(f"Error processing meeting {meeting.get('title', 'Unknown')}: {e}")
                    continue
            
            logger.info(f"Successfully processed {successful_meetings} out of {len(meetings)} meetings")
            return successful_meetings > 0
                
        except Exception as e:
            logger.error(f"Error during scraping process: {e}")
            return False

def main():
    """Main function to run the scraper"""
    try:
        scraper = BoulderMeetingScraper()
        success = scraper.run(max_meetings=5)  # Start with 5 meetings for testing
        
        if success:
            logger.info("Meeting scraping completed successfully")
            sys.exit(0)
        else:
            logger.error("Meeting scraping failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
