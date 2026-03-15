"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Search, Menu, X, ChevronDown, Sun, Moon, LogIn,
  Heart, MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Lottie from "lottie-react"
import diceAnimation from "@/Dice roll.json"

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
  { name: "More", label: "More", isDropdown: true },
]

const moreMenuItems = [
  { href: "/blog", label: "Blog" },
  { href: "/leaderboard", label: "Leaderboard" },
]

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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [isSpinning, setIsSpinning] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const collectionsRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()

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
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("bullzgamez-theme") as "dark" | "light" | null
    if (savedTheme === "light") {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false)
      }
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setIsCollectionsOpen(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false)
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
        setIsMoreOpen(false)
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

  const handleSearchInput = (value: string) => {
      setSearchQuery(value)

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      if (value.trim().length >= 2) {
        // Reduced debounce to 150ms for faster response
        searchTimeoutRef.current = setTimeout(async () => {
          try {
            // Fetch more results for better filtering
            const response = await fetch(`/api/items?q=${encodeURIComponent(value.trim())}&limit=100`)
            const result = await response.json()

            if (result.success && result.data) {
              const searchTerm = value.trim().toLowerCase()
              const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0)

              // Ultra-intelligent filtering with YouTube-like algorithm
              const filteredResults = result.data
                .map((item: SearchResult) => {
                  const title = item.title.toLowerCase()
                  const titleWords = title.split(/[\s\-_:()]+/).filter((w: string) => w.length > 0)
                  let score = 0

                  // === LEVEL 1: EXACT MATCHES (Highest Priority) ===

                  // Perfect exact match
                  if (title === searchTerm) {
                    return { ...item, score: 100000 }
                  }

                  // Title starts with exact search term
                  if (title.startsWith(searchTerm)) {
                    score += 50000
                  }

                  // Title contains exact search term as phrase
                  if (title.includes(searchTerm)) {
                    score += 25000
                  }

                  // === LEVEL 2: WORD-LEVEL MATCHING ===

                  // All search words appear in exact order
                  let allWordsInOrder = true
                  let lastIndex = -1
                  for (const word of searchWords) {
                    const index = title.indexOf(word, lastIndex + 1)
                    if (index === -1) {
                      allWordsInOrder = false
                      break
                    }
                    lastIndex = index
                  }
                  if (allWordsInOrder && searchWords.length > 1) {
                    score += 10000
                  }

                  // Check each search word against title words
                  let exactWordMatches = 0
                  let startsWithMatches = 0
                  let containsMatches = 0

                  for (let i = 0; i < searchWords.length; i++) {
                    const searchWord = searchWords[i]

                    for (let j = 0; j < titleWords.length; j++) {
                      const titleWord = titleWords[j]

                      // Exact word match
                      if (titleWord === searchWord) {
                        exactWordMatches++
                        // Bonus if it's the first word
                        if (i === 0 && j === 0) {
                          score += 5000
                        } else {
                          score += 2000
                        }
                      }
                      // Word starts with search word
                      else if (titleWord.startsWith(searchWord)) {
                        startsWithMatches++
                        score += 1000
                      }
                      // Word contains search word
                      else if (titleWord.includes(searchWord)) {
                        containsMatches++
                        score += 500
                      }
                    }
                  }

                  // === LEVEL 3: ACRONYM MATCHING (like "gta" for "Grand Theft Auto") ===

                  if (searchWords.length === 1 && searchWords[0].length >= 2) {
                    const searchChars = searchWords[0].split('')

                    // Check if search term matches first letters of title words
                    if (titleWords.length >= searchChars.length) {
                      let matches = 0
                      for (let i = 0; i < searchChars.length && i < titleWords.length; i++) {
                        if (titleWords[i][0] === searchChars[i]) {
                          matches++
                        }
                      }
                      if (matches === searchChars.length) {
                        score += 8000 + (matches * 500)
                      } else if (matches >= searchChars.length * 0.7) {
                        score += 3000 + (matches * 300)
                      }
                    }
                  }

                  // === LEVEL 4: FUZZY MATCHING & TYPO TOLERANCE (Only if no good matches yet) ===

                  if (score < 1000) {
                    for (const searchWord of searchWords) {
                      for (const titleWord of titleWords) {
                        // Levenshtein distance for typo tolerance
                        const distance = getLevenshteinDistance(searchWord, titleWord)
                        const maxLen = Math.max(searchWord.length, titleWord.length)
                      const similarity = 1 - (distance / maxLen)

                      // If 70% similar, consider it a match (typo tolerance)
                      if (similarity >= 0.7) {
                        score += Math.floor(similarity * 800)
                      }

                      // Character overlap scoring
                      let charMatches = 0
                      for (let i = 0; i < Math.min(searchWord.length, titleWord.length); i++) {
                        if (searchWord[i] === titleWord[i]) {
                          charMatches++
                        }
                      }
                      if (charMatches >= searchWord.length * 0.6) {
                        score += charMatches * 50
                      }
                    }
                  }
                }

                  // === LEVEL 5: PARTIAL WORD MATCHING ===

                  // Check if search term is part of any compound word
                  for (const titleWord of titleWords) {
                    for (const searchWord of searchWords) {
                      if (titleWord.length > searchWord.length && titleWord.includes(searchWord)) {
                        score += 300
                      }
                    }
                  }

                  // === LEVEL 6: CONTEXTUAL BONUSES ===

                  // Bonus for matching multiple words
                  if (exactWordMatches > 1) {
                    score += exactWordMatches * 1000
                  }

                  // Bonus for matching percentage of search words
                  const matchPercentage = (exactWordMatches + startsWithMatches) / searchWords.length
                  if (matchPercentage >= 0.5) {
                    score += Math.floor(matchPercentage * 2000)
                  }

                  // Penalty for very long titles (prefer concise matches)
                  if (titleWords.length > 10) {
                    score = Math.floor(score * 0.9)
                  }

                  return { ...item, score }
                })
                .filter((item: SearchResult & { score: number }) => item.score > 0)
                .sort((a: SearchResult & { score: number }, b: SearchResult & { score: number }) => b.score - a.score)
                .slice(0, 5)

              setSearchResults(filteredResults)
            }
          } catch (error) {
            console.error("Search error:", error)
          }
        }, 50) // Ultra-fast: 50ms for real-time feel
      } else {
        setSearchResults([])
      }
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
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("bullzgamez-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handleRandomGame = async () => {
    setIsSpinning(true)
    try {
      const response = await fetch("/api/items")
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.data.length)
        setTimeout(() => {
          setIsSpinning(false)
          router.push(`/game/${result.data[randomIndex].id}`)
        }, 600)
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
            ? "bg-[#090514]/95 backdrop-blur-md shadow-lg shadow-black/20"
            : "bg-[#090514]/80 backdrop-blur-sm"
        )}
      >
      <div className="max-w-full mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <Link href="/" className="group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-[#9d4edd]/50 shadow-[0_0_15px_rgba(157,78,221,0.5)] group-hover:scale-110 transition-transform duration-200">
                <img src="/bull-logo.png" alt="BullzGamez Logo" className="w-full h-full object-cover rounded-full" />
              </div>
            </Link>
            <Link href="/" className="group">
              <span className="text-xl hidden sm:block font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] via-[#c77dff] to-[#00bcd4] group-hover:from-[#00bcd4] group-hover:via-[#c77dff] group-hover:to-[#9d4edd] transition-all duration-500">
                BULLZGAMEZ
              </span>
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
                          isGenreOpen ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5"
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
                          isCollectionsOpen ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5"
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
                                  className="block px-4 py-2 text-sm text-gray-300 hover:text-[#9d4edd] hover:bg-white/5 transition-colors"
                                >
                                  {collection.name}
                                </Link>
                              ))
                            )}
                            <div className="border-t border-[#2d1b54] mt-2 pt-2">
                              <Link
                                href="/collections"
                                onClick={() => setIsCollectionsOpen(false)}
                                className="block px-4 py-2 text-sm text-[#9d4edd] hover:bg-white/5 transition-colors font-medium"
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
                if (item.name === "More") {
                  return (
                    <div key={item.name} ref={moreRef} className="relative">
                      <button
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isMoreOpen ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isMoreOpen && "rotate-180")} />
                      </button>
                      {isMoreOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-[#120b22] border border-[#2d1b54] rounded-xl shadow-xl shadow-black/30 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          {moreMenuItems.map((menuItem) => (
                            <Link
                              key={menuItem.href}
                              href={menuItem.href}
                              onClick={() => setIsMoreOpen(false)}
                              className={cn(
                                "block px-4 py-2 text-sm transition-colors",
                                isActive(menuItem.href) ? "text-[#9d4edd] bg-[#9d4edd]/10" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5"
                              )}
                            >
                              {menuItem.label}
                            </Link>
                          ))}
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
                      : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5"
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
                onClick={() => setIsSearchPopupOpen(true)}
                className="p-2 text-gray-400 hover:text-[#9d4edd] transition-colors rounded-full hover:bg-white/5"
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
              className="p-2 text-gray-400 hover:text-[#9d4edd] transition-colors rounded-full hover:bg-white/5 hidden sm:flex overflow-hidden"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Sun className={`absolute h-5 w-5 transition-all duration-500 ease-in-out ${theme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
                <Moon className={`absolute h-5 w-5 transition-all duration-500 ease-in-out ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`} />
              </div>
            </button>

            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Log in</span>
            </Link>

            <Link
              href="/signup"
              className="hidden sm:flex items-center px-3 py-1.5 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign up
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:text-[#9d4edd] hover:bg-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
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
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/games") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                All Games
              </Link>
              <Link
                href="/top"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/top") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Top
              </Link>
              <Link
                href="/trending"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/trending") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
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
                    className="px-3 py-2 text-sm text-gray-300 hover:text-[#9d4edd] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/genres"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-sm text-[#9d4edd] hover:bg-white/5 rounded-lg"
              >
                All Genres →
              </Link>
              <Link
                href="/updates"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/updates") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Recent Updates
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/collections") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Collections
              </Link>
              <Link
                href="/donate"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/donate") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Donate
              </Link>
              <Link
                href="/publishers"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/publishers") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Publishers
              </Link>
              <Link
                href="/request"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/request") ? "text-[#9d4edd] bg-[#9d4edd]/10 font-semibold" : "text-gray-300 hover:text-[#9d4edd] hover:bg-white/5")}
              >
                Request
              </Link>

              <div className="border-t border-[#2d1b54] mt-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-[#9d4edd] hover:bg-white/5 rounded-lg"
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
                <p className="mt-2 text-gray-500 text-xs">Type at least 2 characters to see suggestions</p>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchQuery.trim().length >= 2 && searchResults.length > 0 ? (
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
                        <img src={result.image || "/placeholder.svg"} alt={result.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{result.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                            result.category === "Android Games" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                          )}>
                            {result.category === "Android Games" ? "ANDROID" : "PC"}
                          </span>
                          <span className="text-gray-500 text-xs">{result.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {searchQuery.trim().length >= 2 && (
                    <button
                      onClick={handleSearch}
                      className="w-full mt-3 py-2.5 px-4 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      View All Results
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : searchQuery.trim().length >= 2 && searchQuery.length >= 2 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9d4edd]/10 flex items-center justify-center">
                    <Search className="w-8 h-8 text-[#9d4edd]/50" />
                  </div>
                  <p className="text-gray-400 text-sm">No games found matching "{searchQuery}"</p>
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
