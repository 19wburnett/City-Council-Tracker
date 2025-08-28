#!/usr/bin/env python3
"""
Test script for Boulder Reporting Lab scraper
Tests the actual scraping functionality to see what data we can extract
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scraper'))

from scrape_boulder_reporting_lab import BoulderReportingLabIntegrator
import pandas as pd

def test_brl_scraper():
    """Test the BRL scraper to see what data we can extract"""
    print("🧪 Testing Boulder Reporting Lab Scraper...\n")
    
    try:
        # Initialize the integrator
        integrator = BoulderReportingLabIntegrator()
        
        # Test the scraping function directly
        print("📊 Attempting to scrape BRL vote tracker data...")
        df = integrator.scrape_brl_vote_tracker()
        
        if df is not None and not df.empty:
            print(f"✅ Successfully scraped {len(df)} records")
            print(f"📋 Columns: {list(df.columns)}")
            print("\n📄 Sample data:")
            print(df.head())
            
            # Check data quality
            print(f"\n📈 Data quality check:")
            print(f"   - Total rows: {len(df)}")
            print(f"   - Columns: {len(df.columns)}")
            print(f"   - Missing values: {df.isnull().sum().sum()}")
            
            if 'member_name' in df.columns:
                unique_members = df['member_name'].nunique()
                print(f"   - Unique members: {unique_members}")
            
            if 'vote' in df.columns:
                vote_counts = df['vote'].value_counts()
                print(f"   - Vote distribution: {dict(vote_counts)}")
            
            return True
        else:
            print("❌ No data found or scraping failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing scraper: {e}")
        return False

def test_brl_website_access():
    """Test basic access to BRL website"""
    print("\n🌐 Testing BRL website access...")
    
    try:
        import requests
        from bs4 import BeautifulSoup
        
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
        
        # Look for iframes
        iframes = soup.find_all('iframe')
        print(f"📋 Found {len(iframes)} iframes")
        for iframe in iframes:
            src = iframe.get('src', '')
            if src:
                print(f"   - {src}")
        
        # Look for tables
        tables = soup.find_all('table')
        print(f"📋 Found {len(tables)} tables")
        
        # Look for vote-related text
        page_text = soup.get_text()
        vote_keywords = ['vote', 'yea', 'nay', 'abstain', 'council member', 'motion']
        found_keywords = [keyword for keyword in vote_keywords if keyword.lower() in page_text.lower()]
        print(f"🔍 Found vote-related keywords: {found_keywords}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing BRL website: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Boulder Reporting Lab Scraper Test\n")
    
    # Test website access first
    website_ok = test_brl_website_access()
    
    if website_ok:
        # Test the scraper
        scraper_ok = test_brl_scraper()
        
        if scraper_ok:
            print("\n✅ All tests passed! The scraper can extract real data from BRL.")
        else:
            print("\n⚠️  Scraper test failed, but website is accessible.")
    else:
        print("\n❌ Website access failed. Check the URL and network connection.")
    
    print("\n📝 Next steps:")
    print("   1. If data was found, run: python scraper/scrape_boulder_reporting_lab.py")
    print("   2. Check the database for imported data")
    print("   3. Visit /demo to see the comparative analysis")
