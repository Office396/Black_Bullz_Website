"use client"

import { useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Grid, List, Shuffle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  size?: string
  uploadDate?: string
  releaseDate?: string
  rating?: number
}

const alphabet = ["0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(i + 65))]
const quickFilters = [
  { label: "Most Popular", value: "popular" },
  { label: "Latest Games", value: "latest" },
  { label: "Single Player", value: "singleplayer" },
  { label: "Multiplayer", value: "multiplayer" },
  { label: "2026 Games", value: "2026" },
]

function AllGamesContent({ initialItems }: { initialItems: GameItem[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLetter = searchParams.get("letter") || ""
  const initialFilter = searchParams.get("filter") || ""
  const initialCategory = searchParams.get("category") || ""

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState(initialLetter)
  const [selectedFilter, setSelectedFilter] = useState(initialFilter)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 24

  const filteredGames = useMemo(() => {
    let filtered = [...initialItems]

    if (selectedCategory) {
      if (selectedCategory === "pc-games") filtered = filtered.filter(g => g.category === "PC Games")
      else if (selectedCategory === "android-mod") filtered = filtered.filter(g => g.category === "Android Games")
      else if (selectedCategory === "pre-installed") filtered = filtered.filter(g => g.category === "PC Games")
      else if (selectedCategory === "installable") filtered = filtered.filter(g => g.category === "PC Games")
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(query) || g.category.toLowerCase().includes(query)
      )
    }

    if (selectedLetter) {
      if (selectedLetter === "0-9") filtered = filtered.filter(g => /^[0-9]/.test(g.title))
      else filtered = filtered.filter(g => g.title.toUpperCase().startsWith(selectedLetter))
    }

    if (selectedFilter === "latest") {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
        const dateB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
        return dateB - dateA
      })
    } else {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    return filtered
  }, [initialItems, searchQuery, selectedLetter, selectedFilter, selectedCategory])

  const totalGames = initialItems.length
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
  const displayedGames = filteredGames.slice((currentPage - 1) * gamesPerPage, currentPage * gamesPerPage)

  const handleLetterClick = (letter: string) => {
    const next = letter === selectedLetter ? "" : letter
    setSelectedLetter(next)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    next ? params.set("letter", next) : params.delete("letter")
    router.push(`/games?${params.toString()}`, { scroll: false })
  }

  const handleFilterClick = (filter: string) => {
    const next = filter === selectedFilter ? "" : filter
    setSelectedFilter(next)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    next ? params.set("filter", next) : params.delete("filter")
    router.push(`/games?${params.toString()}`, { scroll: false })
  }

  const handleRandomGame = () => {
    if (initialItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * initialItems.length)
      router.push(`/game/${initialItems[randomIndex].id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
              {selectedCategory === "pre-installed" ? "Pre-installed PC Games" :
               selectedCategory === "installable" ? "Installable PC Games" :
               selectedCategory === "pc-games" ? "PC Games" :
               selectedCategory === "android-mod" ? "Android Mod APKs" :
               "All Games"}
            </h1>
            <p className="text-gray-400 text-center">
              {selectedCategory === "pre-installed" ? "No installation needed — just extract & play" :
               selectedCategory === "installable" ? "Traditional setup with installer" :
               selectedCategory === "pc-games" ? "All PC games — pre-installed & installable" :
               selectedCategory === "android-mod" ? "Modded Android games & APKs" :
               `Browse our collection of ${totalGames.toLocaleString()} games`}
            </p>
            {selectedCategory && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => { setSelectedCategory(""); router.push("/games") }}
                  className="text-sm text-[#9d4edd] hover:underline flex items-center gap-1"
                >
                  ← Browse All Games
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by title, Steam App ID, or keywords..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="w-full bg-[#1a103c] border-[#2d1b54] text-white placeholder-gray-500 focus:border-[#9d4edd] focus:ring-[#9d4edd]/20 h-11 pl-4 pr-10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleRandomGame} variant="outline" className="bg-transparent dark:bg-white/5 border-[#9d4edd]/40 dark:border-white/10 text-[#9d4edd] dark:text-white hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd]">
              <Shuffle className="w-4 h-4 mr-2" />
              Random Game
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterClick(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-center text-sm font-medium transition-all",
                  selectedFilter === filter.value
                    ? "bg-[#9d4edd] text-white border border-[#9d4edd]"
                    : "bg-transparent dark:bg-white/5 text-[#9d4edd] dark:text-gray-300 border border-[#9d4edd]/40 dark:border-transparent hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] dark:hover:text-white"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Browse by Letter</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  className={cn(
                    "w-11 h-8 rounded-lg text-xs text-center font-medium transition-all",
                    selectedLetter === letter
                      ? "bg-[#9d4edd] text-white border border-[#9d4edd]"
                      : "bg-transparent dark:bg-white/5 text-[#9d4edd] dark:text-gray-400 border border-[#9d4edd]/40 dark:border-transparent hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] dark:hover:text-white"
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-500 text-lg mb-4">No games found</div>
              <Button onClick={() => { setSearchQuery(""); setSelectedLetter(""); setSelectedFilter("") }} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">
                  Showing {((currentPage - 1) * gamesPerPage) + 1}–{Math.min(currentPage * gamesPerPage, filteredGames.length)} of {filteredGames.length} games
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-colors border", viewMode === "grid" ? "bg-[#9d4edd] text-white border-[#9d4edd]" : "bg-transparent dark:bg-white/5 text-[#9d4edd] dark:text-gray-400 border-[#9d4edd]/40 dark:border-transparent hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] dark:hover:text-white")}>
                    <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-colors border", viewMode === "list" ? "bg-[#9d4edd] text-white border-[#9d4edd]" : "bg-transparent dark:bg-white/5 text-[#9d4edd] dark:text-gray-400 border-[#9d4edd]/40 dark:border-transparent hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] dark:hover:text-white")}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedGames.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                          {game.category === "Android Games" ? "ANDROID" : "PC"}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-sm font-medium line-clamp-2">{game.title}</p>
                          {game.size && <p className="text-gray-400 text-xs">{game.size}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedGames.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group flex items-center gap-4 p-4 bg-[#120b22] border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 transition-all">
                      <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                        <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="80px" className="object-cover" />
                        <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-white text-[8px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                          {game.category === "Android Games" ? "APK" : "PC"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium group-hover:text-[#9d4edd] transition-colors line-clamp-1">{game.title}</h3>
                        <p className="text-gray-500 text-sm">{game.category}</p>
                        {game.size && <p className="text-gray-400 text-xs mt-1">{game.size}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" className="bg-transparent dark:bg-white/5 border-[#9d4edd]/40 dark:border-white/10 text-[#9d4edd] dark:text-white hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] transition-colors disabled:opacity-50">
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (currentPage <= 3) pageNum = i + 1
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                      else pageNum = currentPage - 2 + i
                      return (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cn("w-10 h-10 rounded-lg text-sm font-medium transition-all border", currentPage === pageNum ? "bg-[#9d4edd] text-white border-[#9d4edd]" : "bg-transparent dark:bg-white/5 text-[#9d4edd] dark:text-gray-400 border-[#9d4edd]/40 dark:border-transparent hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] dark:hover:text-white")}>
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" className="bg-transparent dark:bg-white/5 border-[#9d4edd]/40 dark:border-white/10 text-[#9d4edd] dark:text-white hover:bg-[#9d4edd]/10 dark:hover:bg-white/10 hover:border-[#9d4edd] transition-colors disabled:opacity-50">
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}

export function AllGamesClient({ initialItems }: { initialItems: GameItem[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090514]"><div className="pt-20 p-8 text-center text-white">Loading...</div></div>}>
      <AllGamesContent initialItems={initialItems} />
    </Suspense>
  )
}
