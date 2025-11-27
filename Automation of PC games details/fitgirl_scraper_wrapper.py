#!/usr/bin/env python3
"""
Wrapper script for FitGirl scraper - outputs JSON for API consumption
Usage: python fitgirl_scraper_wrapper.py [URL]
"""

import sys
import json
from website_automation_fitgirl import GameDataExtractor

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL provided"}))
        sys.exit(1)
    
    url = sys.argv[1]
    extractor = GameDataExtractor()
    
    try:
        # Enforce UTF-8 for stdout
        sys.stdout.reconfigure(encoding='utf-8')
        
        print("Starting extraction...", file=sys.stderr)
        game_data = extractor.extract_fitgirl_data(url)
        print(f"Extraction finished. Data found: {bool(game_data)}", file=sys.stderr)
        if game_data:
            print(f"Keys: {list(game_data.keys())}", file=sys.stderr)
        
        if game_data:
            # Output JSON to stdout
            print(json.dumps(game_data, ensure_ascii=False))
        else:
            print(json.dumps({"error": "Failed to scrape game data"}))
    except Exception as e:
        print(f"Wrapper Error: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
