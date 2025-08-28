#!/usr/bin/env python3
"""
Test script to find correct photo URLs from Boulder government website
"""

import requests
from bs4 import BeautifulSoup
import json

def test_photo_urls():
    """Test scraping photo URLs from Boulder government website"""
    
    base_url = "https://bouldercolorado.gov"
    members_url = f"{base_url}/government/city-council"
    
    print("Testing photo URL extraction...")
    print(f"URL: {members_url}")
    
    try:
        response = requests.get(members_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for images
        images = soup.find_all('img')
        print(f"\nFound {len(images)} images on the page")
        
        # Look for council member related images
        member_images = []
        for img in images:
            src = img.get('src', '')
            alt = img.get('alt', '')
            if src and ('council' in alt.lower() or 'member' in alt.lower() or 'mayor' in alt.lower()):
                full_url = f"{base_url}{src}" if src.startswith('/') else src
                member_images.append({
                    'src': src,
                    'full_url': full_url,
                    'alt': alt
                })
        
        print(f"\nFound {len(member_images)} potential member images:")
        for img in member_images:
            print(f"  Alt: {img['alt']}")
            print(f"  URL: {img['full_url']}")
            print()
        
        # Also look for person-detail sections
        person_details = soup.find_all('div', class_='c-person-detail')
        print(f"\nFound {len(person_details)} person-detail sections")
        
        for section in person_details:
            name_elem = section.find('h3', class_='c-person-detail__name')
            if name_elem:
                name = name_elem.get_text(strip=True)
                print(f"\nMember: {name}")
                
                img_elem = section.find('img')
                if img_elem:
                    src = img_elem.get('src', '')
                    alt = img_elem.get('alt', '')
                    if src:
                        full_url = f"{base_url}{src}" if src.startswith('/') else src
                        print(f"  Photo URL: {full_url}")
                        print(f"  Alt text: {alt}")
                        
                        # Test if the URL works
                        try:
                            img_response = requests.head(full_url, timeout=5)
                            print(f"  Status: {img_response.status_code}")
                        except Exception as e:
                            print(f"  Error: {e}")
        
        # Save results to file
        results = {
            'member_images': member_images,
            'person_details_count': len(person_details)
        }
        
        with open('photo_url_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nResults saved to photo_url_test_results.json")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_photo_urls()
