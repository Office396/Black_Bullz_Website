"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Search, Menu, X, ChevronDown, Sun, Moon, LogIn,
  Heart, Bell, User, History, Star, Settings, LogOut,
  Sparkles, Crown, ChevronRight, CheckCheck, Check, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Lottie from "lottie-react"
import diceAnimation from "@/Dice roll.json"
import { useTheme } from "next-themes"
import { useUser } from "@/lib/user-context"
import { SafeImage } from "@/components/safe-image"
const genres = [
  { name: "Action", href: "/genre/action", letter: "A" },
  { name: "Adventure", href: "/genre/adventure", letter: "A" },
  { name: "Anime", href: "/genre/anime", letter: "A" },
  { name: "Classic", href: "/genre/classic", letter: "C" },
  { name: "Fighting", href: "/genre/fighting", letter: "F" },
  { name: "Horror", href: "/genre/horror", letter: "H" },
  { name: "Indie", href: "/genre/indie", letter: "I" },
  { name: "Multiplayer", href: "/genre/multiplayer", letter: "M" },
  { name: "Open World", href: "/genre/open-world", letter: "O" },
  { name: "Puzzle", href: "/genre/puzzle", letter: "P" },
  { name: "Racing", href: "/genre/racing", letter: "R" },
  { name: "RPG", href: "/genre/rpg", letter: "R" },
  { name: "Simulation", href: "/genre/simulation", letter: "S" },
  { name: "Sports", href: "/genre/sports", letter: "S" },
  { name: "Survival", href: "/genre/survival", letter: "S" },
  { name: "VR", href: "/genre/vr", letter: "V" },
]

// Group genres by first letter
const genresByLetter = genres.reduce((acc, genre) => {
  const letter = genre.letter
  if (!acc[letter]) {
    acc[letter] = []
  }
  acc[letter].push(genre)
  return acc
}, {} as Record<string, typeof genres>)

const mainNavItems = [
  { href: "/games", label: "All Games" },
  { href: "/top", label: "Top" },
  { href: "/trending", label: "Trending" },
  { name: "Genre", label: "Genre", isDropdown: true },
  { href: "/updates", label: "Recent Updates" },
  { name: "Collections", label: "Collections", isDropdown: true },
  { href: "/donate", label: "Donate", icon: Heart },
  { href: "/publishers", label: "Publishers" },
  { href: "/request", label: "Request" },
  { href: "/about", label: "About" },
]

const moreMenuItems: { href: string; label: string }[] = []

interface SearchResult {
  id: number
  title: string
  image: string
  category: string
}

interface Collection {
  id: string
  name: string
  gameIds: number[]
  order: number
}

function NotifDropdown({ notifications, markNotificationRead, markNotificationsRead, onClose }: { notifications: any[]; markNotificationRead: (id: string) => Promise<void>; markNotificationsRead: () => Promise<void>; onClose: () => void }) {
  const unread = notifications.filter(n => !n.is_read)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const handleMarkRead = async (id: string) => {
    setRemovingIds(prev => new Set(prev).add(id))
    setTimeout(() => markNotificationRead(id), 300)
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#120b22] border border-[#2d1b54] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-[#2d1b54] flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Notifications</span>
        {unread.length > 0 && (
          <button onClick={() => markNotificationsRead()} className="text-[10px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {unread.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No unread notifications</div>
        ) : unread.map(n => (
          <div key={n.id} className={cn("px-4 py-3 border-b border-[#2d1b54]/50 hover:bg-purple-600/30 transition-all duration-300", removingIds.has(n.id) && "opacity-0 -translate-x-4 max-h-0 py-0 overflow-hidden")}>
            <div className="flex items-start gap-2">
              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.type === 'success' ? 'bg-green-400' : n.type === 'error' ? 'bg-red-400' : 'bg-[#9d4edd]')} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold">{n.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{n.message}</p>
                <p className="text-gray-600 text-[10px] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleMarkRead(n.id)} className="text-[#9d4edd] hover:text-[#c77dff] p-1 rounded-lg hover:bg-[#9d4edd]/10 transition-colors flex-shrink-0" title="Mark as read">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Link href="/profile?tab=notifications" onClick={onClose}
        className="block px-4 py-2.5 border-t border-[#2d1b54] text-center text-[#9d4edd] text-xs font-semibold hover:bg-purple-600/20 transition-colors">
        View all notifications
      </Link>
    </div>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const { theme, setTheme } = useTheme()
  const [isSpinning, setIsSpinning] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const spinningTargetRef = useRef<string | null>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const collectionsRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, notifications, unreadCount, markNotificationsRead, markNotificationRead } = useUser()

  // Stop spinning once the route actually changes to the target
  useEffect(() => {
    if (spinningTargetRef.current && pathname.includes(spinningTargetRef.current)) {
      setIsSpinning(false)
      spinningTargetRef.current = null
    }
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Fetch collections
    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/admin/collections")
        const data = await response.json()
        if (data.collections) {
          setCollections(data.collections.sort((a: Collection, b: Collection) => a.order - b.order))
        }
      } catch (error) {
        console.error("Error fetching collections:", error)
      }
    }
    fetchCollections()
    // Pre-warm the games cache on mount so search is instant when popup opens
    prefetchGames()
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false)
      }
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setIsCollectionsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsGenreOpen(false)
        setIsCollectionsOpen(false)
        setIsSearchPopupOpen(false)
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setIsSearchPopupOpen(false)
      setSearchResults([])
    }
  }

  // Cache all games once for instant in-memory search
  const allGamesRef = useRef<SearchResult[]>([])
  const gamesCachedRef = useRef(false)

  async function prefetchGames() {
    if (gamesCachedRef.current) return
    try {
      const res = await fetch("/api/items?limit=1000")
      const result = await res.json()
      if (result.success && result.data) {
        allGamesRef.current = result.data
        gamesCachedRef.current = true
      }
    } catch {}
  }

  const handleSearchInput = (value: string) => {
      setSearchQuery(value)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

      const term = value.trim().toLowerCase()
      if (!term) { setSearchResults([]); return }

      const words = term.split(/\s+/).filter(w => w.length > 0)
      const results = allGamesRef.current
        .map((item: SearchResult) => {
          const title = item.title.toLowerCase()
          const titleWords = title.split(/[\s\-_:()]+/).filter(w => w.length > 0)
          let score = 0

          if (title === term) return { ...item, score: 100000 }
          if (title.startsWith(term)) score += 50000
          if (title.includes(term)) score += 25000

          let lastIdx = -1; let inOrder = true
          for (const w of words) {
            const i = title.indexOf(w, lastIdx + 1)
            if (i === -1) { inOrder = false; break }
            lastIdx = i
          }
          if (inOrder && words.length > 1) score += 10000

          for (let i = 0; i < words.length; i++) {
            for (let j = 0; j < titleWords.length; j++) {
              if (titleWords[j] === words[i]) score += i === 0 && j === 0 ? 5000 : 2000
              else if (titleWords[j].startsWith(words[i])) score += 1000
              else if (titleWords[j].includes(words[i])) score += 500
            }
          }

          if (words.length === 1) {
            const chars = words[0].split("")
            if (titleWords.length >= chars.length) {
              const matches = chars.filter((c: string, i: number) => titleWords[i]?.[0] === c).length
              if (matches === chars.length) score += 8000
              else if (matches >= chars.length * 0.7) score += 3000
            }
          }

          if (score < 1000) {
            for (const sw of words) {
              for (const tw of titleWords) {
                const dist = getLevenshteinDistance(sw, tw)
                const sim = 1 - dist / Math.max(sw.length, tw.length)
                if (sim >= 0.7) score += Math.floor(sim * 800)
              }
            }
          }

          return { ...item, score }
        })
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 8)

      setSearchResults(results)
    }

    // Levenshtein distance algorithm for typo tolerance
    const getLevenshteinDistance = (str1: string, str2: string): number => {
      const len1 = str1.length
      const len2 = str2.length
      const matrix: number[][] = []

      for (let i = 0; i <= len1; i++) {
        matrix[i] = [i]
      }

      for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j
      }

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            )
          }
        }
      }

      return matrix[len1][len2]
    }

  const toggleTheme = () => {
    const newTheme = (!theme || theme === "dark") ? "light" : "dark"
    setTheme(newTheme)
  }

  const handleRandomGame = async () => {
    setIsSpinning(true)
    try {
      // Use cached games if available — much faster
      let games = allGamesRef.current
      if (!games.length) {
        const response = await fetch("/api/items?limit=1000")
        const result = await response.json()
        if (result.success && result.data) {
          games = result.data
          allGamesRef.current = games
          gamesCachedRef.current = true
        }
      }
      if (games.length > 0) {
        const randomIndex = Math.floor(Math.random() * games.length)
        const gameId = games[randomIndex].id
        spinningTargetRef.current = `/game/${gameId}`
        router.push(`/game/${gameId}`)
      } else {
        setIsSpinning(false)
      }
    } catch (error) {
      setIsSpinning(false)
      console.error("Error fetching random game:", error)
    }
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-[#090514] dark:bg-[#090514]/95 backdrop-blur-md shadow-lg"
            : "bg-[#090514] dark:bg-[#090514]/80 backdrop-blur-sm"
        )}
      >
      <div className="max-w-full mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full ring-4 ring-[#9d4edd] ring-offset-2 ring-offset-[#090514]">
                <SafeImage src="/bull-logo.png" alt="Bull" width={40} height={40} className="w-full h-full object-cover rounded-full" />
              </div>
              <SafeImage src="/logo.png" alt="BullzGamez" width={300} height={300} className="h-10 w-auto" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              if (item.isDropdown) {
                if (item.name === "Genre") {
                  return (
                    <div key={item.name} ref={genreRef} className="relative">
                      <button
                        onClick={() => setIsGenreOpen(!isGenreOpen)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isGenreOpen ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30"
                        )}
                      >
                        {item.label}
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isGenreOpen && "rotate-180")} />
                      </button>
                      {isGenreOpen && (
                        <div className="absolute top-full left-0 mt-1 w-[720px] rounded-xl shadow-2xl shadow-black/50 p-6 animate-in fade-in-0 slide-in-from-top-2 duration-200 z-50"
                          style={{
                            background: 'linear-gradient(135deg, #0f0720 0%, #120b22 40%, #1a0d2e 70%, #0d0619 100%)',
                            border: '1px solid rgba(157, 78, 221, 0.3)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.7), 0 0 40px rgba(157,78,221,0.08), inset 0 1px 0 rgba(157,78,221,0.15)'
                          }}
                        >
                          {/* Subtle glow orb top-right */}
                          <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle at top right, rgba(157,78,221,0.12) 0%, transparent 70%)' }} />

                          {/* Header */}
                          <div className="mb-6 relative">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-1"
                              style={{ background: 'linear-gradient(90deg, #9d4edd, #c77dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              Featured Genres
                            </h3>
                            <p className="text-gray-500 text-xs">Curated categories from your navigation menu.</p>
                          </div>

                          {/* Genres Grid */}
                          <div className="grid grid-cols-3 gap-6 relative">
                            {Object.entries(genresByLetter).sort(([a], [b]) => a.localeCompare(b)).map(([letter, letterGenres]) => (
                              <div key={letter}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-lg font-bold"
                                    style={{ background: 'linear-gradient(135deg, #9d4edd, #c77dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {letter}
                                  </span>
                                  <span className="text-gray-600 text-xs uppercase tracking-wider">Genres</span>
                                </div>
                                <div className="space-y-1.5">
                                  {letterGenres.map((genre) => (
                                    <Link
                                      key={genre.name}
                                      href={genre.href}
                                      onClick={() => setIsGenreOpen(false)}
                                      className="block text-gray-400 hover:text-white text-sm transition-all duration-150 py-0.5 px-2 rounded-lg hover:bg-[#9d4edd]/15 hover:translate-x-0.5"
                                    >
                                      {genre.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="mt-6 pt-4 relative" style={{ borderTop: '1px solid rgba(157,78,221,0.2)' }}>
                            <Link
                              href="/genres"
                              onClick={() => setIsGenreOpen(false)}
                              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
                              style={{ background: 'linear-gradient(90deg, #9d4edd, #c77dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                            >
                              Show All Genres
                              <svg className="w-4 h-4 text-[#9d4edd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                if (item.name === "Collections") {
                  return (
                    <div key={item.name} ref={collectionsRef} className="relative">
                      <button
                        onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isCollectionsOpen ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30"
                        )}
                      >
                        {item.label}
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isCollectionsOpen && "rotate-180")} />
                      </button>
                      {isCollectionsOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-[#120b22] border border-[#2d1b54] rounded-xl shadow-xl shadow-black/30 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          <div className="max-h-80 overflow-y-auto">
                            {collections.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No collections yet
                              </div>
                            ) : (
                              collections.map((collection) => (
                                <Link
                                  key={collection.id}
                                  href={`/collections/${collection.id}`}
                                  onClick={() => setIsCollectionsOpen(false)}
                                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30 transition-colors"
                                >
                                  {collection.name}
                                </Link>
                              ))
                            )}
                            <div className="border-t border-[#2d1b54] mt-2 pt-2">
                              <Link
                                href="/collections"
                                onClick={() => setIsCollectionsOpen(false)}
                                className="block px-4 py-2 text-sm text-[#9d4edd] hover:bg-purple-600/30 transition-colors font-medium"
                              >
                                View All Collections →
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
              }
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href!)
                      ? "text-[#9d4edd] bg-[#9d4edd]/10"
                      : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <button
                onClick={() => { setIsSearchPopupOpen(true); prefetchGames() }}
                className="p-2 text-gray-400 hover:text-[#9d4edd] transition-colors rounded-full hover:bg-purple-600/30"
                title="Search Games"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            <div className="relative group">
              <button
                onClick={handleRandomGame}
                disabled={isSpinning}
                className={cn(
                  "relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-500",
                  "hover:scale-110 active:scale-95",
                  isSpinning ? "scale-110" : ""
                )}
              >
                {/* Main colorful wheel */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-700",
                    isSpinning ? "animate-[spin_1.5s_linear_infinite]" : "animate-[spin_20s_linear_infinite]"
                  )}
                  style={{ 
                    background: 'conic-gradient(from 0deg, #ff0055 0deg 60deg, #ff8800 60deg 120deg, #ffdd00 120deg 180deg, #00ff88 180deg 240deg, #00aaff 240deg 300deg, #8800ff 300deg 360deg)',
                    boxShadow: isSpinning 
                      ? '0 0 40px rgba(157,78,221,0.9), 0 0 80px rgba(157,78,221,0.5), inset 0 0 30px rgba(255,255,255,0.3)' 
                      : '0 4px 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(255,255,255,0.1)'
                  }}
                />

                {/* Bright lights effect */}
                <div className={cn(
                  "absolute inset-0 rounded-full transition-all duration-500",
                  isSpinning ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
                  boxShadow: '0 0 40px rgba(255,255,255,0.6), inset 0 0 30px rgba(255,255,255,0.4)'
                }}
                />

                {/* Center circle */}
                <div className={cn(
                  "absolute inset-[4px] bg-[#0a0a1a] rounded-full z-10 flex items-center justify-center border-2 transition-all duration-300 overflow-hidden",
                  isSpinning 
                    ? "border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.5),inset_0_0_20px_rgba(157,78,221,0.3)]" 
                    : "border-white/20 group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(157,78,221,0.4)]"
                )}>
                  {/* Lottie Dice Animation */}
                  <div 
                    className={cn(
                      "relative z-20 transition-all duration-300",
                      isSpinning ? "scale-110" : "scale-90 group-hover:scale-100"
                    )}
                    style={{
                      width: '28px',
                      height: '28px',
                      filter: isSpinning 
                        ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8)) brightness(1.2)' 
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    <Lottie
                      animationData={diceAnimation}
                      loop={isSpinning}
                      autoplay={isSpinning}
                      initialSegment={isSpinning ? undefined : [diceAnimation.op - 2, diceAnimation.op - 1]}
                      style={{
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </div>
                </div>

                {/* Outer glow ring */}
                <div className={cn(
                  "absolute inset-[-6px] rounded-full transition-all duration-500 pointer-events-none blur-lg",
                  isSpinning 
                    ? "opacity-100 animate-pulse" 
                    : "opacity-0 group-hover:opacity-80"
                )}
                style={{
                  background: 'conic-gradient(from 0deg, #ff0055, #ff8800, #ffdd00, #00ff88, #00aaff, #8800ff, #ff0055)',
                  zIndex: -1
                }}
                />

                {/* Spinning glow pulses */}
                {isSpinning && (
                  <>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: 'radial-gradient(circle, rgba(157,78,221,0.9) 0%, transparent 70%)' }} />
                    <div className="absolute inset-[-10px] rounded-full animate-pulse opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 60%)' }} />
                    <div className="absolute inset-[-15px] rounded-full animate-ping opacity-20" style={{ 
                      background: 'conic-gradient(from 0deg, rgba(255,0,85,0.5), rgba(255,136,0,0.5), rgba(255,221,0,0.5), rgba(0,255,136,0.5), rgba(0,170,255,0.5), rgba(136,0,255,0.5))',
                      animationDuration: '2s'
                    }} />
                  </>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#120b22]/95 backdrop-blur-sm border border-[#9d4edd]/30 rounded-lg text-xs text-white font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                🎲 Random Game
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 transition-colors rounded-full hidden sm:flex overflow-hidden text-gray-400 hover:text-[#9d4edd] hover:bg-[#9d4edd]/10 dark:hover:bg-[#9d4edd]/10"
              title={!mounted ? "Loading..." : (!theme || theme === "dark") ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Sun className={`absolute h-5 w-5 transition-all duration-500 ease-in-out ${(!theme || theme === "dark") ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
                  <Moon className={`absolute h-5 w-5 transition-all duration-500 ease-in-out ${(!theme || theme === "dark") ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`} />
                </div>
              )}
            </button>

            {user ? (
              <>
                {/* Become a Creator / Verifying / Creator Mode button */}
                {!user.is_creator && user.subscription_status !== 'pending' && (
                  <Link href="/subscribe" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 border"
                    style={{ background: "linear-gradient(135deg, rgba(157,78,221,0.2), rgba(199,125,255,0.1))", borderColor: "rgba(157,78,221,0.5)", color: "#c77dff" }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden md:block">Become a Creator</span>
                  </Link>
                )}
                {!user.is_creator && user.subscription_status === 'pending' && (
                  <Link href="/subscribe" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border animate-pulse"
                    style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))", borderColor: "rgba(245,158,11,0.5)", color: "#fbbf24" }}>
                    <span className="w-3.5 h-3.5 text-center">⏳</span>
                    <span className="hidden md:block">Verifying...</span>
                  </Link>
                )}
                {user.is_creator && (
                  <Link href="/creator" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 border"
                    style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))", borderColor: "rgba(245,158,11,0.5)", color: "#fbbf24" }}>
                    <Crown className="w-3.5 h-3.5" />
                    <span className="hidden md:block">Creator Mode</span>
                  </Link>
                )}

                {/* Notification Bell */}
                <div ref={notifRef} className="relative">
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-gray-400 hover:text-[#9d4edd] transition-colors rounded-full hover:bg-purple-600/30">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <NotifDropdown notifications={notifications} markNotificationRead={markNotificationRead} markNotificationsRead={markNotificationsRead} onClose={() => setIsNotifOpen(false)} />
                  )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-purple-600/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#7b2cbf] flex items-center justify-center text-white font-bold text-sm ring-2 ring-[#9d4edd]/40 overflow-hidden">
                      {user.avatar ? <SafeImage src={user.avatar} alt="" fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#120b22] border border-[#2d1b54] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[#2d1b54]">
                        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-gray-500 text-xs truncate">@{user.username}</p>
                        {user.subscription_plan !== 'free' && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(157,78,221,0.2)", color: "#c77dff" }}>
                            <Crown className="w-2.5 h-2.5" /> {user.subscription_plan}
                          </span>
                        )}
                      </div>
                      {[
                        { href: `/profile`, icon: User, label: "My Profile" },
                        { href: `/profile?tab=notifications`, icon: Bell, label: "Notifications" },
                        { href: `/profile?tab=history`, icon: History, label: "Watch History" },
                        { href: `/profile?tab=favourites`, icon: Star, label: "Favourites" },
                        { href: `/subscribe`, icon: Crown, label: "Subscription" },
                        { href: `/profile?tab=settings`, icon: Settings, label: "Settings" },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30 transition-colors">
                          <item.icon className="w-4 h-4 text-gray-500" />
                          {item.label}
                          <ChevronRight className="w-3 h-3 ml-auto text-gray-600" />
                        </Link>
                      ))}
                      {!user.is_creator && (
                        <Link href="/subscribe" onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors border-t border-[#2d1b54]"
                          style={{ color: "#c77dff" }}>
                          <Sparkles className="w-4 h-4" />
                          Become a Creator
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </Link>
                      )}
                      {user.is_creator && (
                        <Link href="/creator" onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors border-t border-[#2d1b54]"
                          style={{ color: "#fbbf24" }}>
                          <Crown className="w-4 h-4" />
                          Creator Mode
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </Link>
                      )}
                      <button onClick={() => { logout(); setIsProfileOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-[#2d1b54]">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30 transition-colors">
                  <LogIn className="w-4 h-4" />
                  <span>Log in</span>
                </Link>
                <Link href="/signup" className="hidden sm:flex items-center px-3 py-1.5 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-medium rounded-lg transition-colors">
                  Sign up
                </Link>
              </>
            )}

            <Button variant="ghost" size="sm" className="lg:hidden text-white hover:text-[#9d4edd] hover:bg-purple-600/30" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#2d1b54] animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              <Link
                href="/games"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/games") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                All Games
              </Link>
              <Link
                href="/top"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/top") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Top
              </Link>
              <Link
                href="/trending"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/trending") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Trending
              </Link>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Genres</div>
              <div className="grid grid-cols-2 gap-1 px-4">
                {genres.slice(0, 8).map((genre) => (
                  <Link
                    key={genre.name}
                    href={genre.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30 rounded-lg transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/genres"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-sm text-[#9d4edd] hover:bg-purple-600/30 rounded-lg"
              >
                All Genres →
              </Link>
              <Link
                href="/updates"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/updates") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Recent Updates
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/collections") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Collections
              </Link>
              <Link
                href="/donate"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/donate") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Donate
              </Link>
              <Link
                href="/publishers"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/publishers") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Publishers
              </Link>
              <Link
                href="/request"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/request") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30")}
              >
                Request
              </Link>

              <div className="border-t border-[#2d1b54] mt-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-[#9d4edd] hover:bg-purple-100 dark:hover:bg-purple-600/30 rounded-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-4 px-4 py-2.5 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-medium rounded-lg"
                >
                  Sign up
                </Link>
              </div>
            </nav>
            <form onSubmit={handleSearch} className="mt-3 px-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a103c] border-[#2d1b54] text-white placeholder-gray-500 focus:border-[#9d4edd] rounded-full pl-4 pr-10 h-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#9d4edd] hover:bg-[#7b2cbf] rounded-full p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>

    {/* Search Popup Modal */}
    {isSearchPopupOpen && (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSearchPopupOpen(false)}
        />
        
        {/* Modal */}
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95vw] max-w-3xl max-h-[85vh] bg-[#120b22] border-2 border-[#9d4edd]/30 rounded-2xl shadow-2xl shadow-[#9d4edd]/20 animate-in zoom-in-95 duration-200"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2d1b54]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-[#9d4edd]" />
                Search Games
              </h2>
              <button
                onClick={() => setIsSearchPopupOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#2d1b54]">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for games, genres, or series..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all duration-200"
                  />
                </div>
                <p className="mt-2 text-gray-500 text-xs">Start typing to see instant results</p>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchQuery.trim().length > 0 && searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-[#9d4edd] text-xs font-bold uppercase tracking-wider mb-3">Search Results</h3>
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={`/game/${result.id}`}
                      onClick={() => {
                        setIsSearchPopupOpen(false)
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="flex items-center gap-3 p-3 bg-[#1a103c]/50 border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 hover:bg-[#1a103c] transition-all duration-200 group"
                    >
                      <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-200">
                        <SafeImage src={result.image || "/placeholder.svg"} alt={result.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{result.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-blue-500/20 text-blue-400">
                            PC
                          </span>
                          <span className="text-gray-500 text-xs">{result.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full mt-3 py-2.5 px-4 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    View All Results
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9d4edd]/10 flex items-center justify-center">
                    <Search className="w-8 h-8 text-[#9d4edd]/50" />
                  </div>
                  <p className="text-gray-400 text-sm">No games found matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-3">Trending Genres</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {genres.slice(0, 8).map(g => (
                        <Link 
                          key={g.name} 
                          href={g.href} 
                          onClick={() => setIsSearchPopupOpen(false)} 
                          className="px-3 py-2 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg text-white hover:text-[#9d4edd] hover:border-[#9d4edd]/50 transition-all text-sm"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-3">Quick Links</h4>
                    <div className="flex flex-col gap-2">
                      <Link href="/top" onClick={() => setIsSearchPopupOpen(false)} className="px-3 py-2 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg text-white hover:text-[#9d4edd] hover:border-[#9d4edd]/50 transition-all text-sm">Top Games</Link>
                      <Link href="/updates" onClick={() => setIsSearchPopupOpen(false)} className="px-3 py-2 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg text-white hover:text-[#9d4edd] hover:border-[#9d4edd]/50 transition-all text-sm">New Updates</Link>
                      <Link href="/collections" onClick={() => setIsSearchPopupOpen(false)} className="px-3 py-2 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg text-white hover:text-[#9d4edd] hover:border-[#9d4edd]/50 transition-all text-sm">Epic Collections</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}
    </>
  )
}
