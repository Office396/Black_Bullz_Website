// ============================================================
// GAMES API
// Fetches from new games table with mirrors
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET: Fetch games or single game by ID/slug
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const genre = url.searchParams.get('genre')
    const repacker = url.searchParams.get('repacker')
    const search = url.searchParams.get('search')
    const sort = url.searchParams.get('sort') || 'created_at'
    const order = url.searchParams.get('order') || 'desc'

    // Single game by ID
    if (id) {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', parseInt(id))
        .single()

      if (error || !game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
      }

      // Fetch mirrors for this game
      const { data: mirrors } = await supabase
        .from('mirrors')
        .select('*')
        .eq('game_id', game.id)
        .order('priority', { ascending: false })

      return NextResponse.json({
        success: true,
        data: { ...game, mirrors: mirrors || [] }
      })
    }

    // Single game by slug
    if (slug) {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
      }

      const { data: mirrors } = await supabase
        .from('mirrors')
        .select('*')
        .eq('game_id', game.id)
        .order('priority', { ascending: false })

      return NextResponse.json({
        success: true,
        data: { ...game, mirrors: mirrors || [] }
      })
    }

    // List games with filters
    let query = supabase
      .from('games')
      .select('*', { count: 'exact' })
      .eq('status', 'published')

    if (genre) {
      query = query.contains('genres', [genre])
    }

    if (repacker) {
      query = query.ilike('repacker_name', `%${repacker}%`)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,developer.ilike.%${search}%,publisher.ilike.%${search}%`)
    }

    const validSorts = ['created_at', 'downloads', 'views', 'rating', 'title']
    const sortField = validSorts.includes(sort) ? sort : 'created_at'
    const ascending = order === 'asc'

    query = query.order(sortField, { ascending })
    query = query.range(offset, offset + limit - 1)

    const { data: games, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: games || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
