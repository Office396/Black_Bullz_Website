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

      console.log(`[ElAmigos] Page loaded, length: ${response.data.length}`);

      // Debug: Check all h2 elements
      const allH2 = $('h2');
      console.log(`[ElAmigos] Found ${allH2.length} h2 elements`);
      allH2.each((i, el) => {
        if (i < 5) console.log(`[ElAmigos] h2[${i}]: "${$(el).text().trim()}"`);
      });

      // Extract title and parse it
      const titleElement = $('h2.my-4').first();
      console.log(`[ElAmigos] Title element found: ${titleElement.length}`);
      if (titleElement.length) {
        const rawTitle = titleElement.text().trim();
        gameData.title = this._parseTitle(rawTitle, gameData);
        console.log(`[ElAmigos] Raw title: "${rawTitle}"`);
        console.log(`[ElAmigos] Parsed title: "${gameData.title}"`);
      } else {
        // Try alternative selectors
        const altTitle = $('h2').first();
        if (altTitle.length) {
          const rawTitle = altTitle.text().trim();
          gameData.title = this._parseTitle(rawTitle, gameData);
          console.log(`[ElAmigos] Alt title found: "${rawTitle}"`);
        }
      }

      // Extract description
      gameData.description = this._extractDescription($);
      console.log(`[ElAmigos] Description length: ${gameData.description?.length || 0}`);

      // Extract game details from info scene section
      this._extractInfoSceneDetails($, gameData);

      // Extract screenshots
      gameData.screenshots = this._extractScreenshots($);
      console.log(`[ElAmigos] Screenshots: ${gameData.screenshots?.length || 0}`);

      // Extract system requirements
      const sysReq = this._extractSystemRequirements($);
      console.log(`[ElAmigos] System requirements found: ${!!(sysReq.os || sysReq.processor || sysReq.memory)}`);
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
    console.log('[ElAmigos] Looking for description div...');
    const descriptionDiv = $('div.col-md-8').first();
    console.log(`[ElAmigos] Description div found: ${descriptionDiv.length}`);
    if (!descriptionDiv.length) {
      console.log('[ElAmigos] No description div found, trying fallback...');
      // Fallback: try to find any div with substantial text
      const allDivs = $('div').filter((i, el) => $(el).text().trim().length > 100);
      console.log(`[ElAmigos] Found ${allDivs.length} substantial divs`);
      if (allDivs.length > 0) {
        return allDivs.first().text().trim().substring(0, 500);
      }
      return '';
    }

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
    console.log('[ElAmigos] Looking for Info Scene section...');
    // Look for "Info Scene +[CrackFix]" section
    const infoSceneHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Info Scene');
    }).first();

    console.log(`[ElAmigos] Info Scene heading found: ${infoSceneHeading.length}`);
    if (infoSceneHeading.length) {
      console.log(`[ElAmigos] Info Scene heading text: "${infoSceneHeading.text().trim()}"`);
      const nextParagraph = infoSceneHeading.next('p');
      console.log(`[ElAmigos] Next paragraph found: ${nextParagraph.length}`);
      if (nextParagraph.length) {
        const infoText = nextParagraph.text();
        console.log(`[ElAmigos] Info text: "${infoText}"`);

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
    console.log('[ElAmigos] Looking for screenshots...');
    const screenshots: string[] = [];

    // Look for Images section
    const imagesHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Images') || $(el).text().includes('Screenshots');
    }).first();

    console.log(`[ElAmigos] Images heading found: ${imagesHeading.length}`);
    if (imagesHeading.length) {
      console.log(`[ElAmigos] Images heading text: "${imagesHeading.text().trim()}"`);
      const imagesRow = imagesHeading.next('.row');
      console.log(`[ElAmigos] Images row found: ${imagesRow.length}`);
      if (imagesRow.length) {
        const imageLinks = imagesRow.find('a[href]');
        console.log(`[ElAmigos] Image links found: ${imageLinks.length}`);
      }
    }

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
    console.log('[ElAmigos] Looking for system requirements...');
    const requirements: RequirementDetails = {};

    // Look for Requirements section - try multiple approaches
    let requirementsDiv: cheerio.Cheerio<any> | null = null;

    // Approach 1: Look for heading followed by row structure
    const requirementsHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Requirements') || $(el).text().includes('requisitos');
    }).first();

    if (requirementsHeading.length) {
      console.log(`[ElAmigos] Requirements heading found: "${requirementsHeading.text().trim()}"`);
      const requirementsRow = requirementsHeading.next('.row');
      if (requirementsRow.length) {
        requirementsDiv = requirementsRow.find('div.col-md-6').eq(1);
      }
    }

    // Approach 2: Look directly for div with "Recommended requirements"
    if (!requirementsDiv || !requirementsDiv.length) {
      requirementsDiv = $('div').filter((i, el) => {
        return $(el).text().includes('Recommended requirements') || $(el).text().includes('requisitos recomendados');
      });
    }

    // Approach 3: Look for any div.col-md-6 containing system requirements keywords
    if (!requirementsDiv || !requirementsDiv.length) {
      requirementsDiv = $('div.col-md-6').filter((i, el) => {
        const text = $(el).text();
        return text.includes('OS:') || text.includes('SO:') || text.includes('Processor:') || text.includes('Procesador:');
      });
    }

    console.log(`[ElAmigos] Requirements div found: ${requirementsDiv && requirementsDiv.length}`);

    if (requirementsDiv && requirementsDiv.length) {
      const reqText = requirementsDiv.first().text();
      console.log(`[ElAmigos] System requirements text: "${reqText}"`);

      if (reqText) {
        // Parse the requirements - support both English and Spanish formats
        // English format
        let osMatch = reqText.match(/OS:\s*([^<\n]+)/i);
        if (!osMatch) osMatch = reqText.match(/SO:\s*([^<\n]+)/i); // Spanish fallback
        if (osMatch) requirements.os = osMatch[1].trim();

        let processorMatch = reqText.match(/Processor:\s*([^<\n]+)/i);
        if (!processorMatch) processorMatch = reqText.match(/Procesador:\s*([^<\n]+)/i); // Spanish fallback
        if (processorMatch) requirements.processor = processorMatch[1].trim();

        let memoryMatch = reqText.match(/Memory:\s*([^<\n]+)/i);
        if (!memoryMatch) memoryMatch = reqText.match(/Memoria:\s*([^<\n]+)/i); // Spanish fallback
        if (memoryMatch) requirements.memory = memoryMatch[1].trim();

        let graphicsMatch = reqText.match(/Graphics:\s*([^<\n]+)/i);
        if (!graphicsMatch) graphicsMatch = reqText.match(/Gráficos:\s*([^<\n]+)/i); // Spanish fallback
        if (graphicsMatch) requirements.graphics = graphicsMatch[1].trim();

        let directxMatch = reqText.match(/DirectX:\s*([^<\n]+)/i);
        if (directxMatch) requirements.directx = directxMatch[1].trim();

        let networkMatch = reqText.match(/Network:\s*([^<\n]+)/i);
        if (!networkMatch) networkMatch = reqText.match(/Red:\s*([^<\n]+)/i); // Spanish fallback
        if (networkMatch) requirements.network = networkMatch[1].trim();

        let storageMatch = reqText.match(/Storage:\s*([^<\n]+)/i);
        if (!storageMatch) storageMatch = reqText.match(/Almacenamiento:\s*([^<\n]+)/i); // Spanish fallback
        if (storageMatch) requirements.storage = storageMatch[1].trim();

        console.log(`[ElAmigos] Parsed requirements:`, {
          os: requirements.os,
          processor: requirements.processor,
          memory: requirements.memory,
          graphics: requirements.graphics,
          storage: requirements.storage,
          directx: requirements.directx
        });
      }
    }

    console.log(`[ElAmigos] System requirements found: ${!!(requirements.os || requirements.processor || requirements.memory)}`);
    return requirements;
  }
}

export { ElAmigosDataExtractor };
