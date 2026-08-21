import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bullzgamez-change-this-in-production-env'
)

async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.role === 'admin'
  } catch {
    return false
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = request.cookies.get('admin_token')?.value
  if (cookie) return cookie
  return null
}

async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = getTokenFromRequest(request)
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Protect ALL /api/admin/* routes (GET, POST, PUT, DELETE)
  if (pathname.startsWith('/api/admin')) {
    const denied = await requireAdminAuth(request)
    if (denied) return denied
  }

  // Protect /api/items for write operations (POST, PUT, PATCH, DELETE)
  if (pathname === '/api/items' && method !== 'GET') {
    const denied = await requireAdminAuth(request)
    if (denied) return denied
  }

  // Protect /api/export-games (admin only - exports all data)
  if (pathname === '/api/export-games') {
    const denied = await requireAdminAuth(request)
    if (denied) return denied
  }

  // Protect /api/moderation POST (approve/reject)
  if (pathname === '/api/moderation' && method === 'POST') {
    const denied = await requireAdminAuth(request)
    if (denied) return denied
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/items',
    '/api/export-games',
    '/api/moderation',
    '/admin/:path*',
  ],
}
