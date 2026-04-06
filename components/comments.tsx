"use client"

import { useEffect, useState } from "react"
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, LogIn, Send } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { PLAN_BADGES } from "@/lib/usernames"
import Link from "next/link"

interface Comment {
  id: number
  author: string
  content: string
  timestamp: string
  likes: number
  dislikes: number
  user_badge?: string
  user_badge_color?: string
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

function UserBadge({ badge, color }: { badge?: string; color?: string }) {
  if (!badge) return null
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {badge}
    </span>
  )
}

export function Comments({ gameId, itemName }: CommentsProps) {
  const { user, token } = useUser() || {}
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const planBadge = user ? PLAN_BADGES[(user as any).subscription_plan || 'free'] : null

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
    if (!user) {
      setToast({ msg: 'Please login to join the discussion', type: 'info' })
      return
    }
    if (!newComment.trim()) return
    setSubmitting(true)
    await apiPost({
      action: 'add', itemId: gameId, itemName,
      author: user.name, email: (user as any).email || '', content: newComment.trim(),
      userBadge: planBadge?.label, userBadgeColor: planBadge?.color,
    })
    setNewComment("")
    setSubmitting(false)
    setSubmitted(true)
    setToast({ msg: 'Your comment has been submitted and is pending approval!', type: 'info' })
    setTimeout(() => { setSubmitted(false); setToast(null) }, 4000)
  }

  const handleReply = async (parentId: number) => {
    if (!user) {
      setToast({ msg: 'Please login to reply', type: 'info' })
      return
    }
    if (!replyContent.trim()) return
    await apiPost({
      action: 'reply', itemId: gameId, parentId, itemName,
      author: user.name, email: (user as any).email || '', content: replyContent.trim(),
      userBadge: planBadge?.label, userBadgeColor: planBadge?.color,
    })
    setReplyContent("")
    setReplyingTo(null)
    setToast({ msg: 'Your reply has been submitted!', type: 'success' })
    setTimeout(() => setToast(null), 4000)
  }

  const handleReact = async (targetId: number, reaction: 'like' | 'dislike') => {
    await apiPost({ action: 'react', itemId: gameId, targetId, reaction })
  }

  const handleDelete = async (targetId: number) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
    await apiPost({ action: 'delete', itemId: gameId, targetId, adminToken })
  }

  const CommentCard = ({ c, isReply = false }: { c: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : ''}`}>
      <div className={`${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-gradient-to-br from-[#9d4edd]/40 to-[#7b2cbf]/40 flex items-center justify-center text-white font-bold flex-shrink-0 ring-1 ring-[#9d4edd]/30`}>
        {c.author.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-3.5 hover:border-[#9d4edd]/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">{c.author}</span>
              <UserBadge badge={c.user_badge} color={c.user_badge_color} />
            </div>
            <span className="text-gray-600 text-xs flex-shrink-0">{formatTimestamp(c.timestamp)}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{c.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1.5 px-1">
          <button onClick={() => handleReact(c.id, 'like')} className="flex items-center gap-1 text-gray-500 hover:text-green-400 transition-colors text-xs group">
            <ThumbsUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {c.likes > 0 && c.likes}
          </button>
          <button onClick={() => handleReact(c.id, 'dislike')} className="flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors text-xs group">
            <ThumbsDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {c.dislikes > 0 && c.dislikes}
          </button>
          {!isReply && user && (
            <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="flex items-center gap-1 text-gray-500 hover:text-[#9d4edd] transition-colors text-xs">
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
          )}
          {isAdmin && (
            <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 transition-colors text-xs ml-auto">Delete</button>
          )}
        </div>

        {replyingTo === c.id && (
          <div className="mt-2 flex gap-2">
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={2} placeholder="Write a reply..."
              className="flex-1 bg-[#f0f0f5] dark:bg-[#120b22] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none text-sm resize-none transition-colors" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleReply(c.id)} disabled={!replyContent.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-xs font-semibold disabled:opacity-40 transition-colors">Post</button>
              <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 rounded-lg border border-[#2d1b54] text-gray-400 text-xs hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {c.replies?.map(r => <CommentCard key={r.id} c={r} isReply />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Toast notification - same style as game-details */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl shadow-2xl overflow-hidden w-80" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 1px rgba(157,78,221,0.5)" }}>
            <div className="p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500/20' : 'bg-[#9d4edd]/20'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{toast.type === 'success' ? 'Success' : 'Info'}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{toast.msg}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-[#2d1b54]">
              <div 
                className={`h-full transition-all duration-[4000ms] ease-linear ${toast.type === 'success' ? 'bg-green-500' : 'bg-[#9d4edd]'}`}
                style={{ animation: 'commentToastShrink 4s linear forwards' }}
              />
            </div>
          </div>
          <style jsx>{`
            @keyframes commentToastShrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#9d4edd]" />
          Join the discussion
          <span className="text-gray-500 font-normal text-sm">({comments.length})</span>
        </h2>
        {comments.length > 0 && <span className="text-gray-500 text-xs">Share your thoughts</span>}
      </div>

      {/* Comment input */}
      {!user ? (
        <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl p-6 text-center">
          <LogIn className="w-8 h-8 text-[#9d4edd] mx-auto mb-2" />
          <p className="text-white font-semibold mb-1">Join the conversation</p>
          <p className="text-gray-400 text-sm mb-4">Sign in to comment and interact with the community</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">Log in</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">Sign up</Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#2d1b54] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd]/40 to-[#7b2cbf]/40 flex items-center justify-center text-white text-sm font-bold ring-1 ring-[#9d4edd]/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.name}</p>
              {planBadge && <UserBadge badge={planBadge.label} color={planBadge.color} />}
            </div>
          </div>
          <div className="p-4">
            <label className="text-gray-400 text-xs mb-2 block">Your comment <span className="text-red-400">*</span></label>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={4}
              placeholder="Your message here..."
              className="w-full bg-[#f0f0f5] dark:bg-[#0d0820] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none text-sm resize-none transition-colors"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
            />
          </div>
          <div className="px-4 pb-4 flex items-center justify-between">
            <span className="text-gray-600 text-xs">
              {submitted ? (
                <span className="text-yellow-400">✓ Comment submitted — awaiting approval</span>
              ) : 'Ready to share your thoughts?'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</div>
        ) : (
          comments.map(c => <CommentCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  )
}
