import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, deleteAllNotifications } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteAllNotifications()
  return NextResponse.json({ success: true })
}
