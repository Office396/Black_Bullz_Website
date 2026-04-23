import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken } from '@/lib/server/user-store'

// GET - Get all delete requests (for admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  
  const { data, error } = await supabase
    .from('delete_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// POST - Create a delete request (for users)
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required', success: false }, { status: 401 })

  const { commentId, itemId, author, content } = await req.json()
  if (!commentId || !itemId) {
    return NextResponse.json({ error: 'Missing data', success: false }, { status: 400 })
  }

  // Check if user owns this comment
  const { data: comment } = await supabase
    .from('comments')
    .select('author, email, item_id')
    .eq('id', commentId)
    .single()

  if (!comment) return NextResponse.json({ error: 'Comment not found', success: false }, { status: 404 })
  
  // Check if user is the author (by email match)
  if (comment.email !== user.email) {
    return NextResponse.json({ error: 'You can only request deletion of your own comments', success: false }, { status: 403 })
  }

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('delete_requests')
    .select('id')
    .eq('comment_id', commentId)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Delete request already pending', success: false })
  }

  const { error } = await supabase
    .from('delete_requests')
    .insert({
      comment_id: commentId,
      item_id: itemId,
      user_id: user.id,
      author: author || comment.author,
      content: content || ''
    })

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}

// PATCH - Update delete request status (for admin)
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminToken = searchParams.get('adminToken')
  
  if (adminToken !== 'authenticated') {
    return NextResponse.json({ error: 'Admin access required', success: false }, { status: 403 })
  }

  const { id, action } = await req.json()
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing data', success: false }, { status: 400 })
  }

  // Get the delete request
  const { data: deleteReq } = await supabase
    .from('delete_requests')
    .select('comment_id')
    .eq('id', id)
    .single()

  if (!deleteReq) {
    return NextResponse.json({ error: 'Request not found', success: false }, { status: 404 })
  }

  if (action === 'approve') {
    // Delete the comment
    await supabase.from('comments').delete().eq('id', deleteReq.comment_id)
    // Update request status
    await supabase.from('delete_requests').update({ status: 'approved' }).eq('id', id)
    return NextResponse.json({ success: true })
  } else if (action === 'reject') {
    // Just update request status
    await supabase.from('delete_requests').update({ status: 'rejected' }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 })
}