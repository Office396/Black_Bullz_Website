// ============================================================
// NFO PARSER - Extracts branding and metadata from .NFO files
// Auto-assigns Repacker ID from NFO content
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface NFOData {
  repackerName: string
  repackerSlug: string
  gameTitle: string
  version: string
  releaseDate: string
  developer: string
  publisher: string
  genres: string[]
  languages: string[]
  originalSize: string
  repackSize: string
  systemRequirements: string
  description: string
  sceneGroup: string
  notes: string
  rawContent: string
}

// ============================================================
// REPACKER SIGNATURES
// ============================================================

const REPACKER_SIGNATURES: Record<string, { patterns: RegExp[]; slug: string; color: string }> = {
  'FitGirl': {
    patterns: [
      /fitgirl[\s-]?repacks?/i,
      /fitgirl-repacks\.site/i,
      /\[FitGirl\]/i,
      /repacked\s+by\s+fitgirl/i,
    ],
    slug: 'fitgirl',
    color: '#ff6b6b',
  },
  'DODI': {
    patterns: [
      /dodi[\s-]?repacks?/i,
      /dodi-repacks\.site/i,
      /\[DODI\]/i,
      /repacked\s+by\s+dodi/i,
    ],
    slug: 'dodi',
    color: '#4ecdc4',
  },
  'ElAmigos': {
    patterns: [
      /elamigos/i,
      /el[\s-]?amigos/i,
      /\[ElAmigos\]/i,
      /repacked\s+by\s+elamigos/i,
    ],
    slug: 'elamigos',
    color: '#45b7d1',
  },
  'Ova Games': {
    patterns: [
      /ovagames/i,
      /ova[\s-]?games/i,
      /\[OvaGames\]/i,
      /repacked\s+by\s+ova/i,
    ],
    slug: 'ovagames',
    color: '#96ceb4',
  },
  'KaOs': {
    patterns: [
      /kaos[\s-]?krew/i,
      /kaos[\s-]?repacks?/i,
      /\[KaOs\]/i,
      /repacked\s+by\s+kaos/i,
    ],
    slug: 'kaos',
    color: '#ffeaa7',
  },
  'CPY': {
    patterns: [
      /\bcpy\b/i,
      /cpy[\s-]?repacks?/i,
      /\[CPY\]/i,
      /cracked\s+by\s+cpy/i,
    ],
    slug: 'cpy',
    color: '#dda0dd',
  },
  'PLAZA': {
    patterns: [
      /\bplaza\b/i,
      /plaza[\s-]?repacks?/i,
      /\[PLAZA\]/i,
      /repacked\s+by\s+plaza/i,
    ],
    slug: 'plaza',
    color: '#98d8c8',
  },
  'CODEX': {
    patterns: [
      /\bcodex\b/i,
      /codex[\s-]?repacks?/i,
      /\[CODEX\]/i,
      /cracked\s+by\s+codex/i,
    ],
    slug: 'codex',
    color: '#f7dc6f',
  },
  'EMPRESS': {
    patterns: [
      /\bempress\b/i,
      /empress[\s-]?repacks?/i,
      /\[EMPRESS\]/i,
      /cracked\s+by\s+empress/i,
    ],
    slug: 'empress',
    color: '#f8c291',
  },
}

// ============================================================
// NFO PARSING
// ============================================================

export function parseNFO(nfoContent: string): NFOData {
  const data: NFOData = {
    repackerName: '',
    repackerSlug: '',
    gameTitle: '',
    version: '',
    releaseDate: '',
    developer: '',
    publisher: '',
    genres: [],
    languages: [],
    originalSize: '',
    repackSize: '',
    systemRequirements: '',
    description: '',
    sceneGroup: '',
    notes: '',
    rawContent: nfoContent,
  }

  // Detect repacker
  const repacker = detectRepacker(nfoContent)
  data.repackerName = repacker.name
  data.repackerSlug = repacker.slug

  // Extract game title
  data.gameTitle = extractTitle(nfoContent)

  // Extract version
  data.version = extractVersion(nfoContent)

  // Extract release date
  data.releaseDate = extractReleaseDate(nfoContent)

  // Extract developer/publisher
  const devPub = extractDeveloperPublisher(nfoContent)
  data.developer = devPub.developer
  data.publisher = devPub.publisher

  // Extract genres
  data.genres = extractGenres(nfoContent)

  // Extract languages
  data.languages = extractLanguages(nfoContent)

  // Extract sizes
  const sizes = extractSizes(nfoContent)
  data.originalSize = sizes.original
  data.repackSize = sizes.repack

  // Extract system requirements
  data.systemRequirements = extractSystemRequirements(nfoContent)

  // Extract description
  data.description = extractDescription(nfoContent)

  // Extract scene group
  data.sceneGroup = extractSceneGroup(nfoContent)

  // Extract notes
  data.notes = extractNotes(nfoContent)

  return data
}

// ============================================================
// DETECTION FUNCTIONS
// ============================================================

function detectRepacker(content: string): { name: string; slug: string } {
  for (const [name, config] of Object.entries(REPACKER_SIGNATURES)) {
    for (const pattern of config.patterns) {
      if (pattern.test(content)) {
        return { name, slug: config.slug }
      }
    }
  }
  return { name: 'Unknown', slug: 'unknown' }
}

function extractTitle(content: string): string {
  // Common title patterns in NFOs
  const patterns = [
    /^.*?(?:game\s*title|title)[:\s]*(.+?)$/im,
    /^.*?(?:release\s*name)[:\s]*(.+?)$/im,
    /^.{0,50}?([A-Z][A-Za-z0-9\s:]+(?:II|III|IV|V|VI|VII|VIII|IX|X)?)\s*(?:v\d|REPACK|CRACKED)/im,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
  }

  // Fallback: first non-empty line that looks like a title
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 5 && trimmed.length < 100 && /^[A-Z]/.test(trimmed)) {
      return trimmed
    }
  }

  return ''
}

function extractVersion(content: string): string {
  const patterns = [
    /version[:\s]*([\d.]+)/i,
    /\bv([\d.]+)\b/i,
    /build[:\s]*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) return match[1]
  }
  return ''
}

function extractReleaseDate(content: string): string {
  const patterns = [
    /release\s*date[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /date[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /(\d{4}[-/]\d{2}[-/]\d{2})/,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) return match[1]
  }
  return ''
}

function extractDeveloperPublisher(content: string): { developer: string; publisher: string } {
  let developer = ''
  let publisher = ''

  const devMatch = content.match(/developer[:\s]*(.+?)$/im)
  if (devMatch) developer = devMatch[1].trim()

  const pubMatch = content.match(/publisher[:\s]*(.+?)$/im)
  if (pubMatch) publisher = pubMatch[1].trim()

  // Also try "by" pattern
  if (!developer) {
    const byMatch = content.match(/(?:developed|created)\s+by[:\s]*(.+?)$/im)
    if (byMatch) developer = byMatch[1].trim()
  }

  return { developer, publisher }
}

function extractGenres(content: string): string[] {
  const patterns = [
    /genre[s]?[:\s]*(.+?)$/im,
    /tags?[:\s]*(.+?)$/im,
    /category[:\s]*(.+?)$/im,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1]
        .split(/[,;|]/)
        .map(g => g.trim())
        .filter(g => g.length > 0)
    }
  }

  return []
}

function extractLanguages(content: string): string[] {
  const patterns = [
    /language[s]?[:\s]*(.+?)$/im,
    /lang[:\s]*(.+?)$/im,
    /(?:english|french|german|spanish|italian|japanese|chinese|korean|portuguese|russian|polish|dutch|swedish|danish|norwegian|finish)/gi,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      const text = match[0]
      const langs = text.match(/(?:english|french|german|spanish|italian|japanese|chinese|korean|portuguese|russian|polish|dutch|swedish|danish|norwegian|finish)/gi)
      if (langs) return [...new Set(langs.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()))]
    }
  }

  return ['English']
}

function extractSizes(content: string): { original: string; repack: string } {
  let original = ''
  let repack = ''

  const origMatch = content.match(/original\s*size[:\s]*([\d.]+\s*(?:gb|mb|tb))/i)
  if (origMatch) original = origMatch[1]

  const repackMatch = content.match(/repack\s*size[:\s]*([\d.]+\s*(?:gb|mb|tb))/i)
  if (repackMatch) repack = repackMatch[1]

  // Also try "size" pattern
  if (!repack) {
    const sizeMatch = content.match(/size[:\s]*([\d.]+\s*(?:gb|mb|tb))/i)
    if (sizeMatch) repack = sizeMatch[1]
  }

  return { original, repack }
}

function extractSystemRequirements(content: string): string {
  const patterns = [
    /system\s*requirements[:\s]*([\s\S]*?)(?:(?:installation|setup|install|description|notes)|$)/i,
    /minimum\s*requirements[:\s]*([\s\S]*?)(?:(?:recommended|installation|setup)|$)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .slice(0, 10)
        .join('\n')
    }
  }

  return ''
}

function extractDescription(content: string): string {
  const patterns = [
    /description[:\s]*([\s\S]*?)(?:(?:system|requirements|installation|setup|install|notes|features)|$)/i,
    /about\s*this\s*game[:\s]*([\s\S]*?)(?:(?:system|requirements|installation|setup)|$)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .slice(0, 5)
        .join(' ')
    }
  }

  return ''
}

function extractSceneGroup(content: string): string {
  const patterns = [
    /\[([A-Z0-9]+)\]/g,
    /scene\s*group[:\s]*(.+?)$/im,
    /group[:\s]*(.+?)$/im,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) return match[1] || match[0]
  }

  return ''
}

function extractNotes(content: string): string {
  const patterns = [
    /notes?[:\s]*([\s\S]*?)(?:(?:system|requirements|installation|setup|install|features)|$)/i,
    /installation[:\s]*([\s\S]*?)(?:(?:system|requirements|notes|features)|$)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .slice(0, 5)
        .join('\n')
    }
  }

  return ''
}

// ============================================================
// AUTO-ASSIGN REPACKER TO GAME
// ============================================================

export async function autoAssignRepacker(gameId: number, nfoContent: string): Promise<{
  repackerName: string
  repackerSlug: string
  assigned: boolean
}> {
  const nfoData = parseNFO(nfoContent)

  if (!nfoData.repackerSlug || nfoData.repackerSlug === 'unknown') {
    return { repackerName: '', repackerSlug: '', assigned: false }
  }

  // Check if repacker exists in DB
  const { data: repacker } = await supabase
    .from('repackers')
    .select('id, name, slug')
    .eq('slug', nfoData.repackerSlug)
    .single()

  if (!repacker) {
    // Create new repacker profile
    const { data: newRepacker } = await supabase
      .from('repackers')
      .insert({
        name: nfoData.repackerName,
        slug: nfoData.repackerSlug,
        active: true,
        priority: 30,
      })
      .select()
      .single()

    if (newRepacker) {
      // Update game with repacker
      await supabase
        .from('games')
        .update({
          repacker_name: newRepacker.name,
          repacker_url: '',
        })
        .eq('id', gameId)

      return {
        repackerName: newRepacker.name,
        repackerSlug: newRepacker.slug,
        assigned: true,
      }
    }
  } else {
    // Update game with existing repacker
    await supabase
      .from('games')
      .update({
        repacker_name: repacker.name,
        repacker_url: '',
      })
      .eq('id', gameId)

    return {
      repackerName: repacker.name,
      repackerSlug: repacker.slug,
      assigned: true,
    }
  }

  return { repackerName: nfoData.repackerName, repackerSlug: nfoData.repackerSlug, assigned: false }
}
