import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, addWatchHistory, getWatchHistory } from '@/lib/server/user-store'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getUserByToken(token)
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const history = await getWatchHistory(user.id)
  return NextResponse.json({ success: true, history })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { gameId } = await req.json()
  await addWatchHistory(user.id, gameId)
  return NextResponse.json({ success: true })
}
