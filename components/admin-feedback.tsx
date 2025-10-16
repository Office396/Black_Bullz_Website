"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageSquare, Mail, Trash2, Eye, CheckCircle2, CircleDot, Reply } from "lucide-react"

// Types for stored feedback
export interface StoredComment {
  id: number
  itemId: number
  itemName: string
  author: string
  email: string
  content: string
  type: "comment" | "reply"
  parentId?: number
  timestamp: string
  status: "new" | "read"
}

export interface StoredMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  status: "new" | "read"
}

export function AdminFeedback() {
  const [comments, setComments] = useState<StoredComment[]>([])
  const [messages, setMessages] = useState<StoredMessage[]>([])

  const [commentSearch, setCommentSearch] = useState("")
  const [commentStatus, setCommentStatus] = useState<"all" | "new" | "read">("all")
  const [commentItemQuery, setCommentItemQuery] = useState("")

  const [messageSearch, setMessageSearch] = useState("")
  const [messageStatus, setMessageStatus] = useState<"all" | "new" | "read">("all")

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewContent, setViewContent] = useState<{ title: string; body: string } | null>(null)

  // Comment reply dialog state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<StoredComment | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)

  // Message reply dialog state
  const [msgReplyDialogOpen, setMsgReplyDialogOpen] = useState(false)
  const [msgReplyTarget, setMsgReplyTarget] = useState<StoredMessage | null>(null)
  const [msgReplySubject, setMsgReplySubject] = useState("")
  const [msgReplyBody, setMsgReplyBody] = useState("")
  const [msgSending, setMsgSending] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Centralized comments across all items
        const cRes = await fetch('/api/comments?admin=1', { cache: 'no-store' })
        const cJson = await cRes.json()
        if (Array.isArray(cJson?.data)) setComments(cJson.data)
      } catch {}

      try {
        // Fetch messages from Supabase API or localStorage for development
        if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))) {
          // In development without Supabase, use localStorage
          const storedMessages = JSON.parse(localStorage.getItem('site_messages') || '[]')
          if (Array.isArray(storedMessages)) setMessages(storedMessages)
        } else {
          // Production: fetch from API
          const mRes = await fetch('/api/contact', { cache: 'no-store' })
          const mJson = await mRes.json()
          if (Array.isArray(mJson?.data)) setMessages(mJson.data.map((msg: any) => ({
            id: msg.id,
            name: msg.name,
            email: msg.email,
            subject: msg.subject,
            message: msg.message,
            timestamp: msg.timestamp,
            status: msg.status
          })))
        }
      } catch {}
    }
    fetchData()
  }, [])

  const saveComments = (list: StoredComment[]) => {
    setComments(list)
  }

  const saveMessages = (list: StoredMessage[]) => {
    setMessages(list)
    try {
      localStorage.setItem("site_messages", JSON.stringify(list))
    } catch {}
  }

  const appendToSiteComments = (entry: StoredComment) => {
    try {
      const existing = JSON.parse(localStorage.getItem("site_comments") || "[]")
      const list = Array.isArray(existing) ? existing : []
      const updated = [entry, ...list]
      localStorage.setItem("site_comments", JSON.stringify(updated))
      setComments(updated)
    } catch {}
  }

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts)
      return d.toLocaleString()
    } catch {
      return ts
    }
  }

  // Derived lists with filters
  const filteredComments = useMemo(() => {
    return comments
      .filter((c) => (commentStatus === "all" ? true : c.status === commentStatus))
      .filter((c) => (commentItemQuery ? c.itemName.toLowerCase().includes(commentItemQuery.toLowerCase()) : true))
      .filter((c) => {
        if (!commentSearch) return true
        const needle = commentSearch.toLowerCase()
        return (
          c.content.toLowerCase().includes(needle) ||
          c.author.toLowerCase().includes(needle) ||
          c.email.toLowerCase().includes(needle) ||
          c.itemName.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [comments, commentStatus, commentItemQuery, commentSearch])

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => (messageStatus === "all" ? true : m.status === messageStatus))
      .filter((m) => {
        if (!messageSearch) return true
        const needle = messageSearch.toLowerCase()
        return (
          m.subject.toLowerCase().includes(needle) ||
          m.message.toLowerCase().includes(needle) ||
          m.name.toLowerCase().includes(needle) ||
          m.email.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [messages, messageStatus, messageSearch])

  // Common actions
  const getAdminToken = () => {
    try {
      return localStorage.getItem('admin_token') || ''
    } catch {
      return ''
    }
  }

  const fetchAdminComments = async () => {
    try {
      const res = await fetch('/api/comments?admin=1', { cache: 'no-store' })
      const json = await res.json()
      if (json?.success) setComments(json.data)
    } catch {}
  }

  const markCommentStatus = async (id: number, status: "new" | "read") => {
    const row = comments.find((c) => c.id === id)
    if (!row) return
    const adminToken = getAdminToken()
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', itemId: row.itemId, targetId: id, status, adminToken })
      })
      await fetchAdminComments()
    } catch {}
  }
  const deleteComment = async (id: number) => {
    const row = comments.find((c) => c.id === id)
    if (!row) return
    const adminToken = getAdminToken()
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', itemId: row.itemId, targetId: id, adminToken })
      })
      await fetchAdminComments()
    } catch {}
  }
  const clearComments = async () => {
    if (!confirm("Clear all comments?")) return
    const adminToken = getAdminToken()
    // Delete each comment/reply by ID
    try {
      const toDelete = comments.map((c) => ({ id: c.id, itemId: c.itemId }))
      await Promise.all(
        toDelete.map((row) =>
          fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', itemId: row.itemId, targetId: row.id, adminToken })
          })
        )
      )
      await fetchAdminComments()
    } catch {}
  }

  const markMessageStatus = (id: number, status: "new" | "read") => {
    saveMessages(messages.map((m) => (m.id === id ? { ...m, status } : m)))
  }
  const deleteMessage = (id: number) => {
    saveMessages(messages.filter((m) => m.id !== id))
  }
  const clearMessages = () => {
    if (confirm("Clear all messages?")) saveMessages([])
  }

  const unreadComments = comments.filter((c) => c.status === "new").length
  const unreadMessages = messages.filter((m) => m.status === "new").length

  const openView = (title: string, body: string) => {
    setViewContent({ title, body })
    setViewDialogOpen(true)
  }

  const openReplyForComment = (c: StoredComment) => {
    setReplyTarget(c)
    setReplyText("")
    setReplyDialogOpen(true)
  }

  const sendAdminReplyToComment = async () => {
    if (!replyTarget || !replyText.trim()) return
    setReplySubmitting(true)
    try {
      const parentId = replyTarget.type === "reply" ? (replyTarget.parentId || replyTarget.id) : replyTarget.id

      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          itemId: replyTarget.itemId,
          parentId,
          itemName: replyTarget.itemName,
          author: 'Admin',
          email: '',
          content: replyText.trim(),
          avatar: '/placeholder-user.jpg',
        })
      })

      await fetchAdminComments()
      await markCommentStatus(replyTarget.id, "read")

      setReplyDialogOpen(false)
      setReplyTarget(null)
      setReplyText("")
      alert("Reply posted. It is now visible on the website under that comment.")
    } catch (e) {
      console.error(e)
      alert("Failed to post reply. Please try again.")
    } finally {
      setReplySubmitting(false)
    }
  }

  const openReplyForMessage = (m: StoredMessage) => {
    setMsgReplyTarget(m)
    setMsgReplySubject(m.subject?.startsWith("Re:") ? m.subject : `Re: ${m.subject}`)
    setMsgReplyBody("")
    setMsgReplyDialogOpen(true)
  }

  const sendEmailReply = async () => {
    if (!msgReplyTarget || !msgReplySubject.trim() || !msgReplyBody.trim()) return
    setMsgSending(true)
    try {
      const serviceId = "service_p71xuen"
      const templateId = "template_p0o71di"
      const publicKey = "HHNlyU_5jLIQ1Parg"

      // Lazy import to avoid any SSR hiccups
      const emailjs = (await import("@emailjs/browser")).default

      // These variables must match what you configured in your EmailJS template
      const templateParams: Record<string, any> = {
        // Core fields for your EmailJS template
        to_email: msgReplyTarget.email,
        to_name: msgReplyTarget.name || "",
        subject: msgReplySubject,
        message: msgReplyBody,
        // Preferred branding and headers
        from_name: "BlackBullz",
        reply_to: "contact@blackbullz.com",
        // Optional recipients (leave empty to skip)
        cc: "",
        bcc: "",
        // Common alternative names some templates use
        content: msgReplyBody,
        // Metadata from original message if you want to include it in the email
        original_subject: msgReplyTarget.subject,
        original_message: msgReplyTarget.message,
      }

      await emailjs.send(serviceId, templateId, templateParams, publicKey)

      // Mark as read locally
      markMessageStatus(msgReplyTarget.id, "read")

      setMsgReplyDialogOpen(false)
      setMsgReplyTarget(null)
      setMsgReplySubject("")
      setMsgReplyBody("")
      alert("Email sent successfully via EmailJS.")
    } catch (e) {
      console.error(e)
      alert("Failed to send email. Ensure EmailJS service/template/keys are set and the template variables match.")
    } finally {
      setMsgSending(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
            <span className="ml-2 text-xs text-gray-400 font-normal hidden md:inline">Manage comments and messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <Tabs defaultValue="comments" className="space-y-4 md:space-y-6">
            <TabsList className="bg-gray-800 border-gray-700 grid w-full grid-cols-2 md:flex md:w-auto">
              <TabsTrigger value="comments" className="data-[state=active]:bg-red-600 text-sm">
                <MessageSquare className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Comments</span>
                <span className="md:hidden">Comments</span>
                {unreadComments > 0 && <Badge className="ml-1 md:ml-2 bg-blue-600 text-xs">{unreadComments}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-red-600 text-sm">
                <Mail className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Messages</span>
                <span className="md:hidden">Messages</span>
                {unreadMessages > 0 && <Badge className="ml-1 md:ml-2 bg-blue-600 text-xs">{unreadMessages}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Comments */}
            <TabsContent value="comments" className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search comments, authors, emails or items..."
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                  />
                </div>
                <Input
                  placeholder="Filter by item name"
                  value={commentItemQuery}
                  onChange={(e) => setCommentItemQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommentStatus("all")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (commentStatus === "all" ? "ring-1 ring-red-600" : "")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommentStatus("new")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (commentStatus === "new" ? "ring-1 ring-red-600" : "")}
                  >
                    New
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommentStatus("read")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (commentStatus === "read" ? "ring-1 ring-red-600" : "")}
                  >
                    Read
                  </Button>
                  <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-gray-300 text-xs" onClick={clearComments}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear All
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="overflow-auto rounded-md border border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-gray-300 text-xs md:text-sm">Date</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Item</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">From</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Content</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 text-sm">
                          No comments
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredComments.map((c) => (
                      <TableRow key={c.id} className="hover:bg-gray-800/60">
                        <TableCell className="text-gray-400 whitespace-nowrap text-xs md:text-sm">{formatDate(c.timestamp)}</TableCell>
                        <TableCell className="text-gray-200">
                          <div className="flex flex-col gap-1">
                            <Badge className={`${c.type === "reply" ? "bg-blue-700" : "bg-green-700"} text-xs w-fit`}>
                              {c.type === "reply" ? "Reply" : "Comment"}
                            </Badge>
                            <span className="text-white text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{c.itemName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex flex-col">
                            <span className="text-white text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{c.author}</span>
                            <span className="text-gray-400 text-xs truncate max-w-[80px] md:max-w-none">{c.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="max-w-[150px] md:max-w-[420px] truncate text-xs md:text-sm" title={c.content}>
                            {c.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.status === "new" ? (
                            <Badge className="bg-yellow-700 flex items-center gap-1 text-xs">
                              <CircleDot className="h-2 w-2 md:h-3 md:w-3" /> New
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-700 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="h-2 w-2 md:h-3 md:w-3" /> Read
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 md:flex-row md:justify-end md:gap-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                onClick={() => openView(`${c.itemName} • ${c.author}`, c.content)}
                              >
                                <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">View</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                onClick={() => openReplyForComment(c)}
                              >
                                <Reply className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">Reply</span>
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              {c.status === "new" ? (
                                <Button size="sm" className="bg-green-700 hover:bg-green-800 h-7 text-xs md:h-8 md:text-sm" onClick={() => markCommentStatus(c.id, "read")}>
                                  <span className="hidden md:inline">Mark Read</span>
                                  <span className="md:hidden">Read</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                  onClick={() => markCommentStatus(c.id, "new")}
                                >
                                  <span className="hidden md:inline">Mark New</span>
                                  <span className="md:hidden">New</span>
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" className="bg-red-700 hover:bg-red-800 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2" onClick={() => deleteComment(c.id)}>
                                <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages" className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by subject, name, email or message..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessageStatus("all")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (messageStatus === "all" ? "ring-1 ring-red-600" : "")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessageStatus("new")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (messageStatus === "new" ? "ring-1 ring-red-600" : "")}
                  >
                    New
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessageStatus("read")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 text-xs " + (messageStatus === "read" ? "ring-1 ring-red-600" : "")}
                  >
                    Read
                  </Button>
                  <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-gray-300 text-xs" onClick={clearMessages}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear All
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="overflow-auto rounded-md border border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-gray-300 text-xs md:text-sm">Date</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Subject</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">From</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Message</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-gray-300 text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 text-sm">
                          No messages
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredMessages.map((m) => (
                      <TableRow key={m.id} className="hover:bg-gray-800/60">
                        <TableCell className="text-gray-400 whitespace-nowrap text-xs md:text-sm">{formatDate(m.timestamp)}</TableCell>
                        <TableCell className="text-white">
                          <div className="max-w-[120px] md:max-w-none truncate text-xs md:text-sm" title={m.subject}>
                            {m.subject}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex flex-col">
                            <span className="text-white text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{m.name}</span>
                            <span className="text-gray-400 text-xs truncate max-w-[80px] md:max-w-none">{m.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="max-w-[150px] md:max-w-[420px] truncate text-xs md:text-sm" title={m.message}>
                            {m.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {m.status === "new" ? (
                            <Badge className="bg-yellow-700 flex items-center gap-1 text-xs">
                              <CircleDot className="h-2 w-2 md:h-3 md:w-3" /> New
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-700 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="h-2 w-2 md:h-3 md:w-3" /> Read
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 md:flex-row md:justify-end md:gap-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                onClick={() => openView(m.subject, m.message)}
                              >
                                <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">View</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                onClick={() => openReplyForMessage(m)}
                              >
                                <Reply className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">Reply</span>
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              {m.status === "new" ? (
                                <Button size="sm" className="bg-green-700 hover:bg-green-800 h-7 text-xs md:h-8 md:text-sm" onClick={() => markMessageStatus(m.id, "read")}>
                                  <span className="hidden md:inline">Mark Read</span>
                                  <span className="md:hidden">Read</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gray-700 border-gray-600 text-gray-300 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2"
                                  onClick={() => markMessageStatus(m.id, "new")}
                                >
                                  <span className="hidden md:inline">Mark New</span>
                                  <span className="md:hidden">New</span>
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" className="bg-red-700 hover:bg-red-800 h-7 w-7 p-0 md:h-8 md:w-auto md:p-2" onClick={() => deleteMessage(m.id)}>
                                <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                                <span className="hidden md:inline">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-[95vw] md:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg pr-8">{viewContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300 whitespace-pre-wrap text-sm md:text-base leading-relaxed">{viewContent?.body}</div>
        </DialogContent>
      </Dialog>

      {/* Comment reply dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-[95vw] md:max-w-[500px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg pr-8">
              Reply to {replyTarget?.author}
              <div className="text-xs md:text-sm text-gray-400 font-normal mt-1 truncate">
                on {replyTarget?.itemName}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Your reply will appear on the website as Admin.</div>
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <Button
                onClick={() => setReplyDialogOpen(false)}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 w-full sm:w-auto"
                disabled={replySubmitting}
              >
                Cancel
              </Button>
              <Button onClick={sendAdminReplyToComment} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" disabled={replySubmitting} size="sm">
                {replySubmitting ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message reply dialog (EmailJS) */}
      <Dialog open={msgReplyDialogOpen} onOpenChange={setMsgReplyDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-[95vw] md:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg pr-8">Reply to {msgReplyTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Subject"
              value={msgReplySubject}
              onChange={(e) => setMsgReplySubject(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
            />
            <Textarea
              placeholder="Write your message..."
              value={msgReplyBody}
              onChange={(e) => setMsgReplyBody(e.target.value)}
              rows={6}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
            />
            <div className="flex flex-col gap-1 text-xs text-gray-400">
              <span>Will send to: {msgReplyTarget?.email}</span>
              <span>Powered by EmailJS (free)</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <Button
                onClick={() => setMsgReplyDialogOpen(false)}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 w-full sm:w-auto"
                disabled={msgSending}
              >
                Cancel
              </Button>
              <Button onClick={sendEmailReply} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" disabled={msgSending} size="sm">
                {msgSending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
