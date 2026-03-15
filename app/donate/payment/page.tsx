"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { QRCodeSVG } from "qrcode.react"
import { CheckCircle, Copy, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"

// ── Free public blockchain APIs — no API key needed ─────────────────────────

async function checkBitcoin(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://blockchain.info/rawaddr/${address}?limit=3`)
    const d = await r.json()
    return (d.n_tx ?? 0) > 0
  } catch { return false }
}

async function checkEthereum(address: string): Promise<boolean> {
  try {
    // blockscout — completely free, no key
    const r = await fetch(`https://eth.blockscout.com/api/v2/addresses/${address}/transactions?filter=to`)
    const d = await r.json()
    return (d.items?.length ?? 0) > 0
  } catch { return false }
}

async function checkTron(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=3&only_to=true`)
    const d = await r.json()
    return (d.data?.length ?? 0) > 0
  } catch { return false }
}

async function checkSolana(address: string): Promise<boolean> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "getSignaturesForAddress",
        params: [address, { limit: 3 }],
      }),
    })
    const d = await r.json()
    return (d.result?.length ?? 0) > 0
  } catch { return false }
}

async function checkBNB(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://bsc.blockscout.com/api/v2/addresses/${address}/transactions?filter=to`)
    const d = await r.json()
    return (d.items?.length ?? 0) > 0
  } catch { return false }
}

async function checkLitecoin(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}?limit=3`)
    const d = await r.json()
    return (d.n_tx ?? 0) > 0
  } catch { return false }
}

async function checkDogecoin(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.blockcypher.com/v1/doge/main/addrs/${address}?limit=3`)
    const d = await r.json()
    return (d.n_tx ?? 0) > 0
  } catch { return false }
}

async function checkDash(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.blockcypher.com/v1/dash/main/addrs/${address}?limit=3`)
    const d = await r.json()
    return (d.n_tx ?? 0) > 0
  } catch { return false }
}

async function checkPolygon(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://polygon.blockscout.com/api/v2/addresses/${address}/transactions?filter=to`)
    const d = await r.json()
    return (d.items?.length ?? 0) > 0
  } catch { return false }
}

async function checkRipple(address: string): Promise<boolean> {
  try {
    const r = await fetch("https://xrplcluster.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "account_tx",
        params: [{ account: address, limit: 3 }],
      }),
    })
    const d = await r.json()
    return (d.result?.transactions?.length ?? 0) > 0
  } catch { return false }
}

async function checkCardano(address: string): Promise<boolean> {
  try {
    // Koios — free, no key required
    const r = await fetch(`https://api.koios.rest/api/v1/address_info?_address=${address}`)
    const d = await r.json()
    return (d[0]?.tx_count ?? 0) > 0
  } catch { return false }
}

async function checkAvalanche(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://snowtrace.io/api/v2/addresses/${address}/transactions?filter=to`)
    const d = await r.json()
    return (d.items?.length ?? 0) > 0
  } catch { return false }
}

async function checkZcash(address: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.zcha.in/v2/mainnet/accounts/${address}`)
    const d = await r.json()
    return (d.operations ?? 0) > 0
  } catch { return false }
}

// ── Main dispatcher ──────────────────────────────────────────────────────────
async function pollForPayment(coin: string, address: string): Promise<boolean> {
  if (!address || address.length < 10) return false
  switch (coin) {
    case "Bitcoin":   return checkBitcoin(address)
    case "Ethereum":  return checkEthereum(address)
    case "USDT":      return checkTron(address)       // most USDT is TRC20
    case "USDC":      return checkEthereum(address)   // ERC20
    case "BNB":       return checkBNB(address)
    case "Solana":    return checkSolana(address)
    case "Litecoin":  return checkLitecoin(address)
    case "Tron":      return checkTron(address)
    case "Dogecoin":  return checkDogecoin(address)
    case "Polygon":   return checkPolygon(address)
    case "Ripple":    return checkRipple(address)
    case "Cardano":   return checkCardano(address)
    case "Avalanche": return checkAvalanche(address)
    case "Chainlink": return checkEthereum(address)   // ERC20 token on ETH
    case "Dash":      return checkDash(address)
    case "Zcash":     return checkZcash(address)
    case "Shiba":     return checkEthereum(address)   // ERC20 token on ETH
    default:          return false
  }
}

function PaymentPageInner() {
  const params = useSearchParams()
  const router = useRouter()

  const coin       = params.get("coin") || "Bitcoin"
  const amount     = parseFloat(params.get("amount") || "0")
  const address    = params.get("address") || ""
  const network    = params.get("network") || ""
  const networkTag = params.get("networkTag") || ""
  const confirmTime = params.get("confirmTime") || "~1 min"
  const cryptoAmt  = params.get("cryptoAmt") || "..."
  const livePrice  = params.get("livePrice") || ""

  const [timeLeft, setTimeLeft] = useState(3600)
  const [copied, setCopied]     = useState(false)
  const [status, setStatus]     = useState<"waiting" | "detected" | "expired">("waiting")
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setStatus("expired"); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-detect payment every 30s
  useEffect(() => {
    if (!address || status !== "waiting") return
    pollRef.current = setInterval(async () => {
      const paid = await pollForPayment(coin, address)
      if (paid) {
        setStatus("detected")
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [coin, address, status])

  function copyAddress() {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return `${m}:${sec}`
  }

  const timerPct = (timeLeft / 3600) * 100

  // ── SUCCESS SCREEN ──
  if (status === "detected") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#090514" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ background: "rgba(74,222,128,0.15)", border: "2px solid rgba(74,222,128,0.4)" }}>
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Payment Detected!</h1>
          <p className="text-gray-400 mb-2">Thank you so much for your support. 🎮</p>
          <p className="text-gray-500 text-sm mb-8">Your donation of <span className="text-white font-bold">${amount}</span> via <span className="text-white font-bold">{coin}</span> has been received. You&apos;re now part of the revolution.</p>
          <div className="rounded-2xl border p-6 mb-6 text-left space-y-3" style={{ background: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" }}>
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Amount</span><span className="text-white font-bold">${amount} USD</span></div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Currency</span><span className="text-white font-bold">{coin}</span></div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Status</span><span className="text-green-400 font-bold">✓ Confirmed</span></div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
            Back to Games
          </Link>
        </div>
      </div>
    )
  }

  // ── EXPIRED SCREEN ──
  if (status === "expired") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#090514" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)" }}>
            <span className="text-4xl">⏱</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Session Expired</h1>
          <p className="text-gray-400 mb-8">The payment window has closed. If you already sent funds, don&apos;t worry — they&apos;ll still arrive. Contact us if you need help.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()} className="px-6 py-3 rounded-xl font-semibold border text-gray-300 hover:text-white transition-colors" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              ← Try Again
            </button>
            <Link href="/" className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#090514" }}>
      <Header />
      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* Back + status */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" /> Awaiting Payment
            </span>
          </div>

          <h1 className="text-4xl font-black text-white text-center mb-2">Complete Your Payment</h1>
          <p className="text-gray-400 text-center mb-10">Send the exact amount to the address below. Payment is detected automatically.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-4">

              {/* Countdown */}
              <div className="rounded-2xl border p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#9d4edd" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - timerPct / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-black text-2xl leading-none">{formatTime(timeLeft)}</span>
                    <span className="text-gray-500 text-xs mt-1">REMAINING</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Complete payment before timer expires</p>
              </div>

              {/* Send amount */}
              <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Send Exactly</p>
                <p className="text-white font-black text-3xl mb-1">
                  {cryptoAmt} <span style={{ color: "#9d4edd" }}>{coin.slice(0,4).toUpperCase()}</span>
                </p>
                <p className="text-gray-500 text-sm">≈ ${amount} USD{livePrice ? ` · 1 ${coin.slice(0,3).toUpperCase()} = ${livePrice}` : ""}</p>
              </div>

              {/* Network */}
              <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Network</p>
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold">{network}</p>
                  <span className="px-3 py-1 rounded-lg text-sm font-bold" style={{ background: "rgba(249,115,22,0.2)", color: "#fb923c" }}>{networkTag}</span>
                </div>
                <p className="text-gray-500 text-sm mt-1">{confirmTime} confirm time</p>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[{ icon: "🔒", label: "Encrypted" }, { icon: "⚡", label: "Instant" }, { icon: "✓", label: "No Fees" }].map(b => (
                  <div key={b.label} className="text-center p-4 rounded-2xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <p className="text-2xl mb-1">{b.icon}</p>
                    <p className="text-gray-400 text-sm">{b.label}</p>
                  </div>
                ))}
              </div>

              {/* Auto-detect info */}
              <div className="rounded-2xl border p-4 text-sm" style={{ background: "rgba(157,78,221,0.06)", borderColor: "rgba(157,78,221,0.2)" }}>
                <p className="text-white font-semibold mb-1">🔍 Auto-detection active</p>
                <p className="text-gray-400 text-xs">
                  We check the blockchain every 30 seconds. Once your transaction is detected, this page will automatically show a confirmation screen — no refresh needed.
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="rounded-2xl border p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-white font-bold text-lg mb-1 text-center">Scan to Pay</p>
              <p className="text-gray-500 text-sm text-center mb-5">Use your wallet app or exchange to scan</p>

              {/* QR */}
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl" style={{ background: "white" }}>
                  {address ? (
                    <QRCodeSVG value={address} size={200} bgColor="#ffffff" fgColor="#000000" level="M" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-center p-4" style={{ color: "#999" }}>
                      <p className="text-xs">Set wallet address in Admin → Donate</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm">{address ? "Ready to scan" : "No address configured"}</span>
              </div>

              {/* Address */}
              <div className="mb-4">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Wallet Address</p>
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <p className="text-white text-sm font-mono flex-1 break-all leading-relaxed">{address || "No address set"}</p>
                  <button onClick={copyAddress} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mt-0.5"
                    style={{ background: copied ? "rgba(74,222,128,0.2)" : "rgba(157,78,221,0.2)", color: copied ? "#4ade80" : "#c77dff" }}>
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-xl border text-sm mb-4" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.25)", color: "#fbbf24" }}>
                ⚠ Only send {coin} via the <strong>{networkTag}</strong> network. Sending via a different network will result in permanent loss.
              </div>

              {/* Exchange guide */}
              <div className="p-4 rounded-xl border text-sm" style={{ background: "rgba(157,78,221,0.06)", borderColor: "rgba(157,78,221,0.2)" }}>
                <p className="text-white font-semibold mb-2">💡 Sending from an exchange?</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["Binance", "Coinbase", "Kraken", "KuCoin", "OKX", "Bybit"].map(ex => (
                    <span key={ex} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: "#c77dff" }}>{ex}</span>
                  ))}
                </div>
                <ol className="text-gray-400 text-xs space-y-1">
                  <li>1. Open your exchange → <span className="text-white">Withdraw / Send</span></li>
                  <li>2. Select <span className="text-white">{coin}</span>, network: <span className="text-white">{networkTag}</span></li>
                  <li>3. Paste the address above, enter exact amount</li>
                  <li>4. Confirm — funds arrive automatically</li>
                </ol>
              </div>

              {/* Summary footer */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div><p className="text-white text-sm font-bold">{coin.slice(0,4).toUpperCase()}</p><p className="text-gray-500 text-xs">Currency</p></div>
                <div className="border-x" style={{ borderColor: "rgba(255,255,255,0.07)" }}><p className="text-white text-sm font-bold">{networkTag}</p><p className="text-gray-500 text-xs">Network</p></div>
                <div><p className="text-sm font-bold" style={{ color: "#4ade80" }}>0%</p><p className="text-gray-500 text-xs">Extra Fee</p></div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
              ← Cancel Payment
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#090514" }}><p className="text-gray-400">Loading...</p></div>}>
      <PaymentPageInner />
    </Suspense>
  )
}
