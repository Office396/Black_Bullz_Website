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
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
            <span className="ml-2 text-xs text-gray-400 font-normal">Manage comments and messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comments" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="comments" className="data-[state=active]:bg-red-600">
                <MessageSquare className="h-4 w-4 mr-2" /> Comments
                {unreadComments > 0 && <Badge className="ml-2 bg-blue-600">{unreadComments}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-red-600">
                <Mail className="h-4 w-4 mr-2" /> Messages
                {unreadMessages > 0 && <Badge className="ml-2 bg-blue-600">{unreadMessages}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Comments */}
            <TabsContent value="comments" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search comments, authors, emails or items..."
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <Input
                  placeholder="Filter by item name"
                  value={commentItemQuery}
                  onChange={(e) => setCommentItemQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 md:w-64"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCommentStatus("all")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (commentStatus === "all" ? "ring-1 ring-red-600" : "")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCommentStatus("new")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (commentStatus === "new" ? "ring-1 ring-red-600" : "")}
                  >
                    New
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCommentStatus("read")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (commentStatus === "read" ? "ring-1 ring-red-600" : "")}
                  >
                    Read
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="bg-gray-700 border-gray-600 text-gray-300" onClick={clearComments}>
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="overflow-auto rounded-md border border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Item</TableHead>
                      <TableHead className="text-gray-300">From</TableHead>
                      <TableHead className="text-gray-300">Content</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400">
                          No comments
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredComments.map((c) => (
                      <TableRow key={c.id} className="hover:bg-gray-800/60">
                        <TableCell className="text-gray-400 whitespace-nowrap">{formatDate(c.timestamp)}</TableCell>
                        <TableCell className="text-gray-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge className={c.type === "reply" ? "bg-blue-700" : "bg-green-700"}>
                              {c.type === "reply" ? "Reply" : "Comment"}
                            </Badge>
                            <span className="text-white">{c.itemName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-white">{c.author}</span>
                            <span className="text-gray-400 text-xs">{c.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-[420px] truncate">{c.content}</TableCell>
                        <TableCell>
                          {c.status === "new" ? (
                            <Badge className="bg-yellow-700 flex items-center gap-1">
                              <CircleDot className="h-3 w-3" /> New
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-700 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Read
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 border-gray-600 text-gray-300"
                              onClick={() => openView(`${c.itemName} • ${c.author}`, c.content)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 border-gray-600 text-gray-300"
                              onClick={() => openReplyForComment(c)}
                            >
                              <Reply className="h-3.5 w-3.5 mr-1" /> Reply
                            </Button>
                            {c.status === "new" ? (
                              <Button size="sm" className="bg-green-700 hover:bg-green-800" onClick={() => markCommentStatus(c.id, "read")}>
                                Mark Read
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300"
                                onClick={() => markCommentStatus(c.id, "new")}
                              >
                                Mark New
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" className="bg-red-700 hover:bg-red-800" onClick={() => deleteComment(c.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
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
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by subject, name, email or message..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMessageStatus("all")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (messageStatus === "all" ? "ring-1 ring-red-600" : "")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMessageStatus("new")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (messageStatus === "new" ? "ring-1 ring-red-600" : "")}
                  >
                    New
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMessageStatus("read")}
                    className={"bg-gray-700 border-gray-600 text-gray-300 " + (messageStatus === "read" ? "ring-1 ring-red-600" : "")}
                  >
                    Read
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="bg-gray-700 border-gray-600 text-gray-300" onClick={clearMessages}>
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="overflow-auto rounded-md border border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Subject</TableHead>
                      <TableHead className="text-gray-300">From</TableHead>
                      <TableHead className="text-gray-300">Message</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400">
                          No messages
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredMessages.map((m) => (
                      <TableRow key={m.id} className="hover:bg-gray-800/60">
                        <TableCell className="text-gray-400 whitespace-nowrap">{formatDate(m.timestamp)}</TableCell>
                        <TableCell className="text-white whitespace-nowrap">{m.subject}</TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-white">{m.name}</span>
                            <span className="text-gray-400 text-xs">{m.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-[420px] truncate">{m.message}</TableCell>
                        <TableCell>
                          {m.status === "new" ? (
                            <Badge className="bg-yellow-700 flex items-center gap-1">
                              <CircleDot className="h-3 w-3" /> New
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-700 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Read
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 border-gray-600 text-gray-300"
                              onClick={() => openView(m.subject, m.message)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 border-gray-600 text-gray-300"
                              onClick={() => openReplyForMessage(m)}
                            >
                              <Reply className="h-3.5 w-3.5 mr-1" /> Reply
                            </Button>
                            {m.status === "new" ? (
                              <Button size="sm" className="bg-green-700 hover:bg-green-800" onClick={() => markMessageStatus(m.id, "read")}>
                                Mark Read
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-gray-300"
                                onClick={() => markMessageStatus(m.id, "new")}
                              >
                                Mark New
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" className="bg-red-700 hover:bg-red-800" onClick={() => deleteMessage(m.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
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
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{viewContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300 whitespace-pre-wrap">{viewContent?.body}</div>
        </DialogContent>
      </Dialog>

      {/* Comment reply dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              Reply to {replyTarget?.author} on {replyTarget?.itemName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Your reply will appear on the website as Admin.</div>
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setReplyDialogOpen(false)}
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-300"
                disabled={replySubmitting}
              >
                Cancel
              </Button>
              <Button onClick={sendAdminReplyToComment} className="bg-red-600 hover:bg-red-700" disabled={replySubmitting}>
                {replySubmitting ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message reply dialog (EmailJS) */}
      <Dialog open={msgReplyDialogOpen} onOpenChange={setMsgReplyDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Reply to {msgReplyTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Subject"
              value={msgReplySubject}
              onChange={(e) => setMsgReplySubject(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Textarea
              placeholder="Write your message..."
              value={msgReplyBody}
              onChange={(e) => setMsgReplyBody(e.target.value)}
              rows={6}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Will send to: {msgReplyTarget?.email}</span>
              <span>Powered by EmailJS (free)</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setMsgReplyDialogOpen(false)}
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-300"
                disabled={msgSending}
              >
                Cancel
              </Button>
              <Button onClick={sendEmailReply} className="bg-red-600 hover:bg-red-700" disabled={msgSending}>
                {msgSending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
