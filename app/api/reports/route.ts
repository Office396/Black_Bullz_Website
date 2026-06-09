import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken, sendNotification } from '@/lib/server/user-store'

export async function GET() {
  const { data } = await supabase.from('game_reports').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ success: true, reports: data || [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { gameId, gameTitle, reportType, description } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  const { error } = await supabase.from('game_reports').insert({
    game_id: gameId,
    game_title: gameTitle,
    user_id: user.id,
    user_name: user.name,
    report_type: reportType || 'error',
    description: description.trim(),
  })

  if (error) return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { id, status, user_id } = await req.json()
  await supabase.from('game_reports').update({ status }).eq('id', id)
  if (user_id && status) {
    const statusMessages: Record<string, string> = {
      resolved: 'Your report has been reviewed and resolved. Thank you!',
      dismissed: 'Your report has been reviewed but no action was needed.',
    }
    if (statusMessages[status]) {
      await sendNotification({ user_id, title: 'Report Update', message: statusMessages[status], type: status === 'resolved' ? 'success' : 'info' })
    }
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await supabase.from('game_reports').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
