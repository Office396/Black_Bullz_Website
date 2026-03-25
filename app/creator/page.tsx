"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from "@/lib/user-context"
import { Crown, ExternalLink, Lock, Sparkles, Copy, Check, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function CreatorPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [showPortalPw, setShowPortalPw] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  if (!user.is_creator) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-[#9d4edd]/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#9d4edd]" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Creator Mode Locked</h1>
            <p className="text-gray-400 mb-6">You need a Revolution Leader or Revolutionist subscription to access Creator Mode.</p>
            <Link href="/subscribe" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
              <Sparkles className="w-4 h-4" /> Upgrade to Creator
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/creator/portal` : '/creator/portal'

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border" style={{ background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.4)", color: "#fbbf24" }}>
              <Crown className="w-3.5 h-3.5" /> Creator Mode Active
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome, {user.name}!</h1>
            <p className="text-gray-400">Use your Creator Portal to upload and manage your games.</p>
          </div>

          {/* Portal Credentials */}
          <div className="rounded-2xl border p-6 mb-6" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(18,11,34,0.9))", borderColor: "rgba(245,158,11,0.3)" }}>
            <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Crown className="w-4 h-4 text-yellow-400" /> Your Creator Portal Credentials</h2>
            <p className="text-gray-400 text-sm mb-4">Use these credentials to log into your personal Creator Portal. Keep them safe — only you should have access.</p>

            <div className="space-y-3 mb-5">
              {/* Portal URL */}
              <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Portal URL</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[#9d4edd] text-sm font-mono break-all">{portalUrl}</p>
                  <button onClick={() => copyToClipboard(portalUrl, 'url')} className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                    {copied === 'url' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Portal ID */}
              <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Portal ID</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-mono">{user.creator_portal_id || '—'}</p>
                  {user.creator_portal_id && (
                    <button onClick={() => copyToClipboard(user.creator_portal_id!, 'id')} className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                      {copied === 'id' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Portal Password */}
              <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Portal Password</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-mono">{showPortalPw ? (user.creator_portal_password || '—') : '••••••••••'}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setShowPortalPw(!showPortalPw)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                      {showPortalPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {user.creator_portal_password && (
                      <button onClick={() => copyToClipboard(user.creator_portal_password!, 'pw')} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        {copied === 'pw' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <ExternalLink className="w-4 h-4" /> Open Creator Portal
              </a>
              <Link href="/profile?tab=settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors border border-[#2d1b54] hover:border-[#9d4edd]/50">
                Change Portal Password
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Upload Games", desc: "Add new games to BullzGamez", icon: "🎮" },
              { label: "Manage Uploads", desc: "Edit or remove your games", icon: "✏️" },
              { label: "Your Own Panel", desc: "Completely separate from admin", icon: "🔒" },
            ].map(item => (
              <div key={item.label} className="rounded-xl border p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(157,78,221,0.15)" }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl border" style={{ background: "rgba(157,78,221,0.05)", borderColor: "rgba(157,78,221,0.2)" }}>
            <p className="text-gray-400 text-sm">
              <span className="text-[#c77dff] font-semibold">Your subscription:</span> {user.subscription_plan}
              {user.subscription_expires_at && ` · Renews ${new Date(user.subscription_expires_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
