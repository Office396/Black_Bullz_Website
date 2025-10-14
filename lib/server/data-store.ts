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
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('item_id', itemId)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Group comments by parent_id to reconstruct the nested structure
  const topLevelComments: SiteCommentRecord[] = []
  const repliesMap: Record<number, SiteCommentRecord[]> = {}

  data.forEach(comment => {
    const commentRecord: SiteCommentRecord = {
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
      replies: []
    }

    if (comment.parent_id) {
      // This is a reply
      if (!repliesMap[comment.parent_id]) {
        repliesMap[comment.parent_id] = []
      }
      repliesMap[comment.parent_id].push(commentRecord)
    } else {
      // This is a top-level comment
      topLevelComments.push(commentRecord)
    }
  })

  // Attach replies to their parent comments
  topLevelComments.forEach(comment => {
    comment.replies = repliesMap[comment.id] || []
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
}): Promise<SiteCommentRecord[]> {
  const { itemId, itemName, author, email, content, avatar } = params

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
      parent_id: null
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    throw error
  }

  // Return updated comments list
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
}): Promise<SiteCommentRecord[]> {
  const { itemId, parentId, itemName, author, email, content, avatar } = params

  const { error } = await supabase
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
    status: comment.status
  }))
}
