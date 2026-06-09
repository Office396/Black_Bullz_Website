import { NextResponse } from 'next/server'
import { getPageModifierData, updateTrendingGames, type TrendingGame } from '@/lib/server/page-modifier-store'
import { sendBroadcastNotification } from '@/lib/server/user-store'

export async function GET() {
  try {
    const data = await getPageModifierData()
    return NextResponse.json({ games: data.trendingGames })
  } catch (error) {
    console.error('Failed to get trending games:', error)
    return NextResponse.json({ games: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { games } = await request.json() as { games: TrendingGame[] }
    
    const success = await updateTrendingGames(games)
    
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update trending games' }, { status: 500 })
    }

    const gameNames = games.map(g => g.title).filter(Boolean)
    if (gameNames.length > 0) {
      const preview = gameNames.length === 1 ? gameNames[0] : `${gameNames[0]} and ${gameNames.length - 1} more`
      await sendBroadcastNotification('Trending Games Updated', `Check out what's trending — ${preview} is hot right now!`, 'info')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update trending games:', error)
    return NextResponse.json({ success: false, error: 'Failed to update trending games' }, { status: 500 })
  }
}
