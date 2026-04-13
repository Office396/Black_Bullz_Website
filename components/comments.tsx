"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, LogIn, Send, Share2, ChevronDown, Plus, Bold, Italic, Underline, Link2, List, Code, Smile } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { PLAN_BADGES } from "@/lib/usernames"
import Link from "next/link"
import dynamic from "next/dynamic"

// Import Quill styles and dynamic component
import "react-quill/dist/quill.snow.css"
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

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

type SortMode = 'best' | 'new' | 'old' | 'replies' | 'mine'

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {badge}
    </span>
  )
}



const COMMENTS_PER_PAGE = 15

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
  const [sortMode, setSortMode] = useState<SortMode>('new')
  const [visibleCount, setVisibleCount] = useState(COMMENTS_PER_PAGE)
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

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

  /** Insert formatting markdown around selection or at cursor in a textarea */
  const insertFormat = useCallback((ref: React.RefObject<HTMLTextAreaElement>, setter: (v: string) => void, prefix: string, suffix: string, placeholder: string) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const val = ta.value
    const selected = val.substring(start, end)
    const insert = selected || placeholder
    const newVal = val.substring(0, start) + prefix + insert + suffix + val.substring(end)
    setter(newVal)
    setTimeout(() => {
      ta.focus()
      const cursorPos = start + prefix.length + (selected ? selected.length : 0) + suffix.length
      ta.setSelectionRange(selected ? cursorPos : start + prefix.length, selected ? cursorPos : start + prefix.length + placeholder.length)
    }, 10)
  }, [])

  const handleSubmit = async () => {
    if (!user) { showToast('Please login to join the discussion', 'info'); return }
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
    showToast('Your comment has been submitted and is pending approval!', 'info')
    setTimeout(() => setSubmitted(false), 4000)
  }

  const handleReply = async (parentId: number) => {
    if (!user) { showToast('Please login to reply', 'info'); return }
    if (!replyContent.trim()) return
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
    await apiPost({
      action: 'reply', itemId: gameId, parentId, itemName,
      author: user.name, email: (user as any).email || '', content: replyContent.trim(),
      userBadge: planBadge?.label, userBadgeColor: planBadge?.color,
      adminToken
    })
    setReplyContent("")
    setReplyingTo(null)
    showToast('Your reply has been submitted!', 'success')
  }

  const handleReact = async (targetId: number, reaction: 'like' | 'dislike') => {
    await apiPost({ action: 'react', itemId: gameId, targetId, reaction })
  }

  const handleDelete = async (targetId: number) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
    await apiPost({ action: 'delete', itemId: gameId, targetId, adminToken })
  }

  const handleShare = (c: Comment) => {
    const url = typeof window !== 'undefined' ? `${window.location.href}#comment-${c.id}` : ''
    navigator.clipboard.writeText(url).then(() => showToast('Comment link copied!', 'success')).catch(() => {})
  }

  const scrollToCommentInput = () => {
    if (!user) { showToast('Please login to comment', 'info'); return }
    const el = document.getElementById('comment-write-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => commentInputRef.current?.focus(), 400)
    }
  }

  // Quill Editor Configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'bullet' }],
      ['link', 'code-block'],
      ['clean']
    ],
  }), [])

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link', 'code-block'
  ]



  const toggleReplies = (id: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sortedComments = useMemo(() => {
    const arr = [...comments]
    switch (sortMode) {
      case 'best': return arr.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
      case 'new': return arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      case 'old': return arr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      case 'replies': return arr.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0))
      case 'mine': return user ? arr.filter(c => c.author === user.name) : arr
      default: return arr
    }
  }, [comments, sortMode, user])

  const visibleComments = sortedComments.slice(0, visibleCount)
  const hasMore = visibleCount < sortedComments.length

  const sortTabs: { key: SortMode; label: string }[] = [
    { key: 'best', label: 'Best' },
    { key: 'new', label: 'New' },
    { key: 'old', label: 'Old' },
    { key: 'replies', label: 'Replies' },
    { key: 'mine', label: '👤 My Comments' },
  ]

  const CommentCard = ({ c, isReply = false, isLast = false }: { c: Comment; isReply?: boolean; isLast?: boolean }) => {
    const replyCount = c.replies?.length || 0
    const isExpanded = expandedReplies.has(c.id)

    return (
      <div id={`comment-${c.id}`} className={`relative ${isReply ? 'ml-10 sm:ml-14' : ''}`}>
        {/* Timeline connector */}
        {!isReply && !isLast && (
          <div className="absolute left-[22px] top-[56px] bottom-0 w-px bg-gradient-to-b from-[#2d1b54]/60 to-transparent pointer-events-none" style={{ zIndex: 1 }} />
        )}

        <div className={`rounded-xl p-5 mb-3 transition-all duration-200 ${
          isReply
            ? 'bg-[#0d0820]/80 border border-[#2d1b54]/40'
            : 'bg-[#110d24] border border-[#2d1b54]/60 hover:border-[#9d4edd]/30 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
        }`}>
          {/* Author row */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`${isReply ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-base'} rounded-full bg-gradient-to-br from-[#9d4edd]/50 to-[#7b2cbf]/50 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-[#9d4edd]/25`}>
              {c.author.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <span className="text-white font-semibold text-[15px]">{c.author}</span>
              <span className="text-[#6b5b8a] text-sm">{formatTimestamp(c.timestamp)}</span>
              <UserBadge badge={c.user_badge} color={c.user_badge_color} />
            </div>
          </div>

          {/* Content */}
          <div 
            className="text-[#c4b5de] text-[15px] leading-relaxed quill-content prose prose-invert prose-p:my-1 prose-h1:text-xl prose-a:text-[#c77dff] prose-code:bg-[#2d1b54]/60 prose-code:text-[#c77dff] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]"
            dangerouslySetInnerHTML={{ __html: c.content }} 
          />

          {/* Action bar */}
          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[#2d1b54]/30">
            <button onClick={() => handleReact(c.id, 'like')} className="flex items-center gap-1.5 text-[#6b5b8a] hover:text-[#c77dff] transition-colors text-sm group">
              <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{c.likes || 0}</span>
            </button>
            <button onClick={() => handleReact(c.id, 'dislike')} className="flex items-center gap-1.5 text-[#6b5b8a] hover:text-red-400 transition-colors text-sm group">
              <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{c.dislikes || 0}</span>
            </button>
            {!isReply && (
              <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="flex items-center gap-1.5 text-[#6b5b8a] hover:text-[#c77dff] transition-colors text-sm font-medium">
                <Reply className="w-4 h-4" /> Reply
              </button>
            )}
            <button onClick={() => handleShare(c)} className="flex items-center gap-1.5 text-[#6b5b8a] hover:text-[#c77dff] transition-colors text-sm font-medium">
              <Share2 className="w-4 h-4" /> Share
            </button>
            {isAdmin && (
              <button onClick={() => handleDelete(c.id)} className="text-[#6b5b8a] hover:text-red-400 transition-colors text-sm font-medium ml-auto">Delete</button>
            )}

            {/* Replies count */}
            {!isReply && replyCount > 0 && (
              <button
                onClick={() => toggleReplies(c.id)}
                className="flex items-center gap-1.5 text-[#9d4edd] hover:text-[#c77dff] transition-colors text-sm font-semibold ml-auto cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {replyingTo === c.id && (
          <div className="ml-10 sm:ml-14 mb-3">
            <div className="bg-[#0d0820] border border-[#2d1b54]/50 rounded-xl overflow-hidden focus-within:border-[#9d4edd] focus-within:shadow-[0_0_0_3px_rgba(157,78,221,0.1)] transition-all">
              <div className="bg-[#120b22] quill-container">
                <ReactQuill
                  theme="snow"
                  value={replyContent}
                  onChange={setReplyContent}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write a reply..."
                  className="text-white"
                />
              </div>
              <div className="p-3 bg-[#0d0820] border-t border-[#2d1b54]/50">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setReplyingTo(null)} className="px-4 py-2 rounded-lg text-[#6b5b8a] text-sm hover:text-white transition-colors">Cancel</button>
                  <button
                    onClick={() => handleReply(c.id)}
                    disabled={!replyContent.trim() || replyContent === '<p><br></p>'}
                    className="px-5 py-2 rounded-lg bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threaded replies */}
        {isExpanded && c.replies?.map((r, ri) => (
          <CommentCard key={r.id} c={r} isReply isLast={ri === (c.replies?.length || 0) - 1} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl shadow-2xl overflow-hidden w-80" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 1px rgba(157,78,221,0.5)" }}>
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
                <p className="text-[#b8a9d4] text-sm mt-0.5 line-clamp-2">{toast.msg}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-[#6b5b8a] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-1 bg-[#2d1b54]">
              <div className={`h-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-[#9d4edd]'}`} style={{ animation: 'commentToastShrink 4s linear forwards' }} />
            </div>
          </div>
          <style jsx>{`@keyframes commentToastShrink { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
      )}

      {/* ===== COMMENTS CONTAINER ===== */}
      <div className="bg-[#0d0820]/90 border border-[#2d1b54]/60 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#2d1b54]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9d4edd]/15 flex items-center justify-center border border-[#9d4edd]/20">
              <MessageSquare className="w-5 h-5 text-[#9d4edd]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl flex items-center gap-2.5">
                Comments
                <span className="text-[#9d4edd] text-lg font-bold">{comments.length}</span>
              </h2>
              <p className="text-[#6b5b8a] text-sm">Join the conversation</p>
            </div>
          </div>
          <button
            onClick={scrollToCommentInput}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-[#9d4edd]/20"
            style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}
          >
            <Plus className="w-4 h-4" /> Comment
          </button>
        </div>

        {/* Sort Tabs */}
        <div className="px-6 py-3.5 flex items-center gap-2 flex-wrap border-b border-[#2d1b54]/30 bg-[#0d0820]/50">
          <span className="text-[#6b5b8a] text-sm font-medium mr-2">Sort:</span>
          {sortTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setSortMode(tab.key); setVisibleCount(COMMENTS_PER_PAGE) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortMode === tab.key
                  ? 'bg-[#9d4edd] text-white shadow-md shadow-[#9d4edd]/25'
                  : 'bg-[#1a103c] text-[#b8a9d4] hover:bg-[#2d1b54] hover:text-white border border-[#2d1b54]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Comments List */}
        <div className="px-6 py-5">
          {sortedComments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#1a103c] border border-[#2d1b54]/40 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-[#2d1b54]" />
              </div>
              <p className="text-[#6b5b8a] text-base font-medium">No comments yet</p>
              <p className="text-[#4a3d6b] text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {visibleComments.map((c, i) => (
                <CommentCard key={c.id} c={c} isLast={i === visibleComments.length - 1} />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount(prev => prev + COMMENTS_PER_PAGE)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#1a103c] border border-[#2d1b54]/60 text-white text-sm font-semibold hover:bg-[#2d1b54] hover:border-[#9d4edd]/30 transition-all duration-200"
              >
                <ChevronDown className="w-4 h-4" /> Load More
              </button>
              <p className="text-[#4a3d6b] text-sm mt-2">
                Showing {Math.min(visibleCount, sortedComments.length)} of {sortedComments.length}
              </p>
            </div>
          )}
        </div>

        {/* ===== ALWAYS-VISIBLE COMMENT INPUT AT BOTTOM ===== */}
        <div id="comment-write-section" className="border-t border-[#2d1b54]/40 bg-[#0d0820]/80">
          {!user ? (
            <div className="p-8 text-center">
              <LogIn className="w-8 h-8 text-[#9d4edd] mx-auto mb-3" />
              <p className="text-white font-semibold text-base mb-1">Join the conversation</p>
              <p className="text-[#6b5b8a] text-sm mb-5">Sign in to comment and interact with the community</p>
              <div className="flex gap-3 justify-center">
                <Link href="/login" className="px-6 py-2.5 rounded-xl border border-[#2d1b54] text-white text-sm font-semibold hover:bg-[#1a103c] transition-colors">Log in</Link>
                <Link href="/signup" className="px-6 py-2.5 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">Sign up</Link>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#9d4edd]/50 to-[#7b2cbf]/50 flex items-center justify-center text-white text-base font-bold ring-2 ring-[#9d4edd]/25 flex-shrink-0 mt-1">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-[15px] font-semibold">{user.name}</span>
                    {planBadge && <UserBadge badge={planBadge.label} color={planBadge.color} />}
                  </div>
                  <div className="border border-[#2d1b54] rounded-xl overflow-hidden focus-within:border-[#9d4edd] focus-within:shadow-[0_0_0_3px_rgba(157,78,221,0.1)] transition-all flex flex-col min-h-[140px] quill-main-container bg-[#120b22]">
                    <ReactQuill
                      theme="snow"
                      value={newComment}
                      onChange={setNewComment}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="What are your thoughts?"
                      className="text-white flex-1"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#4a3d6b] text-sm">
                      {submitted && <span className="text-[#c77dff]">✓ Comment submitted — awaiting approval</span>}
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !newComment.trim() || newComment === '<p><br></p>'}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.03] disabled:opacity-40 hover:shadow-lg hover:shadow-[#9d4edd]/20"
                      style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
