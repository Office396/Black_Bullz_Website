import { NextResponse } from 'next/server'
import { getPageModifierData, updateTrendingGames, type TrendingGame } from '@/lib/server/page-modifier-store'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update trending games:', error)
    return NextResponse.json({ success: false, error: 'Failed to update trending games' }, { status: 500 })
  }
}
