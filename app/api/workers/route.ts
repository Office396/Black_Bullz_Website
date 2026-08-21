// ============================================================
// WORKER API ROUTES
// Endpoints to trigger and monitor background workers
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  triggerWorker,
  triggerAllWorkers,
  getWorkerStatus,
  getWorkerStatusFromDB,
} from '@/lib/workers/orchestrator'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

// GET: Get worker status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'status') {
      const status = await getWorkerStatusFromDB()
      return NextResponse.json({ success: true, workers: status })
    }

    if (action === 'status-memory') {
      const status = getWorkerStatus()
      return NextResponse.json({ success: true, workers: status })
    }

    if (action === 'link-health') {
      const { data: mirrors } = await supabase
        .from('mirrors')
        .select('id, status')

      const total = mirrors?.length || 0
      const active = mirrors?.filter(m => m.status === 'active').length || 0
      const dead = mirrors?.filter(m => m.status === 'dead').length || 0
      const checking = mirrors?.filter(m => m.status === 'checking').length || 0
      const healthScore = total > 0 ? Math.round((active / total) * 100) : 0

      return NextResponse.json({
        success: true,
        data: { total, active, dead, checking, healthScore },
      })
    }

    if (action === 'earnings') {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('analytics_events').select('revenue').gte('created_at', todayStart),
        supabase.from('analytics_events').select('revenue').gte('created_at', weekStart),
        supabase.from('analytics_events').select('revenue').gte('created_at', monthStart),
      ])

      const today = todayResult.data?.reduce((sum: number, e: any) => sum + (e.revenue || 0), 0) || 0
      const thisWeek = weekResult.data?.reduce((sum: number, e: any) => sum + (e.revenue || 0), 0) || 0
      const thisMonth = monthResult.data?.reduce((sum: number, e: any) => sum + (e.revenue || 0), 0) || 0

      return NextResponse.json({
        success: true,
        data: { total: thisMonth, today, thisWeek, thisMonth, bySource: {} },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Trigger workers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { worker, action } = body

    if (action === 'trigger-all') {
      await triggerAllWorkers()
      return NextResponse.json({ success: true, message: 'All workers triggered' })
    }

    if (action === 'trigger' && worker) {
      const result = await triggerWorker(worker)
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
