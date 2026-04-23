"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminItemForm } from "@/components/admin-item-form"
import { AdminItemList } from "@/components/admin-item-list"
import { AdminSettings } from "@/components/admin-settings"
import { AdminFeedback } from "@/components/admin-feedback"
import { AdminPageModifier } from "@/components/admin-page-modifier"
import { AdminDonateEditor } from "@/components/admin-donate-editor"
import AdminSystemStatus from "@/components/admin-system-status"
import AdminDetailsAutomation from "@/components/admin-details-automation"
import AdminPublishersPanel from "@/components/admin-publishers-panel"
import AdminReportsPanel from "@/components/admin-reports-panel"
import AdminGenresPanel from "@/components/admin-genres-panel"
import { LogOut, Plus, List, Settings, Search, MessageSquare, Activity, Edit3, Workflow, Heart, Users, Bell, GamepadIcon, Building2, Flag, Tag, Trash2 } from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    onLogout()
  }

  return (
    <div className="min-h-screen bg-[#090514] text-white">
      {/* Header */}
      <header className="bg-[#090514]/90 backdrop-blur-md border-b border-[#2d1b54] sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-[#9d4edd]/50 shadow-[0_0_15px_rgba(157,78,221,0.5)]">
                <img src="/bull-logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] via-[#c77dff] to-[#00bcd4]">
                  BULLZGAMEZ
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold -mt-1">ADMIN PORTAL</span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-[#120b22] border border-[#2d1b54] p-1 h-auto flex-wrap md:flex-nowrap">
              <TabsTrigger value="list" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <List className="h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Plus className="h-4 w-4" />
                Add New
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Workflow className="h-4 w-4" />
                Auto Scraper
              </TabsTrigger>
              <TabsTrigger value="modifier" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Edit3 className="h-4 w-4" />
                Modifier
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all relative cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                Msgs
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Activity className="h-4 w-4" />
                System Status
              </TabsTrigger>
              <TabsTrigger value="donate" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Heart className="h-4 w-4" />
                Donate
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <GamepadIcon className="h-4 w-4" />
                Requests
              </TabsTrigger>
              <TabsTrigger value="publishers" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Building2 className="h-4 w-4" />
                Publishers
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Flag className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="deletes" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Trash2 className="h-4 w-4" />
                Delete Requests
              </TabsTrigger>
              <TabsTrigger value="genres" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Tag className="h-4 w-4" />
                Genres
              </TabsTrigger>
            </TabsList>

            {activeTab === "list" && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search store inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#120b22] border-[#2d1b54] text-white placeholder-gray-600 focus:border-[#9d4edd] focus:ring-[#9d4edd]/20 rounded-xl"
                />
              </div>
            )}
          </div>

          <TabsContent value="list" className="mt-0 outline-none">
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#2d1b54] bg-gradient-to-r from-[#1a103c] to-[#120b22]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <List className="h-5 w-5 text-[#9d4edd]" />
                  Inventory Management
                </h3>
              </div>
              <div className="p-0 md:p-6">
                <AdminItemList searchQuery={searchQuery} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-0 outline-none">
            <AdminItemForm />
          </TabsContent>

          <TabsContent value="automation" className="mt-0 outline-none">
            <AdminDetailsAutomation />
          </TabsContent>

          <TabsContent value="modifier" className="mt-0 outline-none">
            <AdminPageModifier />
          </TabsContent>

          <TabsContent value="feedback" className="mt-0 outline-none">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="system" className="mt-0 outline-none">
            <AdminSystemStatus />
          </TabsContent>

          <TabsContent value="donate" className="mt-0 outline-none">
            <AdminDonateEditor />
          </TabsContent>

          <TabsContent value="users" className="mt-0 outline-none">
            <AdminUsersPanel />
          </TabsContent>

          <TabsContent value="requests" className="mt-0 outline-none">
            <AdminRequestsPanel />
          </TabsContent>

          <TabsContent value="publishers" className="mt-0 outline-none">
            <AdminPublishersPanel />
          </TabsContent>

          <TabsContent value="reports" className="mt-0 outline-none">
            <AdminReportsPanel />
          </TabsContent>

          <TabsContent value="deletes" className="mt-0 outline-none">
            <AdminDeleteRequests />
          </TabsContent>

          <TabsContent value="genres" className="mt-0 outline-none">
            <AdminGenresPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AdminUsersPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMsg, setNotifMsg] = useState("")
  const [notifTarget, setNotifTarget] = useState<string>("all")
  const [sending, setSending] = useState(false)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (data.users) setUsers(data.users)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const sendNotif = async () => {
    if (!notifTitle || !notifMsg) return
    setSending(true)
    await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_notification', user_id: notifTarget === 'all' ? null : notifTarget, title: notifTitle, message: notifMsg, type: 'info' })
    })
    setSending(false)
    setNotifTitle(""); setNotifMsg("")
    alert("Notification sent!")
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_user', user_id: id }) })
    load()
  }

  const approveSubscription = async (id: string) => {
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_subscription', user_id: id }) })
    load()
  }

  const rejectSubscription = async (id: string) => {
    const reason = rejectReason[id] || 'Payment could not be verified.'
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject_subscription', user_id: id, reason }) })
    load()
  }

  const pendingUsers = users.filter(u => u.subscription_status === 'pending')

  return (
    <div className="space-y-6">
      {/* Pending Subscriptions */}
      {pendingUsers.length > 0 && (
        <div className="bg-[#120b22] border border-yellow-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-yellow-500/20 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)" }}>
            <span className="text-yellow-400">⏳</span>
            <h3 className="text-yellow-400 font-bold">Pending Subscriptions ({pendingUsers.length})</h3>
          </div>
          <div className="divide-y divide-[#2d1b54]/50">
            {pendingUsers.map(u => (
              <div key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-semibold">{u.name} <span className="text-gray-500 text-sm">@{u.username}</span></p>
                    <p className="text-gray-400 text-sm">{u.email}</p>
                    <p className="text-yellow-400 text-xs mt-1">Requested plan: <span className="font-bold">{u.subscription_pending_plan}</span></p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <input
                      placeholder="Reject reason (optional)"
                      value={rejectReason[u.id] || ''}
                      onChange={e => setRejectReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className="bg-[#1a103c] border border-[#2d1b54] text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#9d4edd]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveSubscription(u.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-xs">✓ Approve</Button>
                      <Button size="sm" onClick={() => rejectSubscription(u.id)} variant="outline" className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs">✗ Reject</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Notification */}
      <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-[#9d4edd]" /> Send Notification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Input placeholder="Title" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white" />
          <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)} className="bg-[#1a103c] border border-[#2d1b54] text-white rounded-lg px-3 py-2 text-sm">
            <option value="all">All Users (Broadcast)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
          </select>
        </div>
        <Input placeholder="Message" value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white mb-3" />
        <Button onClick={sendNotif} disabled={sending} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
          {sending ? "Sending..." : "Send Notification"}
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2d1b54] flex items-center justify-between">
          <h3 className="text-white font-bold">Registered Users ({users.length})</h3>
          <Button size="sm" variant="outline" onClick={load} className="border-[#2d1b54] text-gray-400">Refresh</Button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users yet</div>
        ) : (
          <div className="divide-y divide-[#2d1b54]/50">
            {users.map(u => (
              <div key={u.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                  <div className="w-8 h-8 rounded-full bg-[#9d4edd]/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{u.name}</p>
                      <span className="text-gray-500 text-xs">@{u.username}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'creator' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.role}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${u.subscription_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : u.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' : u.subscription_status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-500'}`}>
                        {u.subscription_status === 'pending' ? '⏳ pending' : u.subscription_plan}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-600 text-xs">{new Date(u.created_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); deleteUser(u.id) }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">Delete</Button>
                  </div>
                </div>
                {expandedUser === u.id && u.is_creator && (
                  <div className="px-4 pb-4 bg-[#0d0820]">
                    <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
                      <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Creator Portal Credentials</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-0.5">Portal URL</p>
                          <p className="text-[#9d4edd] font-mono break-all">/creator/portal</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5">Portal ID</p>
                          <p className="text-white font-mono">{u.creator_portal_id || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5">Portal Password</p>
                          <p className="text-white font-mono">{u.creator_portal_password || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminRequestsPanel() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/requests')
    const data = await res.json()
    if (data.requests) setRequests(data.requests)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return
    await fetch(`/api/requests?id=${id}`, { method: 'DELETE' })
    load()
  }

  const statusColor: Record<string, string> = { pending: 'text-yellow-400 bg-yellow-500/20', processing: 'text-blue-400 bg-blue-500/20', completed: 'text-green-400 bg-green-500/20', rejected: 'text-red-400 bg-red-500/20' }

  return (
    <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#2d1b54] flex items-center justify-between">
        <h3 className="text-white font-bold">Game Requests ({requests.length})</h3>
        <Button size="sm" variant="outline" onClick={load} className="border-[#2d1b54] text-gray-400">Refresh</Button>
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No requests yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d1b54] text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Game</th>
                <th className="text-left px-4 py-3">Requested By</th>
                <th className="text-left px-4 py-3">Platform</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-[#2d1b54]/50 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{r.game_title}</p>
                    {r.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{r.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{r.user_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">{r.platform}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[r.status] || ''}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className="bg-[#1a103c] border border-[#2d1b54] text-white rounded px-2 py-1 text-xs">
                        {['pending','processing','completed','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => deleteRequest(r.id)}
                        className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete request"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminDeleteRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    setLoading(true)
    const res = await fetch(`/api/delete-requests?status=${filter}`)
    const data = await res.json()
    if (data.data) setRequests(data.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/delete-requests?adminToken=authenticated`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    })
    const data = await res.json()
    if (data.success) {
      fetchRequests()
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-[#2d1b54] bg-gradient-to-r from-[#1a103c] to-[#120b22]">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-[#9d4edd]" />
          Comment Delete Requests ({pendingCount} pending)
        </h3>
      </div>
      
      {/* Filter tabs */}
      <div className="flex gap-2 px-6 py-4 bg-[#0d0820]/50 border-b border-[#2d1b54]/30">
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-[#9d4edd] text-white' : 'bg-[#1a103c] text-gray-400 hover:text-white'}`}>
          Pending
        </button>
        <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-[#1a103c] text-gray-400 hover:text-white'}`}>
          Approved
        </button>
        <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-[#1a103c] text-gray-400 hover:text-white'}`}>
          Rejected
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#9d4edd] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No {filter} delete requests</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-semibold">{req.author}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(req.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      Comment: "{req.content?.substring(0, 100)}{req.content?.length > 100 ? '...' : ''}"
                    </p>
                    <p className="text-gray-500 text-xs">Comment ID: {req.comment_id} | Item ID: {req.item_id}</p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(req.id, 'approve')} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Approve & Delete
                      </button>
                      <button onClick={() => handleAction(req.id, 'reject')} className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
