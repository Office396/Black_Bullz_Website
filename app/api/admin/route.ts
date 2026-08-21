import { NextResponse } from 'next/server'
import { validateCredentials, updateAdminCredentials, getAdminCredentials } from '@/lib/server/admin-store'
import { signAdminToken, requireAdmin } from '@/lib/server/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 })
    }

    const isValid = await validateCredentials(username, password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signAdminToken(username)

    const response = NextResponse.json({ success: true, token })

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { currentUsername, currentPassword, newUsername, newPassword } = await request.json()

    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    await updateAdminCredentials(currentUsername, currentPassword, newUsername, newPassword)

    return NextResponse.json({ success: true, message: 'Credentials updated successfully' })
  } catch (error: any) {
    console.error('Update credentials error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update credentials' },
      { status: 400 }
    )
  }
}

export async function GET() {
  try {
    const credentials = await getAdminCredentials()
    return NextResponse.json({ success: true, username: credentials.username })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get credentials' }, { status: 500 })
  }
}
