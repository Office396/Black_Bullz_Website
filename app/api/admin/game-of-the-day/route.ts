import { NextResponse } from 'next/server'
import { getPageModifierData, updateGameOfTheDay, type GameOfTheDay } from '@/lib/server/page-modifier-store'
import { sendBroadcastNotification } from '@/lib/server/user-store'

export async function GET() {
  try {
    const data = await getPageModifierData()
    return NextResponse.json({ game: data.gameOfTheDay })
  } catch (error) {
    console.error('Failed to get game of the day:', error)
    return NextResponse.json({ game: null })
  }
}

export async function POST(request: Request) {
  try {
    const { game } = await request.json() as { game: GameOfTheDay | null }
    
    const success = await updateGameOfTheDay(game)
    
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update game of the day' }, { status: 500 })
    }

    if (game?.title) {
      await sendBroadcastNotification('Game of the Day', `Today's pick: ${game.title} — check it out!`, 'success')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update game of the day:', error)
    return NextResponse.json({ success: false, error: 'Failed to update game of the day' }, { status: 500 })
  }
}
