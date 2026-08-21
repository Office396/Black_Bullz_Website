// ============================================================
// VERSION NORMALIZER
// Converts all version strings to a comparable semantic format
// Handles: v1.0, v1.0.0, 1.0, V2.1, build_20240115, etc.
// ============================================================

// ============================================================
// TYPES
// ============================================================

interface NormalizedVersion {
  major: number
  minor: number
  patch: number
  build: number
  preRelease: string
  raw: string
  comparable: string // "1.0.0" format for sorting
}

interface VersionRange {
  min: NormalizedVersion
  max: NormalizedVersion
}

// ============================================================
// VERSION NORMALIZATION
// ============================================================

// Patterns for extracting version from various formats
const VERSION_PATTERNS = [
  // Semantic: v1.2.3, V1.2.3, version 1.2.3
  /[vV](\d+)\.(\d+)\.(\d+)/,
  // Major.Minor: v1.2, V1.2
  /[vV](\d+)\.(\d+)/,
  // Build number: build_20240115, build-20240115, b20240115
  /[bB]uild[-_]?(\d{8,})/,
  // Date version: 2024.01.15, 20240115
  /(\d{4})\.(\d{2})\.(\d{2})/,
  // Steam build IDs: 12345678
  /\b(\d{6,})\b/,
  // Simple: 1.0, 2.1
  /\b(\d+)\.(\d+)\b/,
]

// Pre-release identifiers
const PRE_RELEASE_PATTERNS = [
  { pattern: /alpha/i, label: 'alpha' },
  { pattern: /beta/i, label: 'beta' },
  { pattern: /rc\d*/i, label: 'rc' },
  { pattern: /dev/i, label: 'dev' },
  { pattern: /hotfix/i, label: 'hotfix' },
  { pattern: /patch/i, label: 'patch' },
]

export function normalizeVersion(rawVersion: string): NormalizedVersion {
  if (!rawVersion) {
    return { major: 0, minor: 0, patch: 0, build: 0, preRelease: '', raw: '', comparable: '0.0.0' }
  }

  const cleaned = rawVersion.trim()
  let major = 0, minor = 0, patch = 0, build = 0, preRelease = ''

  // Try semantic version patterns first
  for (const pattern of VERSION_PATTERNS) {
    const match = cleaned.match(pattern)
    if (match) {
      if (match.length >= 4) {
        // Three capture groups (e.g., v1.2.3 or 2024.01.15)
        major = parseInt(match[1]) || 0
        minor = parseInt(match[2]) || 0
        patch = parseInt(match[3]) || 0
      } else if (match.length >= 3) {
        // Two capture groups (e.g., v1.2)
        major = parseInt(match[1]) || 0
        minor = parseInt(match[2]) || 0
      } else if (match.length >= 2) {
        // One capture group (e.g., build_20240115 or 12345678)
        const num = parseInt(match[1]) || 0
        if (num > 999999) {
          // Likely a build number or date
          major = Math.floor(num / 10000)
          minor = Math.floor((num % 10000) / 100)
          patch = num % 100
        } else {
          major = num
        }
      }
      break
    }
  }

  // Extract pre-release
  for (const pr of PRE_RELEASE_PATTERNS) {
    if (pr.pattern.test(cleaned)) {
      preRelease = pr.label
      break
    }
  }

  // Handle date-based versions (YYYY.MM.DD)
  const dateMatch = cleaned.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (dateMatch) {
    major = parseInt(dateMatch[1]) || 0
    minor = parseInt(dateMatch[2]) || 0
    patch = parseInt(dateMatch[3]) || 0
  }

  const comparable = preRelease
    ? `${major}.${minor}.${patch}-${preRelease}`
    : `${major}.${minor}.${patch}`

  return { major, minor, patch, build, preRelease, raw: cleaned, comparable }
}

// ============================================================
// VERSION COMPARISON
// ============================================================

export function compareVersions(a: string, b: string): number {
  const va = normalizeVersion(a)
  const vb = normalizeVersion(b)

  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  if (va.patch !== vb.patch) return va.patch - vb.patch

  // Pre-release versions are lower than release
  if (va.preRelease && !vb.preRelease) return -1
  if (!va.preRelease && vb.preRelease) return 1
  if (va.preRelease && vb.preRelease) {
    const order = ['alpha', 'beta', 'rc', 'dev', 'hotfix', 'patch']
    const ai = order.indexOf(va.preRelease)
    const bi = order.indexOf(vb.preRelease)
    return ai - bi
  }

  return 0
}

export function isNewerVersion(a: string, b: string): boolean {
  return compareVersions(a, b) > 0
}

export function isSameVersion(a: string, b: string): boolean {
  return compareVersions(a, b) === 0
}

// ============================================================
// VERSION GROUPING
// Groups multiple version strings into semantic clusters
// e.g., ["v1.0", "v1.0.0", "1.0.0"] → all map to "1.0.0"
// ============================================================

export function groupVersions(versions: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()

  for (const v of versions) {
    const normalized = normalizeVersion(v)
    const key = normalized.comparable

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(v)
  }

  return groups
}

// ============================================================
// FIND LATEST VERSION
// ============================================================

export function findLatestVersion(versions: string[]): string {
  if (versions.length === 0) return ''

  let latest = versions[0]
  for (let i = 1; i < versions.length; i++) {
    if (isNewerVersion(versions[i], latest)) {
      latest = versions[i]
    }
  }
  return latest
}

// ============================================================
// EXTRACT VERSION FROM TITLE
// ============================================================

export function extractVersionFromTitle(title: string): {
  cleanTitle: string
  version: string
} {
  // Common patterns in release titles
  const patterns = [
    // "Game v1.2.3 Something" → title: "Game Something", version: "v1.2.3"
    /^(.+?)[\s._-]+[vV](\d+(?:\.\d+)+)[\s\S]*$/,
    // "Game.V1.2.3-Group" → title: "Game", version: "V1.2.3"
    /^(.+?)[\.\s][vV](\d+(?:\.\d+)+)[\s\S]*$/,
    // "Game (v1.2.3)" → title: "Game", version: "v1.2.3"
    /^(.+?)\s*\([vV]?(\d+(?:\.\d+)+)\)[\s\S]*$/,
    // "Game_1.0.0" → title: "Game", version: "1.0.0"
    /^(.+?)[_\.](\d+(?:\.\d+)+)[\s\S]*$/,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const cleanTitle = match[1]
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const version = `v${match[2].replace(/^v/i, '')}`
      return { cleanTitle, version }
    }
  }

  return { cleanTitle: title.trim(), version: '' }
}

// ============================================================
// NORMALIZE GAME TITLE
// Removes version info, normalizes separators, cleans up
// ============================================================

export function normalizeGameTitle(title: string): string {
  let clean = title

  // Remove version info
  const { cleanTitle } = extractVersionFromTitle(clean)
  clean = cleanTitle

  // Replace dots and underscores with spaces
  clean = clean.replace(/[._]/g, ' ')

  // Remove common suffixes
  clean = clean
    .replace(/\s*[-–]\s*(repack|fitgirl|dodi|elamigos|ovagames|cpy|codex|plaza|kaos|ali213|empress)\s*/gi, '')
    .replace(/\s*\[.*?\]\s*/g, '') // Remove bracketed content
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthesized content (if version-related)

  // Clean up whitespace
  clean = clean.replace(/\s+/g, ' ').trim()

  // Remove trailing hyphens/dashes
  clean = clean.replace(/[-–]+$/, '').trim()

  return clean
}

// ============================================================
// GENERATE SEO SLUG
// Creates long-tail URL from title + version + repacker
// ============================================================

export function generateSeoSlug(title: string, version?: string, repacker?: string): string {
  let slug = normalizeGameTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Convert to kebab-case
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Trim hyphens

  // Add version for long-tail SEO
  if (version) {
    const cleanVersion = version.replace(/^v/i, '').replace(/\./g, '-')
    slug += `-v${cleanVersion}`
  }

  // Add repacker for uniqueness
  if (repacker) {
    slug += `-${repacker.toLowerCase().replace(/\s+/g, '-')}`
  }

  return slug
}

// ============================================================
// BATCH NORMALIZE
// Normalizes a list of games with their versions
// ============================================================

export interface NormalizedGame {
  title: string
  normalizedTitle: string
  version: string
  normalizedVersion: NormalizedVersion
  repacker: string
  slug: string
}

export function batchNormalize(games: Array<{
  title: string
  version?: string
  repacker?: string
}>): NormalizedGame[] {
  return games.map(g => {
    const { cleanTitle, version: extractedVersion } = extractVersionFromTitle(g.title)
    const version = g.version || extractedVersion
    const normalizedVersion = normalizeVersion(version)
    const normalizedTitle = normalizeGameTitle(g.title)
    const slug = generateSeoSlug(g.title, version, g.repacker)

    return {
      title: g.title,
      normalizedTitle,
      version,
      normalizedVersion,
      repacker: g.repacker || 'unknown',
      slug,
    }
  })
}
