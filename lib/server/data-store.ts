import { supabase } from '../supabase'

export type Status = 'new' | 'read'

export interface SiteCommentRecord {
  id: number
  itemId: number
  itemName: string
  author: string
  email?: string
  avatar?: string
  content: string
  timestamp: string
  likes: number
  dislikes: number
  status: Status
  user_badge?: string
  user_badge_color?: string
  replies?: SiteCommentRecord[]
}

export interface FlattenedComment {
  id: number
  itemId: number
  itemName: string
  author: string
  email: string
  content: string
  type: 'comment' | 'reply'
  parentId?: number
  timestamp: string
  status: Status
}

export async function getComments(itemId: number): Promise<SiteCommentRecord[]> {
  // Get all comments for this item (both top-level and replies)
  // Show: approved comments, or comments with null approval_status, or admin replies
  // Replies show if parent exists (even if pending)
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('item_id', itemId)
    .or(`approval_status.eq.approved,approval_status.is.null,parent_id.is.not.null`)

  if (error) {
    // Fallback: try without approval_status filter (column may not exist yet)
    const { data: fallback } = await supabase
      .from('comments').select('*').eq('item_id', itemId).order('timestamp', { ascending: false })
    if (!fallback) return []
    return buildCommentTree(fallback)
  }

  return buildCommentTree(data || [])
}

function buildCommentTree(data: any[]): SiteCommentRecord[] {
  const commentMap: Record<number, SiteCommentRecord> = {}
  const topLevelComments: SiteCommentRecord[] = []

  // First pass: create all records
  data.forEach(comment => {
    commentMap[comment.id] = {
      id: comment.id,
      itemId: comment.item_id,
      itemName: comment.item_name,
      author: comment.author,
      email: comment.email,
      avatar: comment.avatar,
      content: comment.content,
      timestamp: comment.timestamp,
      likes: comment.likes,
      dislikes: comment.dislikes,
      status: comment.status,
      user_badge: comment.user_badge,
      user_badge_color: comment.user_badge_color,
      replies: []
    }
  })

  // Second pass: attach to parents
  data.forEach(comment => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies!.push(commentMap[comment.id])
    } else {
      topLevelComments.push(commentMap[comment.id])
    }
  })

  // Sort replies older to newer
  Object.values(commentMap).forEach(comment => {
    comment.replies!.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })

  return topLevelComments
}

export async function addComment(params: {
  itemId: number
  itemName: string
  author: string
  email?: string
  content: string
  avatar?: string
  userBadge?: string
  userBadgeColor?: string
}): Promise<SiteCommentRecord[]> {
  const { itemId, itemName, author, email, content, avatar, userBadge, userBadgeColor } = params

  // Set default colors based on badge type if no color provided
  const defaultColors: Record<string, string> = {
    'Member': '#6b7280',
    'Freedom Fighter': '#3b82f6',
    'Revolution Leader': '#a855f7',
    'Revolutionist': '#eab308',
  }
  const finalColor = userBadgeColor || defaultColors[userBadge || ''] || null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      item_id: itemId,
      item_name: itemName,
      author: author.trim(),
      email: email?.trim() || '',
      avatar,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      status: 'new',
      approval_status: 'pending',
      user_badge: userBadge || null,
      user_badge_color: finalColor,
      parent_id: null
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    throw error
  }

  return await getComments(itemId)
}

export async function addReply(params: {
  itemId: number
  parentId: number
  itemName: string
  author: string
  email?: string
  content: string
  avatar?: string
  userBadge?: string
  userBadgeColor?: string
  isAdmin?: boolean
}): Promise<SiteCommentRecord[]> {
  const { itemId, parentId, itemName, author, email, content, avatar, userBadge, userBadgeColor, isAdmin } = params

  // Set default colors based on badge type if no color provided
  const defaultColors: Record<string, string> = {
    'Member': '#6b7280',
    'Freedom Fighter': '#3b82f6',
    'Revolution Leader': '#a855f7',
    'Revolutionist': '#eab308',
  }

  // If admin, set Admin badge and Bullz Community name
  const badge = isAdmin ? 'Admin' : (userBadge || null)
  const badgeColor = isAdmin ? '#FFD700' : (userBadgeColor || defaultColors[userBadge || ''] || null) // Gold color for admin
  const authorName = isAdmin ? 'Bullz Community' : author.trim()

  const { error } = await supabase
    .from('comments')
    .insert({
      item_id: itemId,
      item_name: itemName,
      author: authorName,
      email: email?.trim() || '',
      avatar,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      status: 'new',
      approval_status: isAdmin ? 'approved' : 'pending',
      user_badge: badge,
      user_badge_color: badgeColor,
      parent_id: parentId
    })

  if (error) {
    console.error('Error adding reply:', error)
    throw error
  }

  // Return updated comments list
  return await getComments(itemId)
}

export async function deleteCommentOrReply(itemId: number, targetId: number): Promise<{ updated: SiteCommentRecord[]; deleted: boolean }> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', targetId)

  const deleted = !error

  if (error) {
    console.error('Error deleting comment/reply:', error)
  }

  const updated = await getComments(itemId)
  return { updated, deleted }
}

export async function reactToComment(params: {
  itemId: number
  targetId: number
  reaction: 'like' | 'dislike'
}): Promise<SiteCommentRecord[]> {
  const { targetId, reaction } = params

  // First get current values
  const { data: currentComment, error: fetchError } = await supabase
    .from('comments')
    .select('likes, dislikes')
    .eq('id', targetId)
    .single()

  if (fetchError) {
    console.error('Error fetching comment for reaction:', fetchError)
    throw fetchError
  }

  const incrementField = reaction === 'like' ? 'likes' : 'dislikes'
  const newValue = (currentComment[incrementField] || 0) + 1

  const { error } = await supabase
    .from('comments')
    .update({
      [incrementField]: newValue
    })
    .eq('id', targetId)

  if (error) {
    console.error('Error reacting to comment:', error)
    throw error
  }

  // Return updated comments list
  return await getComments(params.itemId)
}

export async function setCommentStatus(itemId: number, targetId: number, status: Status): Promise<SiteCommentRecord[]> {
  const { error } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', targetId)

  if (error) {
    console.error('Error updating comment status:', error)
    throw error
  }

  // Return updated comments list
  return await getComments(itemId)
}

export async function flattenCommentsForAdmin(): Promise<FlattenedComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching flattened comments:', error)
    return []
  }

  return data.map(comment => ({
    id: comment.id,
    itemId: comment.item_id,
    itemName: comment.item_name,
    author: comment.author,
    email: comment.email,
    content: comment.content,
    type: comment.parent_id ? 'reply' : 'comment',
    parentId: comment.parent_id,
    timestamp: comment.timestamp,
    status: comment.status,
    approval_status: comment.approval_status,
    likes: comment.likes,
    dislikes: comment.dislikes,
  }))
}
