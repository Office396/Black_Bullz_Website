import requests
from bs4 import BeautifulSoup
import re
import json
import time
from urllib.parse import urljoin, urlparse
import os

class GameDataExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def extract_fitgirl_data(self, url):
        """Extract game data from FitGirl repacks site"""
        try:
            # print(f"Extracting data from: {url}")
            response = self.session.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            game_data = {}

            # Extract title
            title_element = soup.find('h1', class_='entry-title')
            if title_element:
                game_data['title'] = title_element.get_text(strip=True)

            # Extract game details from the info block
            details_section = soup.find('p', style=re.compile(r'height.*200px'))
            if details_section:
                self._extract_basic_details(details_section, game_data)

            # Extract screenshots
            game_data['screenshots'] = self._extract_screenshots(soup, url)

            # Extract system requirements
            game_data['system_requirements'] = self._extract_system_requirements(soup)

            # Extract download links
            game_data['download_links'] = self._extract_download_links(soup, url)

            return game_data

        except Exception as e:
            # print(f"Error extracting data: {e}")
            return None

    def _extract_basic_details(self, details_section, game_data):
        """Extract basic game details from the info section"""
        text_content = details_section.get_text()

        # Extract Genres/Tags
        genres_match = re.search(r'Genres/Tags:\s*(.+)', text_content)
        if genres_match:
            game_data['genres'] = [genre.strip() for genre in genres_match.group(1).split(',')]

        # Extract Companies
        companies_match = re.search(r'Companies:\s*<strong>(.+)</strong>', str(details_section))
        if companies_match:
            game_data['companies'] = companies_match.group(1).strip()

        # Extract Languages
        languages_match = re.search(r'Languages:\s*<strong>(.+)</strong>', str(details_section))
        if languages_match:
            game_data['languages'] = languages_match.group(1).strip()

        # Extract Original Size
        original_size_match = re.search(r'Original Size:\s*<strong>(.+)</strong>', str(details_section))
        if original_size_match:
            game_data['original_size'] = original_size_match.group(1).strip()

        # Extract Repack Size
        repack_size_match = re.search(r'Repack Size:\s*<strong>(.+)</strong>', str(details_section))
        if repack_size_match:
            game_data['repack_size'] = repack_size_match.group(1).strip()

    def _extract_screenshots(self, soup, base_url):
        """Extract screenshot URLs from the page"""
        screenshots = []

        # Method 1: Look for screenshot sections first
        screenshot_section = soup.find('h3', string=re.compile(r'Screenshots', re.I))
        if screenshot_section:
            parent = screenshot_section.find_parent()
            if parent:
                images = parent.find_all('img')
                for img in images:
                    src = img.get('src', '')
                    if src and self._is_valid_screenshot_url(src):
                        full_size_url = self._get_full_size_screenshot(src)
                        if full_size_url and full_size_url not in screenshots:
                            screenshots.append(full_size_url)
                            if len(screenshots) >= 7:
                                return screenshots

        # Method 2: Try to find screenshot links in the content
        screenshot_links = soup.find_all('a', href=re.compile(r'\.(jpg|jpeg|png|webp)', re.I))

        for link in screenshot_links:
            img_url = link.get('href', '')
            if img_url and self._is_valid_screenshot_url(img_url):
                full_size_url = self._get_full_size_screenshot(img_url)
                if full_size_url and full_size_url not in screenshots:
                    screenshots.append(full_size_url)
                    if len(screenshots) >= 7:
                        break

        return screenshots[:7]

    def _is_valid_screenshot_url(self, url):
        """Check if URL is a valid screenshot"""
        screenshot_indicators = ['screenshot', 'screen', 'riotpixels', 'imageban']
        return any(indicator in url.lower() for indicator in screenshot_indicators)

    def _get_full_size_screenshot(self, thumbnail_url):
        """Convert thumbnail URL to full-size screenshot URL"""
        # FitGirl specific conversion
        if 'riotpixels.net' in thumbnail_url and '.240p.' in thumbnail_url:
            # Convert from thumbnail to full size - fix double extension
            full_size_url = thumbnail_url.replace('.240p.jpg', '')

            # If we still have double .jpg extension, clean it up
            if full_size_url.endswith('.jpg.jpg'):
                full_size_url = full_size_url.replace('.jpg.jpg', '.jpg')

            return full_size_url

        # General conversion - remove size indicators and fix double extensions
        size_patterns = [
            r'\.\d+p\.',
            r'-\d+x\d+\.',
            r'_thumb',
            r'_small',
            r'_mini'
        ]

        full_url = thumbnail_url
        for pattern in size_patterns:
            full_url = re.sub(pattern, '.', full_url)

        # Fix any double extensions that might have been created
        full_url = self._fix_double_extensions(full_url)

        return full_url if full_url != thumbnail_url else thumbnail_url

    def _fix_double_extensions(self, url):
        """Fix double file extensions in URLs"""
        # Common image extensions to check
        extensions = ['.jpg', '.jpeg', '.png', '.webp']

        for ext in extensions:
            double_ext = f"{ext}{ext}"
            if double_ext in url:
                url = url.replace(double_ext, ext)

        return url

    def _extract_system_requirements(self, soup):
        """Extract system requirements from the page"""
        requirements = {}

        # Look for system requirements section
        requirements_headers = soup.find_all(['h2', 'h3', 'h4'], string=re.compile(
            r'system.requirement|requirement|spec', re.I
        ))

        for header in requirements_headers:
            content = self._find_requirements_content(header)
            if content:
                requirements = self._parse_requirements_content(content)
                if requirements:
                    break

        return requirements

    def _find_requirements_content(self, header):
        """Find the content following a requirements header"""
        # Look in next siblings
        current = header.next_sibling
        while current:
            if current.name and current.get_text(strip=True):
                return current
            current = current.next_sibling

        # Look in parent's next siblings
        parent = header.parent
        if parent:
            current = parent.next_sibling
            while current:
                if current.name and current.get_text(strip=True):
                    return current
                current = current.next_sibling

        return None

    def _parse_requirements_content(self, content):
        """Parse system requirements from content"""
        requirements = {}
        text = content.get_text()

        # Look for recommended requirements
        recommended_patterns = [
            r'recommended[^:]*:([^]+?)(?=minimum|$|\.\s|\\n)',
            r'system.*recommended[^:]*:([^]+?)(?=minimum|$|\.\s|\\n)'
        ]

        for pattern in recommended_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                requirements_text = match.group(1)
                requirements = self._extract_requirement_details(requirements_text)
                break

        return requirements

    def _extract_requirement_details(self, text):
        """Extract specific requirement details from text"""
        requirements = {}

        # Common patterns for system requirements
        patterns = {
            'os': r'OS[^:]*:([^\n]+)',
            'processor': r'(CPU|Processor)[^:]*:([^\n]+)',
            'memory': r'(RAM|Memory)[^:]*:([^\n]+)',
            'graphics': r'(GPU|Graphics|Video)[^:]*:([^\n]+)',
            'storage': r'(Storage|HDD)[^:]*:([^\n]+)',
            'directx': r'DirectX[^:]*:([^\n]+)'
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                requirements[key] = match.group(1).strip()

        return requirements

    def _extract_download_links(self, soup, base_url):
        """Extract download links from the page"""
        download_links = {
            'data_nodes': {},
            'fucking_fast': {},
            'multi_up': {}
        }

        # Find the download mirrors section
        mirrors_heading = soup.find('h3', string=re.compile(r'Download Mirrors \(Direct Links\)', re.I))
        if not mirrors_heading:
            return download_links

        mirrors_section = mirrors_heading.find_next('ul')
        if not mirrors_section:
            return download_links

        # Extract DataNodes links
        datanodes_li = None
        for li in mirrors_section.find_all('li'):
            if 'DataNodes' in li.get_text():
                datanodes_li = li
                break

        if datanodes_li:
            download_links['data_nodes'] = self._extract_filehoster_links(datanodes_li)

        # Extract FuckingFast links
        fuckingfast_li = None
        for li in mirrors_section.find_all('li'):
            if 'FuckingFast' in li.get_text():
                fuckingfast_li = li
                break

        if fuckingfast_li:
            download_links['fucking_fast'] = self._extract_filehoster_links(fuckingfast_li)

        # Extract MultiUpload links
        multup_li = None
        for li in mirrors_section.find_all('li'):
            if 'MultiUpload' in li.get_text():
                multup_li = li
                break

        if multup_li:
            multup_paste_link = multup_li.find('a', href=True)
            if multup_paste_link:
                multup_url = multup_paste_link['href']
                download_links['multi_up'] = self._extract_multup_links(multup_url)

        return download_links

    def _extract_filehoster_links(self, li_element):
        """Extract links from a filehoster list item"""
        links_data = {}

        # Find the spoiler content
        spoiler = li_element.find('div', class_='su-spoiler-content')
        if not spoiler:
            return links_data

        # Extract all links from the spoiler
        links = spoiler.find_all('a', href=True)

        # Group links by file name pattern
        current_group = None
        current_links = []

        for link in links:
            filename = link.get_text(strip=True)
            url = link['href']

            # Clean filename by removing "_fitgirl-repacks.site_"
            clean_filename = filename.replace('_fitgirl-repacks.site_', '')

            # Extract base name (without part number)
            base_match = re.match(r'(.+?)(?:\.part\d+)?\.\w+$', clean_filename)
            if base_match:
                base_name = base_match.group(1)

                if base_name != current_group:
                    # Save previous group
                    if current_group and current_links:
                        links_data[current_group] = current_links.copy()

                    # Start new group
                    current_group = base_name
                    current_links = []

                current_links.append({
                    'filename': clean_filename,
                    'url': url
                })

        # Don't forget to add the last group
        if current_group and current_links:
            links_data[current_group] = current_links

        return links_data

    def _extract_multup_links(self, paste_url):
        """Extract MultiUpload links from the pastebin"""
        try:
            response = self.session.get(paste_url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find the plaintext div containing the links
            plaintext_div = soup.find('div', id='plaintext')
            if not plaintext_div:
                return {}

            # Extract links from the plaintext
            links_data = {}
            current_group = None
            current_links = []

            # Find all list items with links
            list_items = plaintext_div.find_all('li')
            for li in list_items:
                link = li.find('a', href=True)
                if link:
                    url = link['href']
                    filename = link.get_text(strip=True)

                    # Clean filename by removing "_fitgirl-repacks.site_"
                    clean_filename = filename.replace('_fitgirl-repacks.site_', '')

                    # Extract base name (without part number)
                    base_match = re.match(r'(.+?)(?:\.part\d+)?\.\w+$', clean_filename)
                    if base_match:
                        base_name = base_match.group(1)

                        if base_name != current_group:
                            # Save previous group
                            if current_group and current_links:
                                links_data[current_group] = current_links.copy()

                            # Start new group
                            current_group = base_name
                            current_links = []

                        current_links.append({
                            'filename': clean_filename,
                            'url': url
                        })

            # Don't forget to add the last group
            if current_group and current_links:
                links_data[current_group] = current_links

            return links_data

        except Exception as e:
            print(f"Error extracting MultiUpload links: {e}")
            return {}

class WebsiteAutomation:
    def __init__(self):
        self.extractor = GameDataExtractor()

    def process_game_urls(self, urls):
        """Process multiple game URLs and return extracted data"""
        games_data = []

        for url in urls:
            print(f"\nProcessing: {url}")
            game_data = self.extractor.extract_fitgirl_data(url)

            if game_data:
                games_data.append(game_data)
                print(f"✓ Successfully extracted data for: {game_data.get('title', 'Unknown')}")

                # Display download links info
                download_links = game_data.get('download_links', {})
                if download_links:
                    print("Download links found:")
                    for hoster, links in download_links.items():
                        if links:
                            print(f"  - {hoster}: {sum(len(file_links) for file_links in links.values())} files")
            else:
                print(f"✗ Failed to extract data from: {url}")

            # Delay to be respectful to the server
            time.sleep(2)

        return games_data

    def save_to_json(self, games_data, filename='extracted_games.json'):
        """Save extracted data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(games_data, f, indent=2, ensure_ascii=False)
        print(f"\nData saved to {filename}")

    def display_results(self, games_data):
        """Display extracted results in a readable format"""
        for i, game in enumerate(games_data, 1):
            print(f"\n{'='*50}")
            print(f"GAME {i}: {game.get('title', 'N/A')}")
            print(f"{'='*50}")
            print(f"Genres: {', '.join(game.get('genres', []))}")
            print(f"Companies: {game.get('companies', 'N/A')}")
            print(f"Languages: {game.get('languages', 'N/A')}")
            print(f"Original Size: {game.get('original_size', 'N/A')}")
            print(f"Repack Size: {game.get('repack_size', 'N/A')}")
            print(f"Screenshots: {len(game.get('screenshots', []))} found")
            print(f"System Requirements: {game.get('system_requirements', {})}")

            # Display download links
            download_links = game.get('download_links', {})
            if download_links:
                print("\nDownload Links:")
                for hoster, files in download_links.items():
                    if files:
                        print(f"  {hoster.upper()}:")
                        for file_group, links in files.items():
                            print(f"    - {file_group}: {len(links)} files")

# Usage Example
def main():
    automation = WebsiteAutomation()

    # Example URLs (replace with your actual URLs)
    game_urls = [
        "https://fitgirl-repacks.site/grand-theft-auto-v/",
        # Add more URLs here
    ]

    # Extract data from all URLs
    games_data = automation.process_game_urls(game_urls)

    # Display results


    def _extract_filehoster_links(self, li_element):
        """Extract links from a filehoster list item"""
        links_data = {}

        # Find the spoiler content
        spoiler = li_element.find('div', class_='su-spoiler-content')
        if not spoiler:
            return links_data

        # Extract all links from the spoiler
        links = spoiler.find_all('a', href=True)

        # Group links by file name pattern
        current_group = None
        current_links = []

        for link in links:
            filename = link.get_text(strip=True)
            url = link['href']

            # Clean filename by removing "_fitgirl-repacks.site_"
            clean_filename = filename.replace('_fitgirl-repacks.site_', '')

            # Extract base name (without part number)
            base_match = re.match(r'(.+?)(?:\.part\d+)?\.\w+$', clean_filename)
            if base_match:
                base_name = base_match.group(1)

                if base_name != current_group:
                    # Save previous group
                    if current_group and current_links:
                        links_data[current_group] = current_links.copy()

                    # Start new group
                    current_group = base_name
                    current_links = []

                current_links.append({
                    'filename': clean_filename,
                    'url': url
                })

        # Don't forget to add the last group
        if current_group and current_links:
            links_data[current_group] = current_links

        return links_data

    def _extract_multup_links(self, paste_url):
        """Extract MultiUpload links from the pastebin"""
        try:
            response = self.session.get(paste_url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find the plaintext div containing the links
            plaintext_div = soup.find('div', id='plaintext')
            if not plaintext_div:
                return {}

            # Extract links from the plaintext
            links_data = {}
            current_group = None
            current_links = []

            # Find all list items with links
            list_items = plaintext_div.find_all('li')
            for li in list_items:
                link = li.find('a', href=True)
                if link:
                    url = link['href']
                    filename = link.get_text(strip=True)

                    # Clean filename by removing "_fitgirl-repacks.site_"
                    clean_filename = filename.replace('_fitgirl-repacks.site_', '')

                    # Extract base name (without part number)
                    base_match = re.match(r'(.+?)(?:\.part\d+)?\.\w+$', clean_filename)
                    if base_match:
                        base_name = base_match.group(1)

                        if base_name != current_group:
                            # Save previous group
                            if current_group and current_links:
                                links_data[current_group] = current_links.copy()

                            # Start new group
                            current_group = base_name
                            current_links = []

                        current_links.append({
                            'filename': clean_filename,
                            'url': url
                        })

            # Don't forget to add the last group
            if current_group and current_links:
                links_data[current_group] = current_links

            return links_data

        except Exception as e:
            print(f"Error extracting MultiUpload links: {e}")
            return {}

class WebsiteAutomation:
    def __init__(self):
        self.extractor = GameDataExtractor()

    def process_game_urls(self, urls):
        """Process multiple game URLs and return extracted data"""
        games_data = []

        for url in urls:
            print(f"\nProcessing: {url}")
            game_data = self.extractor.extract_fitgirl_data(url)

            if game_data:
                games_data.append(game_data)
                print(f"✓ Successfully extracted data for: {game_data.get('title', 'Unknown')}")

                # Display download links info
                download_links = game_data.get('download_links', {})
                if download_links:
                    print("Download links found:")
                    for hoster, links in download_links.items():
                        if links:
                            print(f"  - {hoster}: {sum(len(file_links) for file_links in links.values())} files")
            else:
                print(f"✗ Failed to extract data from: {url}")

            # Delay to be respectful to the server
            time.sleep(2)

        return games_data

    def save_to_json(self, games_data, filename='extracted_games.json'):
        """Save extracted data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(games_data, f, indent=2, ensure_ascii=False)
        print(f"\nData saved to {filename}")

    def display_results(self, games_data):
        """Display extracted results in a readable format"""
        for i, game in enumerate(games_data, 1):
            print(f"\n{'='*50}")
            print(f"GAME {i}: {game.get('title', 'N/A')}")
            print(f"{'='*50}")
            print(f"Genres: {', '.join(game.get('genres', []))}")
            print(f"Companies: {game.get('companies', 'N/A')}")
            print(f"Languages: {game.get('languages', 'N/A')}")
            print(f"Original Size: {game.get('original_size', 'N/A')}")
            print(f"Repack Size: {game.get('repack_size', 'N/A')}")
            print(f"Screenshots: {len(game.get('screenshots', []))} found")
            print(f"System Requirements: {game.get('system_requirements', {})}")

            # Display download links
            download_links = game.get('download_links', {})
            if download_links:
                print("\nDownload Links:")
                for hoster, files in download_links.items():
                    if files:
                        print(f"  {hoster.upper()}:")
                        for file_group, links in files.items():
                            print(f"    - {file_group}: {len(links)} files")

# Usage Example
def main():
    automation = WebsiteAutomation()

    # Example URLs (replace with your actual URLs)
    game_urls = [
        "https://fitgirl-repacks.site/grand-theft-auto-v/",
        # Add more URLs here
    ]

    # Extract data from all URLs
    games_data = automation.process_game_urls(game_urls)

    # Display results
    automation.display_results(games_data)

    # Save to JSON file
    automation.save_to_json(games_data)

    print(f"\nExtraction complete! Processed {len(games_data)} games.")

if __name__ == "__main__":
    import sys
    
    # Check if URL is provided as command line argument
    if len(sys.argv) > 1:
        extractor = GameDataExtractor()
        url = sys.argv[1]
        game_data = extractor.extract_fitgirl_data(url)
        
        if game_data:
            # Output JSON to stdout for API consumption
            print(json.dumps(game_data, ensure_ascii=False))
        else:
            print(json.dumps({"error": "Failed to scrape game data"}))
    else:
        # Run default example
        main()
