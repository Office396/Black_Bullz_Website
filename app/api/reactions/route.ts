import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('game_id')
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null

  const { data: counts } = await supabase
    .from('items').select('likes, dislikes').eq('id', gameId).single()

  let userReaction = null
  if (user && gameId) {
    const { data } = await supabase.from('game_reactions')
      .select('reaction').eq('game_id', gameId).eq('user_id', user.id).single()
    userReaction = data?.reaction || null
  }

  return NextResponse.json({ likes: counts?.likes || 0, dislikes: counts?.dislikes || 0, userReaction })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { gameId, reaction } = await req.json()
  if (!gameId || !['like', 'dislike'].includes(reaction)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  // Check existing reaction
  const { data: existing } = await supabase.from('game_reactions')
    .select('reaction').eq('game_id', gameId).eq('user_id', user.id).single()

  if (existing?.reaction === reaction) {
    // Toggle off — remove reaction
    await supabase.from('game_reactions').delete().eq('game_id', gameId).eq('user_id', user.id)
    await supabase.rpc('update_reaction_counts', { p_game_id: gameId })
    return NextResponse.json({ success: true, userReaction: null })
  }

  // Upsert reaction
  await supabase.from('game_reactions').upsert({ game_id: gameId, user_id: user.id, reaction }, { onConflict: 'game_id,user_id' })
  await supabase.rpc('update_reaction_counts', { p_game_id: gameId })

  return NextResponse.json({ success: true, userReaction: reaction })
}
