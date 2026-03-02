"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { 
  Search, Menu, X, ChevronDown, Sun, Moon, Globe, User, LogIn, 
  TrendingUp, Clock, FolderHeart, Heart, Building2, MessageSquarePlus,
  Gamepad2, MoreHorizontal
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
  { href: "/status", label: "Status" },
  { href: "/faq", label: "FAQ" },
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
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
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false)
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
        setShowSearchResults(false)
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
      setIsSearchOpen(false)
      setShowSearchResults(false)
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
          setShowSearchResults(true)
        }
      } catch (error) {
        console.error("Search error:", error)
      }
    } else {
      setShowSearchResults(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    document.documentElement.classList.toggle("light", newTheme === "light")
  }

  const isActive = (href: string) => pathname === href

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[#0a1628]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-[#0a1628]/80 backdrop-blur-sm"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2.5 hover:scale-105 transition-transform duration-200 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-[#00bcd4]/30">
              <img src="/bull-logo.png" alt="BlackBullz Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">
              <span className="text-[#00bcd4]">Black</span>Bullz
            </span>
          </Link>

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
                          isGenreOpen ? "text-[#00bcd4] bg-[#00bcd4]/10" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
                        )}
                      >
                        {item.label}
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isGenreOpen && "rotate-180")} />
                      </button>
                      {isGenreOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-[#0f1d32] border border-[#1e3050] rounded-xl shadow-xl shadow-black/30 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          <div className="max-h-80 overflow-y-auto">
                            {genres.map((genre) => (
                              <Link
                                key={genre.name}
                                href={genre.href}
                                onClick={() => setIsGenreOpen(false)}
                                className="block px-4 py-2 text-sm text-gray-300 hover:text-[#00bcd4] hover:bg-white/5 transition-colors"
                              >
                                {genre.name}
                              </Link>
                            ))}
                            <div className="border-t border-[#1e3050] mt-2 pt-2">
                              <Link
                                href="/genres"
                                onClick={() => setIsGenreOpen(false)}
                                className="block px-4 py-2 text-sm text-[#00bcd4] hover:bg-white/5 transition-colors font-medium"
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
                          isMoreOpen ? "text-[#00bcd4] bg-[#00bcd4]/10" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isMoreOpen && "rotate-180")} />
                      </button>
                      {isMoreOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-[#0f1d32] border border-[#1e3050] rounded-xl shadow-xl shadow-black/30 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          {moreMenuItems.map((menuItem) => (
                            <Link
                              key={menuItem.href}
                              href={menuItem.href}
                              onClick={() => setIsMoreOpen(false)}
                              className={cn(
                                "block px-4 py-2 text-sm transition-colors",
                                isActive(menuItem.href) ? "text-[#00bcd4] bg-[#00bcd4]/10" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
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
                      ? "text-[#00bcd4] bg-[#00bcd4]/10"
                      : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <div ref={searchRef} className="hidden md:flex items-center relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center relative">
                  <Input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    className="w-64 bg-[#1a2a44] border-[#1e3050] text-white placeholder-gray-500 focus:border-[#00bcd4] focus:ring-[#00bcd4]/20 rounded-full pl-4 pr-10 h-9 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setShowSearchResults(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1d32] border border-[#1e3050] rounded-xl shadow-xl shadow-black/30 py-2 z-50">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/game/${result.id}`}
                          onClick={() => {
                            setShowSearchResults(false)
                            setIsSearchOpen(false)
                            setSearchQuery("")
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                        >
                          <img src={result.image || "/placeholder.svg"} alt={result.title} className="w-10 h-14 object-cover rounded" />
                          <div>
                            <p className="text-white text-sm font-medium line-clamp-1">{result.title}</p>
                            <p className="text-gray-500 text-xs">{result.category}</p>
                          </div>
                        </Link>
                      ))}
                      <div className="border-t border-[#1e3050] mt-2 pt-2">
                        <button
                          type="submit"
                          className="w-full text-center py-2 text-sm text-[#00bcd4] hover:bg-white/5 transition-colors"
                        >
                          Search all results →
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-[#00bcd4] transition-colors rounded-full hover:bg-white/5"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-[#00bcd4] transition-colors rounded-full hover:bg-white/5 hidden sm:flex"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
              className="hidden sm:flex items-center px-3 py-1.5 bg-[#00bcd4] hover:bg-[#0097a7] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign up
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:text-[#00bcd4] hover:bg-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#1e3050] animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              <Link
                href="/games"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/games") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                All Games
              </Link>
              <Link
                href="/top"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/top") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Top
              </Link>
              <Link
                href="/trending"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/trending") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
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
                    className="px-3 py-2 text-sm text-gray-300 hover:text-[#00bcd4] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/genres"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-sm text-[#00bcd4] hover:bg-white/5 rounded-lg"
              >
                All Genres →
              </Link>
              <Link
                href="/updates"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/updates") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Recent Updates
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/collections") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Collections
              </Link>
              <Link
                href="/donate"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/donate") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Donate
              </Link>
              <Link
                href="/publishers"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/publishers") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Publishers
              </Link>
              <Link
                href="/request"
                onClick={() => setIsMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-lg transition-all duration-200", isActive("/request") ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold" : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5")}
              >
                Request
              </Link>
              
              <div className="border-t border-[#1e3050] mt-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-[#00bcd4] hover:bg-white/5 rounded-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-4 px-4 py-2.5 bg-[#00bcd4] hover:bg-[#0097a7] text-white font-medium rounded-lg"
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
                  className="w-full bg-[#1a2a44] border-[#1e3050] text-white placeholder-gray-500 focus:border-[#00bcd4] rounded-full pl-4 pr-10 h-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#00bcd4] hover:bg-[#0097a7] rounded-full p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}