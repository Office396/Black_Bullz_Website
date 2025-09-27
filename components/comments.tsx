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
    <Card className="bg-gray-800 border-gray-700">
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
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
            <Input
              placeholder="Your email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          <Textarea
            placeholder="Write your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{comment.author}</span>
                      <span className="text-gray-400 text-sm">{comment.timestamp}</span>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                  <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors"
                  >
                  <ThumbsUp className="h-4 w-4" />
                  {comment.likes}
                  </button>
                  <button
                  onClick={() => handleDislike(comment.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                  <ThumbsDown className="h-4 w-4" />
                  {comment.dislikes}
                  </button>
                  <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                  <Reply className="h-4 w-4" />
                  Reply
                  </button>
                  {isAdmin && (
                  <button
                  onClick={() => apiDelete(comment.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
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
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          placeholder="Your name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          required
                        />
                        <Input
                          placeholder="Your email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                          className="bg-gray-700 border-gray-600 text-gray-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 space-y-3 border-l border-gray-600 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {reply.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-medium text-sm">{reply.author}</span>
                                <span className="text-gray-400 text-xs">{reply.timestamp}</span>
                              </div>
                              <p className="text-gray-300 text-sm">{reply.content}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <button
                                onClick={() => handleLike(reply.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {reply.likes}
                              </button>
                              <button
                                onClick={() => handleDislike(reply.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {reply.dislikes}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => apiDelete(reply.id)}
                                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
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
