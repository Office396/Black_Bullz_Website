import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, getNotifications, getUnreadNotifications, markNotificationsRead, markNotificationRead } from '@/lib/server/user-store'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getUserByToken(token)
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ notifications: [] })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === '1'

  if (unreadOnly) {
    const notifications = await getUnreadNotifications(user.id)
    return NextResponse.json({ success: true, notifications })
  }

  const notifications = await getNotifications(user.id)
  return NextResponse.json({ success: true, notifications })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  if (body.notification_id) {
    await markNotificationRead(user.id, body.notification_id)
  } else {
    await markNotificationsRead(user.id)
  }

  return NextResponse.json({ success: true })
}
