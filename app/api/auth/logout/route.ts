import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (token) await logoutUser(token)
  return NextResponse.json({ success: true })
}
