"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Heart, Trophy, Wallet, Plus, Trash2, Save, GripVertical,
  Edit2, Check, X, ChevronUp, ChevronDown, RefreshCw
} from "lucide-react"

export interface Donor {
  id: string
  name: string
  amount: number
  country: string
  rank: number
}

export interface CryptoWallet {
  id: string
  coin: string
  symbol: string
  icon: string
  color: string
  address: string
  network: string
  networkTag: string
  confirmTime: string
  enabled: boolean
}

export interface DonateSettings {
  totalRaised: number
  totalSupporters: number
  countries: number
  donors: Donor[]
  wallets: CryptoWallet[]
}

// Full list matching every coin shown on the donate page
const ALL_DEFAULT_WALLETS: CryptoWallet[] = [
  { id: "btc",  coin: "Bitcoin",   symbol: "BTC",  icon: "₿", color: "#f97316", address: "", network: "Bitcoin",          networkTag: "BTC",   confirmTime: "~10 min", enabled: true  },
  { id: "eth",  coin: "Ethereum",  symbol: "ETH",  icon: "Ξ", color: "#627eea", address: "", network: "Ethereum",         networkTag: "ERC20", confirmTime: "~1 min",  enabled: true  },
  { id: "usdt", coin: "USDT",      symbol: "USDT", icon: "₮", color: "#26a17b", address: "", network: "Tron (TRC20)",     networkTag: "TRC20", confirmTime: "~3 sec",  enabled: true  },
  { id: "usdc", coin: "USDC",      symbol: "USDC", icon: "$", color: "#2775ca", address: "", network: "Ethereum",         networkTag: "ERC20", confirmTime: "~1 min",  enabled: true  },
  { id: "bnb",  coin: "BNB",       symbol: "BNB",  icon: "B", color: "#f3ba2f", address: "", network: "BNB Smart Chain",  networkTag: "BEP20", confirmTime: "~3 sec",  enabled: true  },
  { id: "sol",  coin: "Solana",    symbol: "SOL",  icon: "◎", color: "#9945ff", address: "", network: "Solana",           networkTag: "SOL",   confirmTime: "~30 sec", enabled: true  },
  { id: "ltc",  coin: "Litecoin",  symbol: "LTC",  icon: "Ł", color: "#a6a9aa", address: "", network: "Litecoin",         networkTag: "LTC",   confirmTime: "~5 min",  enabled: true  },
  { id: "trx",  coin: "Tron",      symbol: "TRX",  icon: "T", color: "#ef0027", address: "", network: "Tron",             networkTag: "TRC20", confirmTime: "~3 sec",  enabled: true  },
  { id: "doge", coin: "Dogecoin",  symbol: "DOGE", icon: "Ð", color: "#c2a633", address: "", network: "Dogecoin",         networkTag: "DOGE",  confirmTime: "~5 min",  enabled: true  },
  { id: "matic",coin: "Polygon",   symbol: "MATIC",icon: "⬡", color: "#8247e5", address: "", network: "Polygon",          networkTag: "MATIC", confirmTime: "~3 sec",  enabled: true  },
  { id: "xrp",  coin: "Ripple",    symbol: "XRP",  icon: "✕", color: "#346aa9", address: "", network: "Ripple",           networkTag: "XRP",   confirmTime: "~5 sec",  enabled: true  },
  { id: "ada",  coin: "Cardano",   symbol: "ADA",  icon: "₳", color: "#0033ad", address: "", network: "Cardano",          networkTag: "ADA",   confirmTime: "~1 min",  enabled: false },
  { id: "avax", coin: "Avalanche", symbol: "AVAX", icon: "A", color: "#e84142", address: "", network: "Avalanche C-Chain",networkTag: "AVAX",  confirmTime: "~3 sec",  enabled: false },
  { id: "link", coin: "Chainlink", symbol: "LINK", icon: "⬡", color: "#2a5ada", address: "", network: "Ethereum",         networkTag: "ERC20", confirmTime: "~1 min",  enabled: false },
  { id: "dash", coin: "Dash",      symbol: "DASH", icon: "D", color: "#008ce7", address: "", network: "Dash",             networkTag: "DASH",  confirmTime: "~5 min",  enabled: false },
  { id: "zec",  coin: "Zcash",     symbol: "ZEC",  icon: "Z", color: "#f4b728", address: "", network: "Zcash",            networkTag: "ZEC",   confirmTime: "~3 min",  enabled: false },
  { id: "shib", coin: "Shiba",     symbol: "SHIB", icon: "S", color: "#e07c24", address: "", network: "Ethereum",         networkTag: "ERC20", confirmTime: "~1 min",  enabled: false },
]

// Merge saved wallets with the full default list so all coins always appear in admin
function mergeWallets(saved: CryptoWallet[]): CryptoWallet[] {
  const savedMap = new Map(saved.map(w => [w.coin, w]))
  const merged = ALL_DEFAULT_WALLETS.map(def => {
    const s = savedMap.get(def.coin)
    return s ? { ...def, ...s } : def
  })
  // append any custom coins added by admin that aren't in the default list
  const extras = saved.filter(s => !ALL_DEFAULT_WALLETS.find(d => d.coin === s.coin))
  return [...merged, ...extras]
}

const DEFAULT_SETTINGS: DonateSettings = {
  totalRaised: 796,
  totalSupporters: 34,
  countries: 12,
  donors: [
    { id: "1", name: "GameMaster",   amount: 500, country: "🇺🇸", rank: 1 },
    { id: "2", name: "StealthPlayer",amount: 350, country: "🇩🇪", rank: 2 },
    { id: "3", name: "NightOwl",     amount: 280, country: "🇬🇧", rank: 3 },
    { id: "4", name: "ProGamer99",   amount: 200, country: "🇨🇦", rank: 4 },
    { id: "5", name: "TheRealOne",   amount: 150, country: "🇦🇺", rank: 5 },
    { id: "6", name: "CyberWolf",    amount: 120, country: "🇫🇷", rank: 6 },
    { id: "7", name: "DragonSlayer", amount: 100, country: "🇧🇷", rank: 7 },
    { id: "8", name: "ShadowKnight", amount: 85,  country: "🇯🇵", rank: 8 },
  ],
  wallets: ALL_DEFAULT_WALLETS,
}

function uid() { return Math.random().toString(36).slice(2) }

export function AdminDonateEditor() {
  const [settings, setSettings] = useState<DonateSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState<"stats" | "donors" | "wallets">("stats")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Donor editing state
  const [editingDonor, setEditingDonor] = useState<string | null>(null)
  const [editDonorData, setEditDonorData] = useState<Partial<Donor>>({})

  // Wallet editing state
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  const [editWalletData, setEditWalletData] = useState<Partial<CryptoWallet>>({})

  // New donor / wallet forms
  const [showNewDonor, setShowNewDonor] = useState(false)
  const [newDonor, setNewDonor] = useState({ name: "", amount: "", country: "🌍" })
  const [showNewWallet, setShowNewWallet] = useState(false)
  const [newWallet, setNewWallet] = useState({ coin: "", symbol: "", icon: "", color: "#9d4edd", address: "", network: "", networkTag: "", confirmTime: "~1 min" })

  useEffect(() => {
    fetch("/api/admin/donate")
      .then(r => r.json())
      .then(d => {
        if (d.donate) {
          setSettings({
            ...d.donate,
            wallets: mergeWallets(d.donate.wallets ?? []),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        alert(`❌ Save failed: ${data.error || "Unknown error"}\n\nMake sure you ran:\ndatabase/add_donate_settings_column.sql\nin your Supabase SQL Editor.`)
      }
    } catch (e) {
      alert(`❌ Network error: ${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Donor helpers ──
  function moveDonor(id: string, dir: -1 | 1) {
    const list = [...settings.donors].sort((a, b) => a.rank - b.rank)
    const idx = list.findIndex(d => d.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= list.length) return
    const tmp = list[idx].rank; list[idx].rank = list[swapIdx].rank; list[swapIdx].rank = tmp
    setSettings(s => ({ ...s, donors: list }))
  }

  function deleteDonor(id: string) {
    setSettings(s => ({ ...s, donors: s.donors.filter(d => d.id !== id) }))
  }

  function saveEditDonor(id: string) {
    setSettings(s => ({ ...s, donors: s.donors.map(d => d.id === id ? { ...d, ...editDonorData } : d) }))
    setEditingDonor(null)
  }

  function addDonor() {
    if (!newDonor.name || !newDonor.amount) return
    const maxRank = settings.donors.reduce((m, d) => Math.max(m, d.rank), 0)
    setSettings(s => ({
      ...s,
      donors: [...s.donors, { id: uid(), name: newDonor.name, amount: parseFloat(newDonor.amount), country: newDonor.country, rank: maxRank + 1 }]
    }))
    setNewDonor({ name: "", amount: "", country: "🌍" })
    setShowNewDonor(false)
  }

  // ── Wallet helpers ──
  function deleteWallet(id: string) {
    setSettings(s => ({ ...s, wallets: s.wallets.filter(w => w.id !== id) }))
  }

  function toggleWallet(id: string) {
    setSettings(s => ({ ...s, wallets: s.wallets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w) }))
  }

  function saveEditWallet(id: string) {
    setSettings(s => ({ ...s, wallets: s.wallets.map(w => w.id === id ? { ...w, ...editWalletData } : w) }))
    setEditingWallet(null)
  }

  function addWallet() {
    if (!newWallet.coin || !newWallet.address) return
    setSettings(s => ({
      ...s,
      wallets: [...s.wallets, { id: uid(), ...newWallet, symbol: newWallet.symbol || newWallet.coin.toUpperCase().slice(0,4), enabled: true }]
    }))
    setNewWallet({ coin: "", symbol: "", icon: "", color: "#9d4edd", address: "", network: "", networkTag: "", confirmTime: "~1 min" })
    setShowNewWallet(false)
  }

  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === t ? "bg-[#9d4edd] text-white" : "text-gray-400 hover:text-white"}`

  if (loading) return <div className="text-gray-400 p-8 text-center">Loading donate settings...</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-[#120b22] border-[#2d1b54]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#9d4edd]" />
              Donate Page Manager
            </CardTitle>
            <Button onClick={save} disabled={saving} className={`${saved ? "bg-green-600" : "bg-[#9d4edd] hover:bg-[#7b2cbf]"} text-white`}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : saved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 bg-[#0f0720] p-1 rounded-xl w-fit">
            <button className={tabClass("stats")} onClick={() => setActiveTab("stats")}>📊 Stats</button>
            <button className={tabClass("donors")} onClick={() => setActiveTab("donors")}><Trophy className="inline h-3.5 w-3.5 mr-1" />Hall of Champions</button>
            <button className={tabClass("wallets")} onClick={() => setActiveTab("wallets")}><Wallet className="inline h-3.5 w-3.5 mr-1" />Crypto Wallets</button>
          </div>
        </CardContent>
      </Card>

      {/* ── STATS TAB ── */}
      {activeTab === "stats" && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader><CardTitle className="text-white text-base">Public Stats</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Raised ($)", key: "totalRaised" as const, icon: "💰" },
              { label: "Total Supporters", key: "totalSupporters" as const, icon: "👥" },
              { label: "Countries", key: "countries" as const, icon: "🌍" },
            ].map(({ label, key, icon }) => (
              <div key={key} className="bg-[#0f0720] rounded-xl p-4 border border-[#2d1b54]">
                <p className="text-gray-400 text-xs mb-2">{icon} {label}</p>
                <Input
                  type="number"
                  value={settings[key]}
                  onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#1a103c] border-[#2d1b54] text-white text-xl font-black h-12"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── DONORS TAB ── */}
      {activeTab === "donors" && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Hall of Champions ({settings.donors.length})
              </CardTitle>
              <Button size="sm" onClick={() => setShowNewDonor(true)} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white">
                <Plus className="h-4 w-4 mr-1" /> Add Donor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* New donor form */}
            {showNewDonor && (
              <div className="bg-[#1a103c] border border-[#9d4edd]/40 rounded-xl p-4 space-y-3 mb-4">
                <p className="text-white font-semibold text-sm">New Donor</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Name / Nickname" value={newDonor.name} onChange={e => setNewDonor(p => ({ ...p, name: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Amount ($)" type="number" value={newDonor.amount} onChange={e => setNewDonor(p => ({ ...p, amount: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Flag emoji 🇺🇸" value={newDonor.country} onChange={e => setNewDonor(p => ({ ...p, country: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addDonor} className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" />Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewDonor(false)} className="text-gray-400"><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {[...settings.donors].sort((a, b) => a.rank - b.rank).map((donor, idx, arr) => (
              <div key={donor.id} className="bg-[#0f0720] border border-[#2d1b54] rounded-xl p-3">
                {editingDonor === donor.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={editDonorData.name ?? donor.name} onChange={e => setEditDonorData(p => ({ ...p, name: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Name" />
                      <Input type="number" value={editDonorData.amount ?? donor.amount} onChange={e => setEditDonorData(p => ({ ...p, amount: parseFloat(e.target.value) }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Amount" />
                      <Input value={editDonorData.country ?? donor.country} onChange={e => setEditDonorData(p => ({ ...p, country: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Flag 🇺🇸" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditDonor(donor.id)} className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDonor(null)} className="text-gray-400"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveDonor(donor.id, -1)} disabled={idx === 0} className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveDonor(donor.id, 1)} disabled={idx === arr.length - 1} className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={donor.rank === 1 ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000" } : donor.rank === 2 ? { background: "#9ca3af", color: "#000" } : donor.rank === 3 ? { background: "#b45309", color: "#fff" } : { background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                      {donor.rank}
                    </div>
                    <span className="text-lg">{donor.country}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{donor.name}</p>
                    </div>
                    <p className="font-bold text-sm" style={{ color: "#c77dff" }}>${donor.amount}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingDonor(donor.id); setEditDonorData({}) }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteDonor(donor.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── WALLETS TAB ── */}
      {activeTab === "wallets" && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#9d4edd]" /> Crypto Wallets ({settings.wallets.filter(w => w.enabled).length} active)
              </CardTitle>
              <Button size="sm" onClick={() => setShowNewWallet(true)} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white">
                <Plus className="h-4 w-4 mr-1" /> Add Coin
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* New wallet form */}
            {showNewWallet && (
              <div className="bg-[#1a103c] border border-[#9d4edd]/40 rounded-xl p-4 space-y-3 mb-4">
                <p className="text-white font-semibold text-sm">Add New Crypto</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input placeholder="Coin name (e.g. Bitcoin)" value={newWallet.coin} onChange={e => setNewWallet(p => ({ ...p, coin: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Symbol (BTC)" value={newWallet.symbol} onChange={e => setNewWallet(p => ({ ...p, symbol: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Icon char (₿)" value={newWallet.icon} onChange={e => setNewWallet(p => ({ ...p, icon: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={newWallet.color} onChange={e => setNewWallet(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-gray-400 text-xs">Color</span>
                  </div>
                </div>
                <Input placeholder="Wallet address" value={newWallet.address} onChange={e => setNewWallet(p => ({ ...p, address: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white font-mono text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Network (e.g. Ethereum)" value={newWallet.network} onChange={e => setNewWallet(p => ({ ...p, network: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Tag (ERC20)" value={newWallet.networkTag} onChange={e => setNewWallet(p => ({ ...p, networkTag: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                  <Input placeholder="Confirm time (~1 min)" value={newWallet.confirmTime} onChange={e => setNewWallet(p => ({ ...p, confirmTime: e.target.value }))} className="bg-[#0f0720] border-[#2d1b54] text-white" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addWallet} className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" />Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewWallet(false)} className="text-gray-400"><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {settings.wallets.map((wallet) => (
              <div key={wallet.id} className={`border rounded-xl p-3 transition-all ${wallet.enabled ? "bg-[#0f0720] border-[#2d1b54]" : "bg-[#0a0618] border-[#1a0d2e] opacity-50"}`}>
                {editingWallet === wallet.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Input value={editWalletData.coin ?? wallet.coin} onChange={e => setEditWalletData(p => ({ ...p, coin: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Coin" />
                      <Input value={editWalletData.symbol ?? wallet.symbol} onChange={e => setEditWalletData(p => ({ ...p, symbol: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Symbol" />
                      <Input value={editWalletData.icon ?? wallet.icon} onChange={e => setEditWalletData(p => ({ ...p, icon: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Icon" />
                      <div className="flex items-center gap-2">
                        <input type="color" value={editWalletData.color ?? wallet.color} onChange={e => setEditWalletData(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                        <span className="text-gray-400 text-xs">Color</span>
                      </div>
                    </div>
                    <Input value={editWalletData.address ?? wallet.address} onChange={e => setEditWalletData(p => ({ ...p, address: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white font-mono text-sm" placeholder="Wallet address" />
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={editWalletData.network ?? wallet.network} onChange={e => setEditWalletData(p => ({ ...p, network: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Network" />
                      <Input value={editWalletData.networkTag ?? wallet.networkTag} onChange={e => setEditWalletData(p => ({ ...p, networkTag: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Tag" />
                      <Input value={editWalletData.confirmTime ?? wallet.confirmTime} onChange={e => setEditWalletData(p => ({ ...p, confirmTime: e.target.value }))} className="bg-[#1a103c] border-[#2d1b54] text-white" placeholder="Confirm time" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditWallet(wallet.id)} className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingWallet(null)} className="text-gray-400"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0" style={{ background: wallet.color }}>
                      {wallet.icon || wallet.symbol.slice(0,1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{wallet.coin}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}>{wallet.symbol}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>{wallet.networkTag}</span>
                      </div>
                      <p className="text-gray-500 text-xs font-mono truncate">{wallet.address || <span className="text-red-400">⚠ No address set</span>}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Toggle enabled */}
                      <button onClick={() => toggleWallet(wallet.id)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${wallet.enabled ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400" : "bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400"}`}>
                        {wallet.enabled ? "ON" : "OFF"}
                      </button>
                      <button onClick={() => { setEditingWallet(wallet.id); setEditWalletData({}) }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteWallet(wallet.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
