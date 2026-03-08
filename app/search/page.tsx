"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Search, X, TrendingUp, Flame, Clock, Grid, List, Filter, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameItem {
  id: number
  title: string
  image: string
  category: string
  size?: string
  rating?: string | number
  description?: string
  trending?: boolean
  latest?: boolean
}

const POPULAR_SEARCHES = ["GTA V", "Call of Duty", "FIFA", "Minecraft", "Cyberpunk", "Red Dead"]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<GameItem[]>([])
  const [allItems, setAllItems] = useState<GameItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAll, setIsLoadingAll] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeCategory, setActiveCategory] = useState<"all" | "pc" | "android">("all")
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load all items for live search
  useEffect(() => {
    const loadAll = async () => {
      try {
        const res = await fetch("/api/items")
        const data = await res.json()
        if (data.success) setAllItems(data.data)
      } catch {}
      setIsLoadingAll(false)
    }
    loadAll()
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Live search as user types
  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setIsLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const lower = q.toLowerCase()
      const filtered = allItems.filter(item =>
        item.title?.toLowerCase().includes(lower) ||
        item.category?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
      )
      setResults(filtered)
      setIsLoading(false)
    }, 250)
  }, [allItems])

  useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  // Filter by category tab
  const displayResults = results.filter(item => {
    if (activeCategory === "pc") return item.category === "PC Games"
    if (activeCategory === "android") return item.category === "Android Games"
    return true
  })

  const pcCount = results.filter(i => i.category === "PC Games").length
  const androidCount = results.filter(i => i.category === "Android Games").length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-20 pb-16">
        {/* Search Hero */}
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#00bcd4]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500 -z-10" />
            <div className="flex items-center gap-3 bg-[#120b22] border border-[#2d1b54] focus-within:border-[#9d4edd] rounded-2xl px-5 py-4 transition-all duration-300">
              <Search className="w-6 h-6 text-[#9d4edd] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search games by title or Steam App ID (SteamDB)..."
                className="flex-1 bg-transparent text-white text-lg placeholder-gray-600 outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#2d1b54]">
                <button className="flex items-center gap-1.5 text-[#9d4edd] text-sm font-medium px-3 py-1.5 bg-[#9d4edd]/10 rounded-lg hover:bg-[#9d4edd]/20 transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Popular searches (shown when no query) */}
          {!query && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-1.5 bg-[#1a103c] border border-[#2d1b54] text-gray-300 text-sm rounded-full hover:border-[#9d4edd]/50 hover:text-[#9d4edd] transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4">
          {query && (
            <>
              {/* Results header + filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-white font-semibold text-lg">
                    {isLoading ? (
                      <span className="text-gray-400">Searching...</span>
                    ) : (
                      <>
                        <span className="text-[#9d4edd] font-bold">{displayResults.length}</span>
                        <span className="text-gray-400"> results for </span>
                        <span className="text-white">"{query}"</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Category Tabs */}
                  <div className="flex bg-[#120b22] border border-[#2d1b54] rounded-xl p-1 gap-1">
                    {[
                      { id: "all", label: `All (${results.length})` },
                      { id: "pc", label: `PC (${pcCount})` },
                      { id: "android", label: `Android (${androidCount})` },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCategory(tab.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                          activeCategory === tab.id
                            ? "bg-[#9d4edd] text-white"
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* View mode */}
                  <div className="flex bg-[#120b22] border border-[#2d1b54] rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-[#9d4edd] text-white" : "text-gray-400 hover:text-white")}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-[#9d4edd] text-white" : "text-gray-400 hover:text-white")}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading skeleton */}
              {isLoading && (
                <div className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "space-y-3"
                )}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    viewMode === "grid" ? (
                      <div key={i} className="aspect-[3/4] bg-[#1a103c] rounded-xl animate-pulse" />
                    ) : (
                      <div key={i} className="h-24 bg-[#1a103c] rounded-xl animate-pulse" />
                    )
                  ))}
                </div>
              )}

              {/* No results */}
              {!isLoading && displayResults.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-[#1a103c] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">No results found</h3>
                  <p className="text-gray-500 mb-6">Try different keywords or browse our categories</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {POPULAR_SEARCHES.slice(0, 4).map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 bg-[#1a103c] border border-[#2d1b54] text-gray-300 text-sm rounded-xl hover:border-[#9d4edd]/50 hover:text-[#9d4edd] transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid results */}
              {!isLoading && displayResults.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayResults.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                          {game.category === "Android Games" ? "APK" : "PC"}
                        </div>
                        {game.trending && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500/90 flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{game.title}</p>
                          {game.size && <p className="text-gray-400 text-[10px] mt-0.5">{game.size}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* List results */}
              {!isLoading && displayResults.length > 0 && viewMode === "list" && (
                <div className="space-y-3">
                  {displayResults.map((game) => (
                    <Link
                      key={game.id}
                      href={`/game/${game.id}`}
                      className="group flex items-center gap-4 p-4 bg-[#120b22] border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 hover:bg-[#1a103c] transition-all"
                    >
                      <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                        <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-white text-[8px] font-bold uppercase ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                          {game.category === "Android Games" ? "APK" : "PC"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold group-hover:text-[#9d4edd] transition-colors line-clamp-1">{game.title}</h3>
                        <p className="text-gray-500 text-sm mt-0.5">{game.category}</p>
                        {game.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{game.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {game.size && <span className="text-gray-500 text-xs">{game.size}</span>}
                          {game.rating && <span className="text-yellow-500 text-xs">★ {game.rating}</span>}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="px-3 py-1.5 bg-[#9d4edd]/10 border border-[#9d4edd]/30 text-[#9d4edd] text-xs font-semibold rounded-lg group-hover:bg-[#9d4edd] group-hover:text-white transition-all">
                          View
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty state — no query */}
          {!query && !isLoadingAll && (
            <div className="max-w-4xl mx-auto">
              {/* Recommendations */}
              <div className="mb-8">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#9d4edd]" />
                  Gamer Recommendations Today
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allItems.filter(i => i.trending).slice(0, 8).map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{game.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {allItems.filter(i => i.trending).length === 0 && allItems.slice(0, 8).map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{game.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Latest Games</h4>
                  <div className="space-y-2">
                    {allItems.filter(i => i.latest).slice(0, 5).map(g => (
                      <Link key={g.id} href={`/game/${g.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden">
                          <img src={g.image || "/placeholder.svg"} alt={g.title} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-gray-400 text-sm group-hover:text-[#9d4edd] transition-colors line-clamp-1">{g.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Quick Links</h4>
                  <div className="space-y-2">
                    {[
                      { href: "/top", label: "Top Games" },
                      { href: "/updates", label: "New Updates" },
                      { href: "/collections", label: "Epic Collections" },
                      { href: "/games?category=pc-games", label: "PC Games" },
                      { href: "/games?category=android-mod", label: "Android APKs" },
                    ].map(link => (
                      <Link key={link.href} href={link.href} className="block text-gray-400 text-sm hover:text-[#9d4edd] transition-colors">
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
