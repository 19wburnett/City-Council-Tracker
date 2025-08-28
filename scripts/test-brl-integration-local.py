#!/usr/bin/env python3
"""
Local test of Boulder Reporting Lab integration
Saves real data to local files instead of requiring Supabase
"""

import sys
import os
import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import io
import json
from datetime import datetime

def scrape_brl_data():
    """Scrape real data from BRL vote tracker"""
    print("🌐 Scraping Boulder Reporting Lab vote tracker...")
    
    try:
        # Get the Google Sheets data
        sheets_url = "https://docs.google.com/spreadsheets/d/1tVtOs2Fc69iOKJJH0k3w91DXpqQmNVtdkR5vCHdqWiM/export?format=csv"
        response = requests.get(sheets_url)
        response.raise_for_status()
        
        # Parse CSV data
        df = pd.read_csv(io.StringIO(response.text))
        print(f"✅ Successfully loaded {len(df)} rows from BRL vote tracker")
        
        return df
        
    except Exception as e:
        print(f"❌ Error scraping BRL data: {e}")
        return None

def process_brl_data(df):
    """Process BRL data into our format"""
    print("🔄 Processing BRL data...")
    
    if df is None or df.empty:
        return None
    
    # Clean and standardize the data
    processed_data = []
    
    for _, row in df.iterrows():
        try:
            # Convert vote values to our format
            vote_mapping = {
                'y': 'yea',
                'n': 'nay', 
                'na': 'abstain',
                'TK': 'absent'
            }
            
            vote_value = vote_mapping.get(row['vote'].lower(), row['vote'].lower())
            
            # Create processed record
            processed_record = {
                'date': row['date'],
                'councilmember': row['councilmember'],
                'attendance': row['attendance'],
                'vote_type': row['vote_type'],
                'ordinance_num': row['ordinance_num'],
                'agenda_item_desc_1': row['agenda_item_desc_1'],
                'agenda_item_desc_2': row['agenda_item_desc_2'],
                'code': row['code'],
                'vote': vote_value,
                'source': 'BRL Vote Tracker'
            }
            
            processed_data.append(processed_record)
            
        except Exception as e:
            print(f"⚠️  Error processing row: {e}")
            continue
    
    print(f"✅ Processed {len(processed_data)} records")
    return processed_data

def save_data_locally(data, filename='brl_data.json'):
    """Save processed data to local file"""
    print(f"💾 Saving data to {filename}...")
    
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"✅ Data saved to {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving data: {e}")
        return False

def create_summary_report(data):
    """Create a summary report of the extracted data"""
    print("\n📊 Creating summary report...")
    
    if not data:
        print("❌ No data to summarize")
        return
    
    # Convert back to DataFrame for analysis
    df = pd.DataFrame(data)
    
    summary = {
        'total_records': len(data),
        'date_range': {
            'start': df['date'].min(),
            'end': df['date'].max()
        },
        'council_members': sorted(df['councilmember'].unique()),
        'vote_distribution': df['vote'].value_counts().to_dict(),
        'meeting_dates': df['date'].value_counts().head(10).to_dict(),
        'vote_types': df['vote_type'].value_counts().to_dict(),
        'top_agenda_items': df['agenda_item_desc_1'].value_counts().head(5).to_dict()
    }
    
    # Save summary
    with open('brl_summary.json', 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    
    print("✅ Summary report saved to brl_summary.json")
    return summary

def display_summary(summary):
    """Display the summary in a readable format"""
    print("\n" + "="*60)
    print("🏛️  BOULDER REPORTING LAB DATA INTEGRATION SUMMARY")
    print("="*60)
    
    print(f"\n📊 Data Overview:")
    print(f"   - Total records: {summary['total_records']}")
    print(f"   - Date range: {summary['date_range']['start']} to {summary['date_range']['end']}")
    
    print(f"\n👥 Council Members ({len(summary['council_members'])}):")
    for member in summary['council_members']:
        print(f"   - {member}")
    
    print(f"\n🗳️ Vote Distribution:")
    for vote, count in summary['vote_distribution'].items():
        print(f"   - {vote.upper()}: {count}")
    
    print(f"\n📅 Recent Meetings:")
    for date, count in list(summary['meeting_dates'].items())[:5]:
        print(f"   - {date}: {count} votes")
    
    print(f"\n📋 Vote Types:")
    for vote_type, count in summary['vote_types'].items():
        print(f"   - {vote_type}: {count}")
    
    print(f"\n📄 Top Agenda Items:")
    for item, count in summary['top_agenda_items'].items():
        if pd.notna(item):
            print(f"   - {item[:60]}... ({count} votes)")
    
    print("\n" + "="*60)
    print("✅ REAL DATA SUCCESSFULLY EXTRACTED AND PROCESSED!")
    print("="*60)

def main():
    print("🚀 Boulder Reporting Lab Local Integration Test\n")
    
    # Step 1: Scrape real data
    df = scrape_brl_data()
    
    if df is None:
        print("❌ Failed to scrape data")
        return
    
    # Step 2: Process the data
    processed_data = process_brl_data(df)
    
    if not processed_data:
        print("❌ Failed to process data")
        return
    
    # Step 3: Save data locally
    if not save_data_locally(processed_data):
        print("❌ Failed to save data")
        return
    
    # Step 4: Create and display summary
    summary = create_summary_report(processed_data)
    if summary:
        display_summary(summary)
    
    print("\n📝 Next Steps:")
    print("   1. Data is saved in brl_data.json")
    print("   2. Summary is saved in brl_summary.json")
    print("   3. This proves real data extraction works")
    print("   4. Ready to integrate with Supabase when available")
    print("   5. Demo can now show real comparative analysis")

if __name__ == "__main__":
    main()
