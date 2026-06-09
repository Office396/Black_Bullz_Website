import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserByToken, sendNotification } from '@/lib/server/user-store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null

  if (!user || !itemId) {
    return NextResponse.json({ reactions: {} })
  }

  const { data: reactions } = await supabase
    .from('comment_reactions')
    .select('comment_id, reaction_type')
    .eq('user_id', user.id)
    .eq('item_id', Number(itemId))

  const reactionsMap: Record<number, 'like' | 'dislike'> = {}
  if (reactions) {
    reactions.forEach(r => {
      reactionsMap[r.comment_id] = r.reaction_type
    })
  }

  return NextResponse.json({ reactions: reactionsMap })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = token ? await getUserByToken(token) : null
  if (!user) return NextResponse.json({ error: 'Login required', success: false }, { status: 401 })

  const { itemId, commentId, reaction } = await req.json()
  if (!itemId || !commentId || !['like', 'dislike'].includes(reaction)) {
    return NextResponse.json({ error: 'Invalid', success: false }, { status: 400 })
  }

  const numItemId = Number(itemId)

  // Check existing reaction
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id, reaction_type')
    .eq('item_id', numItemId)
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // If same reaction, remove it (toggle off)
    if (existing.reaction_type === reaction) {
      await supabase.from('comment_reactions').delete().eq('id', existing.id)
      // Decrement count
      if (reaction === 'like') {
        await supabase.rpc('decrement_comment_likes', { p_comment_id: commentId })
      } else {
        await supabase.rpc('decrement_comment_dislikes', { p_comment_id: commentId })
      }
      return NextResponse.json({ success: true, action: 'removed', reaction: null })
    } else {
      // Different reaction - update it
      await supabase.from('comment_reactions').update({ reaction_type: reaction }).eq('id', existing.id)
      // Update counts: decrement old, increment new
      if (existing.reaction_type === 'like') {
        await supabase.rpc('decrement_comment_likes', { p_comment_id: commentId })
        await supabase.rpc('increment_comment_dislikes', { p_comment_id: commentId })
      } else {
        await supabase.rpc('decrement_comment_dislikes', { p_comment_id: commentId })
        await supabase.rpc('increment_comment_likes', { p_comment_id: commentId })
      }
      return NextResponse.json({ success: true, action: 'changed', reaction })
    }
  }

  // Insert new reaction
  const { error } = await supabase
    .from('comment_reactions')
    .insert({ item_id: numItemId, comment_id: commentId, user_id: user.id, reaction_type: reaction })

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  // Update comment counts
  if (reaction === 'like') {
    await supabase.rpc('increment_comment_likes', { p_comment_id: commentId })
  } else {
    await supabase.rpc('increment_comment_dislikes', { p_comment_id: commentId })
  }

  try {
    const { data: comment } = await supabase.from('comments').select('user_id, author, item_name').eq('id', commentId).single()
    if (comment?.user_id && comment.user_id !== user.id) {
      const reactionText = reaction === 'like' ? 'liked' : 'disliked'
      await sendNotification({ user_id: comment.user_id, title: `Comment ${reactionText}`, message: `${user.name} ${reactionText} your comment on ${comment.item_name || 'a game'}`, type: 'info' })
    }
  } catch {}

  return NextResponse.json({ success: true, action: 'added', reaction })
}