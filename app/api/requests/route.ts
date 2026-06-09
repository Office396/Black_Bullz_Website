import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken, sendNotification } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  let query = supabase.from('game_requests').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
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
  const { id, status, user_id } = await req.json()
  await supabase.from('game_requests').update({ status }).eq('id', id)
  if (user_id) {
    const statusMessages: Record<string, string> = {
      in_progress: 'Your game request is now being worked on!',
      completed: 'Your requested game has been added!',
      rejected: 'Your game request could not be fulfilled at this time.',
    }
    if (statusMessages[status]) {
      await sendNotification({ user_id, title: 'Game Request Update', message: statusMessages[status], type: status === 'completed' ? 'success' : status === 'rejected' ? 'warning' : 'info' })
    }
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Check if it's a user deleting their own request
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null

  if (user) {
    // User can only delete their own requests
    const { error } = await supabase.from('game_requests').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  } else {
    // Admin delete (no token check — admin panel handles auth separately)
    const { error } = await supabase.from('game_requests').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
