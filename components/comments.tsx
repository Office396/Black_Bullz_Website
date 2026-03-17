"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ThumbsDown, Reply } from "lucide-react"

interface Comment {
  id: number
  author: string
  email?: string
  avatar?: string
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

export function Comments({ gameId, itemName }: CommentsProps) {
  const storageKey = useMemo(() => `comments_${gameId}`, [gameId])

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday'
    } else if (diffDays < 7) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'long' })
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Load comments on mount
  useEffect(() => {
    // admin token check for delete controls
    try {
      const token = localStorage.getItem("admin_token")
      setIsAdmin(token === "authenticated")
    } catch {}

    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments?itemId=${gameId}`, { cache: "no-store" })
        const json = await res.json()
        if (json?.success) setComments(json.data || [])
      } catch (e) {
        console.warn("Failed to load comments from API", e)
      }
    }
    fetchComments()
  }, [storageKey, gameId])

  const saveComments = (list: Comment[]) => {
    setComments(list)
  }

  const isValidEmail = (email: string) => {
    // Basic email format validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // API helper wrappers
  const apiAddComment = async (payload: { author: string; email: string; content: string }) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', itemId: gameId, itemName, ...payload })
    })
    const json = await res.json()
    if (json?.success) setComments(json.data)
  }

  const apiAddReply = async (parentId: number, payload: { author: string; email: string; content: string }) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reply', itemId: gameId, parentId, itemName, ...payload })
    })
    const json = await res.json()
    if (json?.success) setComments(json.data)
  }

  const apiReact = async (targetId: number, reaction: 'like' | 'dislike') => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'react', itemId: gameId, targetId, reaction })
    })
    const json = await res.json()
    if (json?.success) setComments(json.data)
  }

  const apiDelete = async (targetId: number) => {
    const adminToken = (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '') || ''
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', itemId: gameId, targetId, adminToken })
    })
    const json = await res.json()
    if (json?.success) setComments(json.data)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !userName.trim() || !userEmail.trim()) return
    if (!isValidEmail(userEmail)) {
      alert("Please enter a valid email address")
      return
    }
    await apiAddComment({ author: userName.trim(), email: userEmail.trim(), content: newComment.trim() })
    setNewComment("")
    setUserName("")
    setUserEmail("")
  }

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || !userName.trim() || !userEmail.trim()) return
    if (!isValidEmail(userEmail)) {
      alert("Please enter a valid email address")
      return
    }
    await apiAddReply(parentId, { author: userName.trim(), email: userEmail.trim(), content: replyContent.trim() })
    setReplyContent("")
    setReplyingTo(null)
  }

  const handleLike = async (commentId: number) => {
    await apiReact(commentId, 'like')
  }

  const handleDislike = async (commentId: number) => {
    await apiReact(commentId, 'dislike')
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-red-500 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
            <Input
              placeholder="Your email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>
          <Textarea
            placeholder="Write your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            required
          />
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Post Comment
          </Button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-red-600 text-white">
                    {comment.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{comment.author}</span>
                          {comment.author === "BullzGamez-Admin" && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xmlSpace="preserve">
                                <g style={{stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1}} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                                  <polygon points="45,6.18 57.06,0 64.41,11.38 77.94,12.06 78.62,25.59 90,32.94 83.82,45 90,57.06 78.62,64.41 77.94,77.94 64.41,78.62 57.06,90 45,83.82 32.94,90 25.59,78.62 12.06,77.94 11.38,64.41 0,57.06 6.18,45 0,32.94 11.38,25.59 12.06,12.06 25.59,11.38 32.94,0 " style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(0,150,241)', fillRule: 'nonzero', opacity: 1}} transform="  matrix(1 0 0 1 0 0) "/>
                                  <polygon points="40.16,58.47 26.24,45.08 29.7,41.48 40.15,51.52 61.22,31.08 64.7,34.67 " style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(255,255,255)', fillRule: 'nonzero', opacity: 1}} transform="  matrix(1 0 0 1 0 0) "/>
                                </g>
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{formatTimestamp(comment.timestamp)}</span>
                      </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                  <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
                  >
                  <ThumbsUp className="h-4 w-4" />
                  {comment.likes}
                  </button>
                  <button
                  onClick={() => handleDislike(comment.id)}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors"
                  >
                  <ThumbsDown className="h-4 w-4" />
                  {comment.dislikes}
                  </button>
                  <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors"
                  >
                  <Reply className="h-4 w-4" />
                  Reply
                  </button>
                  {isAdmin && (
                  <button
                  onClick={() => apiDelete(comment.id)}
                  className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete comment"
                  >
                  Delete
                  </button>
                  )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          placeholder="Your name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                        <Input
                          placeholder="Your email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubmitReply(comment.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reply
                        </Button>
                        <Button
                          onClick={() => setReplyingTo(null)}
                          size="sm"
                          variant="outline"
                          className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 space-y-3 border-l border-gray-300 dark:border-gray-600 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {reply.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 dark:text-white font-medium text-sm">{reply.author}</span>
                                  {reply.author === "BullzGamez-Admin ✔️" && (
                                    <div className="flex items-center gap-1">
                                    </div>
                                  )}
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{formatTimestamp(reply.timestamp)}</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <button
                                onClick={() => handleLike(reply.id)}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {reply.likes}
                              </button>
                              <button
                                onClick={() => handleDislike(reply.id)}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {reply.dislikes}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => apiDelete(reply.id)}
                                  className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete reply"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
