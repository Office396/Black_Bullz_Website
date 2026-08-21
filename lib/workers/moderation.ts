// ============================================================
// MODERATION QUEUE SYSTEM
// Auto-flags bad comments/links, allows Admin review
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface ModerationItem {
  id: number
  itemType: 'comment' | 'mirror' | 'game' | 'review'
  itemId: number
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  autoFlagged: boolean
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

interface FlagResult {
  flagged: boolean
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// ============================================================
// AUTO-FLAGGING RULES
// ============================================================

// Comment moderation rules
const COMMENT_RULES = {
  // Auto-flag comments with excessive negative engagement
  DISLIKE_THRESHOLD: 5,
  // Auto-flag comments containing spam patterns
  SPAM_PATTERNS: [
    /(?:buy|sell|cheap|discount|coupon|promo|free gift|click here|visit my|check out my)/i,
    /(?:telegram|whatsapp|discord\.gg|bit\.ly|tinyurl|shorturl)/i,
    /(?:earn money|make money|work from home|passive income)/i,
    /\b(?:viagra|cialis|casino|betting|gambling|porn|xxx)\b/i,
  ],
  // Auto-flag comments with excessive caps
  CAPS_THRESHOLD: 0.7, // 70% uppercase
  // Auto-flag comments that are too short
  MIN_LENGTH: 5,
}

// Mirror moderation rules
const MIRROR_RULES = {
  // Auto-flag mirrors from suspicious hosts
  SUSPICIOUS_HOSTS: ['mega.nz', 'mediafire.com'],
  // Auto-flag mirrors that failed health checks multiple times
  HEALTH_CHECK_FAILURE_THRESHOLD: 3,
  // Auto-flag mirrors with very old last_alive
  STALE_DAYS: 30,
}

// ============================================================
// COMMENT FLAGGING
// ============================================================

export async function flagComment(commentId: number, content: string, dislikes: number): Promise<FlagResult> {
  // Rule 1: Excessive dislikes
  if (dislikes >= COMMENT_RULES.DISLIKE_THRESHOLD) {
    await createModerationItem('comment', commentId, `Comment has ${dislikes} dislikes (threshold: ${COMMENT_RULES.DISLIKE_THRESHOLD})`, 'medium', true)
    return { flagged: true, reason: 'Excessive dislikes', severity: 'medium' }
  }

  // Rule 2: Spam patterns
  for (const pattern of COMMENT_RULES.SPAM_PATTERNS) {
    if (pattern.test(content)) {
      await createModerationItem('comment', commentId, `Spam pattern detected: ${pattern.source}`, 'high', true)
      return { flagged: true, reason: 'Spam pattern detected', severity: 'high' }
    }
  }

  // Rule 3: Excessive caps
  const upperCount = (content.match(/[A-Z]/g) || []).length
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length
  if (letterCount > 10 && upperCount / letterCount > COMMENT_RULES.CAPS_THRESHOLD) {
    await createModerationItem('comment', commentId, 'Excessive uppercase text', 'low', true)
    return { flagged: true, reason: 'Excessive caps', severity: 'low' }
  }

  // Rule 4: Too short
  if (content.trim().length < COMMENT_RULES.MIN_LENGTH) {
    await createModerationItem('comment', commentId, 'Comment too short', 'low', true)
    return { flagged: true, reason: 'Too short', severity: 'low' }
  }

  return { flagged: false, reason: '', severity: 'low' }
}

// ============================================================
// MIRROR FLAGGING
// ============================================================

export async function flagMirror(mirrorId: number, gameId: number, hostName: string, status: string, healthCheckFailures: number): Promise<FlagResult> {
  // Rule 1: Dead link
  if (status === 'dead') {
    await createModerationItem('mirror', mirrorId, `Mirror is dead (host: ${hostName})`, 'high', true)
    return { flagged: true, reason: 'Dead link', severity: 'high' }
  }

  // Rule 2: Multiple health check failures
  if (healthCheckFailures >= MIRROR_RULES.HEALTH_CHECK_FAILURE_THRESHOLD) {
    await createModerationItem('mirror', mirrorId, `Failed health check ${healthCheckFailures} times`, 'medium', true)
    return { flagged: true, reason: 'Multiple health check failures', severity: 'medium' }
  }

  // Rule 3: Suspicious host
  if (MIRROR_RULES.SUSPICIOUS_HOSTS.some(host => hostName.toLowerCase().includes(host))) {
    await createModerationItem('mirror', mirrorId, `Mirror from suspicious host: ${hostName}`, 'low', true)
    return { flagged: true, reason: 'Suspicious host', severity: 'low' }
  }

  return { flagged: false, reason: '', severity: 'low' }
}

// ============================================================
// GAME FLAGGING
// ============================================================

export async function flagGame(gameId: number, reason: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
  await createModerationItem('game', gameId, reason, severity, false)
}

// ============================================================
// CREATE MODERATION ITEM
// ============================================================

async function createModerationItem(
  itemType: 'comment' | 'mirror' | 'game' | 'review',
  itemId: number,
  reason: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  autoFlagged: boolean
): Promise<void> {
  // Check if already flagged
  const { data: existing } = await supabase
    .from('moderation_queue')
    .select('id')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) return

  await supabase.from('moderation_queue').insert({
    item_type: itemType,
    item_id: itemId,
    reason,
    severity,
    auto_flagged: autoFlagged,
  })

  console.log(`[Moderation] Flagged ${itemType} #${itemId}: ${reason} (${severity})`)
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function approveModerationItem(id: number, reviewedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return !error
}

export async function rejectModerationItem(id: number, reviewedBy: string): Promise<boolean> {
  const { data: item, error: fetchError } = await supabase
    .from('moderation_queue')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !item) return false

  // Take action based on item type
  if (item.item_type === 'comment') {
    await supabase.from('comments').update({ status: 'deleted' }).eq('id', item.item_id)
  } else if (item.item_type === 'mirror') {
    await supabase.from('mirrors').update({ status: 'dead' }).eq('id', item.item_id)
  }

  const { error } = await supabase
    .from('moderation_queue')
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return !error
}

// ============================================================
// GET MODERATION QUEUE
// ============================================================

export async function getModerationQueue(
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' = 'pending',
  limit = 50
): Promise<ModerationItem[]> {
  const { data, error } = await supabase
    .from('moderation_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

export async function getModerationStats(): Promise<{
  pending: number
  highSeverity: number
  todayFlagged: number
}> {
  const today = new Date().toISOString().split('T')[0]

  const [pendingResult, highResult, todayResult] = await Promise.all([
    supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('severity', 'high'),
    supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).gte('created_at', today),
  ])

  return {
    pending: pendingResult.count || 0,
    highSeverity: highResult.count || 0,
    todayFlagged: todayResult.count || 0,
  }
}

// ============================================================
// BATCH SCANNING
// ============================================================

export async function scanCommentsForModeration(): Promise<number> {
  // Get recent comments that haven't been checked
  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, dislikes, status')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!comments) return 0

  let flaggedCount = 0
  for (const comment of comments) {
    const result = await flagComment(comment.id, comment.content, comment.dislikes || 0)
    if (result.flagged) flaggedCount++
  }

  return flaggedCount
}

export async function scanMirrorsForModeration(): Promise<number> {
  // Get mirrors with health check failures
  const { data: mirrors } = await supabase
    .from('mirrors')
    .select('id, game_id, host_name, status')
    .eq('status', 'dead')
    .order('last_checked', { ascending: false })
    .limit(50)

  if (!mirrors) return 0

  let flaggedCount = 0
  for (const mirror of mirrors) {
    const result = await flagMirror(mirror.id, mirror.game_id, mirror.host_name, mirror.status, 0)
    if (result.flagged) flaggedCount++
  }

  return flaggedCount
}
