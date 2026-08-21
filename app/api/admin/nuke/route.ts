// ============================================================
// NUKE ALL DATA
// Deletes ALL data from ALL tables
// ============================================================

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Foreign key order - children first, parents last
const TABLES_TO_CLEAR = [
  // New system tables
  'bug_reports',
  'video_ads',
  'discord_queue',
  'discord_signals',
  'ad_variants',
  'version_history',
  'affiliate_clicks',
  'analytics_events',
  'daily_stats',
  'click_logs',
  'request_logs',
  'ip_whitelist',
  'worker_status',
  'sticky_sessions',
  'moderation_queue',
  'audit_logs',
  'comment_reactions',
  'comments',
  'game_reviews',
  'game_ratings',
  'mirrors',
  'downloads',
  'games',
  'repackers',
  'genres',
  // Old system tables
  'items',
  'items_backup',
  'download_pages',
  'contact_messages',
  'delete_requests',
  'page_modifiers',
  'notifications',
  'user_favourites',
  'user_watch_history',
  'user_sessions',
  'users',
  'proxy_servers',
]

export async function POST() {
  try {
    const results: Record<string, { success: boolean; deleted: number; error?: string }> = {}

    for (const table of TABLES_TO_CLEAR) {
      try {
        const { count } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })

        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 0)

        if (error) {
          results[table] = { success: false, deleted: 0, error: error.message }
        } else {
          results[table] = { success: true, deleted: count || 0 }
        }
      } catch (e: any) {
        results[table] = { success: false, deleted: 0, error: e.message || 'Unknown error' }
      }
    }

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.deleted || 0), 0)
    const allSuccess = Object.values(results).every(r => r.success)

    return NextResponse.json({
      success: allSuccess,
      totalDeleted,
      results,
    })
  } catch (error: any) {
    console.error('Nuke error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
