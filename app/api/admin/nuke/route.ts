import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TABLES_TO_CLEAR = [
  'items',
  'comments',
  'download_pages',
  'game_reviews',
  'contact_messages',
  'delete_requests',
  'comment_reactions',
  'page_modifiers',
  'users',
  'user_sessions',
  'user_favourites',
  'user_watch_history',
  'notifications',
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
