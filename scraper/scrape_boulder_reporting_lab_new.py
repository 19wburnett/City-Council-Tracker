#!/usr/bin/env python3
"""
Boulder Reporting Lab Vote Tracker Integration - New Normalized Schema
Integrates data from BRL's vote tracker spreadsheet into the new normalized database
"""

import os
import sys
import json
import logging
import pandas as pd
import re
import io
from datetime import datetime
from typing import Dict, List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BoulderReportingLabIntegrator:
    def __init__(self):
        """Initialize the integrator with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # BRL Vote Tracker URLs
        self.brl_vote_tracker_url = "https://boulderreportinglab.org/boulder-city-council-vote-tracker/"
        
        # Load Boulder city and existing council members
        self.boulder_city = self._load_boulder_city()
        self.council_members = self._load_council_members()
        
    def _load_boulder_city(self) -> Optional[Dict]:
        """Load Boulder city record"""
        try:
            result = self.supabase.table('cities').select('id,name').eq('name', 'Boulder').execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error loading Boulder city: {e}")
            return None
    
    def _load_council_members(self) -> List[Dict]:
        """Load existing council members for Boulder"""
        try:
            result = self.supabase.table('council_members').select('id,name,title').eq('city_id', self.boulder_city['id']).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error loading council members: {e}")
            return []
    
    def _find_member_by_name(self, name: str) -> Optional[Dict]:
        """Find a council member by name (fuzzy matching)"""
        if not name or len(name.strip()) < 2:
            return None
            
        name = name.strip()
        
        # Exact match first
        for member in self.council_members:
            if member['name'].lower() == name.lower():
                return member
        
        # Partial match
        for member in self.council_members:
            if name.lower() in member['name'].lower() or member['name'].lower() in name.lower():
                return member
        
        return None
    
    def _scrape_google_sheets(self, spreadsheet_url: str) -> Optional[pd.DataFrame]:
        """Scrape data from Google Sheets CSV export"""
        try:
            # Convert to CSV export URL
            if '/spreadsheets/d/' in spreadsheet_url:
                sheet_id = spreadsheet_url.split('/spreadsheets/d/')[1].split('/')[0]
                csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
            else:
                csv_url = spreadsheet_url
            
            logger.info(f"Attempting to access CSV export: {csv_url}")
            
            response = requests.get(csv_url)
            response.raise_for_status()
            
            # Read CSV data
            df = pd.read_csv(io.StringIO(response.text))
            logger.info(f"Successfully loaded {len(df)} rows from Google Sheets")
            
            return df
            
        except Exception as e:
            logger.error(f"Error scraping Google Sheets: {e}")
            return None
    
    def scrape_brl_vote_tracker(self) -> Optional[pd.DataFrame]:
        """Scrape the actual BRL vote tracker data from their website"""
        logger.info("Attempting to access BRL vote tracker data...")
        
        try:
            # First, let's scrape the BRL page to see if we can find the spreadsheet link
            response = requests.get(self.brl_vote_tracker_url)
            response.raise_for_status()
            
            # Parse the HTML to find the spreadsheet link
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for Google Sheets links or embedded spreadsheets
            spreadsheet_links = []
            
            # Check for Google Sheets links
            for link in soup.find_all('a', href=True):
                href = link['href']
                if 'docs.google.com' in href or 'sheets.google.com' in href:
                    spreadsheet_links.append(href)
                    logger.info(f"Found Google Sheets link: {href}")
            
            # Check for embedded iframes
            for iframe in soup.find_all('iframe'):
                src = iframe.get('src', '')
                if 'docs.google.com' in src or 'sheets.google.com' in src:
                    spreadsheet_links.append(src)
                    logger.info(f"Found embedded spreadsheet: {src}")
            
            # If we found a spreadsheet link, try to access it
            if spreadsheet_links:
                return self._scrape_google_sheets(spreadsheet_links[0])
            
            # If no spreadsheet found, try to extract data from the page itself
            logger.info("No spreadsheet link found, attempting to extract data from page content...")
            return self._extract_data_from_page(soup)
            
        except Exception as e:
            logger.error(f"Error scraping BRL vote tracker: {e}")
            return None
    
    def _extract_data_from_page(self, soup: BeautifulSoup) -> Optional[pd.DataFrame]:
        """Extract data from page content if no spreadsheet is available"""
        try:
            # Look for tables or structured data
            tables = soup.find_all('table')
            if tables:
                # Try to parse the first table
                df = pd.read_html(str(tables[0]))[0]
                logger.info(f"Extracted {len(df)} rows from page table")
                return df
            
            # If no tables, try to extract from text using regex
            page_text = soup.get_text()
            
            # Look for vote patterns in text
            vote_patterns = re.findall(r'(\w+)\s+(YEA|NAY|ABSTAIN|ABSENT)', page_text)
            if vote_patterns:
                data = {
                    'councilmember': [pattern[0] for pattern in vote_patterns],
                    'vote': [pattern[1] for pattern in vote_patterns],
                    'date': [datetime.now().strftime('%Y-%m-%d')] * len(vote_patterns),
                    'agenda_item_desc_1': ['Extracted from page content'] * len(vote_patterns),
                    'code': ['Unknown'] * len(vote_patterns)
                }
                df = pd.DataFrame(data)
                logger.info(f"Extracted {len(df)} vote patterns from page content")
                return df
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting data from page: {e}")
            return None
    
    def process_brl_data(self, df: pd.DataFrame) -> List[Dict]:
        """Process BRL data and convert to our normalized format"""
        logger.info("Processing BRL vote tracker data...")
        
        processed_data = []
        
        for _, row in df.iterrows():
            try:
                # Find matching council member
                member = self._find_member_by_name(row['councilmember'])
                if not member:
                    logger.warning(f"Could not find council member: {row['councilmember']}")
                    continue
                
                # Create processed record
                processed_record = {
                    'date': row['date'],
                    'council_member_id': member['id'],
                    'council_member_name': row['councilmember'],
                    'agenda_item_title': row['agenda_item_desc_1'] if pd.notna(row['agenda_item_desc_1']) else 'Vote recorded by BRL',
                    'category': row['code'] if pd.notna(row['code']) else 'Unknown',
                    'vote_value': row['vote'],
                    'source_name': 'BRL Vote Tracker'
                }
                
                processed_data.append(processed_record)
                
            except Exception as e:
                logger.error(f"Error processing row: {e}")
                continue
        
        logger.info(f"Processed {len(processed_data)} records from BRL data")
        return processed_data
    
    def save_brl_data_to_supabase(self, data: List[Dict]) -> bool:
        """Save processed BRL data to Supabase using normalized schema"""
        logger.info("Saving BRL data to Supabase...")
        
        try:
            # Group records by meeting date to create meetings efficiently
            meetings_by_date = {}
            for record in data:
                date = record['date']
                if date not in meetings_by_date:
                    meetings_by_date[date] = []
                meetings_by_date[date].append(record)
            
            # Create meetings and process votes
            for date, records in meetings_by_date.items():
                # Create meeting
                meeting_data = {
                    'city_id': self.boulder_city['id'],
                    'date': date,
                    'title': f"BRL Vote Tracker Meeting - {date}",
                    'meeting_type': 'Regular Council Meeting',
                    'status': 'completed'
                }
                
                meeting_result = self.supabase.table('meetings').insert(meeting_data).execute()
                meeting_id = meeting_result.data[0]['id']
                
                # Process each vote for this meeting
                for record in records:
                    # Create agenda item
                    agenda_data = {
                        'meeting_id': meeting_id,
                        'title': record['agenda_item_title'][:500] if len(record['agenda_item_title']) > 500 else record['agenda_item_title'],
                        'category': record['category'],
                        'tags': [record['category']] if record['category'] != 'Unknown' else []
                    }
                    
                    agenda_result = self.supabase.table('agenda_items').insert(agenda_data).execute()
                    agenda_item_id = agenda_result.data[0]['id']
                    
                    # Map vote values to database enum
                    vote_mapping = {
                        'Y': 'YEA',
                        'N': 'NAY',
                        'YEA': 'YEA',
                        'NAY': 'NAY',
                        'ABSTAIN': 'ABSTAIN',
                        'ABSENT': 'ABSENT'
                    }
                    
                    # Handle NaN values
                    vote_value = record['vote_value']
                    if pd.isna(vote_value):
                        mapped_vote = 'ABSTAIN'
                    else:
                        mapped_vote = vote_mapping.get(str(vote_value).upper(), 'ABSTAIN')
                    
                    # Create vote record
                    vote_data = {
                        'agenda_item_id': agenda_item_id,
                        'council_member_id': record['council_member_id'],
                        'vote_value': mapped_vote,
                        'source_url': 'https://boulderreportinglab.org/boulder-city-council-vote-tracker/',
                        'source_name': record['source_name']
                    }
                    
                    # Insert into votes table
                    self.supabase.table('votes').insert(vote_data).execute()
            
            logger.info(f"Successfully saved {len(data)} records to Supabase")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to Supabase: {e}")
            return False
    
    def run(self) -> bool:
        """Run the complete BRL integration process"""
        logger.info("Starting Boulder Reporting Lab vote tracker integration...")
        
        try:
            # Scrape BRL data
            df = self.scrape_brl_vote_tracker()
            
            if df is None or df.empty:
                logger.error("No data found from BRL vote tracker")
                return False
            
            # Process the data
            processed_data = self.process_brl_data(df)
            
            if not processed_data:
                logger.error("No data processed from BRL")
                return False
            
            # Save to Supabase
            success = self.save_brl_data_to_supabase(processed_data)
            
            if success:
                logger.info(f"Successfully integrated {len(processed_data)} records from BRL")
                return True
            else:
                logger.error("Failed to save BRL data to Supabase")
                return False
                
        except Exception as e:
            logger.error(f"BRL integration failed: {e}")
            return False

def main():
    """Main function to run the BRL integration"""
    integrator = BoulderReportingLabIntegrator()
    success = integrator.run()
    
    if success:
        logger.info("✅ BRL vote tracker integration completed successfully!")
    else:
        logger.error("❌ BRL vote tracker integration failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
