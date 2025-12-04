import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

interface GameData {
  title?: string;
  genres?: string[];
  developer?: string;
  languages?: string;
  original_size?: string;
  repack_size?: string;
  screenshots?: string[];
  system_requirements?: Record<string, string>;
  description?: string;
  debug_info?: string[];
}

interface RequirementDetails {
  os?: string;
  processor?: string;
  memory?: string;
  graphics?: string;
  storage?: string;
  directx?: string;
  sound_card?: string;
  network?: string;
}

class ElAmigosDataExtractor {
  private session: AxiosInstance;

  constructor() {
    this.session = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
  }

  async extractElAmigosData(url: string): Promise<GameData | null> {
    try {
      console.log(`[ElAmigos] Extracting data from: ${url}`);
      const response = await this.session.get(url);

      const $ = cheerio.load(response.data);
      const gameData: GameData = {};

      // Extract title and parse it
      const titleElement = $('h2.my-4').first();
      if (titleElement.length) {
        const rawTitle = titleElement.text().trim();
        gameData.title = this._parseTitle(rawTitle, gameData);
        console.log(`[ElAmigos] Raw title: ${rawTitle}`);
        console.log(`[ElAmigos] Parsed title: ${gameData.title}`);
      }

      // Extract description
      gameData.description = this._extractDescription($);

      // Extract game details from info scene section
      this._extractInfoSceneDetails($, gameData);

      // Extract screenshots
      gameData.screenshots = this._extractScreenshots($);
      console.log(`[ElAmigos] Screenshots: ${gameData.screenshots?.length || 0}`);

      // Extract system requirements
      const sysReq = this._extractSystemRequirements($);
      gameData.system_requirements = {
        os: sysReq.os || '',
        processor: sysReq.processor || '',
        memory: sysReq.memory || '',
        graphics: sysReq.graphics || '',
        storage: sysReq.storage || '',
        directx: sysReq.directx || '',
        sound_card: sysReq.sound_card || '',
        network: sysReq.network || ''
      };

      return gameData;
    } catch (error) {
      console.error(`[ElAmigos] Error extracting data: ${error}`);
      return null;
    }
  }

  private _parseTitle(rawTitle: string, gameData: GameData): string {
    const logs: string[] = [];
    logs.push(`[ElAmigos] Parsing Title Input: "${rawTitle}"`);
    let title = rawTitle;

    // Remove year and size info - look for patterns like "(2020)" or ", 17.11GB"
    title = title.replace(/\s*\(\d{4}\)/g, ''); // Remove year in parentheses
    title = title.replace(/,\s*\d+\.\d+GB\s*$/i, ''); // Remove size at end
    title = title.replace(/\s+/g, ' ').trim(); // Clean extra spaces

    logs.push(`[ElAmigos] After cleaning: "${title}"`);

    // Attach logs to gameData for debugging
    gameData.debug_info = logs;

    return title;
  }

  private _extractDescription($: cheerio.CheerioAPI): string {
    const descriptionDiv = $('div.col-md-8').first();
    if (!descriptionDiv.length) return '';

    let description = '';
    let collectingDescription = false;

    // Find the Description heading and collect text until we hit Info Scene
    descriptionDiv.contents().each((i, el) => {
      const $el = $(el);

      // Start collecting after the Description h3
      if ($el.is('h3') && $el.text().includes('Description')) {
        collectingDescription = true;
        return true; // Continue to next element
      }

      // Stop collecting when we hit Info Scene heading
      if ($el.is('h3') && $el.text().includes('Info Scene')) {
        collectingDescription = false;
        return false; // Stop processing
      }

      // Collect text nodes and br elements, but skip ads and scripts
      if (collectingDescription) {
        if (el.type === 'text') {
          const text = $el.text().trim();
          if (text && text.length > 10) { // Only collect substantial text
            description += text + ' ';
          }
        } else if (el.type === 'tag' && el.name === 'br') {
          description += '\n';
        }
        // Skip divs with ads, scripts, etc.
      }
    });

    // Clean up the description
    description = description
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Clean up line breaks
      .trim();

    return description;
  }

  private _extractInfoSceneDetails($: cheerio.CheerioAPI, gameData: GameData): void {
    // Look for "Info Scene +[CrackFix]" section
    const infoSceneHeading = $('h3.my-3').filter((i, el) => {
      return $(el).text().includes('Info Scene');
    }).first();

    if (infoSceneHeading.length) {
      const nextParagraph = infoSceneHeading.next('p');
      if (nextParagraph.length) {
        const infoText = nextParagraph.text();

        // Extract file size
        const uploadSizeMatch = infoText.match(/Upload size \/ to download:\s*(\d+MB)/i);
        if (uploadSizeMatch) {
          gameData.repack_size = uploadSizeMatch[1];
        }

        // Extract languages
        const languagesMatch = infoText.match(/Languages:\s*(.+?)(?:\n|$)/i);
        if (languagesMatch) {
          gameData.languages = languagesMatch[1].trim();
        }
      }
    }
  }

  private _extractScreenshots($: cheerio.CheerioAPI): string[] {
    const screenshots: string[] = [];

    // Look for Images section
    const imagesHeading = $('h3.my-4').filter((i, el) => {
      return $(el).text().includes('Images');
    }).first();

    if (imagesHeading.length) {
      const imagesRow = imagesHeading.next('.row');
      if (imagesRow.length) {
        imagesRow.find('a[href]').each((i, el) => {
          const href = $(el).attr('href') || '';
          if (href && href.includes('.webp') && this._isValidScreenshotUrl(href)) {
            screenshots.push(href);
            if (screenshots.length >= 6) return false; // Max 6 screenshots
          }
        });
      }
    }

    return screenshots;
  }

  private _isValidScreenshotUrl(url: string): boolean {
    return url.includes('elamigosgamez.com') && url.includes('games_tumbl');
  }

  private _extractSystemRequirements($: cheerio.CheerioAPI): RequirementDetails {
    const requirements: RequirementDetails = {};

    // Look for Requirements section
    const requirementsHeading = $('h3.my-4').filter((i, el) => {
      return $(el).text().includes('Requirements');
    }).first();

    if (requirementsHeading.length) {
      const requirementsRow = requirementsHeading.next('.row');
      if (requirementsRow.length) {
        // Get recommended requirements (second column)
        const recommendedDiv = requirementsRow.find('div.col-md-6').eq(1);
        if (recommendedDiv.length) {
          const reqText = recommendedDiv.text();

          // Parse the requirements
          const osMatch = reqText.match(/SO:\s*([^<\n]+)/i);
          if (osMatch) requirements.os = osMatch[1].trim();

          const processorMatch = reqText.match(/Procesador:\s*([^<\n]+)/i);
          if (processorMatch) requirements.processor = processorMatch[1].trim();

          const memoryMatch = reqText.match(/Memoria:\s*([^<\n]+)/i);
          if (memoryMatch) requirements.memory = memoryMatch[1].trim();

          const graphicsMatch = reqText.match(/Gráficos:\s*([^<\n]+)/i);
          if (graphicsMatch) requirements.graphics = graphicsMatch[1].trim();

          const directxMatch = reqText.match(/DirectX:\s*([^<\n]+)/i);
          if (directxMatch) requirements.directx = directxMatch[1].trim();

          const networkMatch = reqText.match(/Red:\s*([^<\n]+)/i);
          if (networkMatch) requirements.network = networkMatch[1].trim();

          const storageMatch = reqText.match(/Almacenamiento:\s*([^<\n]+)/i);
          if (storageMatch) requirements.storage = storageMatch[1].trim();
        }
      }
    }

    return requirements;
  }
}

export { ElAmigosDataExtractor };
