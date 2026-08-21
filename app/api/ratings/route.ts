// ============================================================
// RATINGS API ROUTE
// User ratings with auto-flag low quality
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getGameRatings,
  getGameRatingStats,
  addOrUpdateRating,
  deleteRating,
  markRatingHelpful,
  getTopRatedGames,
  getUserRatings,
} from '@/lib/server/rating-store'

export const runtime = 'nodejs'

// GET: Fetch ratings for a game or top rated
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gameId = url.searchParams.get('gameId')
    const userId = url.searchParams.get('userId')
    const action = url.searchParams.get('action')

    if (action === 'top') {
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const games = await getTopRatedGames(limit)
      return NextResponse.json({ success: true, games })
    }

    if (userId) {
      const ratings = await getUserRatings(userId)
      return NextResponse.json({ success: true, ratings })
    }

    if (!gameId) {
      return NextResponse.json({ error: 'gameId or userId required' }, { status: 400 })
    }

    const [ratings, stats] = await Promise.all([
      getGameRatings(parseInt(gameId)),
      getGameRatingStats(parseInt(gameId)),
    ])

    return NextResponse.json({ success: true, ratings, stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Add/update rating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, userId, rating, review, action } = body

    if (action === 'helpful') {
      await markRatingHelpful(body.ratingId)
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      await deleteRating(gameId, userId)
      return NextResponse.json({ success: true })
    }

    if (!gameId || !userId || !rating) {
      return NextResponse.json({ error: 'gameId, userId, and rating required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const result = await addOrUpdateRating(gameId, userId, rating, review || '')
    if (!result) {
      return NextResponse.json({ error: 'Failed to add rating' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rating: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
