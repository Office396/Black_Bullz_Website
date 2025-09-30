import { NextResponse } from 'next/server'
import { validateCredentials, updateAdminCredentials, getAdminCredentials } from '@/lib/server/admin-store'

// POST: Login - validate credentials
// PUT: Update credentials

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 })
    }

    const isValid = await validateCredentials(username, password)
    if (isValid) {
      return NextResponse.json({ success: true, message: 'Login successful' })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { currentUsername, currentPassword, newUsername, newPassword } = await request.json()

    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    // Validate current credentials
    const isValid = await validateCredentials(currentUsername, currentPassword)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Current credentials invalid' }, { status: 401 })
    }

    // Update credentials
    await updateAdminCredentials({ username: newUsername, password: newPassword })

    return NextResponse.json({ success: true, message: 'Credentials updated successfully' })
  } catch (error) {
    console.error('Update credentials error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update credentials' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const credentials = await getAdminCredentials()
    // Don't return password, just username for display
    return NextResponse.json({ success: true, username: credentials.username })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get credentials' }, { status: 500 })
  }
}