import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken } from '@/lib/server/user-store'

export async function GET() {
  const { data } = await supabase.from('game_requests').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ success: true, requests: data || [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required to submit requests' }, { status: 401 })

  const { gameTitle, platform, description } = await req.json()
  if (!gameTitle?.trim()) return NextResponse.json({ error: 'Game title is required' }, { status: 400 })

  const { error } = await supabase.from('game_requests').insert({
    user_id: user.id,
    user_name: user.name,
    game_title: gameTitle.trim(),
    platform: platform || 'PC',
    description: description || '',
  })

  if (error) return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  await supabase.from('game_requests').update({ status }).eq('id', id)
  return NextResponse.json({ success: true })
}
