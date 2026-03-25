import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ user: null })
    const user = await getUserByToken(token)
    return NextResponse.json({ user })
  } catch (e: any) {
    console.error('[me error]', e?.message)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
