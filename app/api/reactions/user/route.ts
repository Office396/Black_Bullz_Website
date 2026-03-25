import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ likedGameIds: [] })

  const { data } = await supabase.from('game_reactions')
    .select('game_id').eq('user_id', user.id).eq('reaction', 'like')

  return NextResponse.json({ likedGameIds: (data || []).map((r: any) => r.game_id) })
}
