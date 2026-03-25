import { NextRequest, NextResponse } from 'next/server'
import { loginCreatorPortal } from '@/lib/server/user-store'
import { supabase } from '@/lib/supabase'

// Authenticate creator from portal credentials in header
async function getCreatorFromRequest(req: NextRequest) {
  const portalId = req.headers.get('x-portal-id')
  const portalPassword = req.headers.get('x-portal-password')
  if (!portalId || !portalPassword) return null
  return loginCreatorPortal(portalId, portalPassword)
}

// GET — list games uploaded by this creator
export async function GET(req: NextRequest) {
  const creator = await getCreatorFromRequest(req)
  if (!creator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('publisher', creator.username)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: data || [] })
}

// POST — add a new game
export async function POST(req: NextRequest) {
  const creator = await getCreatorFromRequest(req)
  if (!creator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, ...gameData } = body

  if (action === 'add') {
    // Check for duplicate title (case-insensitive)
    const { data: existing } = await supabase
      .from('items')
      .select('id, title')
      .ilike('title', gameData.title?.trim() || '')
      .limit(1)
      .single()
    if (existing) {
      return NextResponse.json(
        { error: `"${existing.title}" already exists on the site. Duplicate games are not allowed.` },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('items')
      .insert({ ...gameData, publisher: creator.username })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  }

  if (action === 'update') {
    const { id, ...updates } = gameData
    // Verify ownership
    const { data: existing } = await supabase.from('items').select('publisher').eq('id', id).single()
    if (!existing || existing.publisher !== creator.username) {
      return NextResponse.json({ error: 'Not authorized to edit this game' }, { status: 403 })
    }
    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  }

  if (action === 'delete') {
    const { id } = gameData
    const { data: existing } = await supabase.from('items').select('publisher').eq('id', id).single()
    if (!existing || existing.publisher !== creator.username) {
      return NextResponse.json({ error: 'Not authorized to delete this game' }, { status: 403 })
    }
    await supabase.from('items').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
