// ============================================================
// BUG REPORTS API
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { submitBugReport, getBugStats, getRecentBugReports, resolveBugReport, isGameSuspect, isMirrorSuspect } from '@/lib/workers/bug-flagging'

export const runtime = 'nodejs'

// GET: Fetch bug reports or stats
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const gameId = url.searchParams.get('gameId')
    const mirrorId = url.searchParams.get('mirrorId')

    if (action === 'stats') {
      const stats = await getBugStats()
      return NextResponse.json({ success: true, data: stats })
    }

    if (action === 'suspect' && gameId) {
      const result = await isGameSuspect(parseInt(gameId))
      return NextResponse.json({ success: true, data: result })
    }

    if (action === 'mirror-suspect' && mirrorId) {
      const result = await isMirrorSuspect(parseInt(mirrorId))
      return NextResponse.json({ success: true, data: result })
    }

    const reports = await getRecentBugReports(50)
    return NextResponse.json({ success: true, data: reports })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Submit bug report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'

    const result = await submitBugReport({
      gameId: body.gameId,
      mirrorId: body.mirrorId,
      userId: body.userId,
      ipAddress: ip,
      bugType: body.bugType,
      description: body.description || '',
      gameVersion: body.gameVersion,
      repackerName: body.repackerName,
      systemInfo: body.systemInfo,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH: Resolve bug report (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, resolution, notes } = body

    if (!id || !resolution) {
      return NextResponse.json({ success: false, error: 'Missing id or resolution' }, { status: 400 })
    }

    const success = await resolveBugReport(id, resolution, notes)
    return NextResponse.json({ success })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
