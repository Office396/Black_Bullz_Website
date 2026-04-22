"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import {
  Heart, Shield, Zap, Globe, Lock, ChevronDown, ChevronUp,
  Trophy, Star, Crown, Flame, Users, TrendingDown, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

const topDonors = [
  { name: "GameMaster", amount: 500, rank: 1, country: "🇺🇸" },
  { name: "StealthPlayer", amount: 350, rank: 2, country: "🇩🇪" },
  { name: "NightOwl", amount: 280, rank: 3, country: "🇬🇧" },
  { name: "ProGamer99", amount: 200, rank: 4, country: "🇨🇦" },
  { name: "TheRealOne", amount: 150, rank: 5, country: "🇦🇺" },
  { name: "CyberWolf", amount: 120, rank: 6, country: "🇫🇷" },
  { name: "DragonSlayer", amount: 100, rank: 7, country: "🇧🇷" },
  { name: "ShadowKnight", amount: 85, rank: 8, country: "🇯🇵" },
]
const faqItems = [
  { q: "Is this platform completely free?", a: "Always. We will never charge you to download or play games. Donations help us keep the lights on and the servers fast." },
  { q: "What do you do with the money?", a: "60% goes to storage and CDN costs, 25% covers server infrastructure, and 15% handles renewals, tools, and miscellaneous expenses. Every dollar is accounted for." },
  { q: "Which payment methods are supported?", a: "We accept Bitcoin, Ethereum, USDT, PayPal, and major credit/debit cards. Crypto is preferred — it aligns with our values and keeps fees low." },
  { q: "Do donors get any perks?", a: "Yes — ad-free browsing, a supporter badge on your profile, priority support, and a permanent spot on our leaderboard." },
  { q: "Can I donate anonymously?", a: "Absolutely. Crypto donations are private by nature. For PayPal/card, just use a nickname when prompted." },
]

export default function DonatePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string | null>("Crypto")
  const [cryptoCoin, setCryptoCoin] = useState<string>("Bitcoin")
  const [showMoreCoins, setShowMoreCoins] = useState(false)
  const [otherCoin, setOtherCoin] = useState("")
  const [selectedCryptoForPayment, setSelectedCryptoForPayment] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [donorName, setDonorName] = useState("")
  const [donorMessage, setDonorMessage] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Donate settings from admin
  const [donateSettings, setDonateSettings] = useState<{
    totalRaised: number; totalSupporters: number; countries: number;
    donors: { name: string; amount: number; rank: number; country: string }[];
    wallets: { coin: string; symbol: string; icon: string; color: string; address: string; network: string; networkTag: string; confirmTime: string; enabled: boolean }[];
  } | null>(null)

  useEffect(() => {
    fetch("/api/admin/donate")
      .then(r => r.json())
      .then(d => { if (d.donate) setDonateSettings(d.donate) })
      .catch(() => {})
  }, [])

  // ── Wallet addresses — managed via Admin > Donate tab ──
  const activeDonors = donateSettings
    ? [...donateSettings.donors].sort((a, b) => a.rank - b.rank)
    : [...topDonors].sort((a, b) => a.rank - b.rank)
  const statsRaised = donateSettings?.totalRaised ?? 796
  const statsSupporters = donateSettings?.totalSupporters ?? 34
  const statsCountries = donateSettings?.countries ?? 12

  const DEFAULT_WALLETS: Record<string, { address: string; network: string; networkTag: string; confirmTime: string }> = {
    Bitcoin:   { address: "", network: "Bitcoin",         networkTag: "BTC",   confirmTime: "~10 min" },
    Ethereum:  { address: "", network: "Ethereum",        networkTag: "ERC20", confirmTime: "~1 min"  },
    USDT:      { address: "", network: "Tron (TRC20)",    networkTag: "TRC20", confirmTime: "~3 sec"  },
    USDC:      { address: "", network: "Ethereum",        networkTag: "ERC20", confirmTime: "~1 min"  },
    BNB:       { address: "", network: "BNB Smart Chain", networkTag: "BEP20", confirmTime: "~3 sec"  },
    Solana:    { address: "", network: "Solana",          networkTag: "SOL",   confirmTime: "~30 sec" },
    Litecoin:  { address: "", network: "Litecoin",        networkTag: "LTC",   confirmTime: "~5 min"  },
    Tron:      { address: "", network: "Tron",            networkTag: "TRC20", confirmTime: "~3 sec"  },
    Dogecoin:  { address: "", network: "Dogecoin",        networkTag: "DOGE",  confirmTime: "~5 min"  },
    Polygon:   { address: "", network: "Polygon",         networkTag: "MATIC", confirmTime: "~3 sec"  },
    Ripple:    { address: "", network: "Ripple",          networkTag: "XRP",   confirmTime: "~5 sec"  },
  }

  // Build WALLETS from admin settings if available
  const WALLETS: Record<string, { address: string; network: string; networkTag: string; confirmTime: string }> = {}
  if (donateSettings?.wallets) {
    for (const w of donateSettings.wallets) {
      if (w.enabled) {
        WALLETS[w.coin] = { address: w.address, network: w.network, networkTag: w.networkTag, confirmTime: w.confirmTime }
      }
    }
  } else {
    Object.assign(WALLETS, DEFAULT_WALLETS)
  } 

  // CoinGecko ID map
  const COINGECKO_IDS: Record<string, string> = {
    Bitcoin: "bitcoin", Ethereum: "ethereum", USDT: "tether", USDC: "usd-coin",
    BNB: "binancecoin", Solana: "solana", Litecoin: "litecoin", Tron: "tron",
    Dogecoin: "dogecoin", Polygon: "matic-network", Ripple: "ripple",
    Cardano: "cardano", Avalanche: "avalanche-2", Chainlink: "chainlink",
    Dash: "dash", Zcash: "zcash", Shiba: "shiba-inu",
  }

  // Fetch live prices when reaching step 3
  useEffect(() => {
    if (step !== 3) return
    setPricesLoading(true)
    const ids = Object.values(COINGECKO_IDS).join(",")
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .then((r) => r.json())
      .then((data) => {
        const mapped: Record<string, number> = {}
        for (const [coin, geckoId] of Object.entries(COINGECKO_IDS)) {
          if (data[geckoId]?.usd) mapped[coin] = data[geckoId].usd
        }
        setPrices(mapped)
      })
      .catch(() => {}) // silently fail — fallback prices used
      .finally(() => setPricesLoading(false))
  }, [step])

  function getCryptoAmount(coin: string): string {
    const price = prices[coin]
    if (!price || !finalAmount) return "..."
    return (finalAmount / price).toFixed(coin === "USDT" || coin === "USDC" ? 2 : 8)
  }

  function getDisplayPrice(coin: string, fallback: string): string {
    const price = prices[coin]
    if (!price) return fallback
    return price >= 1 ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${price.toFixed(4)}`
  }

  function navigateToPayment(coin: string) {
    const info = WALLETS[coin]
    if (!info) return
    const cryptoAmt = getCryptoAmount(coin)
    const livePrice = prices[coin] ? `${prices[coin].toLocaleString("en-US", { maximumFractionDigits: 2 })}` : ""
    const params = new URLSearchParams({
      coin,
      amount: String(finalAmount || 0),
      address: info.address,
      network: info.network,
      networkTag: info.networkTag,
      confirmTime: info.confirmTime,
      cryptoAmt,
      livePrice,
    })
    router.push(`/donate/payment?${params.toString()}`)
  }

  const formRef = useRef<HTMLDivElement>(null)
  const presetAmounts = [10, 25, 50, 100, 200]
  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : null)

  function goToStep(s: 1 | 2 | 3) {
    setStep(s)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090514]">
      <Header />
      <div className="pt-16 bg-gray-50 dark:bg-[#090514]">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #9d4edd, transparent)" }} />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #c77dff, transparent)" }} />
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ background: "rgba(157,78,221,0.15)", borderColor: "rgba(157,78,221,0.4)", color: "#c77dff" }}>
                <Heart className="w-3.5 h-3.5" /> Community-Powered Platform
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
                Fuel the Fight for{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #9d4edd, #c77dff)" }}>
                  Free Gaming
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                No subscriptions. No paywalls. No corporate gatekeeping. Your support keeps this platform alive and independent — forever.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <a href="#donate-form" className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                  Support Now
                </a>
                <a href="#alternatives" className="px-6 py-3 rounded-xl font-semibold border transition-all hover:bg-white/5" style={{ borderColor: "rgba(157,78,221,0.4)", color: "#c77dff" }}>
                  Other Ways to Help
                </a>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Shield, label: "DRM-Free" },
                  { icon: Zap, label: "Free Forever" },
                  { icon: Globe, label: "Anti-Monopoly" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#a0a0b0" }}>
                    <Icon className="w-4 h-4" style={{ color: "#9d4edd" }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {/* Right card */}
              <div className="rounded-2xl p-6 border relative overflow-hidden bg-white dark:bg-[#120b22] dark:bg-gradient-to-br dark:from-[#9d4edd]/10 dark:to-[#120b22]/90 border-[#9d4edd]/30">
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(157,78,221,0.3)", color: "#c77dff" }}>
                100% Ad-Free
              </div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9d4edd" }}>Unlocked Experience</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">No limits. No ads.</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Just play.</p>
              </div>
              <div className="space-y-3 mt-6">
                {[
                  { label: "Unlimited Downloads", sub: "No daily caps or speed throttling" },
                  { label: "Zero Advertisements", sub: "Clean interface, always" },
                  { label: "Community Driven", sub: "Shaped by players, not investors" },
                  { label: "Private & Anonymous", sub: "No tracking, no accounts required" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#9d4edd" }} />
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm font-semibold">{item.label}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DONATION FORM ── */}
        <section id="donate-form" className="py-12 px-4" ref={formRef}>
          <div className="max-w-3xl mx-auto">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {([1, 2, 3] as const).map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all", step >= s ? "text-white" : "text-gray-500 border border-gray-300 dark:border-white/10")} style={step >= s ? { background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" } : {}}>
                    {s}
                  </div>
                  <span className={cn("text-sm hidden sm:block", step >= s ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-500")}>
                    {s === 1 ? "Amount" : s === 2 ? "Details" : "Currency"}
                  </span>
                    {s < 3 && <div className="w-8 h-px mx-1" style={{ background: step > s ? "#9d4edd" : "rgba(156,163,175,0.4)" }} />}
                </div>
              ))}
            </div>

              <div className="rounded-2xl border p-6 bg-white dark:bg-[#120b22] dark:bg-gradient-to-b dark:from-[#120b22]/90 dark:to-[#090514]/90 border-[#9d4edd]/20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Support with Crypto, PayPal or Card</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Fast, secure, and private — perfectly aligned with our mission for gaming freedom.</p>

              {step === 1 && (
                <>
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Select Donation Amount</h3>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {presetAmounts.map((a) => (
                      <button key={a} onClick={() => { setAmount(a); setCustomAmount("") }}
                        className={cn("px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105", amount === a ? "text-white" : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-purple-500/40 bg-gray-50 dark:bg-white/[0.04]")}
                        style={amount === a ? { background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" } : {}}>
                        ${a}
                      </button>
                    ))}
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-gray-400">$</span>
                      <input type="number" placeholder="Custom" value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setAmount(null) }}
                        className="w-20 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
                    </div>
                  </div>

                  <div className="rounded-xl p-4 mb-6 border" style={{ background: "rgba(157,78,221,0.08)", borderColor: "rgba(157,78,221,0.2)" }}>
                    <h4 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm">Why Your Support Matters</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Shield, label: "Ad-Free Experience", sub: "Clean platform" },
                        { icon: Lock, label: "Fight DRM", sub: "Gaming freedom" },
                        { icon: Star, label: "Supporter Badge", sub: "Get recognized" },
                        { icon: Globe, label: "Anti-Monopoly", sub: "Open ecosystem" },
                      ].map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
                          <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#9d4edd" }} />
                          <p className="text-gray-900 dark:text-white text-xs font-semibold">{label}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs">{sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button disabled={!finalAmount} onClick={() => goToStep(2)}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                    {finalAmount ? `Continue with $${finalAmount}` : "Select an amount to continue"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Your Details & Payment Method</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Tell us a bit about yourself and choose how to pay.</p>

                  {/* Amount summary */}
                    <div className="rounded-xl p-4 mb-5 text-center border bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08]">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Your donation amount</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">${finalAmount}</p>
                  </div>

                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-gray-900 dark:text-white text-sm font-semibold mb-2">Your Name <span className="text-gray-500 dark:text-gray-500 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="Enter your name or nickname"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-colors bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10"
                        style={{}}
                        onFocus={(e) => e.currentTarget.style.borderColor = "rgba(157,78,221,0.6)"}
                        onBlur={(e) => e.currentTarget.style.borderColor = ""}
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-5">
                    <label className="block text-gray-900 dark:text-white text-sm font-semibold mb-2">Message <span className="text-gray-500 dark:text-gray-500 font-normal">(Optional)</span></label>
                    <textarea
                      placeholder="Add a message to your donation"
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none transition-colors bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10"
                      style={{}}
                      onFocus={(e) => e.currentTarget.style.borderColor = "rgba(157,78,221,0.6)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = ""}
                    />
                  </div>

                  {/* Payment method cards */}
                  <p className="text-gray-900 dark:text-white text-sm font-semibold mb-3">Select Payment Method</p>
                  <div className="space-y-2 mb-4">
                    {[
                      { id: "Crypto", icon: "₿", iconBg: "#f97316", label: "Crypto", desc: "Bitcoin, Ethereum, USDT and more" },
                      { id: "Card",   icon: "💳", iconBg: "#3b82f6", label: "Credit / Debit Card", desc: "Visa, Mastercard, Amex via Stripe" },
                      { id: "PayPal", icon: "P",  iconBg: "#0070ba", label: "PayPal", desc: "Pay with your PayPal balance or linked card" },
                    ].map((m) => {
                      const selected = paymentMethod === m.id
                      return (
                        <div key={m.id}>
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                              className={cn("w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all", selected ? "border-purple-500/70" : "bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]")}
                              style={selected ? { background: "rgba(157,78,221,0.1)" } : {}}
                            >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-900 dark:text-white font-black text-lg flex-shrink-0" style={{ background: m.iconBg }}>
                              {m.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-white font-semibold text-sm">{m.label}</p>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{m.desc}</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all", selected ? "border-purple-500" : "border-gray-600")}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#9d4edd" }} />}
                            </div>
                          </button>

                          {/* Crypto coin sub-selector */}
                          {m.id === "Crypto" && selected && (
                            <div className="mt-2 ml-2 p-3 rounded-xl border" style={{ background: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.2)" }}>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">Select cryptocurrency</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: "Bitcoin",   symbol: "BTC",  icon: "₿", color: "#f97316" },
                                  { id: "Ethereum",  symbol: "ETH",  icon: "Ξ", color: "#627eea" },
                                  { id: "USDT",      symbol: "USDT", icon: "₮", color: "#26a17b" },
                                  { id: "USDC",      symbol: "USDC", icon: "$", color: "#2775ca" },
                                  { id: "Litecoin",  symbol: "LTC",  icon: "Ł", color: "#a6a9aa" },
                                  ...(showMoreCoins ? [
                                    { id: "BNB",       symbol: "BNB",  icon: "B", color: "#f3ba2f" },
                                    { id: "Solana",    symbol: "SOL",  icon: "◎", color: "#9945ff" },
                                    { id: "Dogecoin",  symbol: "DOGE", icon: "Ð", color: "#c2a633" },
                                    { id: "Cardano",   symbol: "ADA",  icon: "₳", color: "#0033ad" },
                                    { id: "Polygon",   symbol: "MATIC",icon: "⬡", color: "#8247e5" },
                                    { id: "Avalanche", symbol: "AVAX", icon: "A", color: "#e84142" },
                                    { id: "Chainlink", symbol: "LINK", icon: "⬡", color: "#2a5ada" },
                                    { id: "Tron",      symbol: "TRX",  icon: "T", color: "#ef0027" },
                                    { id: "Dash",      symbol: "DASH", icon: "D", color: "#008ce7" },
                                    { id: "Zcash",     symbol: "ZEC",  icon: "Z", color: "#f4b728" },
                                  ] : []),
                                ].map((coin) => {
                                  const coinSelected = cryptoCoin === coin.id
                                  return (
                                    <button
                                      key={coin.id}
                                      onClick={() => setCryptoCoin(coin.id)}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all hover:scale-105"
                                      style={{
                                        background: coinSelected ? `${coin.color}22` : "rgba(255,255,255,0.04)",
                                        borderColor: coinSelected ? coin.color : "rgba(255,255,255,0.1)",
                                        color: coinSelected ? coin.color : "#9ca3af",
                                      }}
                                    >
                                      <span className="font-black">{coin.icon}</span>
                                      <span>{coin.symbol}</span>
                                    </button>
                                  )
                                })}
                                <button
                                  onClick={() => setShowMoreCoins(!showMoreCoins)}
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all hover:scale-105"
                                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#9ca3af" }}
                                >
                                  {showMoreCoins ? "− Less" : "+ More"}
                                </button>
                                {/* Other option */}
                                <button
                                  onClick={() => setCryptoCoin("Other")}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all hover:scale-105"
                                  style={{
                                    background: cryptoCoin === "Other" ? "rgba(157,78,221,0.15)" : "rgba(255,255,255,0.04)",
                                    borderColor: cryptoCoin === "Other" ? "#9d4edd" : "rgba(255,255,255,0.1)",
                                    color: cryptoCoin === "Other" ? "#c77dff" : "#9ca3af",
                                  }}
                                >
                                  <span>✦</span>
                                  <span>Other</span>
                                </button>
                              </div>
                              {/* Other coin input */}
                              {cryptoCoin === "Other" && (
                                <div className="mt-3">
                                  <input
                                    type="text"
                                    placeholder="Enter coin name or ticker (e.g. Kaspa, KAS)"
                                    value={otherCoin}
                                    onChange={(e) => setOtherCoin(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none transition-colors"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(157,78,221,0.4)" }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(157,78,221,0.8)"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(157,78,221,0.4)"}
                                  />
                                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1.5">We'll provide a wallet address for your chosen coin on the next step.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => goToStep(1)} className="flex items-center gap-2 px-6 py-3 rounded-xl border text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-semibold bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/10">
                      ← Back
                    </button>
                    <button
                      onClick={() => { if (paymentMethod === "Crypto") { goToStep(3) } else { alert("Card and PayPal payments coming soon. Please use Crypto for now.") } }}
                      className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                      Continue to Payment →
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Choose Cryptocurrency ── */}
              {step === 3 && (() => {
                const adminWallets = donateSettings?.wallets?.filter(w => w.enabled) ?? []
                const defaultPopular = [
                  { id: "Bitcoin",  symbol: "BTC",  name: "Bitcoin",   icon: "₿", color: "#f97316", networks: 1, price: "$71,849" },
                  { id: "Ethereum", symbol: "ETH",  name: "Ethereum",  icon: "Ξ", color: "#627eea", networks: 3, price: "$2,112"  },
                  { id: "USDT",     symbol: "USDT", name: "Tether",    icon: "₮", color: "#26a17b", networks: 6, price: "$1.00"   },
                  { id: "USDC",     symbol: "USDC", name: "USD Coin",  icon: "$", color: "#2775ca", networks: 4, price: "$0.9999" },
                  { id: "BNB",      symbol: "BNB",  name: "BNB",       icon: "B", color: "#f3ba2f", networks: 1, price: "$660"    },
                  { id: "Tron",     symbol: "TRX",  name: "Tron",      icon: "T", color: "#ef0027", networks: 1, price: "$0.2964" },
                  { id: "Solana",   symbol: "SOL",  name: "Solana",    icon: "◎", color: "#9945ff", networks: 1, price: "$88.47"  },
                  { id: "Litecoin", symbol: "LTC",  name: "Litecoin",  icon: "Ł", color: "#a6a9aa", networks: 1, price: "$55.30"  },
                ]
                const popularCoins = adminWallets.length > 0
                  ? adminWallets.slice(0, 8).map(w => ({ id: w.coin, symbol: w.symbol, name: w.coin, icon: w.icon || w.symbol.slice(0,1), color: w.color, networks: 1, price: "—" }))
                  : defaultPopular
                const moreCoinsList = [
                  { id: "Dogecoin",  symbol: "DOGE", name: "Dogecoin",  icon: "Ð", color: "#c2a633" },
                  { id: "Polygon",   symbol: "MATIC",name: "Polygon",   icon: "⬡", color: "#8247e5" },
                  { id: "Ripple",    symbol: "XRP",  name: "Ripple",    icon: "✕", color: "#346aa9" },
                  { id: "Cardano",   symbol: "ADA",  name: "Cardano",   icon: "₳", color: "#0033ad" },
                  { id: "Avalanche", symbol: "AVAX", name: "Avalanche", icon: "A", color: "#e84142" },
                  { id: "Chainlink", symbol: "LINK", name: "Chainlink", icon: "⬡", color: "#2a5ada" },
                  { id: "Dash",      symbol: "DASH", name: "Dash",      icon: "D", color: "#008ce7" },
                  { id: "Zcash",     symbol: "ZEC",  name: "Zcash",     icon: "Z", color: "#f4b728" },
                  { id: "Shiba",     symbol: "SHIB", name: "Shiba Inu", icon: "S", color: "#e07c24" },
                ]
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex -space-x-2">
                        {["#f97316","#627eea","#26a17b","#f3ba2f"].map((c,i) => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-[#120b22] flex items-center justify-center text-xs font-black text-gray-900 dark:text-white" style={{ background: c }}>
                            {["₿","Ξ","₮","B"][i]}
                          </div>
                        ))}
                        <div className="w-7 h-7 rounded-full border-2 border-[#120b22] flex items-center justify-center text-xs text-gray-600 dark:text-gray-400" style={{ background: "rgba(255,255,255,0.1)" }}>+{moreCoinsList.length}</div>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Choose Cryptocurrency</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Select your preferred crypto to complete this payment</p>
                      <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl border text-center bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10">
                      <div>
                        <p className="text-gray-900 dark:text-white font-black text-lg">{popularCoins.length + moreCoinsList.length}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs">Currencies</p>
                      </div>
                      <div className="border-x" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <p className="font-black text-lg" style={{ color: "#4ade80" }}>0%</p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs">Extra Fees</p>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-black text-lg">~1m</p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs">Confirm Time</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9d4edd" }}>
                      Popular Currencies
                      {pricesLoading && <span className="ml-2 text-gray-500 dark:text-gray-500 normal-case font-normal">fetching live prices...</span>}
                      {!pricesLoading && Object.keys(prices).length > 0 && <span className="ml-2 text-green-500 normal-case font-normal text-xs">● live</span>}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {popularCoins.map((coin) => (
                          <button key={coin.id} onClick={() => { setSelectedCryptoForPayment(coin.id); navigateToPayment(coin.id) }}
                              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-left transition-all hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-white/10">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-black text-base flex-shrink-0" style={{ background: coin.color }}>
                            {coin.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 dark:text-white font-semibold text-sm">{coin.name}</span>
                              {coin.networks > 1 && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(157,78,221,0.2)", color: "#c77dff" }}>{coin.networks} networks</span>
                              )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-500 text-xs">{coin.symbol} · {getDisplayPrice(coin.id, coin.price)}</p>
                          </div>
                          <span className="text-gray-600 text-sm">›</span>
                        </button>
                      ))}
                    </div>
                      <button onClick={() => setShowMoreCoins(!showMoreCoins)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 mb-2 transition-colors hover:bg-purple-50 dark:hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <span className="text-gray-600 dark:text-gray-400 text-sm">⋯</span>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-900 dark:text-white text-sm font-semibold">More Currencies</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs">{moreCoinsList.length} additional options</p>
                        </div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">{showMoreCoins ? "∧" : "∨"}</span>
                    </button>
                    {showMoreCoins && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {moreCoinsList.map((coin) => (
                            <button key={coin.id} onClick={() => { setSelectedCryptoForPayment(coin.id); navigateToPayment(coin.id) }}
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-left transition-all hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-black text-sm flex-shrink-0" style={{ background: coin.color }}>
                                {coin.icon}
                              </div>
                              <span className="text-gray-900 dark:text-white font-semibold text-sm">{coin.name}</span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-500 text-xs font-mono">{coin.symbol}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => goToStep(2)} className="w-full mt-2 py-2 text-gray-500 dark:text-gray-500 text-sm hover:text-gray-300 transition-colors">
                      ← Back
                    </button>
                  </>
                )
              })()}

            </div>
          </div>
        </section>

        {/* ── FUND ALLOCATION ── */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border p-6 bg-white dark:bg-[#120b22] dark:bg-gradient-to-b dark:from-[#120b22]/90 dark:to-[#090514]/90 border-[#9d4edd]/20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Community Impact</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Every dollar is allocated transparently. No hidden costs, no corporate overhead.</p>
              <div className="space-y-4 mb-6">
                {[
                  { label: "DataNodes & Storage Costs", pct: 60, color: "#9d4edd" },
                  { label: "Server Infrastructure", pct: 25, color: "#c77dff" },
                  { label: "Renewals, Tools & Miscellaneous", pct: 15, color: "#7b2cbf" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{label}</span>
                      <span className="font-bold text-sm" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                    </div>
                  </div>
                ))}
              </div>
              <blockquote className="border-l-2 pl-4 italic text-gray-600 dark:text-gray-400 text-sm" style={{ borderColor: "#9d4edd" }}>
                "Your support funds our fight against restrictive DRM, corporate monopolies, and overpriced games. Every single dollar counts — we don't ask for big donations, just consistent ones."
                <footer className="mt-2 text-gray-500 dark:text-gray-500 not-italic">— Bullz Commuinity, Admin</footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── ALTERNATIVE SUPPORT ── */}
        <section id="alternatives" className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Other Ways to Support</h2>
              <p className="text-gray-600 dark:text-gray-400">Prefer a recurring contribution or one-time support? We've got options.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Patreon */}
                <div className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-[#120b22] dark:bg-gradient-to-br dark:from-[#f97316]/10 dark:to-[#120b22]/90 border-[#f97316]/25">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.2)" }}>
                    <Heart className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-bold">Patreon</h3>
                    <p className="text-gray-500 dark:text-gray-500 text-xs">Monthly membership</p>
                  </div>
                </div>
                <div className="space-y-3 mb-5 flex-1">
                  {[
                    { tier: "Freedom Fighter", price: "$5/mo", perks: ["Supporter badge", "Ad-free browsing", "Early access"] },
                    { tier: "Revolution Leader", price: "$10/mo", perks: ["Everything above", "Priority support", "Leaderboard spotlight"] },
                  ].map(({ tier, price, perks }) => (
                    <div key={tier} className="p-3 rounded-xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(249,115,22,0.15)" }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-900 dark:text-white font-semibold text-sm">{tier}</span>
                        <span className="text-orange-400 font-bold text-sm">{price}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {perks.map((p) => <span key={p} className="text-xs text-gray-600 dark:text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{p}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
                <a href="https://www.patreon.com/c/BullzGamez" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  <ExternalLink className="w-4 h-4" /> Join on Patreon
                </a>
              </div>

              {/* Open Collective - General */}
                <div className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-[#120b22] dark:bg-gradient-to-br dark:from-[#6366f1]/10 dark:to-[#120b22]/90 border-[#6366f1]/25">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.2)" }}>
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-bold">Open Collective</h3>
                    <p className="text-gray-500 dark:text-gray-500 text-xs">Transparent funding</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                  100% transparent — every dollar in and out is publicly visible. Support us through Open Collective and see exactly where your money goes.
                </p>
                <div className="p-3 rounded-xl border mb-5" style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-gray-900 dark:text-white text-xs font-semibold">Full Transparency</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-500 text-xs">All expenses and income are publicly logged. No hidden fees, no surprises.</p>
                </div>
                <a href="https://opencollective.com/bullz-games" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                  <ExternalLink className="w-4 h-4" /> Support on Open Collective
                </a>
              </div>

              {/* Open Collective - Expenses */}
                <div className="rounded-2xl border p-6 flex flex-col bg-white dark:bg-[#120b22] dark:bg-gradient-to-br dark:from-[#06b6d4]/10 dark:to-[#120b22]/90 border-[#06b6d4]/25">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.2)" }}>
                    <Flame className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-bold">Fund an Expense</h3>
                    <p className="text-gray-500 dark:text-gray-500 text-xs">Direct server & hosting costs</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Directly fund a specific server or hosting expense. Pick one below and contribute exactly what's needed.</p>
                <div className="space-y-2 mb-5 flex-1">
                  {[
                    { label: "Server Infrastructure", href: "https://opencollective.com/bullz-games/expenses/289914" },
                    { label: "Hosting & CDN Costs", href: "https://opencollective.com/bullz-games/expenses/289913" },
                  ].map(({ label, href }) => (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border text-sm transition-all hover:scale-[1.01] group"
                      style={{ background: "rgba(6,182,212,0.06)", borderColor: "rgba(6,182,212,0.2)" }}>
                      <span className="text-gray-900 dark:text-white font-medium group-hover:text-cyan-300 transition-colors">{label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
                <a href="https://opencollective.com/bullz-games" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
                  <ExternalLink className="w-4 h-4" /> View All Expenses
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-white dark:bg-[#120b22] dark:bg-gradient-to-br dark:from-[#9d4edd]/10 dark:to-[#120b22]/90 border-[#9d4edd]/25">
              <div>
                <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">${statsRaised}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Raised</p>
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>↓ 31% this month</p>
              </div>
              <div className="sm:border-x" style={{ borderColor: "rgba(157,78,221,0.2)" }}>
                <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{statsSupporters}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Supporters</p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">And growing every week</p>
              </div>
              <div>
                <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{statsCountries}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Countries</p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">A truly global community</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD ── */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border p-6 bg-white dark:bg-[#120b22] dark:bg-gradient-to-b dark:from-[#120b22]/90 dark:to-[#090514]/90 border-[#9d4edd]/20">
                <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6" style={{ color: "#f59e0b" }} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hall of Champions</h2>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">The legends keeping this platform alive</p>
                </div>
              </div>
              <div className="space-y-2">
                {activeDonors.map((donor) => (
                    <div key={donor.rank} className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-purple-50 dark:hover:bg-white/10 bg-gray-50 dark:bg-white/5">
                    <div className={cn("w-9 h-9 flex items-center justify-center rounded-full font-black text-sm flex-shrink-0")}
                      style={donor.rank === 1 ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }
                        : donor.rank === 2 ? { background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "#000" }
                        : donor.rank === 3 ? { background: "linear-gradient(135deg, #b45309, #92400e)", color: "#fff" }
                        : { background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                      {donor.rank === 1 ? <Crown className="w-4 h-4" /> : donor.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold text-sm">{donor.name}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">{donor.country} Anonymous Supporter</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: "#c77dff" }}>${donor.amount}</p>
                      {donor.rank <= 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">{donor.rank === 1 ? "Top Donor" : donor.rank === 2 ? "2nd Place" : "3rd Place"}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── JOIN CTA ── */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
              <div className="rounded-2xl border p-10 relative overflow-hidden bg-white dark:bg-[#090514] dark:bg-gradient-to-br dark:from-[#9d4edd]/15 dark:to-[#090514]/95 border-[#9d4edd]/35">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #9d4edd, transparent)" }} />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Join Our Revolution</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                  Your donation directly challenges corporate control of gaming. Stand with us for a free, open, and accessible gaming ecosystem — for everyone.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a href="#donate-form" className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                    Donate Now
                  </a>
                  <a href="/about" className="px-8 py-3 rounded-xl font-semibold border transition-all hover:bg-white/5" style={{ borderColor: "rgba(157,78,221,0.4)", color: "#c77dff" }}>
                    Explore Our Mission
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">Common Questions</h2>
            <div className="space-y-2">
              {faqItems.map((item, index) => (
                  <div key={index} className="rounded-xl border overflow-hidden bg-white dark:bg-white/[0.03]" style={{ borderColor: "rgba(157,78,221,0.15)" }}>
                  <button onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <span className="text-gray-900 dark:text-white font-medium text-sm">{item.q}</span>
                    {openFaq === index
                      ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />}
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}

