import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, updateUser, changePassword, changeCreatorPortalPassword, deleteUser } from '@/lib/server/user-store'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getUserByToken(token)
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'update_profile') {
    const updated = await updateUser(user.id, { name: body.name, username: body.username, bio: body.bio, avatar: body.avatar, banner: body.banner })
    return NextResponse.json({ success: true, user: updated })
  }

  if (body.action === 'change_password') {
    const result = await changePassword(user.id, body.currentPassword, body.newPassword)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'change_creator_portal_password') {
    if (!user.is_creator) return NextResponse.json({ error: 'Not a creator' }, { status: 403 })
    await changeCreatorPortalPassword(user.id, body.newPassword)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'delete_account') {
    await deleteUser(user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
