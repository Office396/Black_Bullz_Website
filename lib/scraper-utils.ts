/**
 * Scraper Utility Functions
 * Helper functions for processing scraped game data
 */

export interface ScrapedGameData {
  ovagames?: OvaGamesData;
  fitgirl?: FitGirlData;
  elamigos?: ElAmigosData;
  imdb?: IMDBData;
}

export interface OvaGamesData {
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

export interface FitGirlData {
  title: string;
  genres: string[];
  companies: string;
  languages: string;
  original_size: string;
  repack_size: string;
  screenshots: string[];
  system_requirements: any;
  download_links: {
    data_nodes?: Record<string, Array<{ filename: string; url: string }>>;
    fucking_fast?: Record<string, Array<{ filename: string; url: string }>>;
    multi_up?: Record<string, Array<{ filename: string; url: string }>>;
  };
}

export interface ElAmigosData {
  title: string;
  developer?: string;
  languages: string;
  repack_size: string;
  screenshots: string[];
  system_requirements: any;
  description: string;
}

export interface IMDBData {
  title: string;
  category: string[];
  developer: string;
  rating: string;
  profile_pic_url: string;
  short_description: string;
  long_description: string;
  screenshots: string[];
}

export interface MergedGameData {
  title: string;
  developer: string;
  fileSize: string;
  rating: string;
  profileImage: string;
  shortDescription: string;
  longDescription: string;
  screenshots: string[];
  systemRequirements: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
    directx: string;
    sound_card: string;
  };
  downloadLinks: Array<{
    cloudName: string;
    links: Array<{ name: string; url: string; size: string }>;
  }>;
  genres: string[];
  languages: string;
  originalSize: string;
  repackSize: string;
}

/**
 * Clean FitGirl title to extract game name and edition/version
 */
export function cleanFitGirlTitle(title: string): string {
  if (!title) return '';

  // Split by colon
  const parts = title.split(':');

  if (parts.length > 1) {
    const firstPart = parts[0].trim();
    const secondPart = parts[1].trim();

    // Look for version pattern (v followed by numbers/dots)
    const versionMatch = secondPart.match(/^(.+?\s+v[\d.]+(?:\.\d+)*)/i);
    if (versionMatch) {
      return `${firstPart}: ${versionMatch[1].trim()}`;
    }

    // Priority 2: Look for edition keywords
    const editionKeywords = ['edition', 'deluxe', 'ultimate', 'gold', 'complete', 'goty', 'definitive', 'remastered', 'enhanced', 'collection', 'pack'];
    for (const keyword of editionKeywords) {
      const editionRegex = new RegExp(`^(.+?\\s+${keyword}\\w*)`, 'i');
      const editionMatch = secondPart.match(editionRegex);
      if (editionMatch) {
        return `${firstPart}: ${editionMatch[1].trim()}`;
      }
    }

    // If no version or edition found, return just the first part
    return firstPart;
  }

  // If no colon, look for version in the whole title
  const versionMatch = title.match(/^(.+?\s+v[\d.]+(?:\.\d+)*)/i);
  if (versionMatch) {
    return versionMatch[1].trim();
  }

  return title.trim();
}

/**
 * Extract file size (part before slash)
 */
export function extractFileSize(sizeString: string): string {
  if (!sizeString) return '';

  const match = sizeString.match(/^([\d.]+\s*[GM]B)/i);
  return match ? match[1] : sizeString;
}

/**
 * Parse system requirements from OvaGames format
 */
export function parseSystemRequirements(reqText: string): {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
  directx: string;
  sound_card: string;
} {
  const requirements = {
    os: '',
    processor: '',
    memory: '',
    graphics: '',
    storage: '',
    directx: '',
    sound_card: ''
  };

  if (!reqText) return requirements;

  const lines = reqText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^OS:/i.test(trimmed)) {
      requirements.os = trimmed.replace(/^OS:\s*/i, '').trim();
    } else if (/^Processor:/i.test(trimmed)) {
      requirements.processor = trimmed.replace(/^Processor:\s*/i, '').trim();
    } else if (/^Memory:/i.test(trimmed)) {
      requirements.memory = trimmed.replace(/^Memory:\s*/i, '').trim();
    } else if (/^Graphics:/i.test(trimmed)) {
      requirements.graphics = trimmed.replace(/^Graphics:\s*/i, '').trim();
    } else if (/^Storage:/i.test(trimmed)) {
      requirements.storage = trimmed.replace(/^Storage:\s*/i, '').trim();
    } else if (/^DirectX:/i.test(trimmed)) {
      requirements.directx = trimmed.replace(/^DirectX:\s*/i, '').trim();
    } else if (/^Sound Card:/i.test(trimmed)) {
      requirements.sound_card = trimmed.replace(/^Sound Card:\s*/i, '').trim();
    }
  }

  return requirements;
}

/**
 * Process download links from FitGirl with intelligent size assignment
 * Only the FIRST group of files (game parts) gets 500MB
 * All subsequent groups (selective packs, mods, etc.) get N/A when name changes
 */
export function processDownloadLinks(
  links: Record<string, Array<{ filename: string; url: string }>>,
  provider: string
): Array<{ name: string; url: string; size: string }> {
  const processed: Array<{ name: string; url: string; size: string }> = [];
  let isFirstGroup = true;

  for (const [gameName, fileLinks] of Object.entries(links)) {
    for (const file of fileLinks) {
      processed.push({
        name: file.filename,
        url: file.url,
        // Only the first group gets 500MB, all others get N/A
        size: isFirstGroup ? '500 MB' : 'N/A'
      });
    }
    // After processing the first group, set flag to false
    isFirstGroup = false;
  }

  return processed;
}

/**
 * Reverse array for bottom-to-top screenshot processing
 */
export function reverseScreenshots(screenshots: string[]): string[] {
  return [...screenshots].reverse();
}

/**
 * Merge data from all three sources with intelligent defaults
 */
export interface MergePreferences {
  title?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  developer?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  fileSize?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  rating?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  shortDescription?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  longDescription?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  screenshots?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  genres?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  languages?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  systemRequirements?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  downloadLinks?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  originalSize?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
  repackSize?: 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';
}

/**
 * Merge data from all three sources with intelligent defaults and user preferences
 */
export function mergeGameData(data: ScrapedGameData, prefs?: MergePreferences): MergedGameData {
  const { ovagames, fitgirl, elamigos, imdb } = data;

  // Helper to get title based on preference
  const getTitle = () => {
    if (prefs?.title === 'ovagames' && ovagames?.title) return ovagames.title;
    if (prefs?.title === 'fitgirl' && fitgirl?.title) return cleanFitGirlTitle(fitgirl.title);
    if (prefs?.title === 'elamigos' && elamigos?.title) return elamigos.title;
    if (prefs?.title === 'imdb' && imdb?.title) return imdb.title;
    // Default priority
    return fitgirl?.title ? cleanFitGirlTitle(fitgirl.title) : elamigos?.title || imdb?.title || ovagames?.title || '';
  };

  // Helper to get developer
  const getDeveloper = () => {
    if (prefs?.developer === 'ovagames' && ovagames?.developer) return ovagames.developer;
    if (prefs?.developer === 'fitgirl' && fitgirl?.companies) return fitgirl.companies;
    if (prefs?.developer === 'elamigos' && elamigos?.developer) return elamigos.developer;
    if (prefs?.developer === 'imdb' && imdb?.developer) return imdb.developer;
    // Default priority
    return imdb?.developer || ovagames?.developer || fitgirl?.companies || elamigos?.developer || '';
  };

  // Helper to get file size
  const getFileSize = () => {
    if (prefs?.fileSize === 'ovagames' && ovagames?.file_size) return extractFileSize(ovagames.file_size);
    if (prefs?.fileSize === 'fitgirl' && fitgirl?.repack_size) return fitgirl.repack_size;
    if (prefs?.fileSize === 'elamigos' && elamigos?.repack_size) return elamigos.repack_size;
    // Default priority
    return ovagames?.file_size ? extractFileSize(ovagames.file_size) : fitgirl?.repack_size || elamigos?.repack_size || '';
  };

  // Helper to get rating
  const getRating = () => {
    if (prefs?.rating === 'ovagames' && ovagames?.rating) return ovagames.rating;
    if (prefs?.rating === 'imdb' && imdb?.rating) return imdb.rating;
    // Default priority
    return imdb?.rating || ovagames?.rating || '';
  };

  // Helper to get short description
  const getShortDescription = () => {
    if (prefs?.shortDescription === 'ovagames' && ovagames?.short_description) return ovagames.short_description;
    if (prefs?.shortDescription === 'imdb' && imdb?.short_description) return imdb.short_description;
    // Default priority (ElAmigos doesn't have short description)
    return imdb?.short_description || ovagames?.short_description || '';
  };

  // Helper to get long description
  const getLongDescription = () => {
    if (prefs?.longDescription === 'ovagames' && ovagames?.long_description) return ovagames.long_description;
    if (prefs?.longDescription === 'elamigos' && elamigos?.description) return elamigos.description;
    if (prefs?.longDescription === 'imdb' && imdb?.long_description) return imdb.long_description;
    // Default priority
    return ovagames?.long_description || elamigos?.description || imdb?.long_description || '';
  };

  // Helper to get screenshots
  const getScreenshots = () => {
    if (prefs?.screenshots === 'ovagames' && ovagames?.screenshots) return ovagames.screenshots;
    if (prefs?.screenshots === 'fitgirl' && fitgirl?.screenshots) return reverseScreenshots(fitgirl.screenshots);
    if (prefs?.screenshots === 'elamigos' && elamigos?.screenshots) return elamigos.screenshots;
    if (prefs?.screenshots === 'imdb' && imdb?.screenshots) return reverseScreenshots(imdb.screenshots);

    // Default priority
    return fitgirl?.screenshots?.length
      ? reverseScreenshots(fitgirl.screenshots)
      : elamigos?.screenshots?.length
        ? elamigos.screenshots
        : imdb?.screenshots?.length
          ? reverseScreenshots(imdb.screenshots)
          : ovagames?.screenshots || [];
  };

  // Helper to get genres
  const getGenres = () => {
    if (prefs?.genres === 'ovagames' && ovagames?.category) return [ovagames.category];
    if (prefs?.genres === 'fitgirl' && fitgirl?.genres) return fitgirl.genres;
    if (prefs?.genres === 'imdb' && imdb?.category) return imdb.category;
    // Default priority
    // Combine FitGirl genres and OvaGames category if available, or fallback
    const genres = fitgirl?.genres || [];
    if (ovagames?.category && !genres.includes(ovagames.category)) {
      genres.push(ovagames.category);
    }
    return genres.length > 0 ? genres : imdb?.category || [];
  };

  // Helper to get languages
  const getLanguages = () => {
    if (prefs?.languages === 'fitgirl' && fitgirl?.languages) return fitgirl.languages;
    if (prefs?.languages === 'elamigos' && elamigos?.languages) return elamigos.languages;
    // Default priority
    return fitgirl?.languages || elamigos?.languages || '';
  };

  // Helper to get system requirements
  const getSystemRequirements = () => {
    if (prefs?.systemRequirements === 'ovagames' && ovagames?.system_requirements) {
      return parseSystemRequirements(ovagames.system_requirements);
    }
    if (prefs?.systemRequirements === 'elamigos' && elamigos?.system_requirements) {
      return elamigos.system_requirements;
    }
    // Default priority (OvaGames is best, then ElAmigos)
    return ovagames?.system_requirements
      ? parseSystemRequirements(ovagames.system_requirements)
      : elamigos?.system_requirements || { os: '', processor: '', memory: '', graphics: '', storage: '', directx: '', sound_card: '' };
  };

  // Helper to get download links with multiple providers
  const getDownloadLinks = () => {
    const cloudProviders: Array<{
      cloudName: string;
      links: Array<{ name: string; url: string; size: string }>;
    }> = [];

    if (fitgirl?.download_links) {
      // Add DataNodes if available
      if (fitgirl.download_links.data_nodes && Object.keys(fitgirl.download_links.data_nodes).length > 0) {
        cloudProviders.push({
          cloudName: 'Data Nodes',
          links: processDownloadLinks(fitgirl.download_links.data_nodes, 'data_nodes')
        });
      }

      // Add FuckingFast if available
      if (fitgirl.download_links.fucking_fast && Object.keys(fitgirl.download_links.fucking_fast).length > 0) {
        cloudProviders.push({
          cloudName: 'Fucking Fast',
          links: processDownloadLinks(fitgirl.download_links.fucking_fast, 'fucking_fast')
        });
      }
    }

    return cloudProviders;
  };

  // Helper to get original size
  const getOriginalSize = () => {
    if (prefs?.originalSize === 'fitgirl' && fitgirl?.original_size) return fitgirl.original_size;
    // Default priority
    return fitgirl?.original_size || '';
  };

  // Helper to get repack size
  const getRepackSize = () => {
    if (prefs?.repackSize === 'fitgirl' && fitgirl?.repack_size) return fitgirl.repack_size;
    if (prefs?.repackSize === 'elamigos' && elamigos?.repack_size) return elamigos.repack_size;
    // Default priority
    return fitgirl?.repack_size || elamigos?.repack_size || '';
  };

  return {
    title: getTitle(),
    developer: getDeveloper(),
    fileSize: getFileSize(),
    rating: getRating(),
    profileImage: imdb?.profile_pic_url || fitgirl?.screenshots?.[0] || elamigos?.screenshots?.[0] || ovagames?.profile_pic || '',
    shortDescription: getShortDescription(),
    longDescription: getLongDescription(),
    screenshots: getScreenshots(),
    systemRequirements: getSystemRequirements(),
    downloadLinks: getDownloadLinks(),
    genres: getGenres(),
    languages: getLanguages(),
    originalSize: getOriginalSize(),
    repackSize: getRepackSize()
  };
}

