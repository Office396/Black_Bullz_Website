import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('game_id')
  const all = searchParams.get('all') // admin: get all reviews
  const mine = searchParams.get('mine') // get user's own pending review
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null

  if (all === '1') {
    const { data } = await supabase.from('game_reviews').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ success: true, reviews: data || [] })
  }

  if (!gameId) return NextResponse.json({ reviews: [] })
  
  // If user wants their own review (pending, rejected, or approved)
  if (mine === '1' && user) {
    const { data } = await supabase.from('game_reviews').select('*')
      .eq('game_id', gameId).eq('user_id', user.id).in('status', ['pending', 'rejected', 'approved']).order('created_at', { ascending: false })
    return NextResponse.json({ success: true, myReview: data?.[0] || null, reviews: data || [] })
  }
  
  // Only return approved reviews for public
  const { data } = await supabase.from('game_reviews').select('*')
    .eq('game_id', gameId).eq('status', 'approved').order('created_at', { ascending: false })
  return NextResponse.json({ success: true, reviews: data || [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { gameId, gameTitle, rating, content } = await req.json()
  if (!gameId || !rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  // Check if user already reviewed this game
  const { data: existing } = await supabase.from('game_reviews')
    .select('id').eq('game_id', gameId).eq('user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'You already reviewed this game' }, { status: 400 })

  const { error } = await supabase.from('game_reviews').insert({
    game_id: gameId, game_title: gameTitle, user_id: user.id,
    user_name: user.name, rating, content: content?.trim() || null,
    user_badge: (user as any).subscription_plan ? (user as any).subscription_plan : null,
  })
  if (error) return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  const { searchParams } = new URL(req.url)
  const idFromQuery = searchParams.get('id')
  const adminToken = req.headers.get('x-admin-token')
  const isAdmin = adminToken === 'authenticated'
  
  const body = await req.json()
  const { rating, content, status, id } = body
  const reviewId = idFromQuery || id

  // If updating own review (edit)
  if (reviewId && user && rating !== undefined) {
    const { data: existing } = await supabase.from('game_reviews').select('user_id').eq('id', reviewId).single()
    if (existing?.user_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    await supabase.from('game_reviews').update({ rating, content: content?.trim() || null }).eq('id', reviewId)
    return NextResponse.json({ success: true })
  }

  // Admin status update
  if (status && reviewId && isAdmin) {
    await supabase.from('game_reviews').update({ status }).eq('id', reviewId)
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await supabase.from('game_reviews').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
