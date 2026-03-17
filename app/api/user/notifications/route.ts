import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, getNotifications, markNotificationsRead } from '@/lib/server/user-store'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getUserByToken(token)
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ notifications: [] })
  const notifications = await getNotifications(user.id)
  return NextResponse.json({ success: true, notifications })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await markNotificationsRead(user.id)
  return NextResponse.json({ success: true })
}
