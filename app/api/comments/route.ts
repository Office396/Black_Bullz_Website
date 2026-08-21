// ============================================================
// COMMENTS API ROUTE
// Nested comments with threading support
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getGameComments,
  addComment,
  replyToComment,
  likeComment,
  dislikeComment,
  deleteComment,
  getCommentCount,
} from '@/lib/server/comment-store'

export const runtime = 'nodejs'

// GET: Fetch comments for a game
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gameId = url.searchParams.get('gameId')
    const action = url.searchParams.get('action')

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 })
    }

    if (action === 'count') {
      const count = await getCommentCount(parseInt(gameId))
      return NextResponse.json({ success: true, count })
    }

    const comments = await getGameComments(parseInt(gameId))
    return NextResponse.json({ success: true, comments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Add comment or reply
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, parentId, author, email, content, action } = body

    if (!gameId || !content) {
      return NextResponse.json({ error: 'gameId and content required' }, { status: 400 })
    }

    if (action === 'like') {
      await likeComment(body.commentId)
      return NextResponse.json({ success: true })
    }

    if (action === 'dislike') {
      await dislikeComment(body.commentId)
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      await deleteComment(body.commentId)
      return NextResponse.json({ success: true })
    }

    if (parentId) {
      const reply = await replyToComment(parentId, gameId, author || 'Anonymous', content)
      if (!reply) {
        return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
      }
      return NextResponse.json({ success: true, comment: reply })
    }

    const comment = await addComment({ gameId, author: author || 'Anonymous', email, content })
    if (!comment) {
      return NextResponse.json({ error: 'Failed to add comment (spam detected?)' }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
