import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title')?.trim()
  const excludeId = req.nextUrl.searchParams.get('excludeId')

  if (!title || title.length < 2) return NextResponse.json({ exists: false })

  let query = supabase.from('items').select('id, title').ilike('title', title).limit(1)
  if (excludeId) query = query.neq('id', Number(excludeId))

  const { data } = await query.single()
  return NextResponse.json({ exists: !!data, match: data?.title || null })
}
