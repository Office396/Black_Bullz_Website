"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Star, Download, ExternalLink, Heart, Flag, MessageCircle,
  Monitor, Cpu, MemoryStick, HardDrive, Clock, User,
  Calendar, ChevronLeft, Play, ThumbsUp, ThumbsDown, Share2, Shield,
  AlertTriangle, CheckCircle, Info, Package, Wrench,
  ChevronDown, ChevronUp, Cloud, Building2, X, Maximize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Comments } from "@/components/comments"
import { RichContent } from "@/components/rich-text"
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
  landscapeImage?: string
  trailerUrl?: string
  steamUrl?: string
  edition?: string
  rating?: number | string
  size?: string
  description: string
  longDescription?: string
  releaseDate?: string
  publishedDate?: string
  uploadDate?: string
  updatedDate?: string
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
  likes?: number
  dislikes?: number
  uploader?: string
  uploaderName?: string
  uploaderId?: string
  version?: string
  note?: string
  reviews?: any[]
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
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("error")
  const [reportDesc, setReportDesc] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [likes, setLikes] = useState(game?.likes || 0)
  const [dislikes, setDislikes] = useState(game?.dislikes || 0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewContent, setReviewContent] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [myReview, setMyReview] = useState<any>(null)
  const [showReactionLoginPrompt, setShowReactionLoginPrompt] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null)
  const [calculatedRating, setCalculatedRating] = useState<number>(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [reviewSortMode, setReviewSortMode] = useState<'recent' | 'top' | 'lowest' | 'oldest'>('recent')
  const [reviewVisibleCount, setReviewVisibleCount] = useState(5)
  const [filterCommentary, setFilterCommentary] = useState(true)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterMine, setFilterMine] = useState(false)

  const showToast = (msg: string, type: 'success' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Function to trigger toast with auto-scroll message
  const showReviewToast = () => {
    const msg = "Awesome! Your review has been submitted and is now pending approval. Check it out below!"
    setToast({ msg, type: 'info' })
    setTimeout(() => {
      const el = document.getElementById('pending-review-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 500)
    setTimeout(() => setToast(null), 4000)
  }

  // User context for favourites + watch history
  const userCtx = useUser()
  const user = userCtx?.user
  const token = userCtx?.token

  const isPCGame = game?.category === "PC Games"
  const isAndroid = game?.category === "Android Games"

  const averageRating = typeof game?.rating === 'number' ? game.rating : parseFloat(String(game?.rating || '4.5'))
  const recommendPercent = Math.min(95, Math.max(70, averageRating * 20))
  const views = game?.views ?? 0
  const downloads = game?.downloads ?? 0

  const features = game?.keyFeatures?.filter(Boolean) || game?.features || []
  const genres = game?.genres || []
  const cloudDownloads = game?.cloudDownloads || []

  // Get YouTube embed ID from trailer URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }
  const trailerYtId = game?.trailerUrl ? getYouTubeId(game.trailerUrl) : null

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxOpen(false); setTrailerOpen(false); setShowReportModal(false) }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load favourite state + reactions + track watch history
  useEffect(() => {
    if (!token || !game?.id) return
    fetch('/api/user/favourites', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.favourites) setIsFavorite(d.favourites.includes(game.id)) }).catch(() => { })
    fetch('/api/user/history', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id }) }).catch(() => { })
    fetch(`/api/reactions?game_id=${game.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setLikes(d.likes || 0); setDislikes(d.dislikes || 0); setUserReaction(d.userReaction) }).catch(() => { })
  }, [token, game?.id])

  // Initialize reviews from server data (instant display)
  useEffect(() => {
    if (game?.reviews && game.reviews.length > 0) {
      setReviews(game.reviews)
      const total = game.reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
      setCalculatedRating(total / game.reviews.length)
      setIsLoaded(true)
    } else {
      setIsLoaded(true)
    }
  }, [game?.reviews])

// Load approved reviews + user's pending review (fallback/fresh data)
  useEffect(() => {
    if (!game?.id) return
    fetch(`/api/reviews?game_id=${game.id}`)
      .then(r => r.json()).then(d => {
        if (d.reviews) {
          setReviews(d.reviews)
          if (d.reviews.length > 0) {
            const total = d.reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
            setCalculatedRating(total / d.reviews.length)
          }
        }
        setIsLoaded(true)
      }).catch(() => { setIsLoaded(true) })
    // Load user's own review (pending, rejected, or approved)
    if (token && user) {
      fetch(`/api/reviews?game_id=${game.id}&mine=1`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { 
          if (d.myReview) setMyReview(d.myReview)
        }).catch(() => { })
    }
  }, [game?.id, token, user])

  // Mark as loaded after initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleReaction = async (reaction: 'like' | 'dislike') => {
    if (!user) { setShowReactionLoginPrompt(true); setTimeout(() => setShowReactionLoginPrompt(false), 3000); return }
    const res = await fetch('/api/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id, reaction }) })
    const data = await res.json()
    if (data.success) {
      setUserReaction(data.userReaction)
      fetch(`/api/reactions?game_id=${game.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { setLikes(d.likes || 0); setDislikes(d.dislikes || 0) }).catch(() => { })
    }
  }

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard.writeText(url).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000) }).catch(() => { })
  }

  const submitReview = async () => {
    if (!reviewRating || !user) return
    setReviewSubmitting(true)
    
    // If editing existing pending review
    if (myReview && myReview.status === 'pending') {
      await fetch(`/api/reviews?id=${myReview.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ rating: reviewRating, content: reviewContent }) 
      })
      setReviewSubmitting(false)
      setShowReviewModal(false)
      setReviewRating(0)
      setReviewContent("")
      // Show toast
      setToast({ msg: "Your review has been updated successfully!", type: 'success' })
      setTimeout(() => setToast(null), 4000)
      // Refresh my review and scroll after data is set
      fetch(`/api/reviews?game_id=${game.id}&mine=1`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { 
          if (d.myReview) {
            setMyReview(d.myReview)
            setTimeout(() => {
              const el = document.getElementById('pending-review-section')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        }).catch(() => { })
      return
    }
    
    // New review submission
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id, gameTitle: game.title, rating: reviewRating, content: reviewContent }) })
    const data = await res.json()
    setReviewSubmitting(false)
    if (data.error) { alert(data.error); return }
    setShowReviewModal(false)
    setReviewRating(0)
    setReviewContent("")
    // Refresh my review and scroll after data is set
    fetch(`/api/reviews?game_id=${game.id}&mine=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { 
        if (d.myReview) {
          setMyReview(d.myReview)
          setTimeout(() => {
            const el = document.getElementById('pending-review-section')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }).catch(() => { })
    showReviewToast()
  }

  const scrollToPendingReview = () => {
    setTimeout(() => {
      const el = document.getElementById('pending-review-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const submitReport = async () => {
    if (!reportDesc.trim()) return
    setReportSubmitting(true)
    await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ gameId: game.id, gameTitle: game.title, reportType, description: reportDesc }) })
    setReportSubmitting(false)
    setReportDone(true)
    setTimeout(() => { setShowReportModal(false); setReportDone(false); setReportDesc("") }, 2000)
  }

  if (!game) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown"
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return "Unknown" }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Toast notification - Windows/macOS style */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl shadow-2xl overflow-hidden w-80" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 1px rgba(157,78,221,0.5)" }}>
            <div className="p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500/20' : 'bg-[#9d4edd]/20'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{toast.type === 'success' ? 'Success' : 'Info'}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{toast.msg}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Progress bar that shrinks */}
            <div className="h-1 bg-[#2d1b54]">
              <div 
                className={`h-full transition-all duration-[4000ms] ease-linear ${toast.type === 'success' ? 'bg-green-500' : 'bg-[#9d4edd]'}`}
                style={{ animation: 'shrink 4s linear forwards' }}
              />
            </div>
          </div>
          <style jsx>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-[#9d4edd] transition-colors">Home</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <Link href="/games" className="hover:text-[#9d4edd] transition-colors">Games</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 dark:text-white">{game.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden keep-white">
        {/* Content Container - transparent to show background */}
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
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
          {/* Like/Dislike/Report buttons below game cover */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="relative">
              <Button
                variant="outline"
                className={`h-9 px-3 border-white/20 transition-colors keep-white ${userReaction === 'like' ? 'text-green-400 border-green-500/50 bg-green-500/10' : 'text-white hover:bg-white/10 hover:text-green-400'}`}
                onClick={() => handleReaction('like')}
              >
                <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-green-400' : ''}`} />
                <span className="ml-1.5 text-xs font-medium">Like</span>
                <span className="ml-1 text-xs opacity-70">{likes}</span>
              </Button>
              {showReactionLoginPrompt && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-[#9d4edd]/40 rounded-lg text-xs text-white whitespace-nowrap shadow-xl z-50">
                  <a href="/login" className="text-[#9d4edd] font-semibold hover:underline">Login</a> or <a href="/signup" className="text-[#9d4edd] font-semibold hover:underline">Sign up</a> to react
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className={`h-9 px-3 border-white/20 transition-colors keep-white ${userReaction === 'dislike' ? 'text-red-400 border-red-500/50 bg-red-500/10' : 'text-white hover:bg-white/10 hover:text-red-400'}`}
              onClick={() => handleReaction('dislike')}
            >
              <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-red-400' : ''}`} />
              <span className="ml-1.5 text-xs font-medium">Dislike</span>
              <span className="ml-1 text-xs opacity-70">{dislikes}</span>
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 border-white/20 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 keep-white"
              onClick={() => setShowReportModal(true)}
            >
              <Flag className="w-4 h-4" />
              <span className="ml-1.5 text-xs font-medium">Report</span>
            </Button>
          </div>
        </div>

        {/* Game Info */}
        <div className="flex-1 space-y-4">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`text-white text-xs font-bold ${isAndroid ? 'bg-green-600' : 'bg-[#9d4edd]'}`}>
              {game.category}
            </Badge>
            <Badge className="bg-secondary text-secondary-foreground border-border text-xs uppercase">
              {isAndroid ? "Android" : "PC"}
            </Badge>
            {game.size && (
              <Badge className="bg-secondary text-secondary-foreground border-border text-xs">
                {game.size}
              </Badge>
            )}
          </div>

          {/* Title & Rating */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">{game.title}
              {game.edition && (
                <span className="ml-3 text-sm font-bold px-3 py-1.5 rounded-lg align-middle inline-flex items-center gap-1.5 animate-pulse" style={{ background: "linear-gradient(135deg, rgba(157,78,221,0.4), rgba(199,125,255,0.25))", border: "1px solid rgba(157,78,221,0.6)", color: "#c77dff", boxShadow: "0 0 12px rgba(157,78,221,0.4)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c77dff] animate-ping inline-block" />
                  {game.edition}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {reviews.length > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-foreground font-semibold ml-1 text-sm">{(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs ml-1">({reviews.length})</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-muted border-muted-foreground/30" />)}
                  <span className="text-muted-foreground text-xs ml-1">No reviews yet</span>
                </div>
              )}
              {myReview?.status === 'approved' ? (
                <button onClick={() => { const el = document.getElementById('reviews-section'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }} className="text-xs text-green-500 hover:text-green-400 transition-colors flex items-center gap-1 cursor-pointer">
                  <MessageCircle className="w-3 h-3" /> Reviewed
                </button>
              ) : (
                <button onClick={() => { if (myReview?.status === 'pending') { setReviewRating(myReview.rating); setReviewContent(myReview.content || '') } setShowReviewModal(true) }} className="text-xs text-[#9d4edd] hover:text-[#c77dff] hover:underline transition-colors flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {myReview?.status === 'pending' ? 'Edit your hot take' : myReview?.status === 'rejected' ? 'Submit new review' : 'Give us your hot take'}
                </button>
              )}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-white/20">
            {game.developer && (
              <div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><User className="w-3 h-3" />Developer</div>
                <p className="text-foreground text-sm font-medium">{game.developer}</p>
              </div>
            )}
            {(game as any).publisher && (
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Building2 className="w-3 h-3" />Publisher</div>
                <Link href={`/publishers/${(game as any).publisher.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(157,78,221,0.15)", border: "1px solid rgba(157,78,221,0.4)", color: "#c77dff" }}>
                  <Building2 className="w-3 h-3" />
                  {(game as any).publisher}
                  <ExternalLink className="w-3 h-3 opacity-60" />
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
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                {game.updatedDate && game.updatedDate !== game.uploadDate ? 'Updated' : 'Published'}
              </div>
              <p className="text-gray-900 dark:text-white text-sm font-medium">
                {game.updatedDate && game.updatedDate !== game.uploadDate
                  ? formatDate(game.updatedDate)
                  : formatDate(game.publishedDate || game.uploadDate)}
              </p>
            </div>
          </div>

          {/* Uploader */}
          <div className="flex items-center gap-3 bg-[#120b22]/60 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-[#9d4edd]/30 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#9d4edd]" />
            </div>
            <div>
              <p className="text-muted-foreground dark:text-muted-foreground text-xs">Uploaded by</p>
              {(game.uploaderName || game.uploader) ? (
                <Link href={`/profile`} className="text-[#9d4edd] hover:text-[#c77dff] text-sm font-medium transition-colors">
                  {game.uploaderName || game.uploader}
                </Link>
              ) : (
                <p className="text-foreground text-sm font-medium">BullzGamez Team</p>
              )}
            </div>
          </div>

          {/* Short Description */}
          {game.description && (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">{game.description}</p>
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
            {(trailerYtId || game.trailerUrl) && (
              <Button variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => setTrailerOpen(true)}>
                <Play className="w-4 h-4 mr-2" />
                Trailer
              </Button>
            )}
            <Button
              variant="outline"
              className={`border-border ${isFavorite ? 'text-red-500 border-red-500/50 hover:bg-red-500/10' : 'text-foreground hover:bg-accent hover:text-accent-foreground'} relative group`}
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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg text-xs text-popover-foreground whitespace-nowrap shadow-xl z-50">
                  <a href="/login" className="text-[#9d4edd] font-semibold hover:underline">Login</a> or <a href="/signup" className="text-[#9d4edd] font-semibold hover:underline">Sign up</a> to save favourites
                </div>
              )}
            </Button>
            <Button variant="outline" className={`border-border transition-colors ${shareCopied ? 'text-green-500 border-green-500/50 bg-green-500/10' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`} onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              {shareCopied ? 'Copied!' : 'Share'}
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => setShowReportModal(true)}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </Button>            </div>

          {/* Steam Link */}
          <a
            href={game.steamUrl || `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
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
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all border bg-secondary text-secondary-foreground border-border hover:bg-[#9d4edd]/20 hover:text-[#c77dff] hover:border-[#9d4edd]/40">
                    {genre}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/80 rounded-xl p-4 text-center backdrop-blur-sm">
          <p className="text-2xl font-bold text-foreground">{DownloadsFormatter(downloads)}</p>
          <p className="text-muted-foreground text-sm">Downloads</p>
        </div>
        <div className="bg-card/80 rounded-xl p-4 text-center backdrop-blur-sm">
          <p className="text-2xl font-bold text-foreground">{views.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Views</p>
        </div>
        <div className="bg-card/80 rounded-xl p-4 text-center backdrop-blur-sm">
          <p className="text-2xl font-bold text-foreground">
            {!isLoaded ? averageRating.toFixed(1) : (reviews.length > 0 ? calculatedRating.toFixed(1) : averageRating.toFixed(1))}
          </p>
          <p className="text-muted-foreground text-sm">
            {!isLoaded ? 'Score' : (reviews.length > 0 ? `Based on ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'Score')}
          </p>
        </div>
      </div>

      {/* About Section (Long Description) - MOVED HERE AFTER PROFILE */}
      <div className="bg-card rounded-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#9d4edd]" />
            About {game.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {game.longDescription || game.description}
          </p>
        </div>
      </div>

      {/* Features - AFTER ABOUT */}
      {
        features.length > 0 && (
          <div className="bg-card rounded-2xl">
            <div className="p-6 pb-0">
              <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#9d4edd]" />
                Key Features
              </h3>
            </div>
            <div className="p-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-[#9d4edd] rounded-full mt-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      }

      {/* System Requirements - AFTER KEY FEATURES */}
      {
        (game.systemRequirements?.recommended?.os || game.androidRequirements?.recommended?.os) && (
          <div className="bg-card rounded-2xl">
            <div className="p-6 pb-0">
              <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#9d4edd]" />
                System Requirements <span className="text-muted-foreground text-sm font-normal">(Recommended)</span>
              </h3>
            </div>
            <div className="p-6">
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
                        <span className="text-gray-400 text-xs">{label}</span>
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
                        <span className="text-gray-400 text-xs">{label}</span>
                        <p className="text-foreground font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Screenshots Gallery - AFTER SYSTEM REQUIREMENTS */}
      {
        game.screenshots && game.screenshots.length > 0 && (
          <div className="bg-card rounded-2xl">
            <div className="p-6 pb-0">
              <h3 className="text-foreground font-bold text-lg">Screenshots</h3>
            </div>
            <div className="p-6">
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
                    {/* Watermark */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold text-white/70 select-none pointer-events-none" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                      BullzGamez
                    </div>
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
                  <div className="absolute top-4 left-4 px-2 py-1 rounded text-xs font-bold text-white/60 select-none pointer-events-none" style={{ background: "rgba(0,0,0,0.6)" }}>
                    BullzGamez
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % game.screenshots!.length) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-[101] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80"
                  >›</button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{lightboxIndex + 1} / {game.screenshots.length}</div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* ===== INSTALLATION GUIDE ===== - AFTER SCREENSHOTS */}
      <div className="bg-card rounded-2xl">
        <div className="p-6 pb-4 border-b border-white/5">
          <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#9d4edd]" />
            Installation Guide
          </h3>
          <p className="text-muted-foreground text-sm mt-1">Step-by-step setup process</p>
        </div>
        <div className="p-0">
          {isPCGame ? (
            <div>
              {/* Tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setInstallTab("pre-installed")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${installTab === "pre-installed"
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
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${installTab === "installable"
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
        </div>
      </div>

      {/* ===== DOWNLOAD SECTION ===== - AFTER INSTALLATION GUIDE */}
      {
        cloudDownloads.length > 0 && (
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
                      <div className="bg-green-900/60 border border-green-500/40 rounded-2xl overflow-hidden keep-white">
                        <div className="flex items-center gap-3 p-4 border-b border-green-500/30">
                          <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">Pre-installed Version</h3>
                            <p className="text-green-300 dark:text-green-400 text-xs">Recommended • No installation needed, just extract & play!</p>
                          </div>
                          <Badge className="ml-auto bg-green-500/30 text-green-300 dark:text-green-400 border border-green-500/40">RECOMMENDED</Badge>
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
                                          <span className="text-white dark:text-white text-sm truncate">{link.name || `Part ${li + 1}`}</span>
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
                      <div className="bg-purple-900/60 border border-purple-500/40 rounded-2xl overflow-hidden keep-white">
                        <div className="flex items-center gap-3 p-4 border-b border-purple-500/30">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">Installable Version</h3>
                            <p className="text-purple-300 dark:text-purple-400 text-xs">Traditional installer • Run setup.exe to install</p>
                          </div>
                          <Badge className="ml-auto bg-purple-500/30 text-purple-300 dark:text-purple-400 border border-purple-500/40">INSTALLER</Badge>
                        </div>
                        <div className="p-4 flex items-center justify-center text-gray-500 py-8">
                          <div className="text-center">
                            <Package className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                            <p className="text-gray-700 dark:text-gray-500 text-sm">Use the same links above — select your preferred version</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Android - single download section */
                    <div className="bg-[#9d4edd]/40 border border-[#9d4edd]/40 rounded-2xl overflow-hidden keep-white">
                      <div className="flex items-center gap-3 p-4 border-b border-[#9d4edd]/30">
                        <div className="w-10 h-10 rounded-xl bg-[#9d4edd]/30 flex items-center justify-center">
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
                                          <span className="text-white dark:text-white text-sm truncate">{link.name || `Download ${li + 1}`}</span>
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

                </div>
              )
            })()}
          </div>
        )
      }

      {/* ===== PLAYER PERSPECTIVES (AnkerGames Style) ===== */}
      <div className="bg-[#0d0820]/90 border border-[#2d1b54]/60 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Section Header */}
        <div className="p-7 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[#c77dff] text-xs font-bold tracking-[0.2em] uppercase mb-1.5">Community Voices</p>
            <h3 className="text-white font-black text-2xl">Player perspectives</h3>
            <p className="text-[#b8a9d4] text-sm mt-1">Spot the sentiment at a glance, then dive into the stories that matter to you.</p>
          </div>
          {/* Sort options */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[#b8a9d4] text-sm font-medium mr-1 border-r border-[#2d1b54] pr-3 py-1">SORT BY</span>
            {[
              { key: 'recent' as const, label: 'Most recent' },
              { key: 'top' as const, label: 'Top rated' },
              { key: 'lowest' as const, label: 'Lowest rated' },
              { key: 'oldest' as const, label: 'Oldest first' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setReviewSortMode(opt.key); setReviewVisibleCount(5) }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  reviewSortMode === opt.key
                    ? 'bg-[#9d4edd] text-white shadow-md shadow-[#9d4edd]/25'
                    : 'text-[#b8a9d4] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mx-7 mb-6 bg-[#110d24] border border-[#2d1b54]/50 rounded-xl p-6 shadow-inner">
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
            <div className="bg-[#0d0820] rounded-xl p-4 border border-[#2d1b54]/30">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[#b8a9d4] text-xs font-semibold uppercase tracking-wider">Average</span>
                <span className="text-[#6b5b8a] text-xs">/5</span>
              </div>
              <p className="text-white text-4xl font-black mt-1 tracking-tight">
                {reviews.length > 0 ? calculatedRating.toFixed(1) : averageRating.toFixed(1)}
              </p>
            </div>
            <div className="bg-[#0d0820] rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[#b8a9d4] text-xs font-semibold uppercase tracking-wider">Recommend</span>
              </div>
              <p className="text-emerald-400 text-4xl font-black mt-1 tracking-tight">{reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : recommendPercent}%</p>
            </div>
            <div className="bg-[#0d0820] rounded-xl p-4 border border-[#2d1b54]/30">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[#b8a9d4] text-xs font-semibold uppercase tracking-wider">Written</span>
              </div>
              <p className="text-white text-4xl font-black mt-1 tracking-tight">{reviews.filter(r => r.content).length}</p>
            </div>
            <div className="bg-[#0d0820] rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[#b8a9d4] text-xs font-semibold uppercase tracking-wider">Verified</span>
              </div>
              <p className="text-white text-4xl font-black mt-1 tracking-tight">{reviews.length}</p>
            </div>
          </div>

          {/* Sentiment Mix */}
          {reviews.length > 0 && (() => {
            const positive = reviews.filter(r => r.rating >= 4).length
            const neutral = reviews.filter(r => r.rating === 3).length
            const critical = reviews.filter(r => r.rating <= 2).length
            const total = reviews.length
            const posPct = Math.round((positive / total) * 100)
            const neuPct = Math.round((neutral / total) * 100)
            const criPct = Math.round((critical / total) * 100)
            return (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6b5b8a] text-[10px] uppercase tracking-wider">Sentiment Mix</span>
                  <span className="text-[#6b5b8a] text-[10px]">{total} REVIEWS</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#2d1b54]/40">
                  {posPct > 0 && <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${posPct}%` }} />}
                  {neuPct > 0 && <div className="h-full bg-yellow-500 transition-all" style={{ width: `${neuPct}%` }} />}
                  {criPct > 0 && <div className="h-full bg-red-500 transition-all" style={{ width: `${criPct}%` }} />}
                </div>
                <div className="flex justify-between mt-2">
                  <div><span className="text-emerald-400 text-sm font-bold">{posPct}%</span><br /><span className="text-[#4a3d6b] text-[10px] uppercase">Positive</span></div>
                  <div className="text-center"><span className="text-yellow-400 text-sm font-bold">{neuPct}%</span><br /><span className="text-[#4a3d6b] text-[10px] uppercase">Neutral</span></div>
                  <div className="text-right"><span className="text-red-400 text-sm font-bold">{criPct}%</span><br /><span className="text-[#4a3d6b] text-[10px] uppercase">Critical</span></div>
                </div>
              </div>
            )
          })()}

          {/* Bottom Row: Quick Filters + Rating Spread */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quick Filters */}
            <div>
              <p className="text-[#6b5b8a] text-[10px] uppercase tracking-wider mb-3">Quick Filters</p>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 bg-[#0d0820] rounded-lg px-3 py-2.5 cursor-pointer border border-[#2d1b54]/40 hover:border-[#9d4edd]/30 transition-colors">
                  <div className="w-4 h-4 rounded bg-orange-500/30 flex items-center justify-center text-[8px]">💬</div>
                  <div>
                    <p className="text-white text-xs font-semibold">Reviews with commentary</p>
                    <p className="text-[#4a3d6b] text-[9px]">Written thoughts only</p>
                  </div>
                  <button
                    onClick={() => setFilterCommentary(!filterCommentary)}
                    className={`ml-1 w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${filterCommentary ? 'bg-[#9d4edd]' : 'bg-[#2d1b54]'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filterCommentary ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center gap-2 bg-[#0d0820] rounded-lg px-3 py-2.5 cursor-pointer border border-[#2d1b54]/40 hover:border-[#9d4edd]/30 transition-colors">
                  <div className="w-4 h-4 rounded bg-[#9d4edd]/30 flex items-center justify-center text-[8px]">✓</div>
                  <div>
                    <p className="text-white text-xs font-semibold">Verified players only</p>
                    <p className="text-[#4a3d6b] text-[9px]">Confirmed downloads</p>
                  </div>
                  <button
                    onClick={() => setFilterVerified(!filterVerified)}
                    className={`ml-1 w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${filterVerified ? 'bg-[#9d4edd]' : 'bg-[#2d1b54]'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filterVerified ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center gap-2 bg-[#0d0820] rounded-lg px-3 py-2.5 cursor-pointer border border-[#2d1b54]/40 hover:border-[#9d4edd]/30 transition-colors">
                  <div className="w-4 h-4 rounded bg-[#9d4edd]/20 flex items-center justify-center text-[8px]">👤</div>
                  <div>
                    <p className="text-white text-xs font-semibold">Only my feedback</p>
                    <p className="text-[#4a3d6b] text-[9px]">Your personal notes</p>
                  </div>
                  <button
                    onClick={() => setFilterMine(!filterMine)}
                    className={`ml-1 w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${filterMine ? 'bg-[#9d4edd]' : 'bg-[#2d1b54]'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filterMine ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Rating Spread */}
            <div>
              <p className="text-[#6b5b8a] text-[10px] uppercase tracking-wider mb-3">Rating Spread</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="text-[#b8a9d4] w-5 text-right font-medium">{star}★</span>
                      <div className="flex-1 bg-[#0d0820] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            star >= 4 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                            star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[#6b5b8a] w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      {
        game.note && (
          <div className="bg-yellow-500/10 rounded-2xl">
            <div className="p-4">
              <h3 className="text-yellow-400 font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Note
              </h3>
              <p className="text-gray-300 text-sm">{game.note}</p>
            </div>
          </div>
        )
      }

      {/* Related Games */}
      {
        allGames.length > 0 && (() => {
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
        })()
      }

      {/* My Pending Review */}
      {myReview && myReview.status === 'pending' && (
        <div id="pending-review-section" className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <div className="p-6 pb-4">
            <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Your Review is Pending Approval
            </h3>
            <p className="text-gray-400 text-sm mt-1">Thanks for sharing your experience! Your review will go live once our team approves it.</p>
          </div>
          <div className="px-6 pb-6">
            <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#9d4edd]/30 flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{user?.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= myReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />)}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400">PENDING APPROVAL</span>
              </div>
              {myReview.content && <p className="text-gray-300 text-[15px] leading-relaxed mt-1"><RichContent text={myReview.content} /></p>}
              <p className="text-gray-600 text-sm mt-4 font-medium">Submitted on {new Date(myReview.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                onClick={async () => {
                  if (!confirm('Are you sure you want to withdraw your review?')) return
                  await fetch(`/api/reviews?id=${myReview.id}`, { method: 'DELETE' })
                  setMyReview(null)
                  setToast({ msg: 'Your review has been withdrawn', type: 'info' })
                  setTimeout(() => setToast(null), 4000)
                }}>
                Withdraw Review
              </Button>
              <Button size="sm" variant="outline" className="border-[#2d1b54] text-gray-400 hover:bg-white/5"
                onClick={() => { setReviewRating(myReview.rating); setReviewContent(myReview.content || ''); setShowReviewModal(true) }}>
                Edit Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* My Rejected Review */}
      {myReview && myReview.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl">
          <div className="p-6 pb-4">
            <h3 className="text-red-400 font-bold text-lg flex items-center gap-2">
              <X className="w-5 h-5" />
              Your Review Was Not Approved
            </h3>
            <p className="text-gray-400 text-sm mt-1">Unfortunately, your review didn't meet our community guidelines. You can delete it and submit a new one.</p>
          </div>
          <div className="px-6 pb-6">
            <div className="bg-[#1a103c] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#9d4edd]/30 flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{user?.name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= myReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />)}
                  </div>
                </div>
              </div>
              {myReview.content && <p className="text-gray-300 text-[15px] leading-relaxed mt-1"><RichContent text={myReview.content} /></p>}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={async () => {
                  if (!confirm('Delete this review and submit a new one?') ) return
                  await fetch(`/api/reviews?id=${myReview.id}`, { method: 'DELETE' })
                  setMyReview(null)
                }}>
                Delete & Write New Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVED REVIEWS (AnkerGames Style) ===== */}
      {(() => {
        // Sort & filter reviews
        let filteredReviews = [...reviews]
        if (filterCommentary) filteredReviews = filteredReviews.filter(r => r.content && r.content.trim())
        if (filterMine && user) filteredReviews = filteredReviews.filter(r => r.user_name === user.name)
        // Sort
        switch (reviewSortMode) {
          case 'top': filteredReviews.sort((a, b) => b.rating - a.rating); break
          case 'lowest': filteredReviews.sort((a, b) => a.rating - b.rating); break
          case 'oldest': filteredReviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
          default: filteredReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
        }
        const visibleReviews = filteredReviews.slice(0, reviewVisibleCount)
        const hasMoreReviews = reviewVisibleCount < filteredReviews.length
        const newestReview = reviews.length > 0 ? [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null
        const spotlightReview = reviews.length > 0 ? [...reviews].sort((a, b) => b.rating - a.rating || (b.content?.length || 0) - (a.content?.length || 0))[0] : null
        const topReviewers = reviews.length > 0 ? [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 3) : []

        return (
          <div id="reviews-section" className="space-y-4">
            {/* Fresh Off The Press + Spotlight Row */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Fresh Off The Press + Review List */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Fresh Off The Press */}
                  {newestReview && (
                    <div className="bg-[#110d24] border border-[#2d1b54]/50 rounded-xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                      <div>
                        <p className="text-[#6b5b8a] text-[10px] uppercase tracking-wider font-bold">Fresh Off The Press</p>
                        <p className="text-[#b8a9d4] text-xs mt-0.5">{formatDate(newestReview.created_at)}</p>
                        <p className="text-[#6b5b8a] text-xs mt-1">Look for it at the top of the stream.</p>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                        <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">{newestReview.rating}.0/5</span>
                      </div>
                    </div>
                  )}

                  {/* Review Cards */}
                  {visibleReviews.map((r, idx) => (
                    <div key={r.id} className="bg-[#110d24] border border-[#2d1b54]/50 rounded-xl p-5 hover:border-[#9d4edd]/25 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#9d4edd]/40 to-[#7b2cbf]/40 flex items-center justify-center text-white text-base font-bold ring-2 ring-[#9d4edd]/20">
                            {r.user_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-semibold text-[15px]">{r.user_name}</span>
                              <span className="text-[#4a3d6b] text-sm">{formatDate(r.created_at)}</span>
                              {r.user_badge && PLAN_BADGES[r.user_badge] && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${PLAN_BADGES[r.user_badge].color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                  {PLAN_BADGES[r.user_badge].label}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#2d1b54]'}`} />)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                          <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                          <span className="text-emerald-400 text-sm font-bold">{r.rating}.0/5</span>
                        </div>
                      </div>
                      {r.content && <p className="text-[#c4b5de] text-[15px] leading-relaxed mt-4 pt-4 border-t border-[#2d1b54]/30"><RichContent text={r.content} /></p>}
                    </div>
                  ))}

                  {/* Load More Reviews */}
                  {hasMoreReviews && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setReviewVisibleCount(prev => prev + 5)}
                        className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#9d4edd]/20"
                        style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}
                      >
                        Load more reviews
                      </button>
                    </div>
                  )}

                  {filteredReviews.length === 0 && reviews.length > 0 && (
                    <div className="bg-[#110d24] border border-[#2d1b54]/50 rounded-xl py-16 px-8 text-center flex flex-col items-center justify-center">
                      <p className="text-[#b8a9d4] text-[15px] font-medium">No reviews match your current filters.</p>
                      <button onClick={() => { setFilterCommentary(false); setFilterVerified(false); setFilterMine(false) }} className="text-[#c77dff] text-sm mt-3 font-semibold hover:underline bg-[#9d4edd]/10 px-4 py-1.5 rounded-full">Clear filters</button>
                    </div>
                  )}

                  {reviews.length === 0 && (
                    <div className="bg-[#110d24] border border-[#2d1b54]/50 rounded-xl p-8 text-center">
                      <Star className="w-10 h-10 text-[#2d1b54] mx-auto mb-3" />
                      <p className="text-[#6b5b8a] text-sm font-medium">No reviews yet</p>
                      <p className="text-[#4a3d6b] text-xs mt-1">Be the first to rate this game!</p>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="mt-3 px-5 py-2 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-all"
                      >
                        Write a Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Sidebar: Spotlight + Consistent Praise */}
                {reviews.length > 0 && (
                  <div className="space-y-4">
                    {/* Spotlight Review */}
                    {spotlightReview && (
                      <div className="bg-[#110d24] border border-[#9d4edd]/20 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(157,78,221,0.1)]">
                        <div className="p-5 pb-4 border-b border-[#2d1b54]/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Spotlight Review</p>
                          </div>
                          <p className="text-[#4a3d6b] text-xs">Community Favorite</p>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#9d4edd]/60 to-[#7b2cbf]/60 flex items-center justify-center text-white text-xl font-bold ring-3 ring-[#9d4edd]/30 shadow-lg shadow-[#9d4edd]/10">
                              {spotlightReview.user_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-base font-bold">{spotlightReview.user_name}</p>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= spotlightReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#2d1b54]'}`} />)}
                              </div>
                              <p className="text-[#6b5b8a] text-xs mt-0.5">{formatDate(spotlightReview.created_at)}</p>
                            </div>
                          </div>
                          {spotlightReview.content && (
                            <div className="bg-[#0d0820]/60 border border-[#2d1b54]/30 rounded-lg p-5">
                              <p className="text-[#c4b5de] text-[15px] leading-relaxed italic"><RichContent text={spotlightReview.content} /></p>
                            </div>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <span className="text-emerald-400 text-sm font-bold">{spotlightReview.rating}.0/5</span>
                            </div>
                            <span className="text-[#c77dff] text-xs font-medium">Top Rated</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consistent Praise */}
                    {topReviewers.length > 0 && (
                      <div className="bg-[#110d24] border border-[#2d1b54]/50 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                        <div className="p-5 pb-3 border-b border-[#2d1b54]/30">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#9d4edd]/20 flex items-center justify-center">
                              <Star className="w-3 h-3 text-[#9d4edd]" />
                            </div>
                            <p className="text-[#b8a9d4] text-sm font-bold uppercase tracking-wider">Consistent Praise</p>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          {topReviewers.map((r, i) => (
                            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#0d0820]/60 border border-[#2d1b54]/20 hover:border-[#9d4edd]/15 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9d4edd]/40 to-[#7b2cbf]/40 flex items-center justify-center text-white text-sm font-bold ring-2 ring-[#9d4edd]/20 flex-shrink-0">
                                {r.user_name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold">{r.user_name}</p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-[#2d1b54]'}`} />)}
                                </div>
                                <p className="text-[#6b5b8a] text-xs mt-1 line-clamp-2">{r.content ? r.content.substring(0, 80) + (r.content.length > 80 ? '...' : '') : 'Rating only'}</p>
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-emerald-400 text-xs font-bold">{r.rating}.0</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Write Review CTA */}
                    <button
                      onClick={() => {
                        if (myReview?.status === 'approved') {
                          const el = document.getElementById('reviews-section')
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        } else {
                          if (myReview?.status === 'pending') {
                            setReviewRating(myReview.rating)
                            setReviewContent(myReview.content || '')
                          }
                          setShowReviewModal(true)
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#9d4edd]/20"
                      style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}
                    >
                      {myReview?.status === 'pending' ? '✏️ Edit your review' : myReview?.status === 'rejected' ? '📝 Submit new review' : myReview?.status === 'approved' ? '✅ View your review' : '☕ Rate this game'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Comments */}
      <Comments gameId={game.id} itemName={game.title} />

      {/* Review Modal */}
      {
        showReviewModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
            <div className="bg-card border border-[#2d1b54] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Rate & Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {!user ? (
                <div className="text-center py-4 space-y-3">
                  <Star className="w-10 h-10 text-yellow-500 mx-auto" />
                  <p className="text-gray-300 text-sm">Sign in to write a review</p>
                  <div className="flex gap-3 justify-center">
                    <a href="/login" className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">Log in</a>
                    <a href="/signup" className="px-4 py-2 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">Sign up</a>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-gray-400 text-sm mb-3 text-center">How would you rate this game?</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button"
                          onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(s)}
                          className="transition-transform hover:scale-125">
                          <Star className={`w-10 h-10 transition-colors ${s <= (reviewHover || reviewRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-center text-sm mt-2 font-semibold" style={{ color: ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'][reviewRating] }}>
                        {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][reviewRating]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">Share your experience <span className="text-gray-600">(optional)</span></label>
                    <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} rows={4}
                      placeholder="What did you think about this game? Any tips for other players?"
                      className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm resize-none" />
                  </div>
                  <button onClick={submitReview} disabled={reviewSubmitting || !reviewRating}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40 hover:scale-[1.01]"
                    style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <p className="text-gray-600 text-xs text-center">Reviews are shown after admin approval</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Trailer Modal */}
      {
        trailerOpen && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setTrailerOpen(false)}>
            <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setTrailerOpen(false)} className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl font-bold z-10 flex items-center gap-2">
                <X className="w-6 h-6" /> Close
              </button>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                {trailerYtId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerYtId}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video src={game.trailerUrl} controls autoPlay className="w-full h-full" />
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Report Modal */}
      {
        showReportModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
            <div className="bg-card border border-[#2d1b54] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Flag className="w-4 h-4 text-red-400" /> Report Issue</h3>
                <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {!user ? (
                <div className="text-center py-4 space-y-3">
                  <Flag className="w-10 h-10 text-red-400 mx-auto" />
                  <p className="text-gray-300 text-sm">You need to be logged in to report an issue.</p>
                  <div className="flex gap-3 justify-center">
                    <a href="/login" className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors">Log in</a>
                    <a href="/signup" className="px-4 py-2 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold transition-colors">Sign up</a>
                  </div>
                </div>
              ) : reportDone ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-semibold">Report submitted!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Report Type</label>
                    <select value={reportType} onChange={e => setReportType(e.target.value)}
                      className="w-full bg-[#1a103c] border border-[#2d1b54] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#9d4edd]">
                      <option value="error">Download Error</option>
                      <option value="broken_link">Broken Link</option>
                      <option value="wrong_game">Wrong Game</option>
                      <option value="virus">Virus/Malware</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Description *</label>
                    <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={3}
                      placeholder="Describe the issue..."
                      className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors text-sm resize-none" />
                  </div>
                  <button onClick={submitReport} disabled={reportSubmitting || !reportDesc.trim()}
                    className="w-full py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  )
}

function DownloadsFormatter(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
