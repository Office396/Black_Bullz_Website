import axios from 'axios';
import * as cheerio from 'cheerio';

interface GameData {
  url: string;
  scraped_at: string;
  title: string;
  category: string;
  developer: string;
  file_size: string;
  rating: string;
  profile_pic: string;
  short_description: string;
  long_description: string;
  screenshots: string[];
  system_requirements: string;
}

class GameDetailsScraper {
  private headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async scrapeGame(gameUrl: string): Promise<GameData | null> {
    try {
      const response = await axios.get(gameUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      const gameData: GameData = {
        url: gameUrl,
        scraped_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false }),
        title: this.extractTitle($),
        category: this.extractCategory($),
        developer: this.extractDeveloper($),
        file_size: this.extractFileSize($),
        rating: this.extractRating($),
        profile_pic: this.extractProfilePic($),
        short_description: this.extractShortDescription($),
        long_description: this.extractLongDescription($),
        screenshots: this.extractScreenshots($),
        system_requirements: this.extractSystemRequirements($),
      };

      return gameData;
    } catch (error) {
      console.error(`Error scraping ${gameUrl}: ${error}`);
      return null;
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    try {
      const titleElement = $('h1.post-title');
      if (titleElement.length) {
        let title = titleElement.find('a').text().trim();

        // Remove "MULTi" followed by numbers (e.g. MULTi15)
        title = title.replace(/\s*MULTi\d+\s*/i, ' ');

        // Remove "-ElAmigos" or "ElAmigos"
        title = title.replace(/\s*[-–—]?\s*ElAmigos\s*/i, ' ');

        // Clean up extra whitespace and dashes
        title = title.replace(/\s+/, ' ').trim();
        title = title.replace(/[-–—]\s*$/, '').trim();

        return title;
      }
    } catch (error) {
      console.error(`Error extracting title: ${error}`);
    }
    return 'N/A';
  }

  private extractCategory($: cheerio.CheerioAPI): string {
    try {
      const categories: string[] = [];
      const postInfo = $('div.post-info');

      if (postInfo.length) {
        const categoryLinks = postInfo.find('a[rel="category tag"]');
        categoryLinks.each((_i, el) => {
          const cat = $(el).text().trim();
          if (cat && !categories.includes(cat)) {
            categories.push(cat);
          }
        });
      }

      if (categories.length === 0) {
        const detailsSection = $('p').first().text();
        const genreMatch = detailsSection.match(/Genre[^:]*:\s*([^<\n]+)/);
        if (genreMatch) {
          return genreMatch[1]
            .split(',')
            .map((c: string) => c.trim())
            .join(', ');
        }
      }

      return categories.length > 0 ? categories.join(', ') : 'N/A';
    } catch (error) {
      console.error(`Error extracting category: ${error}`);
    }
    return 'N/A';
  }

  private extractDeveloper($: cheerio.CheerioAPI): string {
    try {
      const paragraphs = $('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const text = $(paragraphs[i]).text();
        if (text.includes('Developer')) {
          const match = text.match(/Developer[^:]*:\s*([^<\n,•]+)/);
          if (match) {
            return match[1].trim();
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting developer: ${error}`);
    }
    return 'N/A';
  }

  private extractFileSize($: cheerio.CheerioAPI): string {
    try {
      const paragraphs = $('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const text = $(paragraphs[i]).text();
        if (text.includes('File Size')) {
          const match = text.match(/File Size[^:]*:\s*([^<\n•]+)/);
          if (match) {
            return match[1].trim();
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting file size: ${error}`);
    }
    return 'N/A';
  }

  private extractRating($: cheerio.CheerioAPI): string {
    try {
      const ratingElements = $('[class*="rating"], [class*="rate"], [class*="star"]');
      if (ratingElements.length) {
        return ratingElements.first().text().trim();
      }
    } catch (error) {
      console.error(`Error extracting rating: ${error}`);
    }
    return 'N/A';
  }

  private extractProfilePic($: cheerio.CheerioAPI): string {
    try {
      const postWrapper = $('div.post-wrapper');
      if (postWrapper.length) {
        const img = postWrapper.find('img').first();
        const src = img.attr('src');
        if (src) {
          return src;
        }
      }
    } catch (error) {
      console.error(`Error extracting profile pic: ${error}`);
    }
    return 'N/A';
  }

  private extractShortDescription($: cheerio.CheerioAPI): string {
    try {
      const paragraphs = $('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const text = $(paragraphs[i]).text();
        if (text.includes('Free Download')) {
          const cleaned = text.replace(/\s*\[.*?\]\s*/g, '').trim();
          return cleaned;
        }
      }
    } catch (error) {
      console.error(`Error extracting short description: ${error}`);
    }
    return 'N/A';
  }

  private extractLongDescription($: cheerio.CheerioAPI): string {
    try {
      const tabsWrapper = $('div.wp-tabs');
      if (tabsWrapper.length) {
        const headings = tabsWrapper.find('h3.wp-tab-title');
        for (let i = 0; i < headings.length; i++) {
          const heading = $(headings[i]);
          if (/DESCRIPTION/i.test(heading.text())) {
            const contentDiv = heading.next('div.wp-tab-content');
            if (contentDiv.length) {
              const wrapper = contentDiv.find('div.wp-tab-content-wrapper');
              if (wrapper.length) {
                const text = wrapper.text().trim();
                return text || 'N/A';
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting long description: ${error}`);
    }
    return 'N/A';
  }

  private extractScreenshots($: cheerio.CheerioAPI): string[] {
    try {
      const tabsWrapper = $('div.wp-tabs');
      if (tabsWrapper.length) {
        const headings = tabsWrapper.find('h3.wp-tab-title');
        for (let i = 0; i < headings.length; i++) {
          const heading = $(headings[i]);
          if (/SCREENSHOT/i.test(heading.text())) {
            const contentDiv = heading.next('div.wp-tab-content');
            if (contentDiv.length) {
              const wrapper = contentDiv.find('div.wp-tab-content-wrapper');
              if (wrapper.length) {
                const images = wrapper.find('img');
                const screenshots: string[] = [];
                images.each((_j, img) => {
                  const src = $(img).attr('src');
                  if (src) {
                    screenshots.push(src);
                  }
                });
                return screenshots.slice(0, 5);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting screenshots: ${error}`);
    }
    return [];
  }

  private extractSystemRequirements($: cheerio.CheerioAPI): string {
    try {
      const tabsWrapper = $('div.wp-tabs');
      if (tabsWrapper.length) {
        const headings = tabsWrapper.find('h3.wp-tab-title');
        for (let i = 0; i < headings.length; i++) {
          const heading = $(headings[i]);
          if (/SYSTEM REQUIREMENTS/i.test(heading.text())) {
            const contentDiv = heading.next('div.wp-tab-content');
            if (contentDiv.length) {
              const wrapper = contentDiv.find('div.wp-tab-content-wrapper');
              if (wrapper.length) {
                const fullText = wrapper.text();
                if (fullText.includes('Recommended:')) {
                  const parts = fullText.split('Recommended:');
                  if (parts.length > 1) {
                    const recommendedText = parts[1];
                    const lines = recommendedText
                      .split('\n')
                      .map((line: string) => {
                        line = line.trim();
                        line = line.replace(/^[•\-\*]\s*/, '');
                        return line;
                      })
                      .filter((line: string) => line);

                    const result = lines.join('\n');
                    return result || 'N/A';
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting system requirements: ${error}`);
    }
    return 'N/A';
  }
}

export { GameDetailsScraper };