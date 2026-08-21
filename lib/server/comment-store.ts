// ============================================================
// COMMENT SYSTEM with Nested Replies & Threaded Comments
// Supports crack verification discussions
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface Comment {
  id: number
  gameId: number
  parentId: number | null
  author: string
  email: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  dislikes: number
  status: 'new' | 'approved' | 'spam' | 'deleted'
  replies?: Comment[]
  isOP: boolean
  isPinned: boolean
}

interface CommentInput {
  gameId: number
  parentId?: number | null
  author: string
  email?: string
  content: string
}

// ============================================================
// GET COMMENTS (Threaded)
// ============================================================

export async function getGameComments(gameId: number): Promise<Comment[]> {
  // Get all comments for the game
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('game_id', gameId)
    .in('status', ['approved', 'new'])
    .order('created_at', { ascending: false })

  if (error || !comments) return []

  // Build threaded structure
  const commentMap = new Map<number, Comment>()
  const rootComments: Comment[] = []

  // First pass: create map
  for (const comment of comments) {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
      isOP: false,
      isPinned: false,
    })
  }

  // Second pass: build tree
  for (const comment of comments) {
    const node = commentMap.get(comment.id)!
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies!.push(node)
    } else {
      rootComments.push(node)
    }
  }

  // Sort: pinned first, then by date
  rootComments.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return rootComments
}

// ============================================================
// ADD COMMENT
// ============================================================

export async function addComment(input: CommentInput): Promise<Comment | null> {
  // Basic spam check
  const spamCheck = await checkForSpam(input.content, input.author, input.email)
  if (spamCheck.isSpam) {
    console.log(`[Comments] Spam detected: ${spamCheck.reason}`)
    return null
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      game_id: input.gameId,
      parent_id: input.parentId || null,
      author: input.author || 'Anonymous',
      email: input.email || '',
      content: input.content,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      status: 'new', // Requires moderation
    })
    .select()
    .single()

  if (error) {
    console.error('[Comments] Add error:', error)
    return null
  }

  return {
    ...data,
    replies: [],
    isOP: false,
    isPinned: false,
  }
}

// ============================================================
// REPLY TO COMMENT
// ============================================================

export async function replyToComment(
  parentId: number,
  gameId: number,
  author: string,
  content: string
): Promise<Comment | null> {
  return addComment({
    gameId,
    parentId,
    author,
    content,
  })
}

// ============================================================
// LIKE / DISLIKE
// ============================================================

export async function likeComment(commentId: number): Promise<boolean> {
  const { error } = await supabase.rpc('increment_comment_likes', { comment_id: commentId })
  return !error
}

export async function dislikeComment(commentId: number): Promise<boolean> {
  const { error } = await supabase.rpc('increment_comment_dislikes', { comment_id: commentId })
  return !error
}

// ============================================================
// PIN / UNPIN COMMENT
// ============================================================

export async function pinComment(commentId: number): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ is_pinned: true })
    .eq('id', commentId)

  return !error
}

export async function unpinComment(commentId: number): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ is_pinned: false })
    .eq('id', commentId)

  return !error
}

// ============================================================
// DELETE COMMENT (Soft delete)
// ============================================================

export async function deleteComment(commentId: number): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', commentId)

  return !error
}

// ============================================================
// SPAM DETECTION
// ============================================================

async function checkForSpam(
  content: string,
  author: string,
  email?: string
): Promise<{ isSpam: boolean; reason: string }> {
  // Check for spam patterns
  const spamPatterns = [
    /(?:buy|sell|cheap|discount|coupon|promo|free gift|click here|visit my|check out my)/i,
    /(?:telegram|whatsapp|discord\.gg|bit\.ly|tinyurl|shorturl)/i,
    /(?:earn money|make money|work from home|passive income)/i,
    /\b(?:viagra|cialis|casino|betting|gambling|porn|xxx)\b/i,
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isSpam: true, reason: `Spam pattern: ${pattern.source}` }
    }
  }

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length
  if (linkCount > 3) {
    return { isSpam: true, reason: `Too many links: ${linkCount}` }
  }

  // Check for excessive caps
  const upperCount = (content.match(/[A-Z]/g) || []).length
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length
  if (letterCount > 10 && upperCount / letterCount > 0.8) {
    return { isSpam: true, reason: 'Excessive caps' }
  }

  // Check for duplicate comments from same email
  if (email) {
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    if (count && count > 3) {
      return { isSpam: true, reason: 'Too many comments in short time' }
    }
  }

  return { isSpam: false, reason: '' }
}

// ============================================================
// GET COMMENT COUNT
// ============================================================

export async function getCommentCount(gameId: number): Promise<number> {
  const { count } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .in('status', ['approved', 'new'])

  return count || 0
}

// ============================================================
// GET RECENT COMMENTS (for admin/activity feed)
// ============================================================

export async function getRecentComments(limit = 20): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, games!inner(title, slug)')
    .in('status', ['approved', 'new'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}
