import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, sendNotification, approvePlan, rejectPlan } from '@/lib/server/user-store'
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

  if (body.action === 'approve_subscription') {
    await approvePlan(body.user_id)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'reject_subscription') {
    await rejectPlan(body.user_id, body.reason || 'Payment could not be verified.')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

