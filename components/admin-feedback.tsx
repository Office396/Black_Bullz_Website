"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Star, Trash2, CheckCircle2, XCircle, Eye, Search, Reply } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export function AdminFeedback() {
  const [comments, setComments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [commentSearch, setCommentSearch] = useState("")
  const [reviewSearch, setReviewSearch] = useState("")
  const [replyTarget, setReplyTarget] = useState<any | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)

  const getAdminToken = () => {
    try { return localStorage.getItem('admin_token') || '' } catch { return '' }
  }

  const loadComments = async () => {
    try {
      const res = await fetch('/api/comments?BullzGamez-Admin=1', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setComments(json.data || [])
    } catch {}
  }
  const loadReviews = async () => {
    try {
      const res = await fetch('/api/reviews?all=1', { cache: 'no-store' })
      const json = await res.json()
      if (json.reviews) setReviews(json.reviews)
    } catch {}
  }

  useEffect(() => { loadComments(); loadReviews() }, [])

  const approveComment = async (id: number, approvalStatus: string) => {
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', targetId: id, approvalStatus, adminToken: getAdminToken() }) })
    loadComments()
  }

  const deleteComment = async (id: number, itemId: number) => {
    if (!confirm('Delete this comment?')) return
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', itemId, targetId: id, adminToken: getAdminToken() }) })
    loadComments()
  }

  const markComment = async (id: number, itemId: number, status: 'new' | 'read') => {
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', itemId, targetId: id, status, adminToken: getAdminToken() }) })
    loadComments()
  }

  const sendAdminReply = async () => {
    if (!replyTarget || !replyText.trim()) return
    setReplySubmitting(true)
    const parentId = replyTarget.type === 'reply' ? (replyTarget.parentId || replyTarget.id) : replyTarget.id
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reply', itemId: replyTarget.itemId, parentId, itemName: replyTarget.itemName, author: 'BullzGamez-Admin', email: '', content: replyText.trim(), adminToken: 'authenticated' }) })
    await markComment(replyTarget.id, replyTarget.itemId, 'read')
    setReplyTarget(null); setReplyText(""); setReplySubmitting(false)
    loadComments()
  }

  const updateReview = async (id: number, status: string) => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
    await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ id, status }) })
    loadReviews()
  }

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
    loadReviews()
  }

  const filteredComments = useMemo(() => {
    if (!commentSearch) return comments
    const q = commentSearch.toLowerCase()
    return comments.filter(c => c.content?.toLowerCase().includes(q) || c.author?.toLowerCase().includes(q) || c.itemName?.toLowerCase().includes(q))
  }, [comments, commentSearch])

  const filteredReviews = useMemo(() => {
    if (!reviewSearch) return reviews
    const q = reviewSearch.toLowerCase()
    return reviews.filter(r => r.user_name?.toLowerCase().includes(q) || r.game_title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q))
  }, [reviews, reviewSearch])

  const pendingReviews = reviews.filter(r => r.status === 'pending').length
  const newComments = comments.filter(c => c.status === 'new').length

  const formatDate = (ts: string) => {
    try { return new Date(ts).toLocaleString() } catch { return ts }
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    new: 'bg-blue-500/20 text-blue-400',
    read: 'bg-gray-500/20 text-gray-400',
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="comments">
        <TabsList className="bg-[#120b22] border border-[#2d1b54] p-1">
          <TabsTrigger value="comments" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
            {newComments > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">{newComments}</span>}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2">
            <Star className="w-4 h-4" />
            Reviews
            {pendingReviews > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-bold">{pendingReviews}</span>}
          </TabsTrigger>
        </TabsList>

        {/* COMMENTS TAB */}
        <TabsContent value="comments" className="mt-4">
          <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2d1b54] flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input value={commentSearch} onChange={e => setCommentSearch(e.target.value)} placeholder="Search comments..."
                  className="pl-9 bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
              </div>
              <Button size="sm" variant="outline" onClick={loadComments} className="border-[#2d1b54] text-gray-400">Refresh</Button>
            </div>

            {/* Reply dialog */}
            {replyTarget && (
              <div className="p-4 border-b border-[#9d4edd]/30 bg-[#9d4edd]/5">
                <p className="text-[#9d4edd] text-xs font-bold mb-2">Replying to {replyTarget.author} on "{replyTarget.itemName}"</p>
                <p className="text-gray-400 text-xs mb-3 italic">"{replyTarget.content}"</p>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Write admin reply..."
                  className="bg-[#1a103c] border-[#2d1b54] text-white text-sm mb-2" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={sendAdminReply} disabled={replySubmitting || !replyText.trim()} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
                    {replySubmitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setReplyTarget(null); setReplyText("") }} className="border-[#2d1b54] text-gray-400">Cancel</Button>
                </div>
              </div>
            )}

            {filteredComments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No comments yet</div>
            ) : (
              <div className="divide-y divide-[#2d1b54]/50">
                {filteredComments.map((c: any) => (
                  <div key={c.id} className="p-4 hover:bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-semibold text-sm">{c.author}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[c.type] || ''} bg-[#9d4edd]/20 text-[#c77dff]`}>{c.type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' : c.approval_status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.approval_status || 'pending'}</span>
                          <span className="text-gray-600 text-xs">on "{c.itemName}"</span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">{c.content}</p>
                        <p className="text-gray-600 text-xs mt-1">{formatDate(c.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => { setReplyTarget(c); setReplyText("") }} className="p-1.5 rounded text-gray-500 hover:text-[#9d4edd] hover:bg-[#9d4edd]/10 transition-colors" title="Reply">
                          <Reply className="w-4 h-4" />
                        </button>
                        {(!c.approval_status || c.approval_status === 'pending') && (
                          <button onClick={() => approveComment(c.id, 'approved')} className="p-1.5 rounded text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {c.approval_status === 'approved' && (
                          <button onClick={() => approveComment(c.id, 'rejected')} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {c.status === 'new' ? (
                          <button onClick={() => markComment(c.id, c.itemId, 'read')} className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Mark read">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          </button>
                        ) : null}
                        <button onClick={() => deleteComment(c.id, c.itemId)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REVIEWS TAB */}
        <TabsContent value="reviews" className="mt-4">
          <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2d1b54] flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} placeholder="Search reviews..."
                  className="pl-9 bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
              </div>
              <Button size="sm" variant="outline" onClick={loadReviews} className="border-[#2d1b54] text-gray-400">Refresh</Button>
              <Button size="sm" onClick={async () => {
                const res = await fetch('/api/admin/backfill-reviews', { method: 'POST' })
                const data = await res.json()
                alert(data.message || 'Done')
                loadReviews()
              }} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-xs">
                ⚡ Backfill Missing Reviews
              </Button>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No reviews yet</div>
            ) : (
              <div className="divide-y divide-[#2d1b54]/50">
                {filteredReviews.map((r: any) => (
                  <div key={r.id} className="p-4 hover:bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-semibold text-sm">{r.user_name}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />)}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                          <span className="text-gray-600 text-xs">on "{r.game_title}"</span>
                        </div>
                        {r.content && <p className="text-gray-300 text-sm line-clamp-2">{r.content}</p>}
                        <p className="text-gray-600 text-xs mt-1">{formatDate(r.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {r.status !== 'approved' && (
                          <button onClick={() => updateReview(r.id, 'approved')} className="p-1.5 rounded text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button onClick={() => updateReview(r.id, 'rejected')} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteReview(r.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
