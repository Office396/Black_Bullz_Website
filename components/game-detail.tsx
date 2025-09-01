"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Download,
  Star,
  Calendar,
  HardDrive,
  Users,
  ArrowLeft,
  Check,
  Key,
  Shield,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  ThumbsUp,
  Reply,
} from "lucide-react"
import type { Game } from "@/lib/game-data"
import Link from "next/link"
import { useState } from "react"

interface GameDetailProps {
  game: Game
}

interface Comment {
  id: string
  username: string
  message: string
  date: string
  likes: number
  replies?: Comment[]
}

export function GameDetail({ game }: GameDetailProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)
  const [showRarPassword, setShowRarPassword] = useState(false)
  const [showMainPassword, setShowMainPassword] = useState(false)
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      username: "GamerPro123",
      message: "Great game! Downloaded and working perfectly. Thanks for sharing!",
      date: "2024-01-15",
      likes: 12,
      replies: [
        {
          id: "1-1",
          username: "TechUser",
          message: "Same here! Installation was smooth.",
          date: "2024-01-15",
          likes: 3,
        },
      ],
    },
    {
      id: "2",
      username: "PCMaster",
      message: "Anyone know if this works on Windows 11?",
      date: "2024-01-14",
      likes: 5,
    },
  ])
  const [newComment, setNewComment] = useState("")
  const [username, setUsername] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "pc-games":
        return "PC Games"
      case "android-games":
        return "Android Games"
      case "software":
        return "Software"
      default:
        return category
    }
  }

  const handleDownload = () => {
    if (game.downloadLink) {
      window.open(game.downloadLink, "_blank")
    }
  }

  const handleSubmitComment = () => {
    if (!newComment.trim() || !username.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      username: username.trim(),
      message: newComment.trim(),
      date: new Date().toISOString().split("T")[0],
      likes: 0,
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim() || !username.trim()) return

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      username: username.trim(),
      message: replyText.trim(),
      date: new Date().toISOString().split("T")[0],
      likes: 0,
    }

    setComments(
      comments.map((comment) =>
        comment.id === parentId ? { ...comment, replies: [...(comment.replies || []), reply] } : comment,
      ),
    )
    setReplyText("")
    setReplyingTo(null)
  }

  const handleLikeComment = (commentId: string, isReply = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies?.map((reply) =>
                  reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply,
                ),
              }
            : comment,
        ),
      )
    } else {
      setComments(
        comments.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)),
      )
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative">
                <img
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  className="w-full h-64 sm:h-80 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    {game.size}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">{renderStars(game.rating)}</div>
                  <span className="text-sm text-muted-foreground">({game.rating})</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Downloads:</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {game.downloads}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      {game.size}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Released:</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{getCategoryLabel(game.category)}</Badge>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleDownload}>
                  <Download className="h-5 w-5 mr-2" />
                  Download Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Game Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-3xl font-bold text-balance mb-4">{game.title}</h1>
              <p className="text-lg text-muted-foreground text-pretty leading-relaxed">{game.description}</p>
            </div>

            {game.screenshots && game.screenshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {game.screenshots.slice(0, 5).map((screenshot, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer overflow-hidden rounded-lg border"
                        onClick={() => setSelectedScreenshot(screenshot)}
                      >
                        <img
                          src={screenshot || `/placeholder.svg?height=120&width=200&query=game screenshot ${index + 1}`}
                          alt={`${game.title} Screenshot ${index + 1}`}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {game.features && game.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Key Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {game.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Requirements */}
            {game.requirements && game.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">System Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {game.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(game.rarPassword || game.mainPagePassword) && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Download Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {game.rarPassword && (
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">RAR Password:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {showRarPassword ? game.rarPassword : "••••••••"}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => setShowRarPassword(!showRarPassword)}>
                          {showRarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {game.mainPagePassword && (
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Download Page Password:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {showMainPassword ? game.mainPagePassword : "••••••••"}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => setShowMainPassword(!showMainPassword)}>
                          {showMainPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Download Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Download?</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to start your download. Make sure you have enough storage space.
                    </p>
                  </div>
                  <Button size="lg" className="w-full sm:w-auto" onClick={handleDownload}>
                    <Download className="h-5 w-5 mr-2" />
                    Download {game.title}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Form */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Your username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <Textarea
                    placeholder="Share your experience with this game..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim() || !username.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{comment.username[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{comment.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">{comment.message}</p>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeComment(comment.id)}
                          className="text-xs"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="ml-6 space-y-2 p-3 bg-muted/30 rounded-lg">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyText.trim() || !username.trim()}
                            >
                              Reply
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">{reply.username[0].toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-xs">{reply.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(reply.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed">{reply.message}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                className="text-xs"
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {reply.likes}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedScreenshot && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedScreenshot || "/placeholder.svg"}
                alt="Screenshot"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedScreenshot(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
