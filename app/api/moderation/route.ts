// ============================================================
// MODERATION API ROUTE
// Admin moderation queue management
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getModerationQueue,
  getModerationStats,
  approveModerationItem,
  rejectModerationItem,
  scanCommentsForModeration,
  scanMirrorsForModeration,
} from '@/lib/workers/moderation'

export const runtime = 'nodejs'

// GET: Fetch moderation queue
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'stats') {
      const stats = await getModerationStats()
      return NextResponse.json({ success: true, stats })
    }

    if (action === 'scan-comments') {
      const flagged = await scanCommentsForModeration()
      return NextResponse.json({ success: true, flagged })
    }

    if (action === 'scan-mirrors') {
      const flagged = await scanMirrorsForModeration()
      return NextResponse.json({ success: true, flagged })
    }

    const status = (url.searchParams.get('status') as any) || 'pending'
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const items = await getModerationQueue(status, limit)
    return NextResponse.json({ success: true, data: items, items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Approve/Reject items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, itemId, reviewedBy } = body

    if (!itemId || !reviewedBy) {
      return NextResponse.json({ error: 'itemId and reviewedBy required' }, { status: 400 })
    }

    if (action === 'approve') {
      const success = await approveModerationItem(itemId, reviewedBy)
      return NextResponse.json({ success })
    }

    if (action === 'reject') {
      const success = await rejectModerationItem(itemId, reviewedBy)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
