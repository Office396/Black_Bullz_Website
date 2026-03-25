import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const { data } = await supabase.from('publishers').select('*').eq('slug', slug).single()
    return NextResponse.json({ success: true, publisher: data || null })
  }

  const { data } = await supabase.from('publishers').select('*').order('name')
  return NextResponse.json({ success: true, publishers: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ...fields } = body

  if (action === 'delete') {
    await supabase.from('publishers').delete().eq('id', fields.id)
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    const { id, ...updateFields } = fields
    if (updateFields.name) updateFields.slug = updateFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const { data, error } = await supabase.from('publishers').update(updateFields).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, publisher: data })
  }

  // Create
  if (!fields.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const slug = fields.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const { data, error } = await supabase.from('publishers').insert({ ...fields, slug }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, publisher: data })
}
