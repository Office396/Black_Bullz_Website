import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

interface GameData {
  title?: string;
  genres?: string[];
  companies?: string;
  languages?: string;
  original_size?: string;
  repack_size?: string;
  screenshots?: string[];
  system_requirements?: Record<string, string>;
  download_links?: Record<string, any>;
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

class GameDataExtractor {
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

  async extractFitgirlData(url: string): Promise<GameData | null> {
    try {
      console.log(`[FitGirl] Extracting data from: ${url}`);
      const response = await this.session.get(url);

      const $ = cheerio.load(response.data);
      const gameData: GameData = {};

      // Extract title and parse it
      const titleElement = $('h1.entry-title').text().trim();
      if (titleElement) {
        gameData.title = this._parseTitle(titleElement, gameData);
        console.log(`[FitGirl] Raw title: ${titleElement}`);
        console.log(`[FitGirl] Parsed title: ${gameData.title}`);
      }

      // Extract game details from the info block
      const detailsSection = $('p[style*="height"]').first();
      if (detailsSection.length) {
        this._extractBasicDetails(detailsSection, gameData, $);
      }

      // Extract screenshots
      gameData.screenshots = this._extractScreenshots($, url);
      console.log(`[FitGirl] Screenshots: ${gameData.screenshots?.length || 0}`);

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

      // Extract download links
      gameData.download_links = await this._extractDownloadLinks($, url);

      const totalGroups = Object.values(gameData.download_links).reduce((sum, provider) => {
        return sum + Object.keys(provider).length;
      }, 0);
      console.log(`[FitGirl] Total download link groups: ${totalGroups}`);

      return gameData;
    } catch (error) {
      console.error(`[FitGirl] Error extracting data: ${error}`);
      return null;
    }
  }

  private _parseTitle(rawTitle: string, gameData: GameData): string {
    const logs: string[] = [];
    logs.push(`[FitGirl] Parsing Title Input: "${rawTitle}"`);
    let title = rawTitle;

    // 1. Remove "+ ..." (Bonus content)
    const plusIndex = title.indexOf('+');
    if (plusIndex !== -1) {
      title = title.substring(0, plusIndex).trim();
      logs.push(`[FitGirl] After removing +: "${title}"`);
    }

    // 2. Identify Version (Priority 1)
    // Matches: v1.0, v1.0.2, Build 1234
    // We look for the pattern, and if found, we truncate everything after it.
    const versionRegex = /(?:^|\s|[(\[])(v\d+(?:\.\d+)*|Build\s+\d+)/i;
    const versionMatch = title.match(versionRegex);

    if (versionMatch && versionMatch.index !== undefined) {
      logs.push(`[FitGirl] Found Version: "${versionMatch[1]}"`);
      // versionMatch[1] is the version part (e.g. "v1.0")
      // We want to end exactly after the version part.
      const matchStart = versionMatch.index;
      const captureStart = title.indexOf(versionMatch[1], matchStart);
      const endOfVersion = captureStart + versionMatch[1].length;

      title = title.substring(0, endOfVersion).trim();
      logs.push(`[FitGirl] After Version Cut: "${title}"`);
    } else {
      logs.push(`[FitGirl] No Version Found`);
      // 3. If NO Version, check for Edition keywords (Priority 2)
      // We want to keep the edition, but remove garbage after it.
      const editionKeywords = [
        'edition', 'deluxe', 'ultimate', 'gold', 'complete', 'goty',
        'definitive', 'remastered', 'enhanced', 'collection', 'pack', 'cut'
      ];

      const editionRegex = new RegExp(`\\b(${editionKeywords.join('|')})\\b`, 'gi');
      let lastMatch: RegExpExecArray | null = null;
      let match;
      while ((match = editionRegex.exec(title)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        logs.push(`[FitGirl] Found Edition Keyword: "${lastMatch[0]}"`);
        // Found an edition keyword. Cut after it.
        const endOfEdition = lastMatch.index + lastMatch[0].length;
        title = title.substring(0, endOfEdition).trim();
        logs.push(`[FitGirl] After Edition Cut: "${title}"`);
      }
    }

    // 4. Clean up trailing separators and unmatched brackets
    title = title.replace(/\s*[-–—]\s*$/, '').trim();
    title = title.replace(/[)\]]$/, '').trim(); // Remove trailing ) or ] if we cut inside
    logs.push(`[FitGirl] Final Output: "${title}"`);

    // Attach logs to gameData for debugging
    gameData.debug_info = logs;

    return title;
  }

  private _extractBasicDetails(
    detailsSection: cheerio.Cheerio<any>,
    gameData: GameData,
    $: cheerio.CheerioAPI
  ): void {
    const textContent = detailsSection.text();

    // Extract Genres/Tags
    const genresMatch = textContent.match(/Genres\/Tags:\s*(.+)/);
    if (genresMatch) {
      gameData.genres = genresMatch[1]
        .split(',')
        .map((g: string) => g.trim());
    }

    const htmlStr = detailsSection.html() || '';

    // Extract Companies
    const companiesMatch = htmlStr.match(
      /Companies:\s*<strong>(.+?)<\/strong>/
    );
    if (companiesMatch) {
      gameData.companies = companiesMatch[1].trim();
    }

    // Extract Languages
    const languagesMatch = htmlStr.match(
      /Languages:\s*<strong>(.+?)<\/strong>/
    );
    if (languagesMatch) {
      gameData.languages = languagesMatch[1].trim();
    }

    // Extract Original Size
    const originalSizeMatch = htmlStr.match(
      /Original Size:\s*<strong>(.+?)<\/strong>/
    );
    if (originalSizeMatch) {
      gameData.original_size = originalSizeMatch[1].trim();
    }

    // Extract Repack Size
    const repackSizeMatch = htmlStr.match(
      /Repack Size:\s*<strong>(.+?)<\/strong>/
    );
    if (repackSizeMatch) {
      gameData.repack_size = repackSizeMatch[1].trim();
    }
  }

  private _extractScreenshots(
    $: cheerio.CheerioAPI,
    baseUrl: string
  ): string[] {
    const screenshots: string[] = [];

    // Look for screenshot sections
    const screenshotSection = $('h3')
      .filter((_i, el) => {
        return /Screenshots/i.test($(el).text());
      })
      .first();

    if (screenshotSection.length) {
      const parent = screenshotSection.parent();
      const images = parent.find('img');

      images.each((_i, el) => {
        const src = $(el).attr('src') || '';
        if (src && this._isValidScreenshotUrl(src)) {
          const fullSizeUrl = this._getFullSizeScreenshot(src);
          if (fullSizeUrl && !screenshots.includes(fullSizeUrl)) {
            screenshots.push(fullSizeUrl);
            if (screenshots.length >= 7) return false;
          }
        }
      });
    }

    // Fallback: Find screenshot links
    if (screenshots.length < 7) {
      const screenshotLinks = $('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".webp"]');

      screenshotLinks.each((_i, el) => {
        if (screenshots.length >= 7) return false;
        const imgUrl = $(el).attr('href') || '';
        if (imgUrl && this._isValidScreenshotUrl(imgUrl)) {
          const fullSizeUrl = this._getFullSizeScreenshot(imgUrl);
          if (fullSizeUrl && !screenshots.includes(fullSizeUrl)) {
            screenshots.push(fullSizeUrl);
          }
        }
      });
    }

    return screenshots.slice(0, 7);
  }

  private _isValidScreenshotUrl(url: string): boolean {
    const screenshotIndicators = [
      'screenshot',
      'screen',
      'riotpixels',
      'imageban',
    ];
    return screenshotIndicators.some((indicator) =>
      url.toLowerCase().includes(indicator)
    );
  }

  private _getFullSizeScreenshot(thumbnailUrl: string): string {
    let fullSizeUrl = thumbnailUrl;

    // FitGirl specific conversion
    if (
      fullSizeUrl.includes('riotpixels.net') &&
      fullSizeUrl.includes('.240p.')
    ) {
      fullSizeUrl = fullSizeUrl.replace('.240p.jpg', '');
      fullSizeUrl = fullSizeUrl.replace('.jpg.jpg', '.jpg');
      return fullSizeUrl;
    }

    // General conversion
    const sizePatterns = [
      /\.\d+p\./g,
      /-\d+x\d+\./g,
      /_thumb/g,
      /_small/g,
      /_mini/g,
    ];

    sizePatterns.forEach((pattern) => {
      fullSizeUrl = fullSizeUrl.replace(pattern, '.');
    });

    fullSizeUrl = this._fixDoubleExtensions(fullSizeUrl);

    return fullSizeUrl;
  }

  private _fixDoubleExtensions(url: string): string {
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

    extensions.forEach((ext) => {
      const doubleExt = ext + ext;
      while (url.includes(doubleExt)) {
        url = url.replace(doubleExt, ext);
      }
    });

    return url;
  }

  private _extractSystemRequirements(
    $: cheerio.CheerioAPI
  ): RequirementDetails {
    const requirements: RequirementDetails = {};

    // Look for system requirements section
    const requirementsHeaders = $('h2, h3, h4').filter((_i, el) => {
      const text = $(el).text();
      return /system.requirement|requirement|spec/i.test(text);
    });

    requirementsHeaders.each((_i, header) => {
      const content = this._findRequirementsContent($(header), $);
      if (content) {
        const parsed = this._parseRequirementsContent(content, $);
        if (Object.keys(parsed).length > 0) {
          Object.assign(requirements, parsed);
          return false;
        }
      }
    });

    return requirements;
  }

  private _findRequirementsContent(
    header: cheerio.Cheerio<any>,
    $: cheerio.CheerioAPI
  ): cheerio.Cheerio<any> | null {
    let current = header.next();

    while (current.length) {
      if (current.text().trim()) {
        return current;
      }
      current = current.next();
    }

    return null;
  }

  private _parseRequirementsContent(
    content: cheerio.Cheerio<any>,
    $: cheerio.CheerioAPI
  ): RequirementDetails {
    const requirements: RequirementDetails = {};
    const text = content.text();

    const recommendedPatterns = [
      /recommended[^:]*:([^]+?)(?=minimum|$|\.\s)/i,
      /system.*recommended[^:]*:([^]+?)(?=minimum|$|\.\s)/i,
    ];

    for (const pattern of recommendedPatterns) {
      const match = text.match(pattern);
      if (match) {
        const requirementsText = match[1];
        return this._extractRequirementDetails(requirementsText);
      }
    }

    return requirements;
  }

  private _extractRequirementDetails(text: string): RequirementDetails {
    const requirements: RequirementDetails = {};

    const patterns: Record<string, RegExp> = {
      os: /OS[^:]*:([^\n]+)/i,
      processor: /(CPU|Processor)[^:]*:([^\n]+)/i,
      memory: /(RAM|Memory)[^:]*:([^\n]+)/i,
      graphics: /(GPU|Graphics|Video)[^:]*:([^\n]+)/i,
      storage: /(Storage|HDD)[^:]*:([^\n]+)/i,
      directx: /DirectX[^:]*:([^\n]+)/i,
      sound_card: /Sound Card[^:]*:([^\n]+)/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        const value = match[match.length - 1];
        requirements[key as keyof RequirementDetails] = value.trim();
      }
    });

    return requirements;
  }

  private async _extractDownloadLinks(
    $: cheerio.CheerioAPI,
    baseUrl: string
  ): Promise<Record<string, any>> {
    const downloadLinks: Record<string, any> = {
      data_nodes: {},
      fucking_fast: {},
      multi_up: {},
    };

    console.log('[FitGirl] Looking for download mirrors section...');

    // Debug: Log all h3 headings
    const allH3 = $('h3');
    console.log(`[FitGirl] Found ${allH3.length} h3 elements:`);
    allH3.each((i, el) => {
      console.log(`[FitGirl]   H3 ${i + 1}: "${$(el).text().trim()}"`);
    });

    // Find h3 with "Download Mirror" or "Download Mirrors" text
    const mirrorsHeading = $('h3')
      .filter((_i, el) => {
        const text = $(el).text();
        return /Download Mirror/i.test(text);
      })
      .first();

    if (!mirrorsHeading.length) {
      console.log('[FitGirl] ❌ No download mirrors heading found');
      return downloadLinks;
    }

    console.log(`[FitGirl] ✅ Found heading: "${mirrorsHeading.text().trim()}"`);

    // Get the next UL element
    let mirrorsSection = mirrorsHeading.next();
    let steps = 0;
    while (mirrorsSection.length && mirrorsSection.prop('tagName') !== 'UL' && steps < 10) {
      console.log(`[FitGirl]   Next element: ${mirrorsSection.prop('tagName')} - "${mirrorsSection.text().substring(0, 50)}..."`);
      mirrorsSection = mirrorsSection.next();
      steps++;
    }

    if (!mirrorsSection.length || mirrorsSection.prop('tagName') !== 'UL') {
      console.log('[FitGirl] ❌ No UL element found after heading');
      return downloadLinks;
    }

    const listItems = mirrorsSection.find('li');
    console.log(`[FitGirl] ✅ Found UL with ${listItems.length} list items`);

    // Debug: Log each LI content
    listItems.each((i, li) => {
      const text = $(li).text().trim();
      console.log(`[FitGirl]   LI ${i + 1}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    });

    // Process each LI (using regular for loop to support async operations)
    for (let i = 0; i < listItems.length; i++) {
      const li = listItems[i];
      const $li = $(li);
      const text = $li.text();

      // Look for "Filehoster:" pattern to identify filehosters
      const filehosterMatch = text.match(/Filehoster:\s*([^(\n]+)/i);
      if (filehosterMatch) {
        const filehosterName = filehosterMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
        console.log(`[FitGirl] → Processing filehoster: ${filehosterName}`);

        // Check if this LI has a spoiler (direct links) or just a paste link
        const spoilerDiv = $li.find('div.su-spoiler');
        if (spoilerDiv.length > 0) {
          // Has spoiler with direct links
          const linksData = this._extractFilehosterLinks($li, $);
          if (filehosterName.includes('fuckingfast') || filehosterName.includes('fucking_fast')) {
            downloadLinks.fucking_fast = linksData;
          } else if (filehosterName.includes('datanodes') || filehosterName.includes('data_nodes')) {
            downloadLinks.data_nodes = linksData;
          } else if (filehosterName.includes('multiup') || filehosterName.includes('multi_up')) {
            downloadLinks.multi_up = linksData;
          } else {
            // Generic handling for other filehosters
            downloadLinks[filehosterName] = linksData;
          }
          console.log(`[FitGirl] → ${filehosterName}: ${Object.keys(linksData).length} groups`);
        } else {
          // Check for direct paste link
          const pasteLink = $li.find('a').first().attr('href');
          if (pasteLink && pasteLink.includes('paste.')) {
            console.log(`[FitGirl] → ${filehosterName} paste link: ${pasteLink}`);
            try {
              if (filehosterName.includes('datanodes') || filehosterName.includes('data_nodes')) {
                downloadLinks.data_nodes = await this._extractPasteLinks(pasteLink);
              } else if (filehosterName.includes('multiup') || filehosterName.includes('multi_up')) {
                downloadLinks.multi_up = await this._extractMultupLinks(pasteLink);
              } else {
                downloadLinks[filehosterName] = await this._extractPasteLinks(pasteLink);
              }
            } catch (error) {
              console.error(`[FitGirl] Error extracting paste links for ${filehosterName}: ${error}`);
            }
          }
        }
      }
    }

    return downloadLinks;
  }

  private _extractFilehosterLinks(
    liElement: cheerio.Cheerio<any>,
    $: cheerio.CheerioAPI
  ): Record<string, any> {
    const linksData: Record<string, any> = {};

    console.log('[FitGirl]   🔍 Looking for spoiler elements...');

    // Debug: Check what elements are in the LI
    const allDivs = liElement.find('div');
    console.log(`[FitGirl]   Found ${allDivs.length} div elements in LI`);
    allDivs.each((i, div) => {
      const classes = $(div).attr('class') || '';
      console.log(`[FitGirl]   Div ${i + 1}: classes="${classes}"`);
    });

    // Find the su-spoiler div, then get su-spoiler-content inside it
    const spoilerDiv = liElement.find('div.su-spoiler');
    if (!spoilerDiv.length) {
      console.log('[FitGirl]   ⚠️  No div.su-spoiler found');
      return linksData;
    }

    console.log('[FitGirl]   ✅ Found su-spoiler div');

    const spoilerContent = spoilerDiv.find('div.su-spoiler-content');
    if (!spoilerContent.length) {
      console.log('[FitGirl]   ⚠️  No div.su-spoiler-content found');
      return linksData;
    }

    console.log('[FitGirl]   ✅ Found su-spoiler-content div');

    // Get all links from spoiler content
    const links = spoilerContent.find('a[href]');
    console.log(`[FitGirl]   Found ${links.length} links in spoiler`);

    // Debug: Log first few links
    links.slice(0, 3).each((i, link) => {
      const href = $(link).attr('href') || '';
      const text = $(link).text().trim();
      console.log(`[FitGirl]   Link ${i + 1}: "${text.substring(0, 50)}..." -> ${href.substring(0, 50)}...`);
    });

    let currentGroup: string | null = null;
    let currentLinks: any[] = [];

    links.each((_i, link) => {
      const href = $(link).attr('href') || '';
      const text = $(link).text().trim();

      // Skip invalid links
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }

      // Extract filename from link text or URL
      let filename = text.trim();
      if (!filename || filename.length < 5 || filename.startsWith('http')) {
        // If text is empty/short or is a URL, extract from href
        const urlParts = href.split('/');
        filename = urlParts[urlParts.length - 1];
      }

      // Clean filename - remove _fitgirl-repacks markers
      const cleanFilename = filename
        .replace(/_fitgirl-repacks\.site_/g, '')
        .replace(/_fitgirl-repacks_/g, '')
        .replace(/–/g, '-') // Replace en-dash with regular dash
        .replace(/—/g, '-'); // Replace em-dash with regular dash

      // Match file patterns and extract base name
      let baseName = cleanFilename;

      // Try to match files with part numbers first
      const partMatch = cleanFilename.match(/^(.+?)(?:part\s*\d+)\.(?:rar|zip|7z|exe|bin)$/i);
      if (partMatch) {
        baseName = partMatch[1];
      } else {
        // Fallback: remove extension for files without part numbers
        const extMatch = cleanFilename.match(/^(.+)\.(?:rar|zip|7z|exe|bin)$/i);
        if (extMatch) {
          baseName = extMatch[1];
        } else {
          // Last resort: use the cleaned filename as-is
          baseName = cleanFilename;
        }
      }

      console.log(`[FitGirl]   Processing: "${filename}" -> "${cleanFilename}" -> base: "${baseName}"`);

      // Group by base name
      if (baseName !== currentGroup) {
        // Save previous group
        if (currentGroup && currentLinks.length > 0) {
          console.log(`[FitGirl]   Group "${currentGroup}" completed with ${currentLinks.length} files`);
          linksData[currentGroup] = [...currentLinks];
        }

        // Start new group
        console.log(`[FitGirl]   Starting new group: "${baseName}" (was: "${currentGroup}")`);
        currentGroup = baseName;
        currentLinks = [];
      } else {
        console.log(`[FitGirl]   Adding to existing group: "${baseName}"`);
      }

      currentLinks.push({
        filename: cleanFilename,
        url: href,
      });
    });

    // Save final group
    if (currentGroup && currentLinks.length > 0) {
      console.log(`[FitGirl]   Final group "${currentGroup}" with ${currentLinks.length} files`);
      linksData[currentGroup] = currentLinks;
    }

    console.log(`[FitGirl]   Extracted ${Object.keys(linksData).length} file groups`);
    console.log(`[FitGirl]   Group keys:`, Object.keys(linksData));
    const totalFiles = Object.values(linksData).reduce((sum: number, files: any) => sum + files.length, 0);
    console.log(`[FitGirl]   Total files: ${totalFiles}`);
    return linksData;
  }

  private async _extractMultupLinks(pasteUrl: string): Promise<Record<string, any>> {
    // TODO: Implement MultiUp paste link extraction
    return {};
  }

  private async _extractPasteLinks(pasteUrl: string): Promise<Record<string, any>> {
    const linksData: Record<string, any> = {};

    try {
      console.log(`[FitGirl] Fetching paste content from: ${pasteUrl}`);
      const response = await this.session.get(pasteUrl);
      const pasteContent = response.data;

      // Extract links from paste content (this is a simplified implementation)
      // In a real implementation, you'd need to parse the specific paste site format
      const linkRegex = /https?:\/\/[^\s<>"']+/g;
      const links = pasteContent.match(linkRegex) || [];

      console.log(`[FitGirl] Found ${links.length} links in paste`);

      let currentGroup: string | null = null;
      let currentLinks: any[] = [];

      links.forEach((link: string) => {
        // Extract filename from URL
        const urlParts = link.split('/');
        let filename = urlParts[urlParts.length - 1];

        if (filename) {
          // Clean filename
          const cleanFilename = filename
            .replace(/_fitgirl-repacks\.site_/g, '')
            .replace(/_fitgirl-repacks_/g, '')
            .replace(/–/g, '-')
            .replace(/—/g, '-');

          // Extract base name
          let baseName = cleanFilename;
          const partMatch = cleanFilename.match(/^(.+?)(?:part\s*\d+)\.(?:rar|zip|7z|exe|bin)$/i);
          if (partMatch) {
            baseName = partMatch[1];
          } else {
            const extMatch = cleanFilename.match(/^(.+)\.(?:rar|zip|7z|exe|bin)$/i);
            if (extMatch) {
              baseName = extMatch[1];
            }
          }

          // Group by base name
          if (baseName !== currentGroup) {
            if (currentGroup && currentLinks.length > 0) {
              linksData[currentGroup] = [...currentLinks];
            }
            currentGroup = baseName;
            currentLinks = [];
          }

          currentLinks.push({
            filename: cleanFilename,
            url: link,
          });
        }
      });

      // Save final group
      if (currentGroup && currentLinks.length > 0) {
        linksData[currentGroup] = currentLinks;
      }

      console.log(`[FitGirl] Extracted ${Object.keys(linksData).length} file groups from paste`);
    } catch (error) {
      console.error(`[FitGirl] Error fetching paste content: ${error}`);
    }

    return linksData;
  }
}

export { GameDataExtractor };