// ============================================================
// REPACKER TRUST SCORE SYSTEM
// Dynamic reputation based on user bug reports
// High trust = top placement. Low trust = bottom or hidden.
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface RepackerTrustScore {
  repacker: string
  trustScore: number          // 0-100
  totalGames: number
  totalMirrors: number
  totalReports: number
  confirmedBugs: number
  falsePositives: number
  bugRate: number             // percentage
  avgMirrorHealth: number     // percentage
  lastUpdated: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
}

interface TrustFactors {
  bugRate: number             // -40 to +40 weight
  mirrorHealth: number        // -20 to +20 weight
  downloadSuccess: number     // -10 to +10 weight
  ageBonus: number            // 0 to +10 weight
  reportVolume: number        // -10 to +10 weight
}

interface RepackerPriority {
  repacker: string
  basePriority: number        // from static config
  trustModifier: number       // from dynamic trust score
  finalPriority: number       // base + modifier
  placement: 'boosted' | 'normal' | 'demoted' | 'hidden'
}

// ============================================================
// TRUST SCORE CALCULATION
// ============================================================

const TRUST_CONFIG = {
  // Base scores for known repackers (fallback)
  baseScores: {
    fitgirl: 95,
    dodi: 90,
    elamigos: 85,
    ovagames: 80,
    kaos: 75,
    cpy: 70,
    plaza: 65,
    codex: 60,
    ali213: 55,
    empress: 50,
  },

  // Tier thresholds
  tierThresholds: {
    S: 90,  // Elite - always top
    A: 75,  // Great - boosted
    B: 60,  // Good - normal
    C: 45,  // Mediocre - slightly demoted
    D: 30,  // Poor - demoted
    F: 0,   // Terrible - hidden
  },

  // Weight factors for trust calculation
  weights: {
    bugRate: 0.4,        // 40% weight on bug rate
    mirrorHealth: 0.25,  // 25% weight on mirror health
    downloadSuccess: 0.2, // 20% weight on download success
    ageBonus: 0.1,       // 10% weight on how long they've been around
    reportVolume: 0.05,  // 5% weight on report volume (normalized)
  },

  // Penalty/bonus ranges
  maxPenalty: -40,
  maxBonus: 40,
}

// ============================================================
// CALCULATE TRUST SCORE FOR A REPACKER
// ============================================================

export async function calculateRepackerTrust(repacker: string): Promise<RepackerTrustScore> {
  const baseScore = TRUST_CONFIG.baseScores[repacker.toLowerCase()] || 50

  // Get all games by this repacker
  const { data: games } = await supabase
    .from('games')
    .select('id, downloads, views')
    .ilike('repacker_name', `%${repacker}%`)
    .eq('status', 'published')

  const gameIds = (games || []).map(g => g.id)
  const totalGames = gameIds.length

  // Get all mirrors for these games
  const { data: mirrors } = gameIds.length > 0
    ? await supabase
        .from('mirrors')
        .select('id, status, score, clicks, game_id')
        .in('game_id', gameIds)
    : { data: [] }

  const totalMirrors = mirrors?.length || 0
  const activeMirrors = mirrors?.filter(m => m.status === 'active').length || 0
  const mirrorHealth = totalMirrors > 0 ? (activeMirrors / totalMirrors) * 100 : 50

  // Get bug reports for these games
  const { data: reports } = gameIds.length > 0
    ? await supabase
        .from('bug_reports')
        .select('id, status, bug_type, created_at')
        .in('game_id', gameIds)
    : { data: [] }

  const totalReports = reports?.length || 0
  const confirmedBugs = reports?.filter(r => r.status === 'confirmed').length || 0
  const falsePositives = reports?.filter(r => r.status === 'disputed').length || 0
  const bugRate = totalGames > 0 ? (confirmedBugs / totalGames) * 100 : 0

  // Calculate download success rate (mirrors with clicks > 0)
  const mirrorsWithClicks = mirrors?.filter(m => (m.clicks || 0) > 0).length || 0
  const downloadSuccess = totalMirrors > 0 ? (mirrorsWithClicks / totalMirrors) * 100 : 50

  // Calculate age bonus (days since first game)
  const { data: firstGame } = await supabase
    .from('games')
    .select('created_at')
    .ilike('repacker_name', `%${repacker}%`)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const ageDays = firstGame
    ? (Date.now() - new Date(firstGame.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0
  const ageBonus = Math.min(10, ageDays / 30) // +1 per month, max +10

  // Build factors
  const factors: TrustFactors = {
    bugRate: calculateBugRateFactor(bugRate),
    mirrorHealth: calculateMirrorHealthFactor(mirrorHealth),
    downloadSuccess: calculateDownloadSuccessFactor(downloadSuccess),
    ageBonus,
    reportVolume: calculateReportVolumeFactor(totalReports, totalGames),
  }

  // Weighted trust score
  const trustScore = Math.max(0, Math.min(100,
    baseScore +
    (factors.bugRate * TRUST_CONFIG.weights.bugRate) +
    (factors.mirrorHealth * TRUST_CONFIG.weights.mirrorHealth) +
    (factors.downloadSuccess * TRUST_CONFIG.weights.downloadSuccess) +
    (factors.ageBonus * TRUST_CONFIG.weights.ageBonus * 10) +
    (factors.reportVolume * TRUST_CONFIG.weights.reportVolume * 10)
  ))

  // Determine tier
  const tier = getTier(trustScore)

  return {
    repacker,
    trustScore: Math.round(trustScore * 10) / 10,
    totalGames,
    totalMirrors,
    totalReports,
    confirmedBugs,
    falsePositives,
    bugRate: Math.round(bugRate * 10) / 10,
    avgMirrorHealth: Math.round(mirrorHealth * 10) / 10,
    lastUpdated: new Date().toISOString(),
    tier,
  }
}

// ============================================================
// FACTOR CALCULATIONS
// ============================================================

function calculateBugRateFactor(bugRate: number): number {
  // 0% bug rate = +40, 5% = 0, 10%+ = -40
  if (bugRate <= 0) return 40
  if (bugRate >= 10) return -40
  return 40 - (bugRate * 8)
}

function calculateMirrorHealthFactor(health: number): number {
  // 100% healthy = +20, 50% = 0, 0% = -20
  return ((health - 50) / 50) * 20
}

function calculateDownloadSuccessFactor(success: number): number {
  // 100% success = +10, 50% = 0, 0% = -10
  return ((success - 50) / 50) * 10
}

function calculateReportVolumeFactor(reports: number, games: number): number {
  // High reports per game = penalty
  if (games === 0) return 0
  const reportsPerGame = reports / games
  if (reportsPerGame <= 0.5) return 10
  if (reportsPerGame >= 3) return -10
  return 10 - (reportsPerGame * 4)
}

function getTier(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= TRUST_CONFIG.tierThresholds.S) return 'S'
  if (score >= TRUST_CONFIG.tierThresholds.A) return 'A'
  if (score >= TRUST_CONFIG.tierThresholds.B) return 'B'
  if (score >= TRUST_CONFIG.tierThresholds.C) return 'C'
  if (score >= TRUST_CONFIG.tierThresholds.D) return 'D'
  return 'F'
}

// ============================================================
// GET DYNAMIC REPACKER PRIORITIES
// Merges static priority with dynamic trust score
// ============================================================

export async function getDynamicRepackerPriorities(): Promise<RepackerPriority[]> {
  const staticPriorities: Record<string, number> = {
    fitgirl: 100, dodi: 90, elamigos: 80, ovagames: 75,
    kaos: 70, cpy: 65, plaza: 60, codex: 55, ali213: 50, empress: 45,
  }

  const repackers = Object.keys(staticPriorities)
  const priorities: RepackerPriority[] = []

  for (const repacker of repackers) {
    const trust = await calculateRepackerTrust(repacker)
    const basePriority = staticPriorities[repacker]

    // Trust modifier: trust score deviation from 50 (neutral)
    // +40 at trust 90, 0 at trust 50, -40 at trust 10
    const trustModifier = Math.round(((trust.trustScore - 50) / 50) * 40)

    const finalPriority = Math.max(0, Math.min(100, basePriority + trustModifier))

    let placement: 'boosted' | 'normal' | 'demoted' | 'hidden'
    if (trust.tier === 'S' || trust.tier === 'A') placement = 'boosted'
    else if (trust.tier === 'B') placement = 'normal'
    else if (trust.tier === 'C' || trust.tier === 'D') placement = 'demoted'
    else placement = 'hidden'

    priorities.push({
      repacker,
      basePriority,
      trustModifier,
      finalPriority,
      placement,
    })
  }

  // Sort by final priority
  priorities.sort((a, b) => b.finalPriority - a.finalPriority)

  return priorities
}

// ============================================================
// APPLY TRUST TO MIRROR LIST
// Re-ranks mirrors based on repacker trust
// ============================================================

export async function applyTrustToMirrors<T extends { repacker_name?: string; priority?: number; score?: number }>(
  mirrors: T[]
): Promise<T[]> {
  const priorities = await getDynamicRepackerPriorities()
  const priorityMap = new Map(priorities.map(p => [p.repacker.toLowerCase(), p]))

  return mirrors.map(mirror => {
    const repacker = (mirror.repacker_name || '').toLowerCase()
    const priority = priorityMap.get(repacker)

    if (!priority) return mirror

    // Apply trust modifier to score
    const originalScore = mirror.score || mirror.priority || 50
    const adjustedScore = Math.max(0, Math.min(100,
      originalScore + priority.trustModifier
    ))

    return {
      ...mirror,
      score: adjustedScore,
      priority: priority.finalPriority,
    }
  }).sort((a, b) => (b.score || 0) - (a.score || 0))
}

// ============================================================
// GET ALL TRUST SCORES (for admin dashboard)
// ============================================================

export async function getAllRepackerTrustScores(): Promise<RepackerTrustScore[]> {
  const repackers = Object.keys(TRUST_CONFIG.baseScores)
  const scores: RepackerTrustScore[] = []

  for (const repacker of repackers) {
    const score = await calculateRepackerTrust(repacker)
    scores.push(score)
  }

  return scores.sort((a, b) => b.trustScore - a.trustScore)
}

// ============================================================
// UPDATE TRUST IN DATABASE
// Call this periodically to refresh trust scores
// ============================================================

export async function updateAllTrustScores(): Promise<void> {
  const scores = await getAllRepackerTrustScores()

  for (const score of scores) {
    await supabase
      .from('repackers')
      .update({
        trust_score: score.trustScore,
        trust_tier: score.tier,
        bug_rate: score.bugRate,
        mirror_health: score.avgMirrorHealth,
        last_trust_update: new Date().toISOString(),
      })
      .ilike('name', `%${score.repacker}%`)
      .then(() => {})
      .catch(() => {})
  }

  console.log(`[TrustScore] Updated ${scores.length} repacker trust scores`)
}
