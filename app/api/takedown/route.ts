// ============================================================
// TAKEDOWN API ROUTE
// DMCA/copyright takedown workflow
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET: List takedown requests
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'

    const { data, error } = await supabase
      .from('takedown_requests')
      .select('*, games!inner(title), mirrors!inner(host_name, download_url)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, requests: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create takedown request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mirrorId, gameId, reason, type, requestedBy } = body

    if (!mirrorId || !gameId || !reason || !type) {
      return NextResponse.json({ error: 'mirrorId, gameId, reason, and type required' }, { status: 400 })
    }

    // Create takedown request
    const { data, error } = await supabase
      .from('takedown_requests')
      .insert({
        mirror_id: mirrorId,
        game_id: gameId,
        reason,
        type,
        requested_by: requestedBy || 'system',
      })
      .select()
      .single()

    if (error) throw error

    // Auto-hide the mirror
    await supabase
      .from('mirrors')
      .update({ status: 'dead' })
      .eq('id', mirrorId)

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Resolve takedown request
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, resolvedBy, notes } = body

    if (!id || !status || !resolvedBy) {
      return NextResponse.json({ error: 'id, status, and resolvedBy required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('takedown_requests')
      .update({
        status,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If rejected, restore the mirror
    if (status === 'rejected') {
      const { data: takedown } = await supabase
        .from('takedown_requests')
        .select('mirror_id')
        .eq('id', id)
        .single()

      if (takedown) {
        await supabase
          .from('mirrors')
          .update({ status: 'active' })
          .eq('id', takedown.mirror_id)
      }
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
