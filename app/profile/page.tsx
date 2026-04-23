"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from "@/lib/user-context"
import { User, History, Star, Settings, Crown, Camera, Save, AlertTriangle, Bell, Eye, EyeOff, Trash2, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"

function ProfileContent() {
  const { user, token, logout, refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "overview"

  const [favouriteGames, setFavouriteGames] = useState<any[]>([])
  const [historyGames, setHistoryGames] = useState<any[]>([])
  const [likedGames, setLikedGames] = useState<any[]>([])
  const [allGames, setAllGames] = useState<any[]>([])

  // Profile edit
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  // Creator portal password
  const [portalPw, setPortalPw] = useState("")
  const [portalPwMsg, setPortalPwMsg] = useState("")

  // Password
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [pwMsg, setPwMsg] = useState("")

  // Notifications settings
  const [notifSettings, setNotifSettings] = useState({ gameUpdates: true, adminAnnouncements: true, requestUpdates: true })

  // Delete account
  const [deleteConfirmPw, setDeleteConfirmPw] = useState("")
  const [deleteChecked, setDeleteChecked] = useState(false)

  useEffect(() => {
    if (user) { setName(user.name); setUsername(user.username); setBio(user.bio || "") }
  }, [user])

  useEffect(() => {
    if (!token) return
    // Fetch favourites + history
    Promise.all([
      fetch('/api/user/favourites', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/user/history', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/items?limit=1000').then(r => r.json()),
    ]).then(([favData, histData, gamesData]) => {
      const games = gamesData.data || []
      setAllGames(games)
      if (favData.favourites) {
        setFavouriteGames(games.filter((g: any) => favData.favourites.includes(g.id)))
      }
      if (histData.history) {
        const histIds = histData.history.map((h: any) => h.game_id)
        setHistoryGames(games.filter((g: any) => histIds.includes(g.id)))
      }
      // Liked games — fetch from reactions
      fetch('/api/reactions/user', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
          if (d.likedGameIds) setLikedGames(games.filter((g: any) => d.likedGameIds.includes(g.id)))
        }).catch(() => {})
    }).catch(() => {})
  }, [token])

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Please log in to view your profile</p>
          <Link href="/login" className="px-6 py-3 bg-[#9d4edd] text-white rounded-xl font-semibold">Sign In</Link>
        </div>
      </div>
    )
  }

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch('/api/auth/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'update_profile', name, username, bio })
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setSaveMsg(data.error) } else { setSaveMsg("Profile saved!"); refreshUser() }
    setTimeout(() => setSaveMsg(""), 3000)
  }

  const changePassword = async () => {
    const res = await fetch('/api/auth/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'change_password', currentPassword: currentPw, newPassword: newPw })
    })
    const data = await res.json()
    if (data.error) { setPwMsg(data.error) } else { setPwMsg("Password changed!"); setCurrentPw(""); setNewPw("") }
    setTimeout(() => setPwMsg(""), 3000)
  }

  const changeCreatorPortalPassword = async () => {
    if (!portalPw || portalPw.length < 6) { setPortalPwMsg("Password must be at least 6 characters"); return }
    const res = await fetch('/api/auth/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'change_creator_portal_password', newPassword: portalPw })
    })
    const data = await res.json()
    if (data.error) { setPortalPwMsg(data.error) } else { setPortalPwMsg("Portal password updated!"); setPortalPw(""); refreshUser() }
    setTimeout(() => setPortalPwMsg(""), 3000)
  }

  const deleteAccount = async () => {
    if (!deleteChecked || !deleteConfirmPw) return
    await fetch('/api/auth/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'delete_account' })
    })
    await logout()
    router.push('/')
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "history", label: "Watch History", icon: History },
    { id: "favourites", label: "Favourites", icon: Star },
    { id: "likes", label: "Likes", icon: ThumbsUp },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const planBadge: Record<string, string> = { free: '', fighter: '🥉', leader: '🥈', revolutionist: '🥇' }

  return (
    <div className="min-h-screen bg-[#090514]">
      {/* Banner — uses landscape image from most recent history/favourite game if available */}
      <div className="relative h-40 sm:h-52 overflow-hidden">
        {(() => {
          // Find first game with a landscapeImage set
          const bgGame = [...historyGames, ...favouriteGames].find(g => g.landscapeImage) || historyGames[0] || favouriteGames[0]
          const bgImg = bgGame?.landscapeImage || null
          return bgImg ? (
            <>
              <SafeImage src={bgImg} alt="" fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55" style={{ backdropFilter: "blur(0.5px)" }} />
            </>
          ) : (
            <div className="w-full h-full" style={{ background: user.banner || "linear-gradient(135deg, #1a103c, #2d1b54, #9d4edd)" }} />
          )
        })()}
      </div>

      {/* Profile header */}
      <div className="max-w-5xl mx-auto px-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 rounded-full ring-4 ring-[#090514] overflow-hidden bg-gradient-to-br from-[#9d4edd] to-[#7b2cbf] flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
              {user.avatar ? <SafeImage src={user.avatar} alt="" fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
            </div>
            {/* Like/Dislike counts below avatar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                <span className="font-semibold text-white">{likedGames.length}</span>
              </div>
              <div className="w-px h-3 bg-gray-700" />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className="font-semibold text-white">{favouriteGames.length}</span>
                <span>❤️</span>
              </div>
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              {planBadge[user.subscription_plan] && <span className="text-lg">{planBadge[user.subscription_plan]}</span>}
              {user.is_creator && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>Creator</span>}
            </div>
            <p className="text-gray-400 text-sm">@{user.username}</p>
            {user.bio && <p className="text-gray-300 text-sm mt-1">{user.bio}</p>}
          </div>
          <div className="flex gap-2 pb-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ background: "rgba(157,78,221,0.1)", borderColor: "rgba(157,78,221,0.3)", color: "#c77dff" }}>
              {user.subscription_plan === 'free' ? 'Free' : user.subscription_plan}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Games Viewed", value: historyGames.length },
            { label: "Favourites", value: favouriteGames.length },
            { label: "Liked Games", value: likedGames.length },
            { label: "Member Since", value: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center border" style={{ background: "rgba(157,78,221,0.06)", borderColor: "rgba(157,78,221,0.15)" }}>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2d1b54] mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <Link key={t.id} href={`/profile?tab=${t.id}`}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
                tab === t.id ? "border-[#9d4edd] text-[#9d4edd]" : "border-transparent text-gray-400 hover:text-white")}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="pb-12">
            <h2 className="text-white font-bold mb-4">Recent Activity</h2>
            {historyGames.length === 0 ? (
              <p className="text-gray-500 text-sm">No games viewed yet. Start exploring!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {historyGames.slice(0, 6).map(g => (
                  <Link key={g.id} href={`/game/${g.id}`} className="group">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c] relative">
                      <SafeImage src={g.image || "/placeholder.svg"} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="text-gray-300 text-xs mt-1.5 line-clamp-1 group-hover:text-white transition-colors">{g.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="pb-12">
            <h2 className="text-white font-bold mb-4">Watch History <span className="text-gray-500 font-normal text-sm">(auto-clears after 7 days)</span></h2>
            {historyGames.length === 0 ? (
              <p className="text-gray-500 text-sm">No watch history yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {historyGames.map(g => (
                  <div key={g.id} className="group">
                    <Link href={`/game/${g.id}`}>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <SafeImage src={g.image || "/placeholder.svg"} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <p className="text-gray-300 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{g.title}</p>
                    </Link>
                    <Link href={`/game/${g.id}#reviews`} className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />)}
                      <span className="text-[#9d4edd] text-[10px] ml-1">Review</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "favourites" && (
          <div className="pb-12">
            <h2 className="text-white font-bold mb-4">Favourites</h2>
            {favouriteGames.length === 0 ? (
              <p className="text-gray-500 text-sm">No favourites yet. Heart a game to save it here.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {favouriteGames.map(g => (
                  <div key={g.id} className="group">
                    <Link href={`/game/${g.id}`}>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <SafeImage src={g.image || "/placeholder.svg"} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <p className="text-gray-300 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{g.title}</p>
                    </Link>
                    <Link href={`/game/${g.id}#reviews`} className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />)}
                      <span className="text-[#9d4edd] text-[10px] ml-1">Review</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "likes" && (
          <div className="pb-12">
            <h2 className="text-white font-bold mb-4">Liked Games</h2>
            {likedGames.length === 0 ? (
              <p className="text-gray-500 text-sm">No liked games yet. Like a game on its page to see it here.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {likedGames.map(g => (
                  <Link key={g.id} href={`/game/${g.id}`} className="group">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                      <SafeImage src={g.image || "/placeholder.svg"} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="text-gray-300 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{g.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="pb-12 max-w-2xl space-y-6">
            {/* Edit Profile */}
            <div className="rounded-2xl border p-6" style={{ background: "rgba(18,11,34,0.8)", borderColor: "rgba(157,78,221,0.2)" }}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#9d4edd]" /> Edit Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Email</label>
                  <input value={user.email} disabled className="w-full bg-[#1a103c]/50 border border-[#2d1b54] rounded-xl px-4 py-2.5 text-gray-500 outline-none text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white outline-none transition-colors text-sm resize-none" />
                </div>
                {saveMsg && <p className={cn("text-sm", saveMsg.includes("!") ? "text-green-400" : "text-red-400")}>{saveMsg}</p>}
                <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-2xl border p-6" style={{ background: "rgba(18,11,34,0.8)", borderColor: "rgba(157,78,221,0.2)" }}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-[#9d4edd]" /> Notification Settings</h3>
              <div className="space-y-3">
                {[
                  { key: "gameUpdates", label: "Game Updates", desc: "When your favourited games are updated" },
                  { key: "adminAnnouncements", label: "Admin Announcements", desc: "Important updates from the team" },
                  { key: "requestUpdates", label: "Request Updates", desc: "When your game requests are processed" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                    <button onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className={cn("w-11 h-6 rounded-full transition-colors relative", notifSettings[item.key as keyof typeof notifSettings] ? "bg-[#9d4edd]" : "bg-gray-700")}>
                      <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", notifSettings[item.key as keyof typeof notifSettings] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border p-6" style={{ background: "rgba(18,11,34,0.8)", borderColor: "rgba(157,78,221,0.2)" }}>
              <h3 className="text-white font-bold mb-4">Change Password</h3>
              <div className="space-y-3">
                <input type="password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 pr-10 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwMsg && <p className={cn("text-sm", pwMsg.includes("!") ? "text-green-400" : "text-red-400")}>{pwMsg}</p>}
                <button onClick={changePassword} className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  Update Password
                </button>
              </div>
            </div>

            {/* Creator Portal Password */}
            {user.is_creator && (
              <div className="rounded-2xl border p-6" style={{ background: "rgba(18,11,34,0.8)", borderColor: "rgba(245,158,11,0.3)" }}>
                <h3 className="text-white font-bold mb-1 flex items-center gap-2"><span className="text-yellow-400">👑</span> Creator Portal Password</h3>
                <p className="text-gray-500 text-xs mb-4">Change the password used to log into your Creator Portal. Your Portal ID stays the same.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Portal ID (read-only)</label>
                    <input value={user.creator_portal_id || ''} disabled className="w-full bg-[#1a103c]/50 border border-[#2d1b54] rounded-xl px-4 py-2.5 text-gray-400 outline-none text-sm font-mono cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">New Portal Password</label>
                    <input type="text" placeholder="New portal password" value={portalPw} onChange={e => setPortalPw(e.target.value)}
                      className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-yellow-500/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                  </div>
                  {portalPwMsg && <p className={cn("text-sm", portalPwMsg.includes("!") ? "text-green-400" : "text-red-400")}>{portalPwMsg}</p>}
                  <button onClick={changeCreatorPortalPassword} className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    Update Portal Password
                  </button>
                </div>
              </div>
            )}

            {/* Delete Account */}
            <div className="rounded-2xl border p-6" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.3)" }}>
              <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Delete Account</h3>
              <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
              <div className="space-y-3">
                <input type="password" placeholder="Confirm your password" value={deleteConfirmPw} onChange={e => setDeleteConfirmPw(e.target.value)}
                  className="w-full bg-[#1a103c] border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deleteChecked} onChange={e => setDeleteChecked(e.target.checked)} className="accent-red-500" />
                  <span className="text-gray-400 text-sm">I understand this action cannot be undone</span>
                </label>
                <button onClick={deleteAccount} disabled={!deleteChecked || !deleteConfirmPw}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <Suspense fallback={null}>
          <ProfileContent />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  )
}
