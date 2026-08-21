// ============================================================
// WATCHLIST API ROUTE
// User game following & notifications
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET: Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const gameId = url.searchParams.get('gameId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    let query = supabase
      .from('user_watchlists')
      .select('*, games!inner(id, title, slug, cover_image, repack_date, status)')
      .eq('user_id', parseInt(userId))

    if (gameId) {
      query = query.eq('game_id', parseInt(gameId))
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, watchlist: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Add to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gameId, notifyOnRepack = true, notifyOnUpdate = true } = body

    if (!userId || !gameId) {
      return NextResponse.json({ error: 'userId and gameId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_watchlists')
      .upsert({
        user_id: parseInt(userId),
        game_id: parseInt(gameId),
        notify_on_repack: notifyOnRepack,
        notify_on_update: notifyOnUpdate,
      }, { onConflict: 'user_id,game_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, item: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Remove from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const gameId = url.searchParams.get('gameId')

    if (!userId || !gameId) {
      return NextResponse.json({ error: 'userId and gameId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', parseInt(userId))
      .eq('game_id', parseInt(gameId))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
