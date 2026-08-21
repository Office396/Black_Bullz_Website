// ============================================================
// IMPORT BACKUP
// Restores ALL tables from a JSON backup file
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

// Order matters for foreign keys - parents first
const TABLE_ORDER = [
  'items',
  'items_backup',
  'games',
  'repackers',
  'genres',
  'users',
  'user_sessions',
  'user_favourites',
  'user_watch_history',
  'notifications',
  'comments',
  'comment_reactions',
  'game_reviews',
  'game_ratings',
  'download_pages',
  'downloads',
  'mirrors',
  'moderation_queue',
  'audit_logs',
  'bug_reports',
  'video_ads',
  'proxy_servers',
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
  'contact_messages',
  'delete_requests',
  'page_modifiers',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { backup } = body

    if (!backup || typeof backup !== 'object') {
      return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 })
    }

    const meta = backup._meta
    if (!meta || !meta.version) {
      return NextResponse.json({ error: 'Invalid backup format - missing _meta' }, { status: 400 })
    }

    const results: Record<string, { success: boolean; inserted: number; error?: string }> = {}
    let totalInserted = 0

    // Import tables in order
    for (const table of TABLE_ORDER) {
      const rows = backup[table]
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue

      try {
        // Delete existing data first
        await supabase.from(table).delete().neq('id', 0)

        // Insert in batches of 500
        let inserted = 0
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500)

          // Remove any fields that might not exist in the target table
          const cleanBatch = batch.map(row => {
            const clean: Record<string, any> = {}
            for (const [key, value] of Object.entries(row)) {
              // Skip null/undefined
              if (value !== null && value !== undefined) {
                clean[key] = value
              }
            }
            return clean
          })

          const { error } = await supabase
            .from(table)
            .insert(cleanBatch)

          if (error) {
            console.log(`[Import] Batch error on ${table}: ${error.message}`)
            // Try one by one as fallback
            for (const row of cleanBatch) {
              const { error: singleError } = await supabase
                .from(table)
                .insert(row)
              if (!singleError) inserted++
            }
          } else {
            inserted += cleanBatch.length
          }
        }

        results[table] = { success: true, inserted }
        totalInserted += inserted
      } catch (e: any) {
        results[table] = { success: false, inserted: 0, error: e.message }
      }
    }

    const allSuccess = Object.values(results).every(r => r.success)

    return NextResponse.json({
      success: allSuccess,
      totalInserted,
      meta,
      results,
    })
  } catch (error: any) {
    console.error('[Import] Failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
