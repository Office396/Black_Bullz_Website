// ============================================================
// MIRROR ROTATION ALGORITHM
// Rotates mirrors based on Health, Speed, GeoIP
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface MirrorScore {
  mirrorId: number
  hostName: string
  downloadUrl: string
  fileName: string
  fileSize: string
  partNumber: number
  totalParts: number
  score: number
  healthScore: number
  speedScore: number
  geoScore: number
  popularityScore: number
}

interface GeoLocation {
  country: string
  continent: string
}

// ============================================================
// HOST SPEED RATINGS (based on typical download speeds)
// ============================================================

const HOST_SPEED_RATINGS: Record<string, number> = {
  '1fichier': 95,
  'mega.nz': 90,
  'gofile': 85,
  'pixeldrain': 80,
  'mediafire': 75,
  'google drive': 85,
  'onedrive': 80,
  'buzzheavier': 70,
  'anonfiles': 60,
  'mixdrop': 50,
}

// ============================================================
// GEO-BASED HOST PREFERENCES
// ============================================================

const GEO_PREFERENCES: Record<string, string[]> = {
  'NA': ['1fichier', 'mega.nz', 'gofile'], // North America
  'EU': ['1fichier', 'mega.nz', 'gofile'], // Europe
  'AS': ['mega.nz', 'gofile', 'pixeldrain'], // Asia
  'SA': ['gofile', 'mega.nz', 'pixeldrain'], // South America
  'AF': ['gofile', 'pixeldrain', 'mediafire'], // Africa
  'OC': ['1fichier', 'mega.nz', 'gofile'], // Oceania
}

// ============================================================
// MIRROR SCORING
// ============================================================

function calculateHealthScore(mirror: any): number {
  if (mirror.status === 'dead') return 0
  if (mirror.status === 'checking') return 30

  // Check last alive time
  if (mirror.lastAlive) {
    const hoursSinceAlive = (Date.now() - new Date(mirror.lastAlive).getTime()) / (1000 * 60 * 60)
    if (hoursSinceAlive < 24) return 100
    if (hoursSinceAlive < 72) return 80
    if (hoursSinceAlive < 168) return 60
    if (hoursSinceAlive < 336) return 40
    return 20
  }

  return 50 // Default if no health data
}

function calculateSpeedScore(mirror: any): number {
  const hostRating = HOST_SPEED_RATINGS[mirror.hostName?.toLowerCase()] || 50
  return hostRating
}

function calculateGeoScore(mirror: any, userGeo: GeoLocation | null): number {
  if (!userGeo) return 50

  const preferences = GEO_PREFERENCES[userGeo.continent] || GEO_PREFERENCES['NA']
  const hostLower = mirror.hostName?.toLowerCase() || ''

  for (let i = 0; i < preferences.length; i++) {
    if (hostLower.includes(preferences[i].toLowerCase())) {
      return 100 - (i * 10) // First preference = 100, second = 90, etc.
    }
  }

  return 40 // Default for non-preferred hosts
}

function calculatePopularityScore(mirror: any): number {
  const clicks = mirror.clicks || 0
  // Logarithmic scale - diminishing returns
  if (clicks > 1000) return 100
  if (clicks > 500) return 90
  if (clicks > 100) return 75
  if (clicks > 50) return 60
  if (clicks > 10) return 45
  return 30
}

function calculateTotalScore(
  healthScore: number,
  speedScore: number,
  geoScore: number,
  popularityScore: number,
  priority: number = 0
): number {
  // Weighted average
  const weights = {
    health: 0.35,
    speed: 0.25,
    geo: 0.20,
    popularity: 0.15,
    priority: 0.05,
  }

  const baseScore =
    healthScore * weights.health +
    speedScore * weights.speed +
    geoScore * weights.geo +
    popularityScore * weights.popularity

  // Priority bonus (0-100 -> 0-5 points)
  const priorityBonus = (priority / 100) * 5

  return Math.min(100, baseScore + priorityBonus)
}

// ============================================================
// MAIN ROTATION FUNCTION
// ============================================================

export async function getRotatedMirrors(
  gameId: number,
  userGeo: GeoLocation | null = null,
  limit: number = 5
): Promise<MirrorScore[]> {
  // Get all active mirrors for the game
  const { data: mirrors, error } = await supabase
    .from('mirrors')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'active')
    .order('priority', { ascending: true })

  if (error || !mirrors) return []

  // Score each mirror
  const scoredMirrors: MirrorScore[] = mirrors.map(mirror => {
    const healthScore = calculateHealthScore(mirror)
    const speedScore = calculateSpeedScore(mirror)
    const geoScore = calculateGeoScore(mirror, userGeo)
    const popularityScore = calculatePopularityScore(mirror)
    const score = calculateTotalScore(healthScore, speedScore, geoScore, popularityScore, mirror.priority || 0)

    return {
      mirrorId: mirror.id,
      hostName: mirror.host_name,
      downloadUrl: mirror.download_url,
      fileName: mirror.file_name || '',
      fileSize: mirror.file_size || '',
      partNumber: mirror.part_number || 1,
      totalParts: mirror.total_parts || 1,
      score,
      healthScore,
      speedScore,
      geoScore,
      popularityScore,
    }
  })

  // Sort by score (highest first)
  scoredMirrors.sort((a, b) => b.score - a.score)

  return scoredMirrors.slice(0, limit)
}

// ============================================================
// GET BEST MIRROR (Single best option)
// ============================================================

export async function getBestMirror(gameId: number, userGeo: GeoLocation | null = null): Promise<MirrorScore | null> {
  const mirrors = await getRotatedMirrors(gameId, userGeo, 1)
  return mirrors[0] || null
}

// ============================================================
// INCREMENT MIRROR CLICKS
// ============================================================

export async function incrementMirrorClicks(mirrorId: number): Promise<void> {
  await supabase.rpc('increment_mirror_clicks', { mirror_id: mirrorId })
}

// ============================================================
// GET GEO FROM IP (using free GeoIP)
// ============================================================

export async function getGeoFromIP(ip: string): Promise<GeoLocation | null> {
  try {
    // Use ip-api.com (free tier: 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,continentCode`)
    const data = await response.json()

    if (data.status === 'success') {
      return {
        country: data.country,
        continent: data.continentCode,
      }
    }
  } catch {}

  return null
}

// ============================================================
// AUTO-ARCHIVE DEAD MIRRORS (Mirror Expiry)
// ============================================================

export async function archiveDeadMirrors(): Promise<{
  archived: number
  errors: number
}> {
  console.log('[Mirror Expiry] Starting dead mirror archive...')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Find mirrors that have been dead for >7 days
  const { data: deadMirrors, error } = await supabase
    .from('mirrors')
    .select('id, game_id, host_name')
    .eq('status', 'dead')
    .lt('last_checked', sevenDaysAgo)

  if (error || !deadMirrors) {
    return { archived: 0, errors: 1 }
  }

  let archived = 0
  let errors = 0

  for (const mirror of deadMirrors) {
    try {
      // Archive instead of delete
      await supabase
        .from('mirrors')
        .update({ status: 'archived' })
        .eq('id', mirror.id)

      archived++
    } catch {
      errors++
    }
  }

  console.log(`[Mirror Expiry] Archived ${archived} dead mirrors, ${errors} errors`)

  return { archived, errors }
}
