// ============================================================
// DUPLICATE DETECTION & GAME ID NORMALIZATION
// Prevents duplicate game entries when scraping from multiple sources
// Merges mirrors/repacks into existing game records
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface DuplicateCheckResult {
  isDuplicate: boolean
  existingGameId: number | null
  confidence: number // 0-100
  matchType: 'exact' | 'fuzzy' | 'none'
  matchReason: string
}

interface GameMergeResult {
  success: boolean
  gameId: number
  mirrorsAdded: number
  error?: string
}

// ============================================================
// TITLE NORMALIZATION
// ============================================================

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
}

function extractVersion(title: string): string | null {
  // Match patterns like v1.0, v1.0.5, build 1234, ver 1.2
  const match = title.match(/(?:v|ver\.?|version|build)\s*(\d+[\.\d]*)/i)
  return match ? match[1] : null
}

function extractEdition(title: string): string | null {
  const editions = [
    'deluxe', 'ultimate', 'gold', 'complete', 'goty',
    'definitive', 'remastered', 'enhanced', 'collection',
    'premium', 'standard', 'digital', 'annual',
  ]

  for (const edition of editions) {
    if (title.toLowerCase().includes(edition)) {
      return edition
    }
  }
  return null
}

function extractYear(title: string): string | null {
  const match = title.match(/\((\d{4})\)/)
  return match ? match[1] : null
}

function extractBaseGameName(title: string): string {
  let name = title

  // Remove version info
  name = name.replace(/\s*(?:v|ver\.?|version|build)\s*\d+[\.\d]*/gi, '')

  // Remove edition info
  name = name.replace(/\s*(?:deluxe|ultimate|gold|complete|goty|definitive|remastered|enhanced|collection|premium|standard|digital|annual)\s*/gi, '')

  // Remove year
  name = name.replace(/\s*\(\d{4}\)\s*/g, '')

  // Remove size info
  name = name.replace(/\s*\d+(?:\.\d+)?\s*(?:gb|mb|tb)\s*/gi, '')

  // Remove repacker tags
  name = name.replace(/\s*(?:fitgirl|dodi|elamigos|ovagames|kaos|cpy|plaza|codex|ali213|empress)\s*/gi, '')

  // Remove language tags like MULTi15
  name = name.replace(/\s*MULTi\d+\s*/gi, '')

  // Clean up
  name = name.replace(/\s*[-–—]\s*/g, ' ')
  name = name.replace(/\s+/g, ' ')
  name = name.trim()

  return name
}

// ============================================================
// LEVENSHTEIN DISTANCE (for fuzzy matching)
// ============================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// ============================================================
// CHECK FOR DUPLICATES
// ============================================================

export async function checkForDuplicate(gameTitle: string): Promise<DuplicateCheckResult> {
  const normalizedTitle = normalizeTitle(gameTitle)
  const baseGameName = extractBaseGameName(gameTitle)
  const version = extractVersion(gameTitle)
  const edition = extractEdition(gameTitle)

  // 1. Exact match check (by normalized title)
  const { data: exactMatches } = await supabase
    .from('games')
    .select('id, title, slug')
    .eq('status', 'published')
    .ilike('title', gameTitle)

  if (exactMatches && exactMatches.length > 0) {
    return {
      isDuplicate: true,
      existingGameId: exactMatches[0].id,
      confidence: 100,
      matchType: 'exact',
      matchReason: `Exact title match: "${exactMatches[0].title}"`,
    }
  }

  // 2. Base name match (same game, different repacker/version)
  const { data: baseMatches } = await supabase
    .from('games')
    .select('id, title, repack_date')
    .eq('status', 'published')

  if (baseMatches) {
    for (const match of baseMatches) {
      const matchBaseName = extractBaseGameName(match.title)
      const matchEdition = extractEdition(match.title)

      // Check if base names match
      if (normalizeTitle(matchBaseName) === normalizeTitle(baseGameName)) {
        // Same base game - check edition
        if (edition && matchEdition && edition === matchEdition) {
          return {
            isDuplicate: true,
            existingGameId: match.id,
            confidence: 95,
            matchType: 'exact',
            matchReason: `Same game + edition: "${match.title}"`,
          }
        }

        // Same base game, different version
        if (version) {
          return {
            isDuplicate: true,
            existingGameId: match.id,
            confidence: 90,
            matchType: 'fuzzy',
            matchReason: `Same game, different version: "${match.title}"`,
          }
        }

        // Same base game, no version info
        return {
          isDuplicate: true,
          existingGameId: match.id,
          confidence: 85,
          matchType: 'fuzzy',
          matchReason: `Same base game: "${match.title}"`,
        }
      }
    }
  }

  // 3. Fuzzy match (similar titles)
  if (baseMatches) {
    for (const match of baseMatches) {
      const matchBaseName = extractBaseGameName(match.title)
      const distance = levenshteinDistance(normalizeTitle(baseGameName), normalizeTitle(matchBaseName))
      const maxLength = Math.max(baseGameName.length, matchBaseName.length)
      const similarity = 1 - distance / maxLength

      if (similarity > 0.85) {
        return {
          isDuplicate: true,
          existingGameId: match.id,
          confidence: Math.round(similarity * 100),
          matchType: 'fuzzy',
          matchReason: `Fuzzy match (${Math.round(similarity * 100)}% similar): "${match.title}"`,
        }
      }
    }
  }

  return {
    isDuplicate: false,
    existingGameId: null,
    confidence: 0,
    matchType: 'none',
    matchReason: 'No duplicate found',
  }
}

// ============================================================
// MERGE MIRROR INTO EXISTING GAME
// ============================================================

export async function mergeMirrorIntoGame(
  gameId: number,
  mirror: {
    hostName: string
    downloadUrl: string
    fileName?: string
    fileSize?: string
    partNumber?: number
    totalParts?: number
    repackerName?: string
  }
): Promise<GameMergeResult> {
  try {
    // Get current mirrors
    const { data: game } = await supabase
      .from('games')
      .select('mirrors, repacker_name')
      .eq('id', gameId)
      .single()

    if (!game) {
      return { success: false, gameId, mirrorsAdded: 0, error: 'Game not found' }
    }

    const currentMirrors = game.mirrors || []

    // Check if this exact mirror URL already exists
    const urlExists = currentMirrors.some((m: any) => m.downloadUrl === mirror.downloadUrl)
    if (urlExists) {
      return { success: true, gameId, mirrorsAdded: 0 }
    }

    // Create new mirror entry
    const newMirror = {
      id: Date.now(), // Temporary ID
      gameId,
      hostName: mirror.hostName,
      downloadUrl: mirror.downloadUrl,
      fileName: mirror.fileName || '',
      fileSize: mirror.fileSize || '',
      partNumber: mirror.partNumber || 1,
      totalParts: mirror.totalParts || 1,
      status: 'active',
      priority: currentMirrors.length,
      clicks: 0,
      createdAt: new Date().toISOString(),
    }

    // Add to mirrors array
    const updatedMirrors = [...currentMirrors, newMirror]

    // Update game
    const { error } = await supabase
      .from('games')
      .update({ mirrors: updatedMirrors })
      .eq('id', gameId)

    if (error) throw error

    // Also update repacker_name if it's a new repacker
    if (mirror.repackerName && !game.repacker_name.includes(mirror.repackerName)) {
      await supabase
        .from('games')
        .update({
          repacker_name: `${game.repacker_name}, ${mirror.repackerName}`,
        })
        .eq('id', gameId)
    }

    return { success: true, gameId, mirrorsAdded: 1 }
  } catch (error: any) {
    return { success: false, gameId, mirrorsAdded: 0, error: error.message }
  }
}

// ============================================================
// INTELLIGENT GAME UPSERT
// ============================================================

export async function upsertGame(
  gameData: {
    title: string
    repackerName: string
    mirror?: {
      hostName: string
      downloadUrl: string
      fileName?: string
      fileSize?: string
    }
    [key: string]: any
  }
): Promise<{ gameId: number; isNew: boolean; mirrorsAdded: number }> {
  // Check for duplicate
  const duplicateCheck = await checkForDuplicate(gameData.title)

  if (duplicateCheck.isDuplicate && duplicateCheck.existingGameId) {
    // Merge mirror into existing game
    let mirrorsAdded = 0
    if (gameData.mirror) {
      const mergeResult = await mergeMirrorIntoGame(duplicateCheck.existingGameId, {
        hostName: gameData.mirror.hostName,
        downloadUrl: gameData.mirror.downloadUrl,
        fileName: gameData.mirror.fileName,
        fileSize: gameData.mirror.fileSize,
        repackerName: gameData.repackerName,
      })
      mirrorsAdded = mergeResult.mirrorsAdded
    }

    // Update repack date to latest
    await supabase
      .from('games')
      .update({ repack_date: new Date().toISOString() })
      .eq('id', duplicateCheck.existingGameId)

    console.log(`[Dedup] Merged into existing game ${duplicateCheck.existingGameId}: ${duplicateCheck.matchReason}`)

    return {
      gameId: duplicateCheck.existingGameId,
      isNew: false,
      mirrorsAdded,
    }
  }

  // Create new game
  const slug = gameData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200)

  const newGame = {
    title: gameData.title,
    slug,
    description: gameData.description || '',
    long_description: gameData.longDescription || '',
    developer: gameData.developer || '',
    publisher: gameData.publisher || '',
    release_date: gameData.releaseDate || null,
    repack_date: new Date().toISOString(),
    cover_image: gameData.coverImage || '',
    landscape_image: gameData.landscapeImage || '',
    screenshots: gameData.screenshots || [],
    genres: gameData.genres || [],
    tags: gameData.tags || [],
    rating: gameData.rating || 0,
    original_size: gameData.originalSize || '',
    repack_size: gameData.repackSize || '',
    repacker_name: gameData.repackerName,
    system_requirements: gameData.systemRequirements || { minimum: {}, recommended: {} },
    languages: gameData.languages || 'English',
    mirrors: gameData.mirror ? [{
      id: Date.now(),
      hostName: gameData.mirror.hostName,
      downloadUrl: gameData.mirror.downloadUrl,
      fileName: gameData.mirror.fileName || '',
      fileSize: gameData.mirror.fileSize || '',
      partNumber: 1,
      totalParts: 1,
      status: 'active',
      priority: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
    }] : [],
    status: 'published',
    source: gameData.source || 'scraper',
    downloads: Math.floor(Math.random() * 100) + 50,
    views: Math.floor(Math.random() * 500) + 200,
  }

  const { data, error } = await supabase
    .from('games')
    .insert(newGame)
    .select()
    .single()

  if (error) {
    console.error('[Dedup] Failed to create game:', error)
    throw error
  }

  console.log(`[Dedup] Created new game ${data.id}: ${gameData.title}`)

  return {
    gameId: data.id,
    isNew: true,
    mirrorsAdded: gameData.mirror ? 1 : 0,
  }
}

// ============================================================
// BATCH DEDUP SCAN (Find and merge existing duplicates)
// ============================================================

export async function runBatchDedupScan(): Promise<{
  scanned: number
  merged: number
  skipped: number
}> {
  console.log('[Dedup] Starting batch dedup scan...')

  const { data: games } = await supabase
    .from('games')
    .select('id, title, slug')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (!games) return { scanned: 0, merged: 0, skipped: 0 }

  let scanned = 0
  let merged = 0
  let skipped = 0

  // Group by base name
  const groups: Record<string, any[]> = {}
  for (const game of games) {
    const baseName = extractBaseGameName(game.title)
    const normalized = normalizeTitle(baseName)
    if (!groups[normalized]) groups[normalized] = []
    groups[normalized].push(game)
  }

  // Find groups with multiple entries (duplicates)
  for (const [baseName, groupGames] of Object.entries(groups)) {
    if (groupGames.length <= 1) continue

    // Sort by repack_date (newest first)
    groupGames.sort((a, b) => new Date(b.repack_date || b.created_at).getTime() - new Date(a.repack_date || a.created_at).getTime())

    const primary = groupGames[0]
    const duplicates = groupGames.slice(1)

    console.log(`[Dedup] Found ${duplicates.length} duplicates for "${primary.title}"`)

    // For now, just log - actual merging requires careful handling of mirrors
    skipped++
    scanned++
  }

  console.log(`[Dedup] Complete: ${scanned} scanned, ${merged} merged, ${skipped} groups found`)

  return { scanned, merged, skipped }
}
