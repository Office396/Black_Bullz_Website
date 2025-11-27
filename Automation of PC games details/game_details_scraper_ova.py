import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
from datetime import datetime
import re

class GameDetailsScraper:
    """
    Universal game details scraper for ovagames.com
    Extracts: title, category, developer, file size, rating, 
    short/long descriptions, screenshots, and system requirements
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_game(self, game_url):
        """
        Main scraping function - extracts all game details from URL
        """
        try:
            response = requests.get(game_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            game_data = {
                'url': game_url,
                'scraped_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'title': self.extract_title(soup),
                'category': self.extract_category(soup),
                'developer': self.extract_developer(soup),
                'file_size': self.extract_file_size(soup),
                'rating': self.extract_rating(soup),
                'profile_pic': self.extract_profile_pic(soup),
                'short_description': self.extract_short_description(soup),
                'long_description': self.extract_long_description(soup),
                'screenshots': self.extract_screenshots(soup),
                'system_requirements': self.extract_system_requirements(soup)
            }
            
            return game_data
        
        except Exception as e:
            print(f"Error scraping {game_url}: {str(e)}")
            return None
    
    def extract_title(self, soup):
        """
        Extract game title from h1.post-title > a
        """
        try:
            title_element = soup.find('h1', class_='post-title')
            if title_element:
                title = title_element.find('a')
                if title:
                    return title.get_text(strip=True)
        except Exception as e:
            print(f"Error extracting title: {e}")
        return "N/A"
    
    def extract_category(self, soup):
        """
        Extract category from post-info section or genre field
        Looking for: <a href="...category..." rel="category tag">
        """
        try:
            categories = []
            post_info = soup.find('div', class_='post-info')
            if post_info:
                category_links = post_info.find_all('a', rel='category tag')
                for link in category_links:
                    cat = link.get_text(strip=True)
                    if cat and cat not in categories:
                        categories.append(cat)
            
            # If not found in post-info, try to extract from details section
            if not categories:
                details_section = soup.find('p')
                if details_section and 'Genre' in details_section.get_text():
                    genre_text = details_section.get_text()
                    genre_match = re.search(r'Genre[^:]*:\s*([^<\n]+)', genre_text)
                    if genre_match:
                        categories = [cat.strip() for cat in genre_match.group(1).split(',')]
            
            return ', '.join(categories) if categories else "N/A"
        except Exception as e:
            print(f"Error extracting category: {e}")
        return "N/A"
    
    def extract_developer(self, soup):
        """
        Extract developer from the details section
        Looking for: <strong>Developer</strong>: Developer Name
        """
        try:
            paragraphs = soup.find_all('p')
            for para in paragraphs:
                text = para.get_text()
                if 'Developer' in text:
                    # Extract developer name using regex
                    match = re.search(r'Developer[^:]*:\s*([^<\n,•]+)', text)
                    if match:
                        return match.group(1).strip()
        except Exception as e:
            print(f"Error extracting developer: {e}")
        return "N/A"
    
    def extract_file_size(self, soup):
        """
        Extract file size from details section
        Looking for: <strong>File Size</strong>: Size info
        """
        try:
            paragraphs = soup.find_all('p')
            for para in paragraphs:
                text = para.get_text()
                if 'File Size' in text:
                    match = re.search(r'File Size[^:]*:\s*([^<\n•]+)', text)
                    if match:
                        return match.group(1).strip()
        except Exception as e:
            print(f"Error extracting file size: {e}")
        return "N/A"
    
    def extract_rating(self, soup):
        """
        Extract rating - if available in page
        """
        try:
            # Look for rating in various possible locations
            rating_elements = soup.find_all(class_=re.compile(r'rating|rate|star', re.I))
            if rating_elements:
                return rating_elements[0].get_text(strip=True)
        except Exception as e:
            print(f"Error extracting rating: {e}")
        return "N/A"
    
    def extract_profile_pic(self, soup):
        """
        Extract game cover/profile image
        Looking for first <img> in post content
        """
        try:
            post_wrapper = soup.find('div', class_='post-wrapper')
            if post_wrapper:
                img = post_wrapper.find('img')
                if img and img.get('src'):
                    return img.get('src')
        except Exception as e:
            print(f"Error extracting profile pic: {e}")
        return "N/A"
    
    def extract_short_description(self, soup):
        """
        Extract short description - text before 'more' link
        """
        try:
            paragraphs = soup.find_all('p')
            for para in paragraphs:
                if 'Free Download' in para.get_text():
                    # Get the text up to the "more" link
                    text = para.get_text()
                    # Remove the "more" indicator
                    text = re.sub(r'\s*\[.*?\]\s*', '', text)
                    return text.strip()
        except Exception as e:
            print(f"Error extracting short description: {e}")
        return "N/A"

    def extract_long_description(self, soup):
        """
        Extract long description using h3 headings (not IDs)
        """
        try:
            # Find the main tab wrapper
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                # Find all h3 headings
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                # Find the one that says "DESCRIPTION"
                for i, heading in enumerate(headings):
                    if 'DESCRIPTION' in heading.get_text().upper():
                        # Get the next div with class wp-tab-content
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                text = wrapper.get_text(separator='\n', strip=True)
                                return text if text else "N/A"
        except Exception as e:
            print(f"Error extracting long description: {e}")
        return "N/A"

    def extract_screenshots(self, soup):
        """
        Extract screenshots using h3 headings (not IDs)
        """
        try:
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                for heading in headings:
                    if 'SCREENSHOT' in heading.get_text().upper():
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                images = wrapper.find_all('img')
                                screenshots = []
                                for img in images:
                                    src = img.get('src')
                                    if src:
                                        screenshots.append(src)
                                return screenshots[:5] if screenshots else []
        except Exception as e:
            print(f"Error extracting screenshots: {e}")
        return []

    def extract_system_requirements(self, soup):
        """
        Extract RECOMMENDED system requirements using h3 headings
        """
        try:
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                for heading in headings:
                    if 'SYSTEM REQUIREMENTS' in heading.get_text().upper():
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                full_text = wrapper.get_text()

                                # Extract only RECOMMENDED section
                                if 'Recommended:' in full_text:
                                    parts = full_text.split('Recommended:')
                                    if len(parts) > 1:
                                        recommended_text = parts[1]

                                        # Clean up lines
                                        lines = recommended_text.split('\n')
                                        requirements = []

                                        for line in lines:
                                            line = line.strip()
                                            if line:
                                                # Remove bullet points
                                                line = re.sub(r'^[•\-\*]\s*', '', line)
                                                if line:
                                                    requirements.append(line)

                                        result = '\n'.join(requirements)
                                        return result if result else "N/A"
        except Exception as e:
            print(f"Error extracting system requirements: {e}")
        return "N/A"
    
    def save_to_file(self, game_data, filename=None):
        """
        Save extracted game data to a text file
        """
        if not game_data:
            print("No data to save")
            return False
        
        if not filename:
            # Generate filename from game title
            safe_title = re.sub(r'[^\w\s-]', '', game_data['title']).strip()
            safe_title = re.sub(r'[-\s]+', '_', safe_title)
            filename = f"game_details_{safe_title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("GAME DETAILS EXTRACTED FROM OVAGAMES.COM\n")
                f.write("=" * 80 + "\n\n")
                
                f.write(f"TITLE: {game_data['title']}\n")
                f.write("-" * 80 + "\n\n")
                
                f.write(f"CATEGORY: {game_data['category']}\n\n")
                
                f.write(f"DEVELOPER: {game_data['developer']}\n\n")
                
                f.write(f"FILE SIZE: {game_data['file_size']}\n\n")
                
                f.write(f"RATING: {game_data['rating']}\n\n")
                
                f.write(f"PROFILE PICTURE URL:\n{game_data['profile_pic']}\n\n")
                
                f.write("SHORT DESCRIPTION:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['short_description']}\n\n")
                
                f.write("LONG DESCRIPTION:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['long_description']}\n\n")
                
                f.write("SCREENSHOTS (URLs):\n")
                f.write("-" * 80 + "\n")
                if isinstance(game_data['screenshots'], list) and game_data['screenshots']:
                    for idx, screenshot in enumerate(game_data['screenshots'], 1):
                        f.write(f"{idx}. {screenshot}\n")
                else:
                    f.write("No screenshots found\n")
                f.write("\n")
                
                f.write("RECOMMENDED SYSTEM REQUIREMENTS:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['system_requirements']}\n\n")
                
                f.write("=" * 80 + "\n")
                f.write(f"Scraped at: {game_data['scraped_at']}\n")
                f.write(f"Source URL: {game_data['url']}\n")
                f.write("=" * 80 + "\n")
            
            print(f"✓ Data saved to: {filename}")
            return True
        
        except Exception as e:
            print(f"Error saving to file: {e}")
            return False
    
    def save_to_json(self, game_data, filename=None):
        """
        Alternative: Save as JSON for programmatic use
        """
        if not game_data:
            return False
        
        if not filename:
            safe_title = re.sub(r'[^\w\s-]', '', game_data['title']).strip()
            safe_title = re.sub(r'[-\s]+', '_', safe_title)
        try:
            paragraphs = soup.find_all('p')
            for para in paragraphs:
                if 'Free Download' in para.get_text():
                    # Get the text up to the "more" link
                    text = para.get_text()
                    # Remove the "more" indicator
                    text = re.sub(r'\s*\[.*?\]\s*', '', text)
                    return text.strip()
        except Exception as e:
            print(f"Error extracting short description: {e}")
        return "N/A"

    def extract_long_description(self, soup):
        """
        Extract long description using h3 headings (not IDs)
        """
        try:
            # Find the main tab wrapper
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                # Find all h3 headings
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                # Find the one that says "DESCRIPTION"
                for i, heading in enumerate(headings):
                    if 'DESCRIPTION' in heading.get_text().upper():
                        # Get the next div with class wp-tab-content
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                text = wrapper.get_text(separator='\n', strip=True)
                                return text if text else "N/A"
        except Exception as e:
            print(f"Error extracting long description: {e}")
        return "N/A"

    def extract_screenshots(self, soup):
        """
        Extract screenshots using h3 headings (not IDs)
        """
        try:
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                for heading in headings:
                    if 'SCREENSHOT' in heading.get_text().upper():
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                images = wrapper.find_all('img')
                                screenshots = []
                                for img in images:
                                    src = img.get('src')
                                    if src:
                                        screenshots.append(src)
                                return screenshots[:5] if screenshots else []
        except Exception as e:
            print(f"Error extracting screenshots: {e}")
        return []

    def extract_system_requirements(self, soup):
        """
        Extract RECOMMENDED system requirements using h3 headings
        """
        try:
            tabs_wrapper = soup.find('div', class_='wp-tabs')
            if tabs_wrapper:
                headings = tabs_wrapper.find_all('h3', class_='wp-tab-title')

                for heading in headings:
                    if 'SYSTEM REQUIREMENTS' in heading.get_text().upper():
                        content_div = heading.find_next('div', class_='wp-tab-content')
                        if content_div:
                            wrapper = content_div.find('div', class_='wp-tab-content-wrapper')
                            if wrapper:
                                full_text = wrapper.get_text()

                                # Extract only RECOMMENDED section
                                if 'Recommended:' in full_text:
                                    parts = full_text.split('Recommended:')
                                    if len(parts) > 1:
                                        recommended_text = parts[1]

                                        # Clean up lines
                                        lines = recommended_text.split('\n')
                                        requirements = []

                                        for line in lines:
                                            line = line.strip()
                                            if line:
                                                # Remove bullet points
                                                line = re.sub(r'^[•\-\*]\s*', '', line)
                                                if line:
                                                    requirements.append(line)

                                        result = '\n'.join(requirements)
                                        return result if result else "N/A"
        except Exception as e:
            print(f"Error extracting system requirements: {e}")
        return "N/A"
    
    def save_to_file(self, game_data, filename=None):
        """
        Save extracted game data to a text file
        """
        if not game_data:
            print("No data to save")
            return False
        
        if not filename:
            # Generate filename from game title
            safe_title = re.sub(r'[^\w\s-]', '', game_data['title']).strip()
            safe_title = re.sub(r'[-\s]+', '_', safe_title)
            filename = f"game_details_{safe_title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("GAME DETAILS EXTRACTED FROM OVAGAMES.COM\n")
                f.write("=" * 80 + "\n\n")
                
                f.write(f"TITLE: {game_data['title']}\n")
                f.write("-" * 80 + "\n\n")
                
                f.write(f"CATEGORY: {game_data['category']}\n\n")
                
                f.write(f"DEVELOPER: {game_data['developer']}\n\n")
                
                f.write(f"FILE SIZE: {game_data['file_size']}\n\n")
                
                f.write(f"RATING: {game_data['rating']}\n\n")
                
                f.write(f"PROFILE PICTURE URL:\n{game_data['profile_pic']}\n\n")
                
                f.write("SHORT DESCRIPTION:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['short_description']}\n\n")
                
                f.write("LONG DESCRIPTION:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['long_description']}\n\n")
                
                f.write("SCREENSHOTS (URLs):\n")
                f.write("-" * 80 + "\n")
                if isinstance(game_data['screenshots'], list) and game_data['screenshots']:
                    for idx, screenshot in enumerate(game_data['screenshots'], 1):
                        f.write(f"{idx}. {screenshot}\n")
                else:
                    f.write("No screenshots found\n")
                f.write("\n")
                
                f.write("RECOMMENDED SYSTEM REQUIREMENTS:\n")
                f.write("-" * 80 + "\n")
                f.write(f"{game_data['system_requirements']}\n\n")
                
                f.write("=" * 80 + "\n")
                f.write(f"Scraped at: {game_data['scraped_at']}\n")
                f.write(f"Source URL: {game_data['url']}\n")
                f.write("=" * 80 + "\n")
            
            print(f"✓ Data saved to: {filename}")
            return True
        
        except Exception as e:
            print(f"Error saving to file: {e}")
            return False
    
    def save_to_json(self, game_data, filename=None):
        """
        Alternative: Save as JSON for programmatic use
        """
        if not game_data:
            return False
        
        if not filename:
            safe_title = re.sub(r'[^\w\s-]', '', game_data['title']).strip()
            safe_title = re.sub(r'[-\s]+', '_', safe_title)
            filename = f"game_details_{safe_title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(game_data, f, indent=2, ensure_ascii=False)
            print(f"✓ JSON saved to: {filename}")
            return True
        except Exception as e:
            print(f"Error saving JSON: {e}")
            return False


# USAGE EXAMPLE
if __name__ == "__main__":
    import sys
    
    # Check if URL is provided as command line argument
    if len(sys.argv) > 1:
        scraper = GameDetailsScraper()
        game_url = sys.argv[1]
        game_data = scraper.scrape_game(game_url)
        
        if game_data:
            # Output JSON to stdout for API consumption
            print(json.dumps(game_data, ensure_ascii=False))
        else:
            print(json.dumps({"error": "Failed to scrape game data"}))
    else:
        # Run default example
        scraper = GameDetailsScraper()
        game_url = "https://www.ovagames.com/commandos-origins-deluxe-edition-multi14-elamigos.html"
        
        print(f"Scraping game from: {game_url}")
        print("This may take a few seconds...\n")
        
        game_data = scraper.scrape_game(game_url)
        
        if game_data:
            print("\n✓ Successfully extracted game details!\n")
            scraper.save_to_file(game_data)
            scraper.save_to_json(game_data)
            
            print("\n" + "=" * 80)
            print("EXTRACTED DATA SUMMARY:")
            print("=" * 80)
            print(f"Title: {game_data['title']}")
            print(f"Developer: {game_data['developer']}")
            print(f"Category: {game_data['category']}")
            print(f"File Size: {game_data['file_size']}")
            print(f"Screenshots Found: {len(game_data['screenshots'])}")
            print("=" * 80)
        else:
            print("✗ Failed to scrape game details")