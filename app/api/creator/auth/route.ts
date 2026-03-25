import { NextRequest, NextResponse } from 'next/server'
import { loginCreatorPortal } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  const { portalId, portalPassword } = await req.json()
  if (!portalId || !portalPassword) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

  const user = await loginCreatorPortal(portalId, portalPassword)
  if (!user) return NextResponse.json({ error: 'Invalid portal ID or password' }, { status: 401 })

  return NextResponse.json({ success: true, user })
}
