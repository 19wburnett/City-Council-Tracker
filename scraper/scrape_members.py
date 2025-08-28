#!/usr/bin/env python3
"""
Boulder City Council Member Scraper
Scrapes member information from the Boulder City Council website
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BoulderCouncilScraper:
    def __init__(self):
        """Initialize the scraper with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.base_url = "https://bouldercolorado.gov"
        self.members_url = f"{self.base_url}/government/city-council"
        
    def scrape_members_page(self) -> List[Dict]:
        """
        Scrape the main members page to get basic member information
        """
        logger.info("Scraping main members page...")
        
        try:
            response = requests.get(self.members_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            members = []
            
            # Look for the specific person-detail elements that contain council members
            member_sections = soup.find_all('div', class_='c-person-detail')
            
            logger.info(f"Found {len(member_sections)} council members")
            
            for section in member_sections:
                member_info = self._extract_member_from_section(section)
                if member_info:
                    members.append(member_info)
            
            logger.info(f"Successfully extracted {len(members)} members")
            return members
            
        except Exception as e:
            logger.error(f"Error scraping main members page: {e}")
            return []
    
    def _extract_member_from_section(self, section) -> Optional[Dict]:
        """Extract member information from a person-detail section"""
        try:
            # Extract name from the h3 element
            name_elem = section.find('h3', class_='c-person-detail__name')
            if not name_elem:
                return None
            
            name_link = name_elem.find('a')
            if not name_link:
                return None
            
            name = name_link.get_text(strip=True)
            if not name or len(name) < 2:
                return None
            
            # Extract photo URL
            photo_url = None
            img_elem = section.find('img')
            if img_elem and img_elem.get('src'):
                src = img_elem['src']
                if src.startswith('http'):
                    photo_url = src
                else:
                    photo_url = f"{self.base_url}{src}" if src.startswith('/') else f"{self.base_url}/{src}"
            
            # Extract title/position
            title_elem = section.find('div', class_='c-person-detail__title')
            seat = "City Council Member"  # Default
            if title_elem:
                title_text = title_elem.get_text(strip=True)
                if title_text:
                    seat = title_text
            
            # Extract term years
            term_elem = section.find('div', class_='c-person-detail__term')
            term_years = ""
            if term_elem:
                term_item = term_elem.find('p', class_='field__item')
                if term_item:
                    term_years = term_item.get_text(strip=True)
            
            # Extract individual member page URL for more details
            member_page_url = None
            if section.get('data-href'):
                member_page_url = f"{self.base_url}{section['data-href']}"
            
            return {
                'name': name,
                'seat': seat,
                'bio': f"Term: {term_years}" if term_years else "",
                'photo_url': photo_url,
                'contact_info': {},
                'committees': [],
                'stance_scores': {},
            }
            
        except Exception as e:
            logger.error(f"Error extracting member from section: {e}")
            return None
    
    def _fallback_member_extraction(self, soup) -> List[Dict]:
        """Fallback method to extract members using different selectors"""
        logger.info("Using fallback member extraction method...")
        members = []
        
        try:
            # Look for any text that might be member names
            # This is a more aggressive approach
            potential_names = []
            
            # Look for text that might be names (capitalized words, 2-3 words)
            for text in soup.stripped_strings:
                if len(text.split()) in [2, 3] and text[0].isupper():
                    # Filter out common non-name text
                    if not any(word.lower() in ['city', 'council', 'government', 'boulder', 'colorado'] for word in text.split()):
                        potential_names.append(text)
            
            # Take the first few potential names as members
            for name in potential_names[:9]:  # Boulder has 9 council members
                members.append({
                    'name': name,
                    'seat': 'Council Member',
                    'bio': '',
                    'photo_url': None,
                    'contact_info': {},
                    'committees': [],
                    'stance_scores': {}
                })
            
        except Exception as e:
            logger.error(f"Error in fallback extraction: {e}")
        
        return members
    
    def scrape_individual_member_pages(self, members: List[Dict]) -> List[Dict]:
        """
        Scrape individual member pages for more detailed information
        """
        logger.info("Scraping individual member pages...")
        
        updated_members = []
        
        for member in members:
            try:
                # Try to find individual member page
                member_page_info = self._scrape_member_page(member)
                if member_page_info:
                    member.update(member_page_info)
                
                updated_members.append(member)
                
            except Exception as e:
                logger.error(f"Error scraping individual page for {member.get('name', 'Unknown')}: {e}")
                updated_members.append(member)
        
        return updated_members
    
    def _scrape_member_page(self, member: Dict) -> Optional[Dict]:
        """Scrape individual member page for additional details"""
        try:
            # Try to construct member page URL
            name_slug = member['name'].lower().replace(' ', '-')
            potential_urls = [
                f"{self.base_url}/city-council/members/{name_slug}",
                f"{self.base_url}/city-council/member/{name_slug}",
                f"{self.base_url}/government/city-council/members/{name_slug}"
            ]
            
            for url in potential_urls:
                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        return self._parse_member_page(response.content, member)
                except:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error in _scrape_member_page: {e}")
            return None
    
    def _parse_member_page(self, content, member: Dict) -> Dict:
        """Parse individual member page content"""
        soup = BeautifulSoup(content, 'html.parser')
        updates = {}
        
        try:
            # Look for additional bio text
            bio_elements = soup.find_all(['p', 'div'], string=lambda x: x and len(x) > 50)
            if bio_elements:
                # Combine all bio text
                bio_text = ' '.join([elem.get_text(strip=True) for elem in bio_elements[:3]])
                if bio_text and len(bio_text) > len(member.get('bio', '')):
                    updates['bio'] = bio_text
            
            # Look for committees
            committee_elements = soup.find_all(['li', 'span'], string=lambda x: x and any(word in x.lower() for word in ['committee', 'board', 'commission']))
            if committee_elements:
                committees = [elem.get_text(strip=True) for elem in committee_elements]
                updates['committees'] = committees
            
            # Look for additional contact info
            contact_elements = soup.find_all('a', href=True)
            for elem in contact_elements:
                href = elem['href']
                if 'mailto:' in href:
                    updates.setdefault('contact_info', {})['email'] = href.replace('mailto:', '')
                elif 'tel:' in href:
                    updates.setdefault('contact_info', {})['phone'] = href.replace('tel:', '')
                elif 'linkedin.com' in href:
                    updates.setdefault('contact_info', {})['linkedin'] = href
                elif 'twitter.com' in href:
                    updates.setdefault('contact_info', {})['twitter'] = href
            
        except Exception as e:
            logger.error(f"Error parsing member page: {e}")
        
        return updates
    
    def save_to_supabase(self, members: List[Dict]) -> bool:
        """Save scraped members to Supabase"""
        logger.info(f"Saving {len(members)} members to Supabase...")
        
        try:
            for member in members:
                # Check if member already exists
                existing = self.supabase.table('members').select('id').eq('name', member['name']).execute()
                
                if existing.data:
                    # Update existing member
                    member_id = existing.data[0]['id']
                    result = self.supabase.table('members').update(member).eq('id', member_id).execute()
                    logger.info(f"Updated member: {member['name']}")
                else:
                    # Insert new member
                    result = self.supabase.table('members').insert(member).execute()
                    logger.info(f"Inserted new member: {member['name']}")
                
                # Check for errors in the new response format
                if hasattr(result, 'error') and result.error:
                    logger.error(f"Error saving member {member['name']}: {result.error}")
                elif hasattr(result, 'data') and not result.data:
                    logger.error(f"Error saving member {member['name']}: No data returned")
            
            logger.info("Successfully saved all members to Supabase")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to Supabase: {e}")
            return False
    
    def run(self) -> bool:
        """Run the complete scraping process"""
        logger.info("Starting Boulder City Council member scraping...")
        
        try:
            # Scrape main members page
            members = self.scrape_members_page()
            
            if not members:
                logger.error("No members found during scraping")
                return False
            
            # Scrape individual member pages for more details
            members = self.scrape_individual_member_pages(members)
            
            # Save to Supabase
            success = self.save_to_supabase(members)
            
            if success:
                logger.info(f"Successfully scraped and saved {len(members)} members")
                return True
            else:
                logger.error("Failed to save members to Supabase")
                return False
                
        except Exception as e:
            logger.error(f"Error during scraping process: {e}")
            return False

def main():
    """Main function to run the scraper"""
    try:
        scraper = BoulderCouncilScraper()
        success = scraper.run()
        
        if success:
            logger.info("Scraping completed successfully")
            sys.exit(0)
        else:
            logger.error("Scraping failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()