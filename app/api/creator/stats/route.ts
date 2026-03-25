import { NextRequest, NextResponse } from 'next/server'
import { loginCreatorPortal } from '@/lib/server/user-store'
import { supabase } from '@/lib/supabase'

async function getCreator(req: NextRequest) {
  const portalId = req.headers.get('x-portal-id')
  const portalPassword = req.headers.get('x-portal-password')
  if (!portalId || !portalPassword) return null
  return loginCreatorPortal(portalId, portalPassword)
}

export async function GET(req: NextRequest) {
  const creator = await getCreator(req)
  if (!creator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all game IDs for this creator
  const { data: games } = await supabase
    .from('items')
    .select('id')
    .eq('publisher', creator.username)

  if (!games || games.length === 0) return NextResponse.json({ success: true, stats: {} })

  const gameIds = games.map(g => g.id)

  // Fetch counts in parallel
  const [watchRes, favRes, trendingRes, topRes] = await Promise.all([
    supabase.from('user_watch_history').select('game_id').in('game_id', gameIds),
    supabase.from('user_favourites').select('game_id').in('game_id', gameIds),
    supabase.from('page_modifier_store').select('data').eq('key', 'trending_games').single(),
    supabase.from('page_modifier_store').select('data').eq('key', 'top_games').single(),
  ])

  // Aggregate per game
  const stats: Record<number, { watches: number; favourites: number; isTrending: boolean; isTop: boolean }> = {}
  for (const id of gameIds) {
    stats[id] = { watches: 0, favourites: 0, isTrending: false, isTop: false }
  }

  for (const row of watchRes.data || []) {
    if (stats[row.game_id]) stats[row.game_id].watches++
  }
  for (const row of favRes.data || []) {
    if (stats[row.game_id]) stats[row.game_id].favourites++
  }

  const trendingIds: number[] = trendingRes.data?.data?.gameIds || []
  const topIds: number[] = topRes.data?.data?.gameIds || []
  for (const id of gameIds) {
    stats[id].isTrending = trendingIds.includes(id)
    stats[id].isTop = topIds.includes(id)
  }

  return NextResponse.json({ success: true, stats })
}
