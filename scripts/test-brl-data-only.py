#!/usr/bin/env python3
"""
Test script for Boulder Reporting Lab data extraction only
Tests the actual scraping functionality without requiring Supabase
"""

import sys
import os
import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import io
from datetime import datetime

def test_brl_website_access():
    """Test basic access to BRL website"""
    print("🌐 Testing BRL website access...")
    
    try:
        url = "https://boulderreportinglab.org/boulder-city-council-vote-tracker/"
        response = requests.get(url)
        response.raise_for_status()
        
        print(f"✅ Successfully accessed BRL website (Status: {response.status_code})")
        
        # Parse the page
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for spreadsheet links
        spreadsheet_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if 'docs.google.com' in href or 'sheets.google.com' in href:
                spreadsheet_links.append(href)
        
        print(f"📊 Found {len(spreadsheet_links)} potential spreadsheet links")
        for link in spreadsheet_links:
            print(f"   - {link}")
        
        return spreadsheet_links
        
    except Exception as e:
        print(f"❌ Error accessing BRL website: {e}")
        return []

def scrape_google_sheets(sheets_url):
    """Attempt to scrape data from Google Sheets"""
    try:
        print(f"\n📊 Attempting to scrape Google Sheets: {sheets_url}")
        
        # Convert Google Sheets URL to CSV export URL
        if '/spreadsheets/d/' in sheets_url:
            sheet_id = sheets_url.split('/spreadsheets/d/')[1].split('/')[0]
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
            
            print(f"📥 Accessing CSV export: {csv_url}")
            response = requests.get(csv_url)
            response.raise_for_status()
            
            # Parse CSV data
            df = pd.read_csv(io.StringIO(response.text))
            print(f"✅ Successfully loaded {len(df)} rows from Google Sheets")
            print(f"📋 Columns: {list(df.columns)}")
            
            return df
        else:
            print("❌ Could not extract sheet ID from URL")
            return None
            
    except Exception as e:
        print(f"❌ Error scraping Google Sheets: {e}")
        return None

def extract_data_from_page():
    """Extract vote data from the BRL page content"""
    try:
        print("\n📄 Attempting to extract data from page content...")
        
        url = "https://boulderreportinglab.org/boulder-city-council-vote-tracker/"
        response = requests.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for tables
        tables = soup.find_all('table')
        print(f"📋 Found {len(tables)} tables on the page")
        
        if tables:
            # Try to parse the first table
            df = pd.read_html(str(tables[0]))[0]
            print(f"✅ Successfully parsed table with {len(df)} rows")
            return df
        
        # Look for vote-related content in text
        print("🔍 Looking for vote patterns in page text...")
        page_text = soup.get_text()
        
        # Look for vote-related content
        vote_patterns = [
            r'(\w+\s+\w+)\s+(?:voted|moved|seconded)\s+(YEA|NAY|ABSTAIN)',
            r'(YEA|NAY|ABSTAIN)\s+vote\s+by\s+(\w+\s+\w+)',
            r'(\w+\s+\w+)\s*-\s*(YEA|NAY|ABSTAIN)'
        ]
        
        extracted_data = []
        
        for pattern in vote_patterns:
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                if len(match) == 2:
                    member_name, vote = match
                    extracted_data.append({
                        'member_name': member_name.strip(),
                        'vote': vote.upper(),
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'meeting_title': 'Extracted from BRL page',
                        'agenda_item': 'Vote extracted from page content',
                        'topic': 'Unknown',
                        'vote_type': 'Extracted',
                        'outcome': 'Unknown'
                    })
        
        if extracted_data:
            df = pd.DataFrame(extracted_data)
            print(f"✅ Extracted {len(df)} vote records from page content")
            return df
        
        print("❌ No vote data found in page content")
        return None
        
    except Exception as e:
        print(f"❌ Error extracting data from page: {e}")
        return None

def analyze_data(df):
    """Analyze the extracted data"""
    if df is None or df.empty:
        print("❌ No data to analyze")
        return
    
    print(f"\n📈 Data Analysis:")
    print(f"   - Total rows: {len(df)}")
    print(f"   - Columns: {len(df.columns)}")
    print(f"   - Missing values: {df.isnull().sum().sum()}")
    
    # Show sample data
    print(f"\n📄 Sample data:")
    print(df.head())
    
    # Analyze specific columns if they exist
    if 'member_name' in df.columns:
        unique_members = df['member_name'].nunique()
        print(f"\n👥 Unique members: {unique_members}")
        if unique_members <= 10:  # Show all if not too many
            print("   Members found:")
            for member in df['member_name'].unique():
                print(f"   - {member}")
    
    if 'vote' in df.columns:
        vote_counts = df['vote'].value_counts()
        print(f"\n🗳️ Vote distribution:")
        for vote, count in vote_counts.items():
            print(f"   - {vote}: {count}")
    
    if 'topic' in df.columns:
        topic_counts = df['topic'].value_counts()
        print(f"\n📋 Topic distribution:")
        for topic, count in topic_counts.head(5).items():
            print(f"   - {topic}: {count}")

def main():
    print("🚀 Boulder Reporting Lab Data Extraction Test\n")
    
    # Test website access and get spreadsheet links
    spreadsheet_links = test_brl_website_access()
    
    if spreadsheet_links:
        # Try to scrape the first spreadsheet
        df = scrape_google_sheets(spreadsheet_links[0])
        
        if df is not None:
            analyze_data(df)
        else:
            print("\n⚠️  Could not scrape spreadsheet, trying page content...")
            df = extract_data_from_page()
            if df is not None:
                analyze_data(df)
            else:
                print("\n❌ Could not extract any data")
    else:
        print("\n⚠️  No spreadsheet links found, trying page content...")
        df = extract_data_from_page()
        if df is not None:
            analyze_data(df)
        else:
            print("\n❌ Could not extract any data")
    
    print("\n📝 Summary:")
    if df is not None and not df.empty:
        print("✅ SUCCESS: Real data extracted from BRL website!")
        print("   - This proves our scraper can access real vote tracker data")
        print("   - The data can be integrated into our comparative analysis")
        print("   - Our demo will show real automated scraping vs manual tracking")
    else:
        print("❌ FAILED: Could not extract real data")
        print("   - The scraper needs to be enhanced")
        print("   - We may need to use different extraction methods")

if __name__ == "__main__":
    main()
