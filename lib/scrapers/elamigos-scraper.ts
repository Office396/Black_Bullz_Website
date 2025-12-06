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
    console.log('[ElAmigos] Looking for languages in Requirements section...');

    // Look for Requirements section (languages are here, not in Info Scene)
    const requirementsHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Requirements');
    }).first();

    console.log(`[ElAmigos] Requirements heading found: ${requirementsHeading.length}`);
    if (requirementsHeading.length) {
      console.log(`[ElAmigos] Requirements heading text: "${requirementsHeading.text().trim()}"`);

      // Find the row containing the requirements
      const requirementsRow = requirementsHeading.next('.row');
      console.log(`[ElAmigos] Requirements row found: ${requirementsRow.length}`);

      if (requirementsRow.length) {
        // Look for languages in the requirements text
        const requirementsText = requirementsRow.text();
        console.log(`[ElAmigos] Requirements text: "${requirementsText.substring(0, 200)}..."`);

        // Extract languages - look for patterns like "Languages: English, French..."
        const languagesMatch = requirementsText.match(/Languages?:\s*([^<\n]+(?:\s*,\s*[^<\n]+)*)/i);
        if (languagesMatch) {
          gameData.languages = languagesMatch[1].trim();
          console.log(`[ElAmigos] Languages extracted from requirements: "${gameData.languages}"`);
        } else {
          console.log(`[ElAmigos] No languages found in requirements text`);
        }

        // Extract repack size if available
        const sizeMatch = requirementsText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
        if (sizeMatch) {
          gameData.repack_size = sizeMatch[1];
          console.log(`[ElAmigos] Repack size extracted: "${gameData.repack_size}"`);
        }
      }
    }

    // Fallback: Also check for Info Scene section for repack size
    const infoSceneHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Info Scene');
    }).first();

    if (infoSceneHeading.length && !gameData.repack_size) {
      console.log(`[ElAmigos] Info Scene heading found as fallback`);
      const nextParagraph = infoSceneHeading.next('p');
      if (nextParagraph.length) {
        const infoText = nextParagraph.text();
        const uploadSizeMatch = infoText.match(/Upload size \/ to download:\s*(\d+MB)/i);
        if (uploadSizeMatch) {
          gameData.repack_size = uploadSizeMatch[1];
          console.log(`[ElAmigos] Repack size from Info Scene: "${gameData.repack_size}"`);
        }
      }
    }
  }

  private _extractScreenshots($: cheerio.CheerioAPI): string[] {
    console.log('[ElAmigos] ===== STARTING SCREENSHOT EXTRACTION =====');
    const screenshots: string[] = [];

    // DIRECT APPROACH: Find all image links from elamigosgamez.com first
    console.log('[ElAmigos] Searching for all elamigosgamez.com image links...');
    const allImageLinks = $('a[href*="elamigosgamez.com"]').filter((i, el) => {
      const href = $(el).attr('href') || '';
      return href.includes('.webp') || href.includes('.jpg') || href.includes('.png');
    });

    console.log(`[ElAmigos] Found ${allImageLinks.length} total elamigos image links`);

    allImageLinks.each((i, el) => {
      const href = $(el).attr('href');
      if (href && screenshots.length < 6) { // Limit to 6 screenshots
        screenshots.push(href);
        console.log(`[ElAmigos] Added screenshot ${screenshots.length}: ${href}`);
      }
    });

    if (screenshots.length > 0) {
      console.log(`[ElAmigos] ===== ENDING SCREENSHOT EXTRACTION =====`);
      console.log(`[ElAmigos] Total screenshots extracted: ${screenshots.length}`);
      return screenshots;
    }

    // FALLBACK: Legacy heading-based approach if direct search fails
    console.log('[ElAmigos] No screenshots found with direct search, trying legacy approach...');
    let imagesHeading;

    // First, try to find any element containing "Images" text (handles malformed nested tags)
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('Images') && $(el).is('h3')) {
        imagesHeading = $(el);
        console.log(`[ElAmigos] Found Images heading at index ${i}: text="${text}", tag="${el.tagName}", class="${$(el).attr('class')}"`);
        return false; // Stop searching
      }
    });

    // If not found, try the specific h3.my-4 selector
    if (!imagesHeading) {
      imagesHeading = $('h3.my-4').filter((i, el) => {
        const text = $(el).text().trim();
        return text.includes('Images') || text === 'Images';
      }).first();
      console.log(`[ElAmigos] Images heading (h3.my-4) found: ${imagesHeading ? imagesHeading.length : 0}`);
    }

    if (imagesHeading && imagesHeading.length) {
      console.log(`[ElAmigos] Using Images heading: text="${imagesHeading.text().trim()}", html="${imagesHeading.html()}"`);
    } else {
      // Debug: Check all elements containing "Images"
      console.log('[ElAmigos] No Images heading found. Elements containing "Images":');
      $('*').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Images')) {
          console.log(`  Element[${i}]: tag=${el.tagName}, class="${$(el).attr('class')}", text="${text}"`);
        }
      });
    }

    // Fallback: look for any h3 containing Images
    if (!imagesHeading.length) {
      imagesHeading = $('h3').filter((i, el) => {
        const text = $(el).text().trim();
        return text.includes('Images') || text.includes('Screenshots') || text === 'Images';
      }).first();
      console.log(`[ElAmigos] Fallback Images heading found: ${imagesHeading.length}`);
    }

    // Additional approaches for finding Images heading are already covered above

    // Additional approach: Look for elements that have "Images" in their HTML content (including nested elements)
    if (!imagesHeading.length) {
      $('h3').each((i, el) => {
        const html = $(el).html();
        if (html && html.includes('Images')) {
          imagesHeading = $(el);
          console.log(`[ElAmigos] Found Images heading via HTML content at index ${i}: "${html}"`);
          return false;
        }
      });
    }

    if (imagesHeading && imagesHeading.length) {
      console.log(`[ElAmigos] Images heading found, looking for associated row...`);

      // Look for .row after the heading (multiple approaches)
      let imagesRow = imagesHeading.next('.row');
      console.log(`[ElAmigos] Images row immediately after heading: ${imagesRow.length}`);

      // If not found immediately after, try siblings or parent containers
      if (!imagesRow.length) {
        // Try nextUntil to find row
        imagesRow = imagesHeading.nextUntil('.row').last().next('.row');
        console.log(`[ElAmigos] Images row via nextUntil: ${imagesRow.length}`);
      }

      if (!imagesRow.length) {
        // Try finding row in siblings
        imagesHeading.siblings('.row').first().each((i, el) => {
          imagesRow = $(el);
          console.log(`[ElAmigos] Images row as sibling: ${imagesRow.length}`);
          return false;
        });
      }

      if (!imagesRow.length) {
        // Last resort: find any row with webp/jpg images from elamigosgamez.com
        $('div.row').each((i, el) => {
          const row = $(el);
          const imageLinks = row.find('a[href*="elamigosgamez.com"]').filter((j, link) => {
            const href = $(link).attr('href') || '';
            return href.includes('.webp') || href.includes('.jpg');
          });
          if (imageLinks.length >= 1) { // At least 1 image link
            imagesRow = row;
            console.log(`[ElAmigos] Found row with ${imageLinks.length} elamigos image links at index ${i}`);
            return false;
          }
        });
      }

      console.log(`[ElAmigos] Final imagesRow found: ${imagesRow && imagesRow.length}`);
      if (imagesRow && imagesRow.length) {
        const allLinks = imagesRow.find('a');
        const imageLinks = imagesRow.find('a[href*="elamigosgamez.com"]');
        console.log(`[ElAmigos] Images row contains ${allLinks.length} total links, ${imageLinks.length} elamigos links`);

        // Debug: show all links found
        imageLinks.each((i, el) => {
          const href = $(el).attr('href');
          console.log(`[ElAmigos] Image link ${i + 1}: ${href}`);
        });
      } else {
        console.log('[ElAmigos] No images row found, searching globally...');
        // Global search as last resort
        const globalImages = $('a[href*="elamigosgamez.com"]').filter((i, el) => {
          const href = $(el).attr('href') || '';
          return href.includes('.webp') || href.includes('.jpg');
        });
        console.log(`[ElAmigos] Found ${globalImages.length} image links globally`);
        globalImages.each((i, el) => {
          if (i < 5) { // Show first 5
            console.log(`[ElAmigos] Global image ${i + 1}: ${$(el).attr('href')}`);
          }
        });
      }

      if (imagesRow.length) {
        const imageLinks = imagesRow.find('a[href]');
        console.log(`[ElAmigos] Total image links found: ${imageLinks.length}`);

        imageLinks.each((i, el) => {
          const href = $(el).attr('href') || '';
          console.log(`[ElAmigos] Checking link ${i + 1}: ${href}`);

          if (href && href.includes('.webp')) {
            screenshots.push(href);
            console.log(`[ElAmigos] Added screenshot ${screenshots.length}: ${href}`);
            if (screenshots.length >= 6) return false; // Max 6 screenshots
          }
        });
      }
    }

    console.log(`[ElAmigos] ===== ENDING SCREENSHOT EXTRACTION =====`);
    console.log(`[ElAmigos] Total screenshots extracted: ${screenshots.length}`);
    console.log(`[ElAmigos] Screenshots array:`, screenshots);
    return screenshots;
  }

  private _isValidScreenshotUrl(url: string): boolean {
    // More permissive validation - just check it's a valid URL with .webp extension
    return url.startsWith('http') && url.includes('.webp');
  }

  private _extractSystemRequirements($: cheerio.CheerioAPI): RequirementDetails {
    console.log('[ElAmigos] Looking for system requirements...');
    const requirements: RequirementDetails = {};

    // Look for Requirements section - try multiple approaches
    let requirementsDiv: cheerio.Cheerio<any> | null = null;

    // Approach 1: Look for heading followed by row structure (prioritize recommended - second column)
    const requirementsHeading = $('h3').filter((i, el) => {
      return $(el).text().includes('Requirements') || $(el).text().includes('requisitos');
    }).first();

    if (requirementsHeading.length) {
      console.log(`[ElAmigos] Requirements heading found: "${requirementsHeading.text().trim()}"`);
      const requirementsRow = requirementsHeading.next('.row');
      if (requirementsRow.length) {
        const columns = requirementsRow.find('div.col-md-6');
        if (columns.length >= 2) {
          // Check if second column has "Recommended" in it (prioritize recommended)
          const secondColumn = columns.eq(1);
          const secondText = secondColumn.text();
          if (secondText.includes('Recommended') || secondText.includes('recomendados')) {
            requirementsDiv = secondColumn;
            console.log('[ElAmigos] Using recommended requirements (second column)');
          } else {
            // If second column doesn't have recommended, check first column
            const firstColumn = columns.eq(0);
            const firstText = firstColumn.text();
            if (firstText.includes('Recommended') || firstText.includes('recomendados')) {
              requirementsDiv = firstColumn;
              console.log('[ElAmigos] Using recommended requirements (first column)');
            } else {
              // No recommended found, use second column as fallback (might be minimum)
              requirementsDiv = secondColumn;
              console.log('[ElAmigos] No recommended found, using second column as fallback');
            }
          }
        } else if (columns.length === 1) {
          requirementsDiv = columns.eq(0);
          console.log('[ElAmigos] Only one column found');
        }
      }
    }

    // Approach 2: Look directly for div with "Recommended requirements"
    if (!requirementsDiv || !requirementsDiv.length) {
      requirementsDiv = $('div').filter((i, el) => {
        return $(el).text().includes('Recommended requirements') || $(el).text().includes('requisitos recomendados');
      });
      console.log(`[ElAmigos] Approach 2 - Recommended requirements div found: ${requirementsDiv.length}`);
    }

    // Approach 3: Look for any div.col-md-6 containing system requirements keywords
    if (!requirementsDiv || !requirementsDiv.length) {
      const allColumns = $('div.col-md-6');
      console.log(`[ElAmigos] Approach 3 - Found ${allColumns.length} col-md-6 divs`);

      allColumns.each((i, el) => {
        const text = $(el).text();
        if (text.includes('OS:') || text.includes('SO:') || text.includes('Processor:') || text.includes('Procesador:')) {
          // Prioritize recommended over minimum
          if (text.includes('Recommended') || text.includes('recomendados')) {
            requirementsDiv = $(el);
            console.log(`[ElAmigos] Found recommended requirements in column ${i + 1}`);
            return false; // Stop searching
          } else if (!requirementsDiv || !requirementsDiv.length) {
            // Use as fallback if we haven't found recommended yet
            requirementsDiv = $(el);
            console.log(`[ElAmigos] Using minimum requirements as fallback from column ${i + 1}`);
          }
        }
      });
    }

    console.log(`[ElAmigos] Requirements div found: ${requirementsDiv && requirementsDiv.length}`);

    if (requirementsDiv && requirementsDiv.length) {
      const reqText = requirementsDiv.first().text();
      console.log(`[ElAmigos] System requirements text: "${reqText}"`);

      if (reqText) {
        // Clean up the text first - remove bullet points and clean formatting
        let cleanText = reqText.replace(/^[•\-\*]\s*/gm, ''); // Remove bullet points from each line
        cleanText = cleanText.replace(/\n\s*\n/g, '\n'); // Clean up extra newlines

        console.log(`[ElAmigos] Cleaned requirements text: "${cleanText}"`);

        // Parse the requirements - support both English and Spanish formats
        // English format
        let osMatch = cleanText.match(/OS:\s*([^<\n]+)/i);
        if (!osMatch) osMatch = cleanText.match(/SO:\s*([^<\n]+)/i); // Spanish fallback
        if (osMatch) requirements.os = osMatch[1].trim();

        let processorMatch = cleanText.match(/Processor:\s*([^<\n]+)/i);
        if (!processorMatch) processorMatch = cleanText.match(/Procesador:\s*([^<\n]+)/i); // Spanish fallback
        if (processorMatch) requirements.processor = processorMatch[1].trim();

        let memoryMatch = cleanText.match(/Memory:\s*([^<\n]+)/i);
        if (!memoryMatch) memoryMatch = cleanText.match(/Memoria:\s*([^<\n]+)/i); // Spanish fallback
        if (memoryMatch) requirements.memory = memoryMatch[1].trim();

        let graphicsMatch = cleanText.match(/Graphics:\s*([^<\n]+)/i);
        if (!graphicsMatch) graphicsMatch = cleanText.match(/Gráficos:\s*([^<\n]+)/i); // Spanish fallback
        if (graphicsMatch) requirements.graphics = graphicsMatch[1].trim();

        let directxMatch = cleanText.match(/DirectX:\s*([^<\n]+)/i);
        if (directxMatch) requirements.directx = directxMatch[1].trim();

        let networkMatch = cleanText.match(/Network:\s*([^<\n]+)/i);
        if (!networkMatch) networkMatch = cleanText.match(/Red:\s*([^<\n]+)/i); // Spanish fallback
        if (networkMatch) requirements.network = networkMatch[1].trim();

        let storageMatch = cleanText.match(/Storage:\s*([^<\n]+)/i);
        if (!storageMatch) storageMatch = cleanText.match(/Almacenamiento:\s*([^<\n]+)/i); // Spanish fallback
        if (storageMatch) requirements.storage = storageMatch[1].trim();

        // Also try to match "Hard Drive" format (common in OvaGames-style)
        if (!storageMatch) {
          storageMatch = cleanText.match(/Hard Drive:\s*([^<\n]+)/i);
          if (storageMatch) requirements.storage = storageMatch[1].trim();
        }

        // Try to match "Sound" format
        let soundMatch = cleanText.match(/Sound:\s*([^<\n]+)/i);
        if (!soundMatch) soundMatch = cleanText.match(/Sound Card:\s*([^<\n]+)/i);
        if (soundMatch) requirements.sound_card = soundMatch[1].trim();

        console.log(`[ElAmigos] Parsed requirements:`, {
          os: requirements.os,
          processor: requirements.processor,
          memory: requirements.memory,
          graphics: requirements.graphics,
          storage: requirements.storage,
          directx: requirements.directx
        });
        console.log(`[ElAmigos] System requirements extraction completed`);
      }
    }

    console.log(`[ElAmigos] System requirements found: ${!!(requirements.os || requirements.processor || requirements.memory)}`);
    return requirements;
  }
}

export { ElAmigosDataExtractor };
