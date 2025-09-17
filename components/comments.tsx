"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ThumbsDown, Reply } from "lucide-react"

interface Comment {
  id: number
  author: string
  avatar?: string
  content: string
  timestamp: string
  likes: number
  dislikes: number
  replies?: Comment[]
}

interface CommentsProps {
  gameId: number
}

export function Comments({ gameId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: "GameMaster2024",
      content: "Amazing game! The graphics are incredible and the gameplay is so smooth. Definitely worth downloading!",
      timestamp: "2 hours ago",
      likes: 12,
      dislikes: 1,
      replies: [
        {
          id: 2,
          author: "ProGamer",
          content: "I agree! Been playing for weeks now and still discovering new things.",
          timestamp: "1 hour ago",
          likes: 5,
          dislikes: 0,
        },
      ],
    },
    {
      id: 3,
      author: "TechReviewer",
      content: "Installation was easy and the game runs perfectly on my system. Thanks for the upload!",
      timestamp: "5 hours ago",
      likes: 8,
      dislikes: 0,
    },
    {
      id: 4,
      author: "CasualPlayer",
      content: "Good game but takes up a lot of space. Make sure you have enough storage before downloading.",
      timestamp: "1 day ago",
      likes: 15,
      dislikes: 2,
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [userName, setUserName] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !userName.trim()) return

    const comment: Comment = {
      id: Date.now(),
      author: userName,
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      dislikes: 0,
    }

    setComments([comment, ...comments])
    setNewComment("")
    setUserName("")
  }

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim() || !userName.trim()) return

    const reply: Comment = {
      id: Date.now(),
      author: userName,
      content: replyContent,
      timestamp: "Just now",
      likes: 0,
      dislikes: 0,
    }

    setComments(
      comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      }),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const handleLike = (commentId: number, isReply = false, parentId?: number) => {
    if (isReply && parentId) {
      setComments(
        comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies?.map((reply) =>
                reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply,
              ),
            }
          }
          return comment
        }),
      )
    } else {
      setComments(
        comments.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)),
      )
    }
  }

  const handleDislike = (commentId: number, isReply = false, parentId?: number) => {
    if (isReply && parentId) {
      setComments(
        comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies?.map((reply) =>
                reply.id === commentId ? { ...reply, dislikes: reply.dislikes + 1 } : reply,
              ),
            }
          }
          return comment
        }),
      )
    } else {
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, dislikes: comment.dislikes + 1 } : comment,
        ),
      )
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
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
                                onClick={() => handleLike(reply.id, true, comment.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {reply.likes}
                              </button>
                              <button
                                onClick={() => handleDislike(reply.id, true, comment.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {reply.dislikes}
                              </button>
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
