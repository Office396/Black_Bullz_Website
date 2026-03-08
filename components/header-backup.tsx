"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Search, Menu, X, ChevronDown, Sun, Moon, LogIn,
  Heart, MoreHorizontal, Shuffle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const genres = [
  { name: "Action", href: "/genre/action" },
  { name: "Adventure", href: "/genre/adventure" },
  { name: "Anime", href: "/genre/anime" },
  { name: "Classic", href: "/genre/classic" },
  { name: "Fighting", href: "/genre/fighting" },
  { name: "Horror", href: "/genre/horror" },
  { name: "Indie", href: "/genre/indie" },
  { name: "Multiplayer", href: "/genre/multiplayer" },
  { name: "Open World", href: "/genre/open-world" },
  { name: "Puzzle", href: "/genre/puzzle" },
  { name: "Racing", href: "/genre/racing" },
  { name: "RPG", href: "/genre/rpg" },
  { name: "Simulation", href: "/genre/simulation" },
  { name: "Sports", href: "/genre/sports" },
  { name: "Survival", href: "/genre/survival" },
  { name: "VR", href: "/genre/vr" },
]

const mainNavItems = [
  { href: "/games", label: "All Games" },
  { href: "/top", label: "Top" },
  { href: "/trending", label: "Trending" },
  { name: "Genre", label: "Genre", isDropdown: true },
  { href: "/updates", label: "Recent Updates" },
  { href: "/collections", label: "Collections" },
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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [isSpinning, setIsSpinning] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
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
        setIsMoreOpen(false)
        setIsSearchPopupOpen(false)
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
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

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value)
    if (value.trim().length >= 2) {
      try {
        const response = await fetch(`/api/items?q=${encodeURIComponent(value.trim())}&limit=5`)
        const result = await response.json()
        if (result.success) {
          setSearchResults(result.data)
        }
      } catch (error) {
        console.error("Search error:", error)
      }
    } else {
      setSearchResults([])
    }
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
                        <div className="absolute top-full left-0 mt-1 w-56 bg-[#120b22] border border-[#2d1b54] rounded-xl shadow-xl shadow-black/30 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          <div className="max-h-80 overflow-y-auto">
                            {genres.map((genre) => (
                              <Link
                                key={genre.name}
                                href={genre.href}
                                onClick={() => setIsGenreOpen(false)}
                                className="block px-4 py-2 text-sm text-gray-300 hover:text-[#9d4edd] hover:bg-white/5 transition-colors"
                              >
                                {genre.name}
                              </Link>
                            ))}
                            <div className="border-t border-[#2d1b54] mt-2 pt-2">
                              <Link
                                href="/genres"
                                onClick={() => setIsGenreOpen(false)}
                                className="block px-4 py-2 text-sm text-[#9d4edd] hover:bg-white/5 transition-colors font-medium"
                              >
                                Show All Genres →
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
                {/* Outer rotating ring with particles */}
                <div className={cn(
                  "absolute inset-0 rounded-full transition-all duration-700",
                  isSpinning ? "animate-[spin_2s_linear_infinite]" : "group-hover:rotate-180"
                )}>
                  {/* Particle dots around the wheel */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <div
                      key={angle}
                      className={cn(
                        "absolute w-1.5 h-1.5 rounded-full transition-all duration-500",
                        isSpinning ? "animate-pulse" : "group-hover:scale-150"
                      )}
                      style={{
                        background: ['#ff0055', '#ffaa00', '#00ffaa', '#00aaff', '#aa00ff', '#ff0055', '#ffaa00', '#00ffaa'][i],
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-26px)`,
                        boxShadow: isSpinning ? `0 0 10px ${['#ff0055', '#ffaa00', '#00ffaa', '#00aaff', '#aa00ff', '#ff0055', '#ffaa00', '#00ffaa'][i]}` : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Main wheel with gradient segments */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-700 shadow-lg",
                    isSpinning ? "animate-[spin_0.8s_ease-in-out_infinite]" : "group-hover:rotate-[360deg]"
                  )}
                  style={{ 
                    background: 'conic-gradient(from 0deg, #ff0055 0deg 60deg, #ffaa00 60deg 120deg, #00ffaa 120deg 180deg, #00aaff 180deg 240deg, #aa00ff 240deg 300deg, #ff0055 300deg 360deg)',
                    boxShadow: isSpinning 
                      ? '0 0 30px rgba(157,78,221,0.8), 0 0 60px rgba(157,78,221,0.4), inset 0 0 20px rgba(255,255,255,0.1)' 
                      : '0 4px 15px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.05)'
                  }}
                >
                  {/* Wheel segment dividers with glow */}
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <div
                      key={angle}
                      className={cn(
                        "absolute top-1/2 left-1/2 w-[2px] h-[50%] origin-top transition-all duration-300",
                        isSpinning ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/40 group-hover:bg-white/80"
                      )}
                      style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
                    />
                  ))}
                </div>

                {/* Inner glow ring */}
                <div className={cn(
                  "absolute inset-[2px] rounded-full transition-all duration-500",
                  isSpinning 
                    ? "bg-gradient-to-br from-[#9d4edd]/30 to-[#7b2cbf]/30 animate-pulse" 
                    : "bg-gradient-to-br from-[#090514]/90 to-[#120b22]/90 group-hover:from-[#9d4edd]/20 group-hover:to-[#7b2cbf]/20"
                )} />

                {/* Center circle with icon */}
                <div className="absolute inset-[4px] bg-[#090514] rounded-full z-10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  {/* Dice/Shuffle icon with 3D effect */}
                  <div className={cn(
                    "relative z-20 transition-all duration-700",
                    isSpinning 
                      ? "animate-[spin_0.8s_ease-in-out_infinite] scale-110" 
                      : "group-hover:rotate-[720deg] group-hover:scale-125"
                  )}
                  style={{
                    filter: isSpinning 
                      ? 'drop-shadow(0 0 8px rgba(157,78,221,1)) drop-shadow(0 0 12px rgba(157,78,221,0.5))' 
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}>
                    <svg className={cn(
                      "w-5 h-5 transition-all duration-500",
                      isSpinning ? "text-white" : "text-[#9d4edd] group-hover:text-white"
                    )} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/>
                    </svg>
                  </div>
                </div>

                {/* Top pointer/arrow with glow */}
                <div className={cn(
                  "absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 transition-all duration-300",
                  isSpinning ? "animate-bounce" : "group-hover:scale-110"
                )}>
                  <div 
                    className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-white" 
                    style={{
                      filter: isSpinning 
                        ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(157,78,221,0.6))' 
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  />
                </div>

                {/* Spinning glow effect */}
                {isSpinning && (
                  <>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: 'radial-gradient(circle, rgba(157,78,221,0.8) 0%, transparent 70%)' }} />
                    <div className="absolute inset-[-8px] rounded-full animate-pulse opacity-30" style={{ background: 'radial-gradient(circle, rgba(157,78,221,0.6) 0%, transparent 60%)' }} />
                  </>
                )}

                {/* Hover glow ring */}
                <div className={cn(
                  "absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  "bg-gradient-to-r from-[#ff0055] via-[#00ffaa] to-[#aa00ff]",
                  "blur-md"
                )} style={{ zIndex: -1 }} />
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

      {/* Search Popup Modal */}
      {isSearchPopupOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsSearchPopupOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-[30%] left-[50%] z-[9999] w-[95vw] max-w-3xl max-h-[85vh] bg-[#120b22] border-2 border-[#9d4edd]/30 rounded-2xl shadow-2xl shadow-[#9d4edd]/20 animate-in zoom-in-95 duration-200" style={{ transform: 'translate(-50%, -50%)' }}>
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
                {searchResults.length > 0 ? (
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
                ) : searchQuery.length >= 2 ? (
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
    </header>
  )
}