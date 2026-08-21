import { SignJWT, jwtVerify } from 'jose'
import { compare, hash } from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bullzgamez-change-this-in-production-env'
)

const ADMIN_TOKEN_EXPIRY = '8h'
const BCRYPT_ROUNDS = 12

export interface AdminJwtPayload {
  role: 'admin'
  username: string
  iat: number
  exp: number
}

export async function signAdminToken(username: string): Promise<string> {
  return new SignJWT({ role: 'admin', username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== 'admin') return null
    return payload as unknown as AdminJwtPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

export async function requireAdmin(request: Request): Promise<{ ok: true; username: string } | { ok: false; response: Response }> {
  const token = getAuthTokenFromRequest(request)
  if (!token) {
    return {
      ok: false,
      response: Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const payload = await verifyAdminToken(token)
  if (!payload) {
    return {
      ok: false,
      response: Response.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  return { ok: true, username: payload.username }
}
