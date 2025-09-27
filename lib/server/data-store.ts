import { promises as fs } from 'fs'
import path from 'path'

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

type CommentsStore = Record<string, SiteCommentRecord[]>

const DATA_DIR = path.join(process.cwd(), 'data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as T
  } catch (e: any) {
    if (e?.code === 'ENOENT') return fallback
    throw e
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function readCommentsStore(): Promise<CommentsStore> {
  return await readJsonFile<CommentsStore>(COMMENTS_FILE, {})
}

export async function writeCommentsStore(store: CommentsStore): Promise<void> {
  await writeJsonFile(COMMENTS_FILE, store)
}

export async function getComments(itemId: number): Promise<SiteCommentRecord[]> {
  const store = await readCommentsStore()
  return store[String(itemId)] || []
}

export async function setComments(itemId: number, list: SiteCommentRecord[]): Promise<void> {
  const store = await readCommentsStore()
  store[String(itemId)] = list
  await writeCommentsStore(store)
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
  const list = await getComments(itemId)
  const now = new Date()
  const record: SiteCommentRecord = {
    id: Date.now(),
    itemId,
    itemName,
    author: author.trim(),
    email: email?.trim() || '',
    avatar,
    content: content.trim(),
    timestamp: now.toISOString(),
    likes: 0,
    dislikes: 0,
    status: 'new',
    replies: [],
  }
  const updated = [record, ...list]
  await setComments(itemId, updated)
  return updated
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
  const list = await getComments(itemId)
  const now = new Date()
  const reply: SiteCommentRecord = {
    id: Date.now(),
    itemId,
    itemName,
    author: author.trim(),
    email: email?.trim() || '',
    avatar,
    content: content.trim(),
    timestamp: now.toISOString(),
    likes: 0,
    dislikes: 0,
    status: 'new',
  }

  const updated = list.map((c) => {
    if (c.id === parentId) {
      const replies = [...(c.replies || []), reply]
      return { ...c, replies }
    }
    return c
  })

  await setComments(itemId, updated)
  return updated
}

export async function deleteCommentOrReply(itemId: number, targetId: number): Promise<{ updated: SiteCommentRecord[]; deleted: boolean }> {
  const list = await getComments(itemId)
  let deleted = false

  // Try delete top-level
  let updated = list.filter((c) => {
    if (c.id === targetId) {
      deleted = true
      return false
    }
    return true
  })

  if (!deleted) {
    // Try delete a reply
    updated = updated.map((c) => {
      const before = c.replies?.length || 0
      const replies = (c.replies || []).filter((r) => r.id !== targetId)
      if (replies.length !== before) deleted = true
      return { ...c, replies }
    })
  }

  if (deleted) await setComments(itemId, updated)
  return { updated, deleted }
}

export async function reactToComment(params: {
  itemId: number
  targetId: number
  reaction: 'like' | 'dislike'
}): Promise<SiteCommentRecord[]> {
  const { itemId, targetId, reaction } = params
  const list = await getComments(itemId)
  const updated = list.map((c) => {
    if (c.id === targetId) {
      return { ...c, [reaction === 'like' ? 'likes' : 'dislikes']: (c[reaction === 'like' ? 'likes' : 'dislikes'] || 0) + 1 }
    }
    const replies = (c.replies || []).map((r) => {
      if (r.id === targetId) {
        return { ...r, [reaction === 'like' ? 'likes' : 'dislikes']: (r[reaction === 'like' ? 'likes' : 'dislikes'] || 0) + 1 }
      }
      return r
    })
    return { ...c, replies }
  })
  await setComments(itemId, updated)
  return updated
}

export async function setCommentStatus(itemId: number, targetId: number, status: Status): Promise<SiteCommentRecord[]> {
  const list = await getComments(itemId)
  const updated = list.map((c) => {
    if (c.id === targetId) return { ...c, status }
    const replies = (c.replies || []).map((r) => (r.id === targetId ? { ...r, status } : r))
    return { ...c, replies }
  })
  await setComments(itemId, updated)
  return updated
}

export async function flattenCommentsForAdmin(): Promise<FlattenedComment[]> {
  const store = await readCommentsStore()
  const rows: FlattenedComment[] = []
  Object.keys(store).forEach((key) => {
    const itemId = Number(key)
    const list = store[key]
    list.forEach((c) => {
      rows.push({
        id: c.id,
        itemId,
        itemName: c.itemName,
        author: c.author,
        email: c.email || '',
        content: c.content,
        type: 'comment',
        timestamp: c.timestamp,
        status: c.status,
      })
      ;(c.replies || []).forEach((r) => {
        rows.push({
          id: r.id,
          itemId,
          itemName: r.itemName || c.itemName,
          author: r.author,
          email: r.email || '',
          content: r.content,
          type: 'reply',
          parentId: c.id,
          timestamp: r.timestamp,
          status: r.status,
        })
      })
    })
  })
  // Newest first by timestamp
  rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return rows
}
