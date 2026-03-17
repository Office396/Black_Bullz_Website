import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, getFavourites, toggleFavourite } from '@/lib/server/user-store'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getUserByToken(token)
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const favourites = await getFavourites(user.id)
  return NextResponse.json({ success: true, favourites })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { gameId } = await req.json()
  const isFav = await toggleFavourite(user.id, gameId)
  return NextResponse.json({ success: true, isFavourite: isFav })
}
