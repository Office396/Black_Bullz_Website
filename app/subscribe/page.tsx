"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from "@/lib/user-context"
import { Crown, Sparkles, Check, Zap, Star, Shield } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "fighter",
    name: "Freedom Fighter",
    price: 5,
    badge: "🥉",
    color: "#cd7f32",
    gradient: "from-amber-700/20 to-amber-900/10",
    border: "rgba(205,127,50,0.4)",
    features: ["Ad-free browsing", "Supporter badge", "Early access to new games", "Priority support", "Leaderboard spotlight"],
    creator: false,
  },
  {
    id: "leader",
    name: "Revolution Leader",
    price: 10,
    badge: "🥈",
    color: "#9d4edd",
    gradient: "from-purple-700/20 to-purple-900/10",
    border: "rgba(157,78,221,0.5)",
    popular: true,
    features: ["Everything in Fighter", "Creator mode access", "Upload games to BullzGamez", "Custom profile banner", "Exclusive content", "Discord VIP role"],
    creator: true,
  },
  {
    id: "revolutionist",
    name: "Revolutionist",
    price: 15,
    badge: "🥇",
    color: "#f59e0b",
    gradient: "from-yellow-600/20 to-yellow-900/10",
    border: "rgba(245,158,11,0.5)",
    features: ["Everything in Leader", "Top supporter badge", "Direct admin contact", "Custom profile banner", "Priority game requests", "Name in credits"],
    creator: true,
  },
]

const featureTable = [
  { feature: "Ad-free browsing", free: false, paid: true },
  { feature: "Supporter badge", free: false, paid: true },
  { feature: "Creator mode", free: false, paid: "Leader+" },
  { feature: "Upload games", free: false, paid: "Leader+" },
  { feature: "Priority support", free: false, paid: true },
  { feature: "Early access", free: false, paid: true },
  { feature: "Discord VIP", free: "Standard", paid: "VIP role" },
  { feature: "Game requests", free: "Community", paid: "Priority" },
]

export default function SubscribePage() {
  const { user, token, refreshUser } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState("")

  const subscribe = async (planId: string) => {
    if (!user) { router.push('/login'); return }
    setLoading(planId)
    const res = await fetch('/api/user/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: planId })
    })
    const data = await res.json()
    setLoading(null)
    if (data.success) {
      await refreshUser()
      setMsg("Subscription activated! Welcome to the team.")
      setTimeout(() => router.push('/profile'), 2000)
    } else {
      setMsg(data.error || "Something went wrong")
    }
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ background: "rgba(157,78,221,0.15)", borderColor: "rgba(157,78,221,0.4)", color: "#c77dff" }}>
              <Sparkles className="w-3.5 h-3.5" /> Support BullzGamez
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              We don't run ads.<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #9d4edd, #c77dff)" }}>
                We run on you.
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              BullzGamez provides games for free. No paywalls, no ads, no tracking. Subscribers unlock creator tools, exclusive content, and keep the servers running.
            </p>
          </div>

          {msg && (
            <div className="mb-8 p-4 rounded-xl text-center font-semibold text-green-400 border border-green-500/30 bg-green-500/10">{msg}</div>
          )}

          {/* Current plan indicator */}
          {user && user.subscription_plan !== 'free' && (
            <div className="mb-8 p-4 rounded-xl text-center border" style={{ background: "rgba(157,78,221,0.1)", borderColor: "rgba(157,78,221,0.3)" }}>
              <p className="text-[#c77dff] font-semibold">You are currently on the <span className="font-black">{user.subscription_plan}</span> plan {plans.find(p => p.id === user.subscription_plan)?.badge}</p>
            </div>
          )}

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map(plan => {
              const isCurrentPlan = user?.subscription_plan === plan.id
              return (
                <div key={plan.id} className={cn("relative rounded-2xl border p-6 flex flex-col transition-all", plan.popular && "scale-[1.02]")}
                  style={{ background: `linear-gradient(135deg, ${plan.gradient.replace('from-', '').replace('to-', '')})`, borderColor: plan.border, backgroundImage: `linear-gradient(135deg, rgba(18,11,34,0.95), rgba(9,5,20,0.95))` }}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{plan.badge}</span>
                      <h3 className="text-white font-black text-lg">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">${plan.price}</span>
                      <span className="text-gray-400 text-sm">USD/month</span>
                    </div>
                    {plan.creator && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: "#fbbf24" }}>
                        <Crown className="w-3.5 h-3.5" /> Includes Creator Access
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={isCurrentPlan || loading === plan.id}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: isCurrentPlan ? "rgba(157,78,221,0.3)" : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}
                  >
                    {isCurrentPlan ? "Current Plan ✓" : loading === plan.id ? "Activating..." : "Subscribe"}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Feature comparison table */}
          <div className="rounded-2xl border overflow-hidden mb-12" style={{ borderColor: "rgba(157,78,221,0.2)" }}>
            <div className="p-6 text-center border-b" style={{ borderColor: "rgba(157,78,221,0.2)", background: "rgba(157,78,221,0.05)" }}>
              <h2 className="text-2xl font-black text-white">Free vs Premium</h2>
              <p className="text-gray-400 text-sm mt-1">See what you unlock with a subscription</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Feature</th>
                    <th className="px-6 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Free</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider font-semibold" style={{ color: "#9d4edd" }}>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {featureTable.map((row, i) => (
                    <tr key={row.feature} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(157,78,221,0.1)" }}>
                      <td className="px-6 py-3 text-white text-sm font-medium">{row.feature}</td>
                      <td className="px-6 py-3 text-center text-sm text-gray-500">
                        {row.free === false ? <span className="text-gray-600">—</span> : row.free === true ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : row.free}
                      </td>
                      <td className="px-6 py-3 text-center text-sm">
                        {row.paid === true ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <span style={{ color: "#c77dff" }} className="font-semibold">{row.paid}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm">
            Cancel anytime. Also support us on{" "}
            <a href="https://www.patreon.com/c/BullzGamez" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">Patreon</a>
            {" "}or{" "}
            <a href="https://opencollective.com/bullz-games" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Open Collective</a>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
