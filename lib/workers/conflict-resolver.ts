// ============================================================
// REPACK CONFLICT RESOLVER
// Handles version clashes between repackers
// Priority: FitGirl > DODI > ElAmigos > OvaGames > KaOs > Others
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface VersionInfo {
  major: number
  minor: number
  patch: number
  build: number | null
  raw: string
}

interface ConflictResolution {
  gameId: number
  action: 'promote' | 'archive' | 'merge' | 'skip'
  reason: string
  promotedMirrorId?: number
  archivedMirrorIds: number[]
}

// ============================================================
// REPACKER PRIORITY TABLE
// Higher number = higher priority (trusted more)
// ============================================================

const REPACKER_PRIORITY: Record<string, number> = {
  'fitgirl': 100,
  'dodi': 90,
  'elamigos': 80,
  'ovagames': 75,
  'kaos': 70,
  'kaoskrew': 70,
  'cpy': 65,
  'plaza': 60,
  'codex': 55,
  'ali213': 50,
  'empress': 45,
  'fitgirl-repacks': 100,
  'dodi-repacks': 90,
}

function getRepackerPriority(repackerName: string): number {
  const normalized = repackerName.toLowerCase().replace(/\s+/g, '')
  return REPACKER_PRIORITY[normalized] || 30 // Default priority for unknown repackers
}

// Dynamic version that also considers trust score
async function getDynamicRepackerPriority(repackerName: string): Promise<number> {
  const basePriority = getRepackerPriority(repackerName)

  // Fetch trust score from database if available
  const { data: repacker } = await supabase
    .from('repackers')
    .select('trust_score, trust_tier')
    .ilike('name', `%${repackerName}%`)
    .single()

  if (!repacker || !repacker.trust_score) {
    return basePriority
  }

  // Apply trust modifier: trust score deviation from 50 (neutral)
  const trustModifier = ((repacker.trust_score - 50) / 50) * 40
  return Math.max(0, Math.min(100, basePriority + trustModifier))
}

// ============================================================
// VERSION PARSING
// ============================================================

function parseVersion(versionStr: string): VersionInfo | null {
  if (!versionStr) return null

  // Clean the version string
  const cleaned = versionStr.replace(/[^\d.v]/gi, '').trim()

  // Match version patterns: 1.0, 1.0.5, v1.0.5, build 1234
  const match = cleaned.match(/v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.\d+)?/i)
  if (!match) return null

  return {
    major: parseInt(match[1]) || 0,
    minor: parseInt(match[2]) || 0,
    patch: parseInt(match[3]) || 0,
    build: null,
    raw: versionStr,
  }
}

function compareVersions(a: VersionInfo, b: VersionInfo): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  return 0
}

function isVersionNewer(newVersion: string, currentVersion: string): boolean {
  const newParsed = parseVersion(newVersion)
  const currentParsed = parseVersion(currentVersion)

  if (!newParsed) return false
  if (!currentParsed) return true

  return compareVersions(newParsed, currentParsed) > 0
}

// ============================================================
// CONFLICT DETECTION
// ============================================================

export async function detectVersionConflict(
  gameId: number,
  newRepackerName: string,
  newVersion: string
): Promise<{
  hasConflict: boolean
  currentVersion: string
  currentRepacker: string
  isNewer: boolean
  priorityDiff: number
}> {
  // Get the game's current repacker info
  const { data: game } = await supabase
    .from('games')
    .select('repacker_name, mirrors')
    .eq('id', gameId)
    .single()

  if (!game) {
    return { hasConflict: false, currentVersion: '', currentRepacker: '', isNewer: false, priorityDiff: 0 }
  }

  // Extract current version from mirrors or title
  const currentRepacker = game.repacker_name?.split(',')[0]?.trim() || 'unknown'
  const currentVersion = '' // Would need to parse from title/mirrors

  const newPriority = await getDynamicRepackerPriority(newRepackerName)
  const currentPriority = await getDynamicRepackerPriority(currentRepacker)
  const priorityDiff = newPriority - currentPriority

  // Check if versions are the same
  const isNewer = newVersion ? isVersionNewer(newVersion, currentVersion) : false

  return {
    hasConflict: isNewer || priorityDiff > 0,
    currentVersion,
    currentRepacker,
    isNewer,
    priorityDiff,
  }
}

// ============================================================
// CONFLICT RESOLUTION
// ============================================================

export async function resolveRepackConflict(
  gameId: number,
  newMirror: {
    hostName: string
    downloadUrl: string
    repackerName: string
    version?: string
    fileName?: string
    fileSize?: string
  }
): Promise<ConflictResolution> {
  console.log(`[Conflict Resolver] Resolving conflict for game ${gameId}, repacker: ${newMirror.repackerName}`)

  // Get current game state
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (!game) {
    return {
      gameId,
      action: 'skip',
      reason: 'Game not found',
      archivedMirrorIds: [],
    }
  }

  const currentMirrors = game.mirrors || []
  const currentRepacker = game.repacker_name?.split(',')[0]?.trim() || 'unknown'
  const newPriority = await getDynamicRepackerPriority(newMirror.repackerName)
  const currentPriority = await getDynamicRepackerPriority(currentRepacker)

  // Case 1: Same repacker - just add the mirror
  if (currentRepacker.toLowerCase() === newMirror.repackerName.toLowerCase()) {
    return await addMirrorToGame(gameId, game, newMirror, 'merge', 'Same repacker, adding new mirror')
  }

  // Case 2: Higher priority repacker - promote new, archive old
  if (newPriority > currentPriority) {
    console.log(`[Conflict Resolver] Higher priority repacker detected: ${newMirror.repackerName} (${newPriority}) > ${currentRepacker} (${currentPriority})`)

    // Archive existing mirrors from lower priority repacker
    const archivedMirrorIds = currentMirrors
      .filter((m: any) => getRepackerPriority(m.repackerName || currentRepacker) < newPriority)
      .map((m: any) => m.id)

    // Add new mirror with highest priority
    const newMirrorEntry = createMirrorEntry(newMirror, 0)
    const promotedMirrors = [newMirrorEntry, ...currentMirrors.filter((m: any) => !archivedMirrorIds.includes(m.id))]

    // Update game
    await supabase
      .from('games')
      .update({
        mirrors: promotedMirrors,
        repacker_name: newMirror.repackerName,
        updated_date: new Date().toISOString(),
      })
      .eq('id', gameId)

    return {
      gameId,
      action: 'promote',
      reason: `Promoted ${newMirror.repackerName} (priority ${newPriority}) over ${currentRepacker} (priority ${currentPriority})`,
      promotedMirrorId: newMirrorEntry.id,
      archivedMirrorIds,
    }
  }

  // Case 3: Lower priority repacker - add as secondary
  if (newPriority < currentPriority) {
    return await addMirrorToGame(gameId, game, newMirror, 'merge', `Lower priority repacker ${newMirror.repackerName}, adding as secondary mirror`)
  }

  // Case 4: Equal priority - check version
  if (newMirror.version && game.title) {
    const titleVersion = game.title.match(/v?(\d+[\.\d]*)/i)?.[1]
    if (titleVersion && isVersionNewer(newMirror.version, titleVersion)) {
      return await addMirrorToGame(gameId, game, newMirror, 'promote', `Newer version ${newMirror.version} > ${titleVersion}`)
    }
  }

  // Case 5: Same priority, same version - just add mirror
  return await addMirrorToGame(gameId, game, newMirror, 'merge', 'Same priority, adding as additional mirror')
}

// ============================================================
// HELPERS
// ============================================================

async function addMirrorToGame(
  gameId: number,
  game: any,
  newMirror: any,
  action: 'merge' | 'promote',
  reason: string
): Promise<ConflictResolution> {
  const currentMirrors = game.mirrors || []

  // Check for duplicate URL
  const urlExists = currentMirrors.some((m: any) => m.downloadUrl === newMirror.downloadUrl)
  if (urlExists) {
    return {
      gameId,
      action: 'skip',
      reason: 'Mirror URL already exists',
      archivedMirrorIds: [],
    }
  }

  const newMirrorEntry = createMirrorEntry(newMirror, currentMirrors.length)
  const updatedMirrors = [...currentMirrors, newMirrorEntry]

  await supabase
    .from('games')
    .update({
      mirrors: updatedMirrors,
      updated_date: new Date().toISOString(),
    })
    .eq('id', gameId)

  return {
    gameId,
    action,
    reason,
    archivedMirrorIds: [],
  }
}

function createMirrorEntry(mirror: any, priority: number): any {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    hostName: mirror.hostName,
    downloadUrl: mirror.downloadUrl,
    fileName: mirror.fileName || '',
    fileSize: mirror.fileSize || '',
    partNumber: 1,
    totalParts: 1,
    status: 'active',
    priority,
    clicks: 0,
    repackerName: mirror.repackerName,
    createdAt: new Date().toISOString(),
  }
}

// ============================================================
// BATCH CONFLICT RESOLUTION
// ============================================================

export async function resolveAllConflicts(): Promise<{
  resolved: number
  promoted: number
  merged: number
  skipped: number
}> {
  console.log('[Conflict Resolver] Starting batch conflict resolution...')

  // Get all games with multiple repackers
  const { data: games } = await supabase
    .from('games')
    .select('id, title, repacker_name, mirrors')
    .eq('status', 'published')

  if (!games) return { resolved: 0, promoted: 0, merged: 0, skipped: 0 }

  let resolved = 0
  let promoted = 0
  let merged = 0
  let skipped = 0

  for (const game of games) {
    const mirrors = game.mirrors || []
    if (mirrors.length <= 1) continue

    // Group mirrors by repacker
    const repackerGroups: Record<string, any[]> = {}
    for (const mirror of mirrors) {
      const repacker = mirror.repackerName || 'unknown'
      if (!repackerGroups[repacker]) repackerGroups[repacker] = []
      repackerGroups[repacker].push(mirror)
    }

    // If multiple repackers, resolve
    if (Object.keys(repackerGroups).length > 1) {
      const sortedRepackers = Object.entries(repackerGroups)
        .sort(([a], [b]) => getRepackerPriority(b) - getRepackerPriority(a))

      const primaryRepacker = sortedRepackers[0][0]
      const primaryMirrors = sortedRepackers[0][1]

      // Promote primary repacker's mirrors
      const allMirrors = mirrors.map((m: any) => ({
        ...m,
        priority: m.repackerName === primaryRepacker ? 0 : 1,
      }))

      await supabase
        .from('games')
        .update({
          mirrors: allMirrors,
          repacker_name: primaryRepacker,
          updated_date: new Date().toISOString(),
        })
        .eq('id', game.id)

      promoted++
      resolved++
    } else {
      skipped++
    }
  }

  console.log(`[Conflict Resolver] Complete: ${resolved} resolved, ${promoted} promoted, ${merged} merged, ${skipped} skipped`)

  return { resolved, promoted, merged, skipped }
}
