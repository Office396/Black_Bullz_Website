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
  languages: string;
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
        languages: this.extractLanguages($),
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

                // Try to get recommended requirements first
                let requirementsText = '';
                if (fullText.includes('Recommended:')) {
                  const parts = fullText.split('Recommended:');
                  if (parts.length > 1) {
                    requirementsText = parts[1];
                    console.log('[OvaGames] Using recommended requirements, extracted text length:', requirementsText.length);
                    console.log('[OvaGames] Recommended text preview:', requirementsText.substring(0, 200));
                  }
                }

                // If no recommended, try minimum requirements
                if (!requirementsText && fullText.includes('Minimum:')) {
                  const parts = fullText.split('Minimum:');
                  if (parts.length > 1) {
                    requirementsText = parts[1];
                    // If there's also recommended after minimum, get only the minimum part
                    if (requirementsText.includes('Recommended:')) {
                      requirementsText = requirementsText.split('Recommended:')[0];
                    }
                    console.log('[OvaGames] Using minimum requirements, extracted text length:', requirementsText.length);
                    console.log('[OvaGames] Minimum text preview:', requirementsText.substring(0, 200));
                  }
                }

                if (requirementsText) {
                  // Clean up bullet points and format for parseSystemRequirements
                  const cleanedText = requirementsText
                    .replace(/^[•\-\*]\s*/gm, '') // Remove bullet points
                    .replace(/^Additional:\s*\*\s*/gm, '') // Remove additional prefixes
                    .split('\n')
                    .filter((line: string) => {
                      const trimmed = line.trim();
                      return trimmed &&
                             !trimmed.includes('Additional:') &&
                             !trimmed.includes('Supported Video Cards') &&
                             !trimmed.includes('Laptop versions') &&
                             !trimmed.includes('For the most up-to-date') &&
                             !trimmed.includes('visit the FAQ') &&
                             !trimmed.includes('Requires a UPlay account');
                    })
                    .join('\n');

                  console.log('[OvaGames] Raw requirements text:', requirementsText.substring(0, 300));
                  console.log('[OvaGames] Cleaned requirements length:', cleanedText.length);
                  console.log('[OvaGames] Cleaned requirements preview:', cleanedText.substring(0, 200));
                  return cleanedText || 'N/A';
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

  private extractLanguages($: cheerio.CheerioAPI): string {
    try {
      console.log('[OvaGames] Extracting languages...');

      // Look for the install notes section that contains languages
      const installNotesElements = $('p').filter((i, el) => {
        return $(el).text().includes('Full List of Supported Languages');
      });

      console.log(`[OvaGames] Install notes elements found: ${installNotesElements.length}`);

      if (installNotesElements.length) {
        const installNotesText = installNotesElements.first().text();
        console.log('[OvaGames] Install notes text:', installNotesText.substring(0, 200));

        const languagesMatch = installNotesText.match(/Full List of Supported Languages:\s*([^<\n]+(?:\s*,\s*[^<\n]+)*)/i);
        if (languagesMatch) {
          const languages = languagesMatch[1].trim();
          console.log('[OvaGames] Found languages in install notes:', languages);
          return languages;
        } else {
          console.log('[OvaGames] No languages match found in install notes');
        }
      }

      // Fallback: search in paragraphs containing language keywords
      console.log('[OvaGames] Searching in paragraphs for languages...');
      const paragraphs = $('p');
      console.log(`[OvaGames] Found ${paragraphs.length} paragraphs`);
      for (let i = 0; i < paragraphs.length; i++) {
        const text = $(paragraphs[i]).text();
        if (text.includes('English') && text.includes('French')) {
          console.log(`[OvaGames] Found paragraph ${i} with languages: "${text.substring(0, 200)}"`);
          // Try to extract just the language list
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.includes('English') && line.includes('French')) {
              console.log('[OvaGames] Language line found:', line.trim());
              return line.trim();
            }
          }
        }
      }

      console.log('[OvaGames] No languages found');
    } catch (error) {
      console.error(`Error extracting languages: ${error}`);
    }
    return '';
  }
}

export { GameDetailsScraper };