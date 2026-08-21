// ============================================================
// NUKE ALL DATA
// Uses fast SQL function to clear all tables
// ============================================================

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    // Call the fast nuke function
    const { error } = await supabase.rpc('nuke_all_data')

    if (error) {
      // Fallback: delete manually from key tables
      const tables = [
        'bug_reports', 'discord_queue', 'analytics_events', 'daily_stats',
        'click_logs', 'worker_status', 'sticky_sessions', 'moderation_queue',
        'comment_reactions', 'comments', 'game_reviews', 'mirrors',
        'games', 'repackers', 'genres', 'items', 'items_backup',
        'download_pages', 'users', 'user_sessions', 'notifications',
      ]

      for (const table of tables) {
        try {
          await supabase.from(table).delete().neq('id', 0)
        } catch {
          // Skip
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All data deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
