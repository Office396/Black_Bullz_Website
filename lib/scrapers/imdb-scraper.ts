import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

interface GameData {
  title: string;
  category: string[];
  developer: string;
  rating: string;
  profile_pic_url: string;
  short_description: string;
  long_description: string;
  screenshots: string[];
}

class IMDbGameScraper {
  private session: AxiosInstance;

  constructor() {
    this.session = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });
  }

  async scrapeGameDetails(imdbUrl: string): Promise<GameData | null> {
    try {
      const response = await this.session.get(imdbUrl);
      const $ = cheerio.load(response.data);

      const gameData: GameData = {
        title: this.getTitle($),
        category: this.getCategories($),
        developer: this.getDeveloper($),
        rating: this.getRating($),
        profile_pic_url: this.getProfilePic($),
        short_description: this.getShortDescription($),
        long_description: this.getLongDescription($),
        screenshots: this.getScreenshots($),
      };

      return gameData;
    } catch (error) {
      console.error(`Error scraping data: ${error}`);
      return null;
    }
  }

  private getTitle($: cheerio.CheerioAPI): string {
    const titleElement = $(
      'h1[data-testid="hero__pageTitle"]'
    ).first();
    if (titleElement.length) {
      const titleSpan = titleElement.find('span.hero__primary-text');
      if (titleSpan.length) {
        return titleSpan.text().trim();
      }
    }

    const metaTitle = $('meta[property="og:title"]').attr('content');
    if (metaTitle) {
      return metaTitle.split('(')[0].trim();
    }

    return 'Title not found';
  }

  private getCategories($: cheerio.CheerioAPI): string[] {
    const categories: string[] = [];

    const storylineSection = $('section[data-testid="Storyline"]');
    if (storylineSection.length) {
      const genresList = storylineSection.find(
        'li[data-testid="storyline-genres"]'
      );
      if (genresList.length) {
        const genreLinks = genresList.find(
          'a.ipc-metadata-list-item__list-content-item'
        );
        genreLinks.each((_i, el) => {
          categories.push($(el).text().trim());
        });
      }
    }

    if (categories.length === 0) {
      const chipsContainer = $(
        'div.ipc-chip-list__scroller'
      ).first();
      if (chipsContainer.length) {
        const chips = chipsContainer.find('span.ipc-chip__text');
        chips.slice(0, 5).each((_i, el) => {
          categories.push($(el).text().trim());
        });
      }
    }

    return categories.slice(0, 3);
  }

  private getDeveloper($: cheerio.CheerioAPI): string {
    const detailsSection = $('section[data-testid="Details"]');
    if (detailsSection.length) {
      const companiesItem = detailsSection.find(
        'li[data-testid="title-details-companies"]'
      );
      if (companiesItem.length) {
        const companyLinks = companiesItem.find(
          'a.ipc-metadata-list-item__list-content-item'
        );
        if (companyLinks.length) {
          return companyLinks.first().text().trim();
        }
      }
    }

    return 'Developer not found';
  }

  private getRating($: cheerio.CheerioAPI): string {
    // Try the rating bar first
    const ratingElement = $(
      'div[data-testid="hero-rating-bar__aggregate-rating"]'
    );
    if (ratingElement.length) {
      const ratingSpan = ratingElement.find('span.sc-4dc495c1-1').first();
      if (ratingSpan.length) {
        const rating = ratingSpan.text().trim();
        // Sometimes gets duplicated like "9.49.4", just take the first number
        const match = rating.match(/^(\d+\.?\d*)/);
        if (match) {
          return match[1];
        }
        return rating;
      }
    }

    // Fallback to JSON-LD
    const scriptTag = $('script[type="application/ld+json"]').first();
    if (scriptTag.length) {
      try {
        const jsonData = JSON.parse(scriptTag.html() || '{}');
        if (
          jsonData.aggregateRating &&
          jsonData.aggregateRating.ratingValue
        ) {
          return String(jsonData.aggregateRating.ratingValue);
        }
      } catch {
        // Continue silently
      }
    }

    return 'Rating not found';
  }

  private getProfilePic($: cheerio.CheerioAPI): string {
    const metaImage = $('meta[property="og:image"]').attr('content');
    if (metaImage) {
      return this.cleanImageUrl(metaImage);
    }

    const scriptTag = $('script[type="application/ld+json"]').first();
    if (scriptTag.length) {
      try {
        const jsonData = JSON.parse(scriptTag.html() || '{}');
        if (jsonData.image) {
          return this.cleanImageUrl(jsonData.image);
        }
      } catch {
        // Continue silently
      }
    }

    return 'Profile pic not found';
  }

  private getShortDescription($: cheerio.CheerioAPI): string {
    const plotElement = $('p[data-testid="plot"]');
    if (plotElement.length) {
      const mediumSpan = plotElement.find('span[data-testid="plot-l"]');
      if (mediumSpan.length) {
        return mediumSpan.text().trim();
      }

      const xsSpan = plotElement.find(
        'span[data-testid="plot-xs_to_m"]'
      );
      if (xsSpan.length) {
        let text = xsSpan.text().trim();
        text = text.replace(/Read all$/, '').trim();
        return text;
      }
    }

    return 'Short description not found';
  }

  private getLongDescription($: cheerio.CheerioAPI): string {
    const storylineSection = $('section[data-testid="Storyline"]');
    if (storylineSection.length) {
      const plotSummary = storylineSection.find(
        'div[data-testid="storyline-plot-summary"]'
      );
      if (plotSummary.length) {
        const contentDiv = plotSummary.find(
          'div.ipc-html-content-inner-div'
        );
        if (contentDiv.length) {
          let text = contentDiv.text().trim();
          text = text.replace(/—.*$/, '').trim();
          return text;
        }
      }
    }

    return 'Long description not found';
  }

  private getScreenshots($: cheerio.CheerioAPI): string[] {
    const screenshots: string[] = [];

    const photosSection = $('section[data-testid="Photos"]');
    if (photosSection.length) {
      const imageLinks = photosSection.find('img.ipc-image');
      imageLinks.slice(0, 10).each((_i, img) => {
        const src = $(img).attr('src');
        if (src) {
          const cleanUrl = this.cleanImageUrl(src);
          if (cleanUrl && !screenshots.includes(cleanUrl)) {
            screenshots.push(cleanUrl);
            if (screenshots.length >= 6) return false;
          }
        }
      });
    }

    if (screenshots.length < 6) {
      const allImages = $('img');
      allImages.each((_i, img) => {
        if (screenshots.length >= 6) return false;

        const src = $(img).attr('src');
        if (src && src.includes('media-amazon.com') && !screenshots.includes(src)) {
          const cleanUrl = this.cleanImageUrl(src);
          if (cleanUrl) {
            screenshots.push(cleanUrl);
          }
        }
      });
    }

    return screenshots.slice(0, 6);
  }

  private cleanImageUrl(url: string): string {
    if (!url) {
      return '';
    }

    let cleanUrl = url
      .replace(/\._V1_.*\.jpg/g, '._V1_.jpg')
      .replace(/\._V1_QL75_.*\.jpg/g, '._V1_.jpg')
      .replace(/\._V1_FMjpg_.*\.jpg/g, '._V1_.jpg');

    if (!cleanUrl.endsWith('.jpg')) {
      cleanUrl += '.jpg';
    }

    return cleanUrl;
  }
}

export { IMDbGameScraper };