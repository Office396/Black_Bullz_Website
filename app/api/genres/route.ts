import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('custom_genres').select('*').order('name')
  return NextResponse.json({ success: true, genres: data || [] })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const { data, error } = await supabase.from('custom_genres').insert({ name: name.trim(), slug }).select().single()
  if (error) return NextResponse.json({ error: 'Genre already exists or failed to add' }, { status: 400 })
  return NextResponse.json({ success: true, genre: data })
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json()
  if (!id || !name?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  await supabase.from('custom_genres').update({ name: name.trim(), slug }).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await supabase.from('custom_genres').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
