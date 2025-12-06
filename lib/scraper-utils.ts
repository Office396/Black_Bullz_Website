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
  languages: string;
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
    } else if (/^Sound:/i.test(trimmed)) {
      requirements.sound_card = trimmed.replace(/^Sound:\s*/i, '').trim();
    } else if (/^Hard Drive:/i.test(trimmed)) {
      requirements.storage = trimmed.replace(/^Hard Drive:\s*/i, '').trim();
    } else if (/^Other Requirements:/i.test(trimmed)) {
      const otherReq = trimmed.replace(/^Other Requirements:\s*/i, '').trim();
      // Check if it's network related
      if (otherReq.toLowerCase().includes('internet') || otherReq.toLowerCase().includes('broadband')) {
        requirements.network = otherReq;
      }
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
// Default preferences as requested by user
const DEFAULT_PREFERENCES: MergePreferences = {
  title: 'fitgirl',
  developer: 'ovagames',
  fileSize: 'ovagames',
  longDescription: 'ovagames',
  shortDescription: 'imdb',
  screenshots: 'fitgirl',
  genres: 'fitgirl',
  languages: 'fitgirl',
  systemRequirements: 'ovagames',
  downloadLinks: 'fitgirl',
  rating: 'imdb',
  originalSize: 'fitgirl'
};

export function mergeGameData(data: ScrapedGameData, prefs?: MergePreferences): MergedGameData {
  const { ovagames, fitgirl, elamigos, imdb } = data;

  // Use provided preferences or defaults
  const effectivePrefs = { ...DEFAULT_PREFERENCES, ...prefs };

  // Helper to get title with automatic fallback
  const getTitle = () => {
    const preferredSources = ['fitgirl', 'elamigos', 'imdb', 'ovagames'];
    for (const source of preferredSources) {
      if (effectivePrefs.title === source) {
        const value = source === 'fitgirl' ? (fitgirl?.title ? cleanFitGirlTitle(fitgirl.title) : undefined) :
                    source === 'elamigos' ? elamigos?.title :
                    source === 'imdb' ? imdb?.title :
                    ovagames?.title;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (fitgirl?.title) return cleanFitGirlTitle(fitgirl.title);
    if (elamigos?.title) return elamigos.title;
    if (imdb?.title) return imdb.title;
    if (ovagames?.title) return ovagames.title;
    return '';
  };

  // Helper to get developer with automatic fallback
  const getDeveloper = () => {
    const preferredSources = ['ovagames', 'fitgirl', 'elamigos', 'imdb'];
    for (const source of preferredSources) {
      if (effectivePrefs.developer === source) {
        const value = source === 'ovagames' ? ovagames?.developer :
                    source === 'fitgirl' ? fitgirl?.companies :
                    source === 'elamigos' ? elamigos?.developer :
                    imdb?.developer;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (ovagames?.developer) return ovagames.developer;
    if (fitgirl?.companies) return fitgirl.companies;
    if (elamigos?.developer) return elamigos.developer;
    if (imdb?.developer) return imdb.developer;
    return '';
  };

  // Helper to get file size with automatic fallback
  const getFileSize = () => {
    const preferredSources = ['ovagames', 'fitgirl', 'elamigos'];
    for (const source of preferredSources) {
      if (effectivePrefs.fileSize === source) {
        const value = source === 'ovagames' ? (ovagames?.file_size ? extractFileSize(ovagames.file_size) : null) :
                    source === 'fitgirl' ? fitgirl?.repack_size :
                    elamigos?.repack_size;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (ovagames?.file_size) return extractFileSize(ovagames.file_size);
    if (fitgirl?.repack_size) return fitgirl.repack_size;
    if (elamigos?.repack_size) return elamigos.repack_size;
    return '';
  };

  // Helper to get rating
  const getRating = () => {
    if (prefs?.rating === 'ovagames' && ovagames?.rating) return ovagames.rating;
    if (prefs?.rating === 'imdb' && imdb?.rating) return imdb.rating;
    // Default priority
    return imdb?.rating || ovagames?.rating || '';
  };

  // Helper to get short description with automatic fallback
  const getShortDescription = () => {
    const preferredSources = ['imdb', 'ovagames'];
    for (const source of preferredSources) {
      if (effectivePrefs.shortDescription === source) {
        const value = source === 'imdb' ? imdb?.short_description :
                    ovagames?.short_description;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (imdb?.short_description) return imdb.short_description;
    if (ovagames?.short_description) return ovagames.short_description;
    return '';
  };

  // Helper to get long description with automatic fallback
  const getLongDescription = () => {
    const preferredSources = ['ovagames', 'elamigos', 'imdb'];
    for (const source of preferredSources) {
      if (effectivePrefs.longDescription === source) {
        const value = source === 'ovagames' ? ovagames?.long_description :
                    source === 'elamigos' ? elamigos?.description :
                    imdb?.long_description;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (ovagames?.long_description) return ovagames.long_description;
    if (elamigos?.description) return elamigos.description;
    if (imdb?.long_description) return imdb.long_description;
    return '';
  };

  // Helper to get screenshots with automatic fallback
  const getScreenshots = () => {
    const preferredSources = ['fitgirl', 'ovagames', 'elamigos', 'imdb'];
    for (const source of preferredSources) {
      if (effectivePrefs.screenshots === source) {
        const value = source === 'fitgirl' ? (fitgirl?.screenshots ? reverseScreenshots(fitgirl.screenshots) : null) :
                    source === 'ovagames' ? ovagames?.screenshots :
                    source === 'elamigos' ? elamigos?.screenshots :
                    (imdb?.screenshots ? reverseScreenshots(imdb.screenshots) : null);
        if (value && value.length > 0) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (fitgirl?.screenshots?.length) return reverseScreenshots(fitgirl.screenshots);
    if (ovagames?.screenshots?.length) return ovagames.screenshots;
    if (elamigos?.screenshots?.length) return elamigos.screenshots;
    if (imdb?.screenshots?.length) return reverseScreenshots(imdb.screenshots);
    return [];
  };

  // Helper to get genres with automatic fallback
  const getGenres = () => {
    const preferredSources = ['fitgirl', 'ovagames', 'imdb'];
    for (const source of preferredSources) {
      if (effectivePrefs.genres === source) {
        const value = source === 'fitgirl' ? fitgirl?.genres :
                    source === 'ovagames' ? (ovagames?.category ? [ovagames.category] : null) :
                    (imdb?.category ? imdb.category : null);
        if (value && value.length > 0) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (fitgirl?.genres?.length) return fitgirl.genres;
    if (ovagames?.category) return [ovagames.category];
    if (imdb?.category?.length) return imdb.category;
    return [];
  };

  // Helper to get languages with automatic fallback
  const getLanguages = () => {
    const preferredSources = ['fitgirl', 'elamigos', 'ovagames'];
    for (const source of preferredSources) {
      if (effectivePrefs.languages === source) {
        const value = source === 'fitgirl' ? fitgirl?.languages :
                    source === 'elamigos' ? elamigos?.languages :
                    ovagames?.languages;
        if (value) return value;
      }
    }
    // Auto-fallback: try all sources in priority order
    if (fitgirl?.languages) return fitgirl.languages;
    if (elamigos?.languages) return elamigos.languages;
    if (ovagames?.languages) return ovagames.languages;
    return '';
  };

  // Helper to get system requirements with automatic fallback (OvaGames preferred, ElAmigos fallback)
  const getSystemRequirements = () => {
    console.log('[Merge] System requirements - OvaGames:', ovagames?.system_requirements?.substring(0, 100));
    console.log('[Merge] System requirements - ElAmigos:', elamigos?.system_requirements);

    const preferredSources = ['ovagames', 'elamigos'];
    for (const source of preferredSources) {
      if (effectivePrefs.systemRequirements === source) {
        const value = source === 'ovagames' ? (ovagames?.system_requirements ? parseSystemRequirements(ovagames.system_requirements) : null) :
                    elamigos?.system_requirements;
        console.log(`[Merge] Preferred source ${source}:`, value);
        if (value && (value.os || value.processor || value.memory || value.graphics || value.storage)) {
          console.log(`[Merge] Returning ${source} system requirements`);
          return value;
        }
      }
    }
    // Auto-fallback: try all sources in priority order (OvaGames first, then ElAmigos)
    if (ovagames?.system_requirements) {
      const parsed = parseSystemRequirements(ovagames.system_requirements);
      console.log('[Merge] OvaGames fallback parsed:', parsed);
      return parsed;
    }
    if (elamigos?.system_requirements) {
      console.log('[Merge] ElAmigos fallback:', elamigos.system_requirements);
      return elamigos.system_requirements;
    }
    console.log('[Merge] No system requirements found');
    return { os: '', processor: '', memory: '', graphics: '', storage: '', directx: '', sound_card: '' };
  };

  // Helper to get download links with multiple providers
  const getDownloadLinks = () => {
    console.log('[Merge] Download links - FitGirl available:', !!fitgirl?.download_links);
    if (fitgirl?.download_links) {
      console.log('[Merge] Download links - FitGirl keys:', Object.keys(fitgirl.download_links));
    }

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

