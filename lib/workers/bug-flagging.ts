// ============================================================
// USER BUG FLAGGING SYSTEM
// Users report "this game doesn't work" → auto-downgrade mirror
// Auto-hides bad cracks without human intervention
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface BugReport {
  id: number
  gameId: number
  mirrorId?: number
  userId?: string
  ipAddress: string
  bugType: 'crash' | 'black_screen' | 'missing_files' | 'wrong_password' | 'corrupt' | 'virus_false_positive' | 'install_fail' | 'other'
  description: string
  gameVersion?: string
  repackerName?: string
  systemInfo?: {
    os: string
    gpu: string
    ram: string
    antivirus?: string
  }
  status: 'pending' | 'confirmed' | 'disputed' | 'resolved'
  autoAction?: 'hidden' | 'downgraded' | 'flagged' | 'none'
  createdAt: string
}

interface FlagResult {
  action: 'hidden' | 'downgraded' | 'flagged' | 'none'
  reason: string
  mirrorScoreChange: number
  gameScoreChange: number
}

interface BugStats {
  totalReports: number
  pendingReview: number
  confirmedBugs: number
  falsePositives: number
  autoResolved: number
  byType: Record<string, number>
  byGame: Array<{ gameId: number; title: string; reportCount: number }>
}

// ============================================================
// BUG REPORT THRESHOLDS
// ============================================================

const THRESHOLDS = {
  // Auto-hide mirror after this many confirmed bug reports
  autoHideMirror: 5,

  // Auto-downgrade mirror score after this many reports
  autoDowngradeMirror: 3,

  // Auto-flag game after this many reports across all mirrors
  autoFlagGame: 10,

  // Time window for counting reports (hours)
  reportWindowHours: 168, // 7 days

  // Minimum reports needed before auto-action
  minReportsForAction: 2,

  // IP dedup: same IP can only report once per game per day
  ipDedupHours: 24,
}

// ============================================================
// SUBMIT BUG REPORT
// ============================================================

export async function submitBugReport(report: Omit<BugReport, 'id' | 'status' | 'createdAt'>): Promise<{
  success: boolean
  result?: FlagResult
  error?: string
}> {
  try {
    // IP dedup check
    const recentByIp = await supabase
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', report.ipAddress)
      .eq('game_id', report.gameId)
      .gte('created_at', new Date(Date.now() - THRESHOLDS.ipDedupHours * 3600000).toISOString())

    if (recentByIp.count && recentByIp.count > 0) {
      return { success: false, error: 'You have already reported this game recently' }
    }

    // Insert report
    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        game_id: report.gameId,
        mirror_id: report.mirrorId || null,
        user_id: report.userId || null,
        ip_address: report.ipAddress,
        bug_type: report.bugType,
        description: report.description,
        game_version: report.gameVersion || null,
        repacker_name: report.repackerName || null,
        system_info: report.systemInfo || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Analyze and auto-action
    const flagResult = await analyzeAndFlag(report.gameId, report.mirrorId)

    return { success: true, result: flagResult }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// ANALYZE REPORTS AND AUTO-FLAG
// ============================================================

async function analyzeAndFlag(gameId: number, mirrorId?: number): Promise<FlagResult> {
  const windowStart = new Date(Date.now() - THRESHOLDS.reportWindowHours * 3600000).toISOString()

  // Get all reports for this game in the window
  const { data: reports } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('game_id', gameId)
    .gte('created_at', windowStart)

  if (!reports || reports.length < THRESHOLDS.minReportsForAction) {
    return { action: 'none', reason: 'Below report threshold', mirrorScoreChange: 0, gameScoreChange: 0 }
  }

  // Count by type
  const byType: Record<string, number> = {}
  const byMirror: Record<number, number> = {}
  for (const r of reports) {
    byType[r.bug_type] = (byType[r.bug_type] || 0) + 1
    if (r.mirror_id) {
      byMirror[r.mirror_id] = (byMirror[r.mirror_id] || 0) + 1
    }
  }

  // Check if this is a widespread issue (many reports across different types)
  const uniqueTypes = Object.keys(byType).length
  const totalReports = reports.length

  // Auto-flag game if too many reports
  if (totalReports >= THRESHOLDS.autoFlagGame) {
    await supabase
      .from('games')
      .update({ status: 'flagged' })
      .eq('id', gameId)

    // Add to moderation queue
    await supabase.from('moderation_queue').insert({
      item_type: 'game',
      item_id: gameId,
      reason: `Auto-flagged: ${totalReports} bug reports in ${THRESHOLDS.reportWindowHours}h window`,
      severity: totalReports >= 20 ? 'critical' : totalReports >= 10 ? 'high' : 'medium',
      status: 'pending',
      auto_flagged: true,
    })

    return {
      action: 'flagged',
      reason: `Game auto-flagged: ${totalReports} reports across ${uniqueTypes} categories`,
      mirrorScoreChange: 0,
      gameScoreChange: -50,
    }
  }

  // Check specific mirror
  if (mirrorId && byMirror[mirrorId]) {
    const mirrorReports = byMirror[mirrorId]

    if (mirrorReports >= THRESHOLDS.autoHideMirror) {
      // Auto-hide this mirror
      await supabase
        .from('mirrors')
        .update({ status: 'dead', score: 0 })
        .eq('id', mirrorId)

      return {
        action: 'hidden',
        reason: `Mirror auto-hidden: ${mirrorReports} bug reports`,
        mirrorScoreChange: -100,
        gameScoreChange: -10,
      }
    }

    if (mirrorReports >= THRESHOLDS.autoDowngradeMirror) {
      // Downgrade mirror score
      const { data: mirror } = await supabase
        .from('mirrors')
        .select('score')
        .eq('id', mirrorId)
        .single()

      const newScore = Math.max(0, (mirror?.score || 50) - 25)
      await supabase
        .from('mirrors')
        .update({ score: newScore })
        .eq('id', mirrorId)

      return {
        action: 'downgraded',
        reason: `Mirror score reduced: ${mirrorReports} reports`,
        mirrorScoreChange: -25,
        gameScoreChange: -5,
      }
    }
  }

  return { action: 'none', reason: 'Below threshold', mirrorScoreChange: 0, gameScoreChange: 0 }
}

// ============================================================
// GET BUG STATS
// ============================================================

export async function getBugStats(): Promise<BugStats> {
  const { data: allReports } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  const reports = allReports || []

  const byType: Record<string, number> = {}
  const byGameMap = new Map<number, { title: string; count: number }>()

  for (const r of reports) {
    byType[r.bug_type] = (byType[r.bug_type] || 0) + 1

    if (!byGameMap.has(r.game_id)) {
      byGameMap.set(r.game_id, { title: '', count: 0 })
    }
    byGameMap.get(r.game_id)!.count++
  }

  // Fetch game titles
  const gameIds = [...byGameMap.keys()]
  if (gameIds.length > 0) {
    const { data: games } = await supabase
      .from('games')
      .select('id, title')
      .in('id', gameIds)

    for (const g of games || []) {
      if (byGameMap.has(g.id)) {
        byGameMap.get(g.id)!.title = g.title
      }
    }
  }

  const byGame = [...byGameMap.entries()]
    .map(([gameId, data]) => ({ gameId, title: data.title, reportCount: data.count }))
    .sort((a, b) => b.reportCount - a.reportCount)

  return {
    totalReports: reports.length,
    pendingReview: reports.filter(r => r.status === 'pending').length,
    confirmedBugs: reports.filter(r => r.status === 'confirmed').length,
    falsePositives: reports.filter(r => r.status === 'disputed').length,
    autoResolved: reports.filter(r => r.auto_action && r.auto_action !== 'none').length,
    byType,
    byGame,
  }
}

// ============================================================
// RESOLVE BUG REPORT
// ============================================================

export async function resolveBugReport(
  reportId: number,
  resolution: 'confirmed' | 'disputed' | 'resolved',
  notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('bug_reports')
    .update({
      status: resolution,
      resolution_notes: notes || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  return !error
}

// ============================================================
// GET GAME BUG REPORTS
// ============================================================

export async function getGameBugReports(gameId: number): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// ============================================================
// GET RECENT BUG REPORTS (for admin)
// ============================================================

export async function getRecentBugReports(limit = 50): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

// ============================================================
// CHECK IF GAME/MIRROR IS SUSPECT
// ============================================================

export async function isGameSuspect(gameId: number): Promise<{
  suspect: boolean
  reportCount: number
  severity: string
}> {
  const windowStart = new Date(Date.now() - THRESHOLDS.reportWindowHours * 3600000).toISOString()

  const { count } = await supabase
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .gte('created_at', windowStart)

  const reportCount = count || 0
  const suspect = reportCount >= THRESHOLDS.minReportsForAction
  const severity = reportCount >= 20 ? 'critical' : reportCount >= 10 ? 'high' : reportCount >= 5 ? 'medium' : 'low'

  return { suspect, reportCount, severity }
}

export async function isMirrorSuspect(mirrorId: number): Promise<{
  suspect: boolean
  reportCount: number
}> {
  const windowStart = new Date(Date.now() - THRESHOLDS.reportWindowHours * 3600000).toISOString()

  const { count } = await supabase
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .eq('mirror_id', mirrorId)
    .gte('created_at', windowStart)

  const reportCount = count || 0
  return { suspect: reportCount >= THRESHOLDS.autoDowngradeMirror, reportCount }
}
