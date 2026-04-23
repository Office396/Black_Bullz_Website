"use client"

import { useState, useEffect, useRef } from "react"
import { Crown, Plus, Edit2, Trash2, LogOut, Eye, EyeOff, ExternalLink, TrendingUp, Star, Heart, X, AlertTriangle } from "lucide-react"
import { AdminItemForm } from "@/components/admin-item-form"
import { SafeImage } from "@/components/safe-image"

interface CreatorUser {
  id: string
  name: string
  username: string
  subscription_plan: string
  creator_portal_id: string
  creator_portal_password: string
}

interface GameStats {
  watches: number
  favourites: number
  isTrending: boolean
  isTop: boolean
}

export default function CreatorPortalPage() {
  const [authed, setAuthed] = useState(false)
  const [creator, setCreator] = useState<CreatorUser | null>(null)
  const [portalId, setPortalId] = useState("")
  const [portalPw, setPortalPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [games, setGames] = useState<any[]>([])
  const [stats, setStats] = useState<Record<number, GameStats>>({})
  const [gamesLoading, setGamesLoading] = useState(false)
  const [view, setView] = useState<string>("list")
  const [editGame, setEditGame] = useState<any | null>(null)
  const [msg, setMsg] = useState("")
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getHeaders = (): Record<string, string> =>
    creator
      ? { "x-portal-id": creator.creator_portal_id, "x-portal-password": creator.creator_portal_password }
      : {}

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")
    const res = await fetch("/api/creator/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portalId, portalPassword: portalPw })
    })
    const data = await res.json()
    setLoginLoading(false)
    if (data.error) { setLoginError(data.error); return }
    setCreator(data.user)
    setAuthed(true)
    sessionStorage.setItem("creator_portal_session", JSON.stringify(data.user))
  }

  const logout = () => {
    sessionStorage.removeItem("creator_portal_session")
    setAuthed(false)
    setCreator(null)
    setGames([])
    setStats({})
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("creator_portal_session")
    if (saved) {
      try { const u = JSON.parse(saved); setCreator(u); setAuthed(true) } catch {}
    }
  }, [])

  const loadGames = async () => {
    if (!creator) return
    setGamesLoading(true)
    const h = getHeaders()
    const [gamesRes, statsRes] = await Promise.all([
      fetch("/api/creator/games", { headers: h }),
      fetch("/api/creator/stats", { headers: h }),
    ])
    const gamesData = await gamesRes.json()
    const statsData = await statsRes.json()
    if (gamesData.data) setGames(gamesData.data)
    if (statsData.stats) setStats(statsData.stats)
    setGamesLoading(false)
  }

  useEffect(() => { if (authed && creator) loadGames() }, [authed, creator])

  const deleteGame = async (id: number) => {
    if (!confirm("Delete this game?")) return
    await fetch("/api/creator/games", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify({ action: "delete", id })
    })
    loadGames()
  }

  const handleSaved = () => {
    setMsg(view === "add" ? "Game added successfully!" : "Game updated!")
    setDupWarning(null)
    setTimeout(() => setMsg(""), 3000)
    setView("list")
    loadGames()
  }

  const handleTitleChange = (title: string) => {
    setDupWarning(null)
    if (dupTimer.current) clearTimeout(dupTimer.current)
    if (!title || title.trim().length < 2) return
    // Only check on add — on edit the game already exists
    if (view !== "add") return
    dupTimer.current = setTimeout(async () => {
      const res = await fetch("/api/creator/check-title?title=" + encodeURIComponent(title.trim()))
      const data = await res.json()
      if (data.exists) {
        setDupWarning(`"${data.match}" already exists on the site. Please don't upload duplicate games.`)
      }
    }, 600)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #090514, #120b22, #1a103c)" }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Creator Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in with your portal credentials</p>
          </div>
          <form onSubmit={login} className="rounded-2xl border p-6 space-y-4" style={{ background: "rgba(18,11,34,0.9)", borderColor: "rgba(157,78,221,0.3)" }}>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Portal ID</label>
              <input value={portalId} onChange={e => setPortalId(e.target.value)} placeholder="creator_xxxxxx"
                className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Portal Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={portalPw} onChange={e => setPortalPw(e.target.value)}
                  className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 pr-10 text-white placeholder-gray-500 outline-none text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-gray-600 text-xs mt-4">Find your credentials on your Creator page or Profile settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #090514, #120b22, #1a103c)" }}>
      <div className="border-b border-[#2d1b54] px-4 py-3 flex items-center justify-between sticky top-0 z-40" style={{ background: "rgba(9,5,20,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Creator Portal</p>
            <p className="text-gray-500 text-xs">@{creator?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {view !== "list" && (
            <button onClick={() => { setView("list"); setDupWarning(null) }} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
              <X className="w-4 h-4" /> Back to list
            </button>
          )}
          <button onClick={logout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {msg && (
          <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-center bg-green-500/10 text-green-400 border border-green-500/30">
            {msg}
          </div>
        )}

        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">My Games ({games.length})</h2>
              <button onClick={() => { setEditGame(null); setDupWarning(null); setView("add") }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                <Plus className="w-4 h-4" /> Add Game
              </button>
            </div>

            {gamesLoading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : games.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "rgba(157,78,221,0.2)", background: "rgba(157,78,221,0.03)" }}>
                <div className="text-5xl mb-4">🎮</div>
                <p className="text-white font-bold mb-2">No games yet</p>
                <p className="text-gray-500 text-sm mb-6">Upload your first game to get started</p>
                <button onClick={() => { setEditGame(null); setDupWarning(null); setView("add") }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  Add Your First Game
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((g: any) => {
                  const s = stats[g.id]
                  return (
                    <div key={g.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: "rgba(18,11,34,0.8)", borderColor: "rgba(157,78,221,0.15)" }}>
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#1a103c] flex-shrink-0">
                        {g.image && <SafeImage src={g.image} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-white font-semibold text-sm">{g.title}</p>
                          {s?.isTrending && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              <TrendingUp className="w-3 h-3" /> Trending
                            </span>
                          )}
                          {s?.isTop && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              <Star className="w-3 h-3" /> Top Games
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mb-2">{g.category}{g.size ? " · " + g.size : ""}</p>
                        {s && (
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {s.watches} views</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {s.favourites} favs</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={"/game/" + g.id} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View on site">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => { setEditGame(g); setDupWarning(null); setView("edit") }}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#9d4edd] hover:bg-[#9d4edd]/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteGame(g.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {(view === "add" || view === "edit") && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">{view === "add" ? "Add New Game" : "Edit: " + editGame?.title}</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in all the details for your game listing</p>
            </div>
            {dupWarning && (
              <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{dupWarning}</span>
              </div>
            )}
            <AdminItemForm
              editItem={view === "edit" ? editGame : undefined}
              onSave={handleSaved}
              onTitleChange={handleTitleChange}
              overrideApiUrl="/api/creator/games"
              overrideApiHeaders={getHeaders()}
              overrideMethod={() => "POST"}
              overrideBody={(isEdit: boolean, id: number | undefined, formData: any) =>
                isEdit ? { action: "update", id, ...formData } : { action: "add", ...formData }
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
