"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Star, Download, ExternalLink, Heart, Flag, MessageCircle,
  Monitor, Cpu, MemoryStick, HardDrive, Clock, User,
  Calendar, ChevronLeft, Play, ThumbsUp, Share2, Shield,
  AlertTriangle, CheckCircle, Info, Package, Wrench,
  ChevronDown, ChevronUp, Cloud, Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Comments } from "@/components/comments"
import { useUser } from "@/lib/user-context"

interface SystemRequirements {
  os?: string
  processor?: string
  memory?: string
  graphics?: string
  storage?: string
  directx?: string
  sound_card?: string
}

interface GameData {
  id: number
  title: string
  category: string
  image: string
  rating?: number | string
  size?: string
  description: string
  longDescription?: string
  releaseDate?: string
  uploadDate?: string
  developer?: string
  publisher?: string
  screenshots?: string[]
  systemRequirements?: {
    minimum?: SystemRequirements
    recommended?: SystemRequirements
  }
  androidRequirements?: {
    recommended?: {
      os?: string
      ram?: string
      storage?: string
      processor?: string
    }
  }
  features?: string[]
  keyFeatures?: string[]
  genres?: string[]
  views?: number
  downloads?: number
  uploader?: string
  version?: string
  note?: string
  sharedPinCode?: string
  sharedRarPassword?: string
  cloudDownloads?: Array<{
    cloudName: string
    actualProvider?: string
    customProvider?: string
    partsNumber?: number
    version?: string
    actualDownloadLinks?: Array<{ name: string; url: string; size: string }>
  }>
}

interface GameDetailsProps {
  game: GameData
  allGames?: GameData[]
}

// Cloud provider icons/colors
const CLOUD_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
  "Google Drive": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20", icon: "🔵" },
  "MediaFire": { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20", icon: "🔥" },
  "OneDrive": { color: "text-blue-300", bg: "bg-blue-400/10 border-blue-400/30 hover:bg-blue-400/20", icon: "☁️" },
  "MEGA": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20", icon: "🔴" },
  "Telegram": { color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20", icon: "✈️" },
  "Pixeldrain": { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20", icon: "💜" },
  "Buzzheavier": { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20", icon: "⚡" },
  "GoFile": { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20", icon: "📁" },
  "default": { color: "text-[#9d4edd]", bg: "bg-[#9d4edd]/10 border-[#9d4edd]/30 hover:bg-[#9d4edd]/20", icon: "☁️" },
}

function getCloudStyle(name: string) {
  return CLOUD_STYLES[name] || CLOUD_STYLES["default"]
}

export function GameDetails({ game, allGames = [] }: GameDetailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [installTab, setInstallTab] = useState<"pre-installed" | "installable">("pre-installed")
  const [expandedCloud, setExpandedCloud] = useState<number | null>(null)

  // User context for favourites + watch history
  const userCtx = useUser()
  const user = userCtx?.user
  const token = userCtx?.token

  const isPCGame = game?.category === "PC Games"
  const isAndroid = game?.category === "Android Games"

  const averageRating = typeof game?.rating === 'number' ? game.rating : parseFloat(String(game?.rating || '4.5'))
  const recommendPercent = Math.min(95, Math.max(70, averageRating * 20))
  const views = game?.views || 1250
  const downloads = game?.downloads || 15000

  const features = game?.keyFeatures?.filter(Boolean) || game?.features || []
  const genres = game?.genres || []
  const cloudDownloads = game?.cloudDownloads || []

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen])

  // Load favourite state + track watch history
  useEffect(() => {
    if (!token || !game?.id) return
    fetch('/api/user/favourites', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.favourites) setIsFavorite(d.favourites.includes(game.id)) }).catch(() => {})
    fetch('/api/user/history', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id }) }).catch(() => {})
  }, [token, game?.id])

  if (!game) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown"
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return "Unknown" }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-[#9d4edd] transition-colors">Home</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <Link href="/games" className="hover:text-[#9d4edd] transition-colors">Games</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-foreground">{game.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-card to-card border border-border rounded-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
          {/* Game Cover */}
          <div className="relative w-full lg:w-72 flex-shrink-0">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
              <img
                src={game.image || "/placeholder.svg"}
                alt={game.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded">
                v{game.version || '1.0'}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="flex-1 space-y-4">
            {/* Category Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`text-white text-xs font-bold ${isAndroid ? 'bg-green-600' : 'bg-[#9d4edd]'}`}>
                {game.category}
              </Badge>
              <Badge className="bg-white/5 border border-white/10 text-gray-300 text-xs uppercase">
                {isAndroid ? "Android" : "PC"}
              </Badge>
              {game.size && (
                <Badge className="bg-white/5 border border-white/10 text-gray-300 text-xs">
                  {game.size}
                </Badge>
              )}
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">{game.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                    />
                  ))}
                  <span className="text-foreground font-semibold ml-1">{averageRating.toFixed(1)}</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  {recommendPercent}% recommend
                </Badge>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border">
              {game.developer && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><User className="w-3 h-3" />Developer</div>
                  <p className="text-foreground text-sm font-medium">{game.developer}</p>
                </div>
              )}
              {(game as any).publisher && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Building2 className="w-3 h-3" />Publisher</div>
                  <Link href={`/publishers/${(game as any).publisher.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?name=${encodeURIComponent((game as any).publisher)}`}
                    className="text-[#9d4edd] hover:text-[#c77dff] text-sm font-medium transition-colors">
                    {(game as any).publisher}
                  </Link>
                </div>
              )}
              {game.size && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><HardDrive className="w-3 h-3" />File Size</div>
                  <p className="text-foreground text-sm font-medium">{game.size}</p>
                </div>
              )}
              {game.releaseDate && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Calendar className="w-3 h-3" />Released</div>
                  <p className="text-foreground text-sm font-medium">{new Date(game.releaseDate).getFullYear()}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-3 h-3" />Published</div>
                <p className="text-foreground text-sm font-medium">{formatDate(game.uploadDate)}</p>
              </div>
            </div>

            {/* Uploader */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#9d4edd]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[#9d4edd]" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Uploaded by</p>
                <p className="text-foreground text-sm font-medium">{game.uploader || 'BullzGamez Team'}</p>
              </div>
            </div>

            {/* Short Description */}
            {game.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{game.description}</p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  const downloadSection = document.getElementById('download-section')
                  if (downloadSection) {
                    downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-base"
              >
                <Download className="w-5 h-5" />
                Download Now
              </button>
              <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" />
                Trailer
              </Button>
              <Button
                variant="outline"
                className={`border-white/20 ${isFavorite ? 'text-red-500 border-red-500/50' : 'text-white'} relative group`}
                onClick={async () => {
                  if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return }
                  const res = await fetch('/api/user/favourites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id }) })
                  const data = await res.json()
                  if (data.success) setIsFavorite(data.isFavourite)
                }}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500' : ''}`} />
                {isFavorite ? 'Favorited' : 'Favorite'}
                {showLoginPrompt && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#120b22] border border-[#9d4edd]/40 rounded-lg text-xs text-white whitespace-nowrap shadow-xl z-50">
                    <a href="/login" className="text-[#9d4edd] font-semibold hover:underline">Login</a> or <a href="/signup" className="text-[#9d4edd] font-semibold hover:underline">Sign up</a> to save favourites
                  </div>
                )}
              </Button>
              <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Steam Link */}
            <a
              href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#9d4edd] hover:underline text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Support developers – Get it on Steam
            </a>

            {/* Genre Tags */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}>
                    <Badge className="bg-white/5 hover:bg-[#9d4edd]/20 text-muted-foreground border border-white/10 cursor-pointer transition-colors hover:text-[#9d4edd] hover:border-[#9d4edd]/30">
                      {genre}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{DownloadsFormatter(downloads)}</p>
          <p className="text-muted-foreground text-sm">Downloads</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{views.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Views</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
          <p className="text-muted-foreground text-sm">Score</p>
        </div>
      </div>

      {/* About Section (Long Description) - MOVED HERE AFTER PROFILE */}
      <Card className="bg-card border border-border">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#9d4edd]" />
            About {game.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {game.longDescription || game.description}
          </p>
        </CardContent>
      </Card>

      {/* Features - AFTER ABOUT */}
      {features.length > 0 && (
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#9d4edd]" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-[#9d4edd] rounded-full mt-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* System Requirements - AFTER KEY FEATURES */}
      {(game.systemRequirements?.recommended?.os || game.androidRequirements?.recommended?.os) && (
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#9d4edd]" />
              System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPCGame && game.systemRequirements?.recommended && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  { icon: Monitor, label: "OS", value: game.systemRequirements.recommended.os },
                  { icon: Cpu, label: "Processor", value: game.systemRequirements.recommended.processor },
                  { icon: MemoryStick, label: "Memory", value: game.systemRequirements.recommended.memory },
                  { icon: Monitor, label: "Graphics", value: game.systemRequirements.recommended.graphics },
                  { icon: HardDrive, label: "Storage", value: game.systemRequirements.recommended.storage },
                ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <Icon className="w-4 h-4 text-[#9d4edd] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="text-foreground font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isAndroid && game.androidRequirements?.recommended && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  { icon: Monitor, label: "Android Version", value: game.androidRequirements.recommended.os },
                  { icon: Cpu, label: "Processor", value: game.androidRequirements.recommended.processor },
                  { icon: MemoryStick, label: "RAM", value: game.androidRequirements.recommended.ram },
                  { icon: HardDrive, label: "Storage", value: game.androidRequirements.recommended.storage },
                ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <Icon className="w-4 h-4 text-[#9d4edd] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="text-foreground font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Screenshots Gallery - AFTER SYSTEM REQUIREMENTS */}
      {game.screenshots && game.screenshots.length > 0 && (
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {game.screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-[#9d4edd]/50 transition-all"
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true) }}
                >
                  <img
                    src={screenshot || "/placeholder.svg"}
                    alt={`${game.title} screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {lightboxOpen && game.screenshots && (
              <div
                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                onClick={() => setLightboxOpen(false)}
              >
                <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-bold z-[101] w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80">✕</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + game.screenshots!.length) % game.screenshots!.length) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-[101] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80"
                >‹</button>
                <img
                  src={game.screenshots[lightboxIndex] || "/placeholder.svg"}
                  alt={`${game.title} screenshot ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % game.screenshots!.length) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-[101] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80"
                >›</button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{lightboxIndex + 1} / {game.screenshots.length}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== INSTALLATION GUIDE ===== - AFTER SCREENSHOTS */}
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#9d4edd]" />
            Installation Guide
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Step-by-step setup process</p>
        </CardHeader>
        <CardContent className="p-0">
          {isPCGame ? (
            <div>
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setInstallTab("pre-installed")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    installTab === "pre-installed"
                      ? "text-green-400 border-b-2 border-green-400 bg-green-500/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Pre-installed
                  <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">Recommended</Badge>
                </button>
                <button
                  onClick={() => setInstallTab("installable")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    installTab === "installable"
                      ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Installable
                </button>
              </div>

              {/* Pre-installed Guide */}
              {installTab === "pre-installed" && (
                <div className="p-6 space-y-6">
                  {/* Steps */}
                  <div className="space-y-4">
                    {[
                      { step: 1, text: "Game is pre-installed / portable, therefore you do not need to install the game." },
                      { step: 2, text: "Just extract the RAR / ZIP file using 7-Zip or WinRAR." },
                      { step: 3, text: 'Simply launch the game using the "Run Me!.bat" file or the game executable.' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-bold text-sm">{step}</span>
                        </div>
                        <p className="text-muted-foreground text-sm pt-2">{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Important Notes */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                    <h4 className="text-yellow-400 font-bold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      Important Notes
                    </h4>
                    <p className="text-gray-400 text-xs mb-3">Please review these important details before installation</p>
                    <ul className="space-y-2">
                      {[
                        "Install necessary apps from Redist or _CommonRedist folder to ensure the game launches without any problems.",
                        "Always extract the game in an Antivirus / Windows Defender excluded folder — check our FAQs to know why this is important.",
                        "Always run the game as Administrator.",
                        "For a detailed guide, make sure to read Installation Guide.txt inside the game files.",
                      ].map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Game Data & Settings */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                    <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4" />
                      Game Data & Settings
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="text-blue-400 font-medium">Change Language:</span>{" "}
                        <span className="text-gray-400">Edit the file located at </span>
                        <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">steam_settings/Configs.user.ini</code>
                      </p>
                      <p className="text-gray-300">
                        <span className="text-blue-400 font-medium">Save Data Location:</span>{" "}
                        <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">*\userdata\&lt;user-id&gt;\{game.id}\remote</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Installable Guide */}
              {installTab === "installable" && (
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    {[
                      { step: 1, text: "Download all parts of the game from the download links above." },
                      { step: 2, text: "Extract the downloaded archive using 7-Zip or WinRAR. If there are multiple parts, they will automatically combine." },
                      { step: 3, text: "Open the extracted folder and run the Setup.exe or Install.exe file as Administrator." },
                      { step: 4, text: "Follow the installation wizard. Choose your preferred installation directory." },
                      { step: 5, text: "Once installed, install any necessary Redist from the Redist or _CommonRedist folder." },
                      { step: 6, text: "Launch the game from your desktop shortcut or Start Menu. Always run as Administrator." },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-400 font-bold text-sm">{step}</span>
                        </div>
                        <p className="text-muted-foreground text-sm pt-2">{text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                    <h4 className="text-yellow-400 font-bold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      Important Notes
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Always disable antivirus before installing — cracked games may be falsely flagged.",
                        "Install all Visual C++ Redistributables and DirectX from the Redist folder.",
                        "If the game doesn't launch, try running it as Administrator.",
                        "Do not update the game through Steam or any launcher — it will break the crack.",
                        "Block the game in your firewall if you have connectivity issues.",
                      ].map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Android Installation Guide */
            <div className="p-6 space-y-4">
              {[
                { step: 1, text: "Download the APK file from the links above." },
                { step: 2, text: 'Go to your phone Settings → Security → Enable "Install from Unknown Sources" or "Allow from this source".' },
                { step: 3, text: "Open your file manager and navigate to the downloaded APK file." },
                { step: 4, text: "Tap on the APK file and select Install." },
                { step: 5, text: "Wait for installation to complete, then launch the game." },
                { step: 6, text: "If the game requires OBB data, extract the OBB folder to Android/obb/ on your device storage." },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#9d4edd]/20 border border-[#9d4edd]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#9d4edd] font-bold text-sm">{step}</span>
                  </div>
                  <p className="text-muted-foreground text-sm pt-2">{text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== DOWNLOAD SECTION ===== - AFTER INSTALLATION GUIDE */}
      {cloudDownloads.length > 0 && (
        <div id="download-section" className="space-y-6">
          {(() => {
            const allLinks = cloudDownloads

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Download className="w-6 h-6 text-[#9d4edd]" />
                    Download Links
                  </h2>
                </div>

                {/* Show PC game sections */}
                {isPCGame ? (
                  <div className="space-y-4">
                    {/* Pre-installed section */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 border-b border-green-500/20">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">Pre-installed Version</h3>
                          <p className="text-green-400 text-xs">Recommended • No installation needed, just extract & play!</p>
                        </div>
                        <Badge className="ml-auto bg-green-500/20 text-green-400 border border-green-500/30">RECOMMENDED</Badge>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allLinks.map((cloud, ci) => {
                          const style = getCloudStyle(cloud.cloudName)
                          const isExpanded = expandedCloud === ci
                          const links = cloud.actualDownloadLinks || []
                          return (
                            <div key={ci} className={`border rounded-xl overflow-hidden transition-all ${style.bg}`}>
                              <button
                                className="w-full flex items-center justify-between gap-3 p-3"
                                onClick={() => setExpandedCloud(isExpanded ? null : ci)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{style.icon}</span>
                                  <div className="text-left">
                                    <p className={`font-bold text-sm ${style.color}`}>{cloud.cloudName || 'Cloud'}</p>
                                    {cloud.version && <p className="text-gray-500 text-xs">v{cloud.version}</p>}
                                    {links.length > 0 && <p className="text-gray-400 text-xs">{links.length} part{links.length > 1 ? 's' : ''}</p>}
                                  </div>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>
                              {isExpanded && links.length > 0 && (
                                <div className="border-t border-white/10 p-2 space-y-1.5">
                                  {links.map((link, li) => (
                                    <a
                                      key={li}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between gap-2 px-3 py-2 bg-black/20 rounded-lg hover:bg-black/40 transition-all group"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Download className={`w-3.5 h-3.5 ${style.color} flex-shrink-0`} />
                                        <span className="text-white text-sm truncate">{link.name || `Part ${li + 1}`}</span>
                                      </div>
                                      {link.size && <span className="text-gray-400 text-xs flex-shrink-0">{link.size}</span>}
                                    </a>
                                  ))}
                                </div>
                              )}
                              {isExpanded && links.length === 0 && (
                                <div className="border-t border-white/10 p-3 text-center text-gray-500 text-sm">No links available</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Installable section */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 border-b border-purple-500/20">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">Installable Version</h3>
                          <p className="text-purple-400 text-xs">Traditional installer • Run setup.exe to install</p>
                        </div>
                        <Badge className="ml-auto bg-purple-500/20 text-purple-400 border border-purple-500/30">INSTALLER</Badge>
                      </div>
                      <div className="p-4 flex items-center justify-center text-gray-500 py-8">
                        <div className="text-center">
                          <Package className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                          <p className="text-sm">Use the same links above — select your preferred version</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android - single download section */
                  <div className="bg-gradient-to-br from-[#9d4edd]/10 to-[#9d4edd]/5 border border-[#9d4edd]/30 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-[#9d4edd]/20">
                      <div className="w-10 h-10 rounded-xl bg-[#9d4edd]/20 flex items-center justify-center">
                        <Download className="w-5 h-5 text-[#9d4edd]" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">APK Download</h3>
                        <p className="text-[#9d4edd] text-xs">Modded Android Game</p>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allLinks.map((cloud, ci) => {
                        const style = getCloudStyle(cloud.cloudName)
                        const isExpanded = expandedCloud === ci
                        const links = cloud.actualDownloadLinks || []
                        return (
                          <div key={ci} className={`border rounded-xl overflow-hidden transition-all ${style.bg}`}>
                            <button
                              className="w-full flex items-center justify-between gap-3 p-3"
                              onClick={() => setExpandedCloud(isExpanded ? null : ci)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{style.icon}</span>
                                <div className="text-left">
                                  <p className={`font-bold text-sm ${style.color}`}>{cloud.cloudName || 'Cloud'}</p>
                                  {links.length > 0 && <p className="text-gray-400 text-xs">{links.length} link{links.length > 1 ? 's' : ''}</p>}
                                </div>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {isExpanded && links.length > 0 && (
                              <div className="border-t border-white/10 p-2 space-y-1.5">
                                {links.map((link, li) => (
                                  <a
                                    key={li}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 px-3 py-2 bg-black/20 rounded-lg hover:bg-black/40 transition-all"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Download className={`w-3.5 h-3.5 ${style.color} flex-shrink-0`} />
                                      <span className="text-white text-sm truncate">{link.name || `Download ${li + 1}`}</span>
                                    </div>
                                    {link.size && <span className="text-gray-400 text-xs flex-shrink-0">{link.size}</span>}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* PIN / RAR Password */}
                {(game.sharedPinCode || game.sharedRarPassword) && (
                  <div className="flex flex-wrap gap-3">
                    {game.sharedPinCode && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-mono font-bold">PIN: {game.sharedPinCode}</span>
                      </div>
                    )}
                    {game.sharedRarPassword && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm font-mono font-bold">RAR Password: {game.sharedRarPassword}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Player Perspectives */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Player Perspectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{averageRating.toFixed(1)}</div>
              <div className="text-muted-foreground text-sm">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{recommendPercent}%</div>
              <div className="text-muted-foreground text-sm">Recommend</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{DownloadsFormatter(downloads)}</div>
              <div className="text-muted-foreground text-sm">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{views.toLocaleString()}</div>
              <div className="text-muted-foreground text-sm">Views</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Recommend
            </Button>
            <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              Write Review
            </Button>
            <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10">
              <Flag className="w-4 h-4 mr-2" />
              Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      {game.note && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30">
          <CardContent className="p-4">
            <h3 className="text-yellow-400 font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Note
            </h3>
            <p className="text-gray-300 text-sm">{game.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Games */}
      {allGames.length > 0 && (() => {
        const gameGenres = game.genres || []
        const gameFeatures = (game.keyFeatures?.filter(Boolean) || game.features || [])
          .map((f: string) => f.toLowerCase())
        const gameCategory = game.category

        // Score each game by genre + feature overlap
        const scored = allGames
          .filter(g => g.id !== game.id && g.category === gameCategory)
          .map(g => {
            const gGenres = g.genres || []
            const gFeatures = (g.keyFeatures?.filter(Boolean) || g.features || [])
              .map((f: string) => f.toLowerCase())
            const genreScore = gGenres.filter((genre: string) => gameGenres.includes(genre)).length * 2
            const featureScore = gFeatures.filter((f: string) =>
              gameFeatures.some(mf => mf.includes(f) || f.includes(mf))
            ).length
            return { ...g, score: genreScore + featureScore }
          })
          .sort((a, b) => b.score - a.score)

        const related = scored.slice(0, 10)

        // Top in same category by rating
        const topInCategory = allGames
          .filter(g => g.id !== game.id && g.category === gameCategory)
          .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
          .slice(0, 10)

        if (related.length === 0 && topInCategory.length === 0) return null

        const GameCard = ({ g, index }: { g: any; index?: number }) => (
          <Link key={g.id} href={`/game/${g.id}`} className="group flex-shrink-0 w-28 sm:w-32">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
              <img
                src={g.image || "/placeholder.svg"}
                alt={g.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {index !== undefined && index < 3 && (
                <div className={`absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"}`}>
                  {index + 1}
                </div>
              )}
              <div className={`absolute ${index !== undefined && index < 3 ? 'top-1.5 right-1.5' : 'top-1.5 left-1.5'} px-1 py-0.5 rounded text-white text-[8px] font-bold uppercase shadow-lg z-10 ${g.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                {g.category === "Android Games" ? "APK" : "PC"}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-[10px] font-medium line-clamp-2">{g.title}</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-1.5 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{g.title}</p>
          </Link>
        )

        return (
          <div className="space-y-6">
            {related.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#9d4edd] rounded-full" />
                  Related Games
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {related.map(g => <GameCard key={g.id} g={g} />)}
                </div>
              </div>
            )}

            {topInCategory.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full" />
                  Top {gameCategory === "Android Games" ? "Android" : "PC"} Games
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {topInCategory.map((g, i) => <GameCard key={g.id} g={g} index={i} />)}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Comments */}
      <Comments gameId={game.id} itemName={game.title} />
    </div>
  )
}

function DownloadsFormatter(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
