import requests
from bs4 import BeautifulSoup
import re
import json

class IMDbGameScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def scrape_game_details(self, imdb_url):
        """Scrape all game details from IMDb page"""
        try:
            response = self.session.get(imdb_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            game_data = {
                'title': self.get_title(soup),
                'category': self.get_categories(soup),
                'developer': self.get_developer(soup),
                'rating': self.get_rating(soup),
                'profile_pic_url': self.get_profile_pic(soup),
                'short_description': self.get_short_description(soup),
                'long_description': self.get_long_description(soup),
                'screenshots': self.get_screenshots(soup)
            }

            return game_data

        except Exception as e:
            print(f"Error scraping data: {e}")
            return None

    def get_title(self, soup):
        """Extract game title"""
        title_element = soup.find('h1', {'data-testid': 'hero__pageTitle'})
        if title_element:
            title_span = title_element.find('span', class_='hero__primary-text')
            if title_span:
                return title_span.get_text(strip=True)
        
        # Fallback to meta tag
        meta_title = soup.find('meta', property='og:title')
        if meta_title:
            title = meta_title.get('content', '').split('(')[0].strip()
            return title
        
        return "Title not found"
    
    def get_categories(self, soup):
        """Extract game categories/genres"""
        categories = []
        
        # Try to get from storyline genres
        storyline_section = soup.find('section', {'data-testid': 'Storyline'})
        if storyline_section:
            genres_list = storyline_section.find('li', {'data-testid': 'storyline-genres'})
            if genres_list:
                genre_links = genres_list.find_all('a', class_='ipc-metadata-list-item__list-content-item')
                categories = [link.get_text(strip=True) for link in genre_links]
        
        # If no genres found, try from chips
        if not categories:
            chips_container = soup.find('div', class_='ipc-chip-list__scroller')
            if chips_container:
                chips = chips_container.find_all('span', class_='ipc-chip__text')
                categories = [chip.get_text(strip=True) for chip in chips[:5]]  # Limit to 5 categories
        
        return categories[:3]  # Return first 3 categories
    
    def get_developer(self, soup):
        """Extract developer/production companies"""
        details_section = soup.find('section', {'data-testid': 'Details'})
        if details_section:
            companies_item = details_section.find('li', {'data-testid': 'title-details-companies'})
            if companies_item:
                company_links = companies_item.find_all('a', class_='ipc-metadata-list-item__list-content-item')
                if company_links:
                    return company_links[0].get_text(strip=True)  # Return first company as developer
        
        return "Developer not found"
    
    def get_rating(self, soup):
        """Extract IMDb rating"""
        rating_element = soup.find('div', {'data-testid': 'hero-rating-bar__aggregate-rating'})
        if rating_element:
            rating_span = rating_element.find('span', class_='sc-4dc495c1-1')
            if rating_span:
                return rating_span.get_text(strip=True)
        
        # Try to get from JSON-LD
        script_tag = soup.find('script', type='application/ld+json')
        if script_tag:
            try:
                json_data = json.loads(script_tag.string)
                if 'aggregateRating' in json_data and 'ratingValue' in json_data['aggregateRating']:
                    return str(json_data['aggregateRating']['ratingValue'])
            except:
                pass
        
        return "Rating not found"
    
    def get_profile_pic(self, soup):
        """Extract profile picture URL"""
        # Try to get from meta tag first
        meta_image = soup.find('meta', property='og:image')
        if meta_image:
            image_url = meta_image.get('content', '')
            # Convert to higher quality if possible
            return self.clean_image_url(image_url)
        
        # Try to get from JSON-LD
        script_tag = soup.find('script', type='application/ld+json')
        if script_tag:
            try:
                json_data = json.loads(script_tag.string)
                if 'image' in json_data:
                    return self.clean_image_url(json_data['image'])
            except:
                pass
        
        return "Profile pic not found"
    
    def get_short_description(self, soup):
        """Extract short description"""
        plot_element = soup.find('p', {'data-testid': 'plot'})
        if plot_element:
            # Try to get the medium length description first
            medium_span = plot_element.find('span', {'data-testid': 'plot-l'})
            if medium_span:
                return medium_span.get_text(strip=True)
            
            # Fallback to extra small
            xs_span = plot_element.find('span', {'data-testid': 'plot-xs_to_m'})
            if xs_span:
                text = xs_span.get_text(strip=True)
                # Remove "Read all" link text if present
                return re.sub(r'Read all$', '', text).strip()
        
        return "Short description not found"
    
    def get_long_description(self, soup):
        """Extract long description from storyline"""
        storyline_section = soup.find('section', {'data-testid': 'Storyline'})
        if storyline_section:
            plot_summary = storyline_section.find('div', {'data-testid': 'storyline-plot-summary'})
            if plot_summary:
                content_div = plot_summary.find('div', class_='ipc-html-content-inner-div')
                if content_div:
                    # Remove the author attribution
                    text = content_div.get_text(strip=True)
                    # Remove everything after and including the —Author part
                    text = re.sub(r'—.*$', '', text).strip()
                    return text

        return "Long description not found"
    
    def get_screenshots(self, soup):
        """Extract screenshots and convert to full-size URLs"""
        screenshots = []
        
        # Find photos section
        photos_section = soup.find('section', {'data-testid': 'Photos'})
        if photos_section:
            # Find all image links in the photos section
            image_links = photos_section.find_all('img', class_='ipc-image')
            
            for img in image_links[:10]:  # Get first 10 images max
                src = img.get('src', '')
                if src:
                    clean_url = self.clean_image_url(src)
                    if clean_url and clean_url not in screenshots:
                        screenshots.append(clean_url)
                
                if len(screenshots) >= 6:  # We need exactly 5 screenshots
                    break
        
        # If we don't have enough screenshots, try to get more
        if len(screenshots) < 6:
            # Look for additional images in the page
            all_images = soup.find_all('img')
            for img in all_images:
                if len(screenshots) >= 6:
                    break
                src = img.get('src', '')
                if src and 'media-amazon.com' in src and src not in screenshots:
                    clean_url = self.clean_image_url(src)
                    if clean_url:
                        screenshots.append(clean_url)
        
        return screenshots[:6]  # Return exactly 5 screenshots
    
    def clean_image_url(self, url):
        """Convert image URL to full-size version"""
        if not url:
            return None
        
        # Remove resolution parameters and convert to .jpg
        clean_url = re.sub(r'\._V1_.*\.jpg', '._V1_.jpg', url)
        clean_url = re.sub(r'\._V1_QL75_.*\.jpg', '._V1_.jpg', clean_url)
        clean_url = re.sub(r'\._V1_FMjpg_.*\.jpg', '._V1_.jpg', clean_url)
        
        # Ensure it ends with .jpg
        if not clean_url.endswith('.jpg'):
            clean_url += '.jpg'
        
        return clean_url

def main():
    # Initialize the scraper
    scraper = IMDbGameScraper()
    
    # Example usage
    imdb_url = "https://www.imdb.com/title/tt6161168/?ref_=nv_sr_srsg_2_tt_7_nm_1_in_0_q_red%2520dead%2520re"
    
    print("Scraping game data from IMDb...")
    game_data = scraper.scrape_game_details(imdb_url)
    
    if game_data:
        print("\n" + "="*50)
        print("GAME DATA EXTRACTED SUCCESSFULLY!")
        print("="*50)
        
        print(f"\nTitle: {game_data['title']}")
        print(f"Categories: {', '.join(game_data['category'])}")
        print(f"Developer: {game_data['developer']}")
        print(f"Rating: {game_data['rating']}")
        print(f"Profile Pic URL: {game_data['profile_pic_url']}")
        print(f"Short Description: {game_data['short_description']}")
        print(f"Long Description: {game_data['long_description']}")
        print(f"Screenshots Found: {len(game_data['screenshots'])}")
        
        print("\nScreenshot URLs:")
        for i, screenshot in enumerate(game_data['screenshots'], 1):
            print(f"{i}. {screenshot}")
        
        # You can now use this data to automatically fill your admin portal
        # Save to JSON file or database as needed
        
        # Save to JSON file
        with open('game_data.json', 'w', encoding='utf-8') as f:
            json.dump(game_data, f, indent=2, ensure_ascii=False)
        
        print("\nData saved to 'game_data.json'")
        
    else:
        print("Failed to scrape game data.")

# Additional function to automate multiple games
def scrape_multiple_games(url_list):
    """Scrape multiple games from a list of URLs"""
    scraper = IMDbGameScraper()
    all_games_data = []
    
    for url in url_list:
        print(f"Scraping: {url}")
        game_data = scraper.scrape_game_details(url)
        if game_data:
            all_games_data.append(game_data)
            print(f"✓ Successfully scraped: {game_data['title']}")
        else:
            print(f"✗ Failed to scrape: {url}")
        
        # Add delay to be respectful to the server
        import time
        time.sleep(2)
    
    return all_games_data

if __name__ == "__main__":
    import sys
    
    # Check if URL is provided as command line argument
    if len(sys.argv) > 1:
        scraper = IMDbGameScraper()
        url = sys.argv[1]
        game_data = scraper.scrape_game_details(url)
        
        if game_data:
            # Output JSON to stdout for API consumption
            print(json.dumps(game_data, ensure_ascii=False))
        else:
            print(json.dumps({"error": "Failed to scrape game data"}))
    else:
        # Run default example
        main()
