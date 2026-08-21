// ============================================================
// ANALYTICS API ROUTE
// Stats and tracking endpoints
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { analytics, trackGameView, trackDownload, trackSearch } from '@/lib/workers/analytics'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET: Get analytics stats
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || url.searchParams.get('type')

    if (action === 'stats') {
      const period = (url.searchParams.get('period') as any) || 'month'
      const stats = await analytics.getStats(period)
      return NextResponse.json({ success: true, stats })
    }

    if (action === 'daily-stats') {
      const days = parseInt(url.searchParams.get('days') || '30')
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('stat_date', { ascending: false })
        .limit(days)

      if (error) throw error
      return NextResponse.json({ success: true, data: data || [], stats: data || [] })
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

    if (action === 'top-games') {
      const { data, error } = await supabase
        .from('games')
        .select('id, title, slug, cover_image, downloads, views')
        .eq('status', 'published')
        .order('downloads', { ascending: false })
        .limit(10)

      if (error) throw error
      return NextResponse.json({ success: true, games: data || [] })
    }

    if (action === 'top-repackers') {
      const { data, error } = await supabase
        .from('games')
        .select('repacker_name')
        .eq('status', 'published')

      if (error) throw error

      const counts: Record<string, number> = {}
      for (const game of data || []) {
        const repacker = game.repacker_name || 'Unknown'
        counts[repacker] = (counts[repacker] || 0) + 1
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      return NextResponse.json({ success: true, repackers: sorted })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Track events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'pageview') {
      await trackGameView(data.gameId, data.gameTitle, data.source || 'direct')
      return NextResponse.json({ success: true })
    }

    if (action === 'download') {
      await trackDownload(data.gameId, data.mirrorId, data.host)
      return NextResponse.json({ success: true })
    }

    if (action === 'search') {
      await trackSearch(data.query, data.results)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
