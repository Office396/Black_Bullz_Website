import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/server/user-store'
import { sendNotification } from '@/lib/server/user-store'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const users = await getAllUsers()
  return NextResponse.json({ success: true, users })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.action === 'send_notification') {
    await sendNotification({
      user_id: body.user_id || undefined,
      title: body.title,
      message: body.message,
      type: body.type || 'info'
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'delete_user') {
    await supabase.from('users').delete().eq('id', body.user_id)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_role') {
    await supabase.from('users').update({ role: body.role }).eq('id', body.user_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
