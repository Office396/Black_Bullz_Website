"use client"

import { useEffect, useState } from "react"
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, LogIn, Star } from "lucide-react"
import { useUser } from "@/lib/user-context"
import Link from "next/link"

interface Comment {
  id: number
  author: string
  content: string
  timestamp: string
  likes: number
  dislikes: number
  replies?: Comment[]
}

interface CommentsProps {
  gameId: number
  itemName: string
}

function formatTimestamp(ts: string) {
  const d = new Date(ts), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Comments({ gameId, itemName }: CommentsProps) {
  const { user, token } = useUser() || {}
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    try { setIsAdmin(localStorage.getItem("admin_token") === "authenticated") } catch {}
    fetch(`/api/comments?itemId=${gameId}`, { cache: 'no-store' })
      .then(r => r.json()).then(d => { if (d.success) setComments(d.data || []) }).catch(() => {})
  }, [gameId])

  const apiPost = async (body: object) => {
    const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    if (json.success) setComments(json.data)
    return json
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    await apiPost({ action: 'add', itemId: gameId, itemName, author: user.name, email: user.email || '', content: newComment.trim() })
    setNewComment("")
    setSubmitting(false)
  }

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim() || !user) return
    await apiPost({ action: 'reply', itemId: gameId, parentId, itemName, author: user.name, email: user.email || '', content: replyContent.trim() })
    setReplyContent("")
    setReplyingTo(null)
  }

  const handleReact = async (targetId: number, reaction: 'like' | 'dislike') => {
    await apiPost({ action: 'react', itemId: gameId, targetId, reaction })
  }

  const handleDelete = async (targetId: number) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
    await apiPost({ action: 'delete', itemId: gameId, targetId, adminToken })
  }

  const CommentCard = ({ c, isReply = false }: { c: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-3' : ''}`}>
      <div className={`${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-[#9d4edd]/30 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {c.author.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white font-semibold text-sm">{c.author}</span>
            <span className="text-gray-600 text-xs">{formatTimestamp(c.timestamp)}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{c.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button onClick={() => handleReact(c.id, 'like')} className="flex items-center gap-1 text-gray-500 hover:text-green-400 transition-colors text-xs">
            <ThumbsUp className="w-3.5 h-3.5" /> {c.likes}
          </button>
          <button onClick={() => handleReact(c.id, 'dislike')} className="flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors text-xs">
            <ThumbsDown className="w-3.5 h-3.5" /> {c.dislikes}
          </button>
          {!isReply && (
            <button onClick={() => {
              if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return }
              setReplyingTo(replyingTo === c.id ? null : c.id)
            }} className="flex items-center gap-1 text-gray-500 hover:text-[#9d4edd] transition-colors text-xs">
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
          )}
          {isAdmin && (
            <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 transition-colors text-xs ml-auto">Delete</button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === c.id && (
          <div className="mt-2 flex gap-2">
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={2} placeholder="Write a reply..."
              className="flex-1 bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none text-sm resize-none transition-colors" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleReply(c.id)} disabled={!replyContent.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-xs font-semibold disabled:opacity-40 transition-colors">Post</button>
              <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 rounded-lg border border-[#2d1b54] text-gray-400 text-xs hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Replies */}
        {c.replies?.map(r => <CommentCard key={r.id} c={r} isReply />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#9d4edd]" />
        Comments <span className="text-gray-500 font-normal text-base">({comments.length})</span>
      </h2>

      {/* Comment input */}
      <div className="relative">
        {!user ? (
          <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl p-5 text-center">
            <LogIn className="w-8 h-8 text-[#9d4edd] mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-3">Sign in to join the conversation</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">Log in</Link>
              <Link href="/signup" className="px-4 py-2 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">Sign up</Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#9d4edd]/30 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3}
                placeholder="Share your thoughts..."
                className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none text-sm resize-none transition-colors"
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }} />
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 text-xs">Ctrl+Enter to post</span>
                <button onClick={handleSubmit} disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No comments yet. Be the first!</p>
        ) : (
          comments.map(c => <CommentCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  )
}
