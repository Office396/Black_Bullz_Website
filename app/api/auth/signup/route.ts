import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json()
    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    const result = await createUser({ name, username, email, password })
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, user: result.user, token: result.token })
  } catch (e: any) {
    console.error('[signup error]', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
