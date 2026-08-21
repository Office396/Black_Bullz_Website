// ============================================================
// AUDIT LOG SYSTEM
// Track all admin actions for accountability
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface AuditLogEntry {
  id: number
  action: string
  entityType: 'game' | 'mirror' | 'comment' | 'repacker' | 'user' | 'worker' | 'settings' | 'takedown'
  entityId: number
  adminUser: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: string
}

// ============================================================
// LOG ACTIONS
// ============================================================

export async function logAction(
  action: string,
  entityType: AuditLogEntry['entityType'],
  entityId: number,
  adminUser: string,
  details: Record<string, any> = {},
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      admin_user: adminUser,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  if (error) {
    console.error('[Audit] Log error:', error)
  }
}

// ============================================================
// PREDEFINED ACTIONS
// ============================================================

export const AUDIT_ACTIONS = {
  // Game actions
  GAME_CREATED: 'game.created',
  GAME_UPDATED: 'game.updated',
  GAME_DELETED: 'game.deleted',
  GAME_PUBLISHED: 'game.published',
  GAME_ARCHIVED: 'game.archived',
  GAME_FEATURED: 'game.featured',
  GAME_TRENDING: 'game.trending',

  // Mirror actions
  MIRROR_ADDED: 'mirror.added',
  MIRROR_UPDATED: 'mirror.updated',
  MIRROR_DELETED: 'mirror.deleted',
  MIRROR_DISABLED: 'mirror.disabled',

  // Comment actions
  COMMENT_APPROVED: 'comment.approved',
  COMMENT_DELETED: 'comment.deleted',
  COMMENT_PINNED: 'comment.pinned',

  // Repacker actions
  REPACKER_CREATED: 'repacker.created',
  REPACKER_UPDATED: 'repacker.updated',
  REPACKER_VERIFIED: 'repacker.verified',

  // User actions
  USER_SUSPENDED: 'user.suspended',
  USER_BANNED: 'user.banned',
  USER_PREMIUM_GRANTED: 'user.premium_granted',

  // Worker actions
  WORKER_STARTED: 'worker.started',
  WORKER_STOPPED: 'worker.stopped',
  WORKER_MANUAL_TRIGGER: 'worker.manual_trigger',

  // Settings actions
  SETTINGS_UPDATED: 'settings.updated',
  AD_CONFIG_UPDATED: 'ad_config.updated',
  AFFILIATE_ADDED: 'affiliate.added',

  // Takedown actions
  TAKEDOWN_REQUESTED: 'takedown.requested',
  TAKEDOWN_APPROVED: 'takedown.approved',
  TAKEDOWN_REJECTED: 'takedown.rejected',

  // Auth actions
  ADMIN_LOGIN: 'admin.login',
  ADMIN_LOGOUT: 'admin.logout',
  ADMIN_CREDENTIALS_CHANGED: 'admin.credentials_changed',
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export async function logGameAction(
  action: string,
  gameId: number,
  adminUser: string,
  details: Record<string, any> = {},
  ip?: string
): Promise<void> {
  await logAction(action, 'game', gameId, adminUser, details, ip)
}

export async function logMirrorAction(
  action: string,
  mirrorId: number,
  adminUser: string,
  details: Record<string, any> = {},
  ip?: string
): Promise<void> {
  await logAction(action, 'mirror', mirrorId, adminUser, details, ip)
}

export async function logAdminLogin(
  adminUser: string,
  ip: string,
  userAgent: string
): Promise<void> {
  await logAction(AUDIT_ACTIONS.ADMIN_LOGIN, 'user', 0, adminUser, {}, ip, userAgent)
}

export async function logSettingsChange(
  adminUser: string,
  settingKey: string,
  oldValue: any,
  newValue: any,
  ip?: string
): Promise<void> {
  await logAction(AUDIT_ACTIONS.SETTINGS_UPDATED, 'settings', 0, adminUser, {
    settingKey,
    oldValue,
    newValue,
  }, ip)
}

// ============================================================
// QUERY AUDIT LOGS
// ============================================================

export async function getAuditLogs(
  options: {
    entityType?: AuditLogEntry['entityType']
    entityId?: number
    adminUser?: string
    action?: string
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
  } = {}
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')

  if (options.entityType) {
    query = query.eq('entity_type', options.entityType)
  }
  if (options.entityId) {
    query = query.eq('entity_id', options.entityId)
  }
  if (options.adminUser) {
    query = query.eq('admin_user', options.adminUser)
  }
  if (options.action) {
    query = query.eq('action', options.action)
  }
  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getAuditLogStats(): Promise<{
  totalActions: number
  todayActions: number
  topAdmins: Array<{ admin: string; count: number }>
  recentActions: AuditLogEntry[]
}> {
  const today = new Date().toISOString().split('T')[0]

  const [totalResult, todayResult, recentResult] = await Promise.all([
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  // Get top admins
  const { data: allLogs } = await supabase
    .from('audit_logs')
    .select('admin_user')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const adminCounts: Record<string, number> = {}
  for (const log of allLogs || []) {
    adminCounts[log.admin_user] = (adminCounts[log.admin_user] || 0) + 1
  }

  const topAdmins = Object.entries(adminCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([admin, count]) => ({ admin, count }))

  return {
    totalActions: totalResult.count || 0,
    todayActions: todayResult.count || 0,
    topAdmins,
    recentActions: recentResult.data || [],
  }
}
