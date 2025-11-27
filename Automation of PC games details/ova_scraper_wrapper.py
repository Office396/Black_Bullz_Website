#!/usr/bin/env python3
"""
Wrapper script for OvaGames scraper - outputs JSON for API consumption
Usage: python ova_scraper_wrapper.py [URL]
"""

import sys
import json
from game_details_scraper_ova import GameDetailsScraper

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL provided"}))
        sys.exit(1)
    
    url = sys.argv[1]
    scraper = GameDetailsScraper()
    
    try:
        game_data = scraper.scrape_game(url)
        
        if game_data:
            # Output JSON to stdout
            print(json.dumps(game_data, ensure_ascii=False))
        else:
            print(json.dumps({"error": "Failed to scrape game data"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
