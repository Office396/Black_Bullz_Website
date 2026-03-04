"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Search, Grid, List, ChevronDown, Shuffle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  size?: string
  uploadDate?: string
  releaseDate?: string
}

const alphabet = ["0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(i + 65))]
const quickFilters = [
  { label: "Most Popular", value: "popular" },
  { label: "Latest Games", value: "latest" },
  { label: "Single Player", value: "singleplayer" },
  { label: "Multiplayer", value: "multiplayer" },
  { label: "2026 Games", value: "2026" },
]

export default function AllGamesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLetter = searchParams.get("letter") || ""
  const initialFilter = searchParams.get("filter") || ""
  
  const [items, setItems] = useState<GameItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState(initialLetter)
  const [selectedFilter, setSelectedFilter] = useState(initialFilter)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 24

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          setItems(result.data)
        }
      } catch (error) {
        console.error("Error fetching items:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchItems()
  }, [])

  const filteredGames = useMemo(() => {
    let filtered = [...items]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.category.toLowerCase().includes(query)
      )
    }

    if (selectedLetter) {
      if (selectedLetter === "0-9") {
        filtered = filtered.filter((game) => /^[0-9]/.test(game.title))
      } else {
        filtered = filtered.filter(
          (game) => game.title.toUpperCase().startsWith(selectedLetter)
        )
      }
    }

    if (selectedFilter === "latest") {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
        const dateB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
        return dateB - dateA
      })
    }

    return filtered
  }, [items, searchQuery, selectedLetter, selectedFilter])

  const totalGames = items.length
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
  const displayedGames = filteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  )

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter === selectedLetter ? "" : letter)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    if (letter === selectedLetter) {
      params.delete("letter")
    } else {
      params.set("letter", letter)
    }
    router.push(`/games?${params.toString()}`, { scroll: false })
  }

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? "" : filter)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    if (filter === selectedFilter) {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    router.push(`/games?${params.toString()}`, { scroll: false })
  }

  const handleRandomGame = () => {
    if (items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length)
      router.push(`/game/${items[randomIndex].id}`)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="h-10 w-48 bg-[#1a2a44] rounded animate-pulse mb-6" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#1a2a44] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center text-white mb-2">All Games</h1>
            <p className="text-gray-400 text-center">Browse our collection of {totalGames.toLocaleString()} games</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by title, Steam App ID, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-[#1a2a44] border-[#1e3050] text-white placeholder-gray-500 focus:border-[#00bcd4] focus:ring-[#00bcd4]/20 h-11 pl-4 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleRandomGame} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
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
                    ? "bg-[#00bcd4] text-white "
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Browse by Letter</h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  className={cn(
                    "w-11 h-8 rounded-lg text-xs hover:bg-[#00BCD4] text-center font-medium transition-all",
                    selectedLetter === letter
                      ? "bg-[#00bcd4] text-white "
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
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
              <Button onClick={() => { setSearchQuery(""); setSelectedLetter(""); setSelectedFilter(""); }} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">
                  Showing {((currentPage - 1) * gamesPerPage) + 1} - {Math.min(currentPage * gamesPerPage, filteredGames.length)} of {filteredGames.length} games
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === "grid" ? "bg-[#00bcd4] text-white" : "bg-white/5 text-gray-400 hover:text-white"
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === "list" ? "bg-[#00bcd4] text-white" : "bg-white/5 text-gray-400 hover:text-white"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedGames.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a2a44]">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
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
                    <Link key={game.id} href={`/game/${game.id}`} className="group flex items-center gap-4 p-4 bg-[#0f1d32] border border-[#1e3050] rounded-xl hover:border-[#00bcd4]/50 transition-all">
                      <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium group-hover:text-[#00bcd4] transition-colors line-clamp-1">{game.title}</h3>
                        <p className="text-gray-500 text-sm">{game.category}</p>
                        {game.size && <p className="text-gray-400 text-xs mt-1">{game.size}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                            currentPage === pageNum
                              ? "bg-[#00bcd4] text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:opacity-50"
                  >
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