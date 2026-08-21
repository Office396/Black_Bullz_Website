// ============================================================
// FULL DATABASE EXPORT
// Exports ALL tables as a single JSON backup file
// ============================================================

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TABLES_TO_EXPORT = [
  'games',
  'mirrors',
  'repackers',
  'genres',
  'comments',
  'comment_reactions',
  'game_reviews',
  'game_ratings',
  'audit_logs',
  'moderation_queue',
  'bug_reports',
  'video_ads',
  'proxy_servers',
  'discord_queue',
  'ad_variants',
  'version_history',
  'discord_signals',
  'affiliate_clicks',
  'analytics_events',
  'daily_stats',
  'click_logs',
  'request_logs',
  'ip_whitelist',
  'worker_status',
  'sticky_sessions',
  'download_pages',
  'users',
  'user_sessions',
  'user_favourites',
  'user_watch_history',
  'notifications',
  'contact_messages',
  'delete_requests',
  'page_modifiers',
  'items',
  'items_backup',
]

export async function GET() {
  try {
    const backup: Record<string, any[]> = {}
    let totalRows = 0

    for (const table of TABLES_TO_EXPORT) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')

        if (error) {
          // Table might not exist, skip it
          console.log(`[Export] Skipping ${table}: ${error.message}`)
          continue
        }

        backup[table] = data || []
        totalRows += (data || []).length
      } catch (e) {
        // Table doesn't exist, skip
      }
    }

    const exportData = {
      _meta: {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        site: process.env.NEXT_PUBLIC_SITE_NAME || 'BullzGamez',
        totalTables: Object.keys(backup).length,
        totalRows,
        tables: Object.fromEntries(
          Object.entries(backup).map(([table, rows]) => [table, rows.length])
        ),
      },
      ...backup,
    }

    const json = JSON.stringify(exportData, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bullzgamez-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error('[Export] Failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
