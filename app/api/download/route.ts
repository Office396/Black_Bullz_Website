// ============================================================
// SMART REDIRECT API ROUTE
// Edge-cached redirects, sticky sessions, deep health checks
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { handleSmartRedirect, getInterstitialHTML, getGeoFromRequest } from '@/lib/workers/smart-redirect'
import { supabase } from '@/lib/supabase'
import { getCachedMirrorStatus, setCachedMirrorStatus, createCachedRedirect } from '@/lib/cache/edge-cache'
import { stickySessions } from '@/lib/cache/sticky-session'

export const runtime = 'nodejs'
export const maxDuration = 30

// GET: Handle download redirect
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gameId = parseInt(url.searchParams.get('gameId') || '0')
    const mirrorId = parseInt(url.searchParams.get('mirrorId') || '0')
    const format = url.searchParams.get('format') || 'redirect'

    if (!gameId || !mirrorId) {
      return NextResponse.json({ error: 'gameId and mirrorId required' }, { status: 400 })
    }

    // Get GeoIP
    const geo = await getGeoFromRequest(request)

    // Check if banned
    if (geo.isBanned) {
      return NextResponse.json({
        error: 'Download not available in your region',
        country: geo.country,
        reason: 'geo_blocked',
      }, { status: 403 })
    }

    // ============================================================
    // STEP 1: Check micro-cache first (instant dead link detection)
    // ============================================================
    const cachedStatus = getCachedMirrorStatus(mirrorId)

    if (cachedStatus && cachedStatus.status === 'dead') {
      return NextResponse.json({
        error: 'Mirror unavailable',
        reason: 'cached_dead',
        mirrorId,
      }, { status: 410 })
    }

    // ============================================================
    // STEP 2: Get mirror from database
    // ============================================================
    const { data: mirror } = await supabase
      .from('mirrors')
      .select('*')
      .eq('id', mirrorId)
      .single()

    if (!mirror || mirror.status !== 'active') {
      // Cache this dead status
      setCachedMirrorStatus(mirrorId, {
        mirrorId,
        status: 'dead',
        score: 0,
        lastChecked: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      })

      return NextResponse.json({ error: 'Mirror not found or inactive' }, { status: 404 })
    }

    // ============================================================
    // STEP 3: Get game
    // ============================================================
    const { data: game } = await supabase
      .from('games')
      .select('id, title, slug, cover_image, repack_size')
      .eq('id', gameId)
      .single()

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // ============================================================
    // STEP 4: Track click (async, don't block redirect)
    // ============================================================
    Promise.all([
      supabase.rpc('increment_mirror_clicks', { mirror_id: mirrorId }),
      supabase.rpc('increment_downloads', { game_id: gameId }),
    ]).catch(() => {})

    // ============================================================
    // STEP 5: Get sticky session affiliate
    // ============================================================
    const session = await stickySessions.getOrCreateSession(request as any, 'download')
    await stickySessions.trackDownload(session.sessionId)

    // ============================================================
    // STEP 6: Return cached redirect or interstitial
    // ============================================================

    // Update cache with healthy status
    setCachedMirrorStatus(mirrorId, {
      mirrorId,
      status: 'active',
      score: mirror.score || 50,
      lastChecked: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    })

    // If format is html, return interstitial page
    if (format === 'html') {
      const html = getInterstitialHTML(
        game,
        mirror.download_url,
        true // popunder
      )
      const response = new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
      response.headers.set('CDN-Cache-Control', 'max-age=60')

      return response
    }

    // Otherwise, redirect directly with cache headers
    const response = NextResponse.redirect(mirror.download_url, 302)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    response.headers.set('CDN-Cache-Control', 'max-age=300')
    response.headers.set('Cloudflare-CDN-Cache-Control', 'max-age=300')

    return response
  } catch (error: any) {
    console.error('[Smart Redirect] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Get optimized mirror list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId } = body

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 })
    }

    // Get GeoIP from request
    const geo = await getGeoFromRequest(request)

    // Get all active mirrors
    const { data: mirrors } = await supabase
      .from('mirrors')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'active')
      .order('priority', { ascending: true })

    if (!mirrors) {
      return NextResponse.json({ mirrors: [] })
    }

    // Score and rank mirrors
    const scored = mirrors.map(mirror => {
      let score = 50

      // Health bonus
      if (mirror.last_alive) {
        const hoursSinceAlive = (Date.now() - new Date(mirror.last_alive).getTime()) / (1000 * 60 * 60)
        if (hoursSinceAlive < 24) score += 30
        else if (hoursSinceAlive < 72) score += 20
        else if (hoursSinceAlive < 168) score += 10
      }

      // Host speed bonus
      const hostSpeeds: Record<string, number> = {
        '1fichier': 20, 'mega.nz': 18, 'gofile': 15,
        'pixeldrain': 12, 'mediafire': 10, 'google drive': 15,
      }
      score += hostSpeeds[mirror.host_name?.toLowerCase()] || 5

      // Click popularity bonus
      if (mirror.clicks > 100) score += 10
      else if (mirror.clicks > 50) score += 5

      return { ...mirror, score }
    })

    // Sort by score
    scored.sort((a, b) => b.score - a.score)

    // Add cache headers
    const response = NextResponse.json({
      mirrors: scored,
      geo: { country: geo.country, continent: geo.continent },
    })

    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
    response.headers.set('CDN-Cache-Control', 'max-age=60')

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
