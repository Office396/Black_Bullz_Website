"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { MessageSquarePlus, ArrowRight, Shield, Clock, Users, LogIn, Send } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"

export default function RequestPage() {
  const { user, token } = useUser()
  const [gameTitle, setGameTitle] = useState("")
  const [platform, setPlatform] = useState("PC")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gameTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameTitle, platform, description, userName: user?.name })
      })
      const data = await res.json()
      if (data.success) { setSubmitted(true); setGameTitle(""); setDescription("") }
      else setError(data.error || "Failed to submit")
    } catch { setError("Something went wrong") }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#9d4edd]/20 mb-4">
              <MessageSquarePlus className="w-8 h-8 text-[#9d4edd]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Request a Game</h1>
            <p className="text-gray-400">Community voting system — your voice matters!</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { n: "1", label: "Submit Game", sub: "Request your favourite", color: "blue" },
              { n: "2", label: "Get Votes", sub: "Needs 20 votes", color: "green" },
              { n: "3", label: "Fast Processing", sub: "Within 24 hours", color: "yellow" },
            ].map(s => (
              <div key={s.n} className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full bg-${s.color}-500/20 flex items-center justify-center`}>
                  <span className={`text-xl font-bold text-${s.color}-500`}>{s.n}</span>
                </div>
                <p className="text-white font-semibold text-sm">{s.label}</p>
                <p className="text-gray-500 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>

          {!user ? (
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl p-8 text-center">
              <Shield className="w-10 h-10 text-[#9d4edd] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
              <p className="text-gray-400 mb-6 text-sm">You need an account to submit game requests and vote.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                  <LogIn className="w-4 h-4" /> Log in
                </Link>
                <Link href="/signup" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">
                  Create Account <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : submitted ? (
            <div className="bg-[#120b22] border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Request Submitted!</h2>
              <p className="text-gray-400 text-sm mb-4">Your request has been submitted. It will be processed once it gets enough votes.</p>
              <button onClick={() => setSubmitted(false)} className="px-5 py-2.5 rounded-xl bg-[#9d4edd] text-white text-sm font-semibold hover:bg-[#7b2cbf] transition-colors">
                Submit Another
              </button>
            </div>
          ) : (
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Submit a Request</h2>
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Game Title *</label>
                  <input value={gameTitle} onChange={e => setGameTitle(e.target.value)} required placeholder="e.g. Cyberpunk 2077"
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Platform</label>
                  <div className="flex gap-2">
                    {["PC", "Android"].map(p => (
                      <button key={p} type="button" onClick={() => setPlatform(p)}
                        className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors", platform === p ? "bg-[#9d4edd] text-white" : "bg-[#1a103c] text-gray-400 border border-[#2d1b54] hover:border-[#9d4edd]/50")}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Description (optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Any additional details..."
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm resize-none" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
