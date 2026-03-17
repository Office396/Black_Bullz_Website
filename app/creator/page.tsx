"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from "@/lib/user-context"
import { Crown, ExternalLink, Lock, Sparkles } from "lucide-react"
import Link from "next/link"

export default function CreatorPage() {
  const { user, loading } = useUser()
  const router = useRouter()

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

  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/portal` : '/admin/portal'

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border" style={{ background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.4)", color: "#fbbf24" }}>
              <Crown className="w-3.5 h-3.5" /> Creator Mode Active
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome, Creator {user.name}!</h1>
            <p className="text-gray-400">You have creator access. Use the Creator Panel to upload and manage your games.</p>
          </div>

          <div className="rounded-2xl border p-6 mb-6" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(18,11,34,0.9))", borderColor: "rgba(245,158,11,0.3)" }}>
            <h2 className="text-white font-bold mb-2 flex items-center gap-2"><Crown className="w-4 h-4 text-yellow-400" /> Creator Panel Access</h2>
            <p className="text-gray-400 text-sm mb-4">Access the creator panel to upload games, manage your uploads, and track performance.</p>
            <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-4 mb-4 font-mono text-sm">
              <p className="text-gray-400 text-xs mb-1">Panel URL</p>
              <p className="text-[#9d4edd] break-all">{adminUrl}</p>
            </div>
            <a href={adminUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <ExternalLink className="w-4 h-4" /> Open Creator Panel
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Upload Games", desc: "Add new games to BullzGamez", icon: "🎮" },
              { label: "Manage Uploads", desc: "Edit or remove your games", icon: "✏️" },
              { label: "Track Performance", desc: "See views and downloads", icon: "📊" },
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
              <span className="text-[#c77dff] font-semibold">Your subscription:</span> {user.subscription_plan} — Creator access active
              {user.subscription_expires_at && ` · Renews ${new Date(user.subscription_expires_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
