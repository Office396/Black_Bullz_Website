"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Star, Search } from "lucide-react"
import { useState, useEffect } from "react"

const allGames = [
  {
    id: 1,
    title: "Grand Theft Auto V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    rating: 4.8,
    size: "65 GB",
    releaseDate: "2015-04-14",
    description: "Open world action-adventure game set in Los Santos with heists, racing, and crime.",
    tags: ["gta", "grand theft auto", "action", "open world", "crime", "heist", "racing", "rockstar"],
    tab: "pc-games",
  },
  {
    id: 2,
    title: "Call of Duty: Modern Warfare",
    category: "PC Games",
    image: "/call-of-duty-game-cover.jpg",
    rating: 4.6,
    size: "175 GB",
    releaseDate: "2019-10-25",
    description: "First-person shooter with intense multiplayer action and campaign mode.",
    tags: ["cod", "call of duty", "fps", "shooter", "multiplayer", "warfare", "modern", "activision"],
    tab: "pc-games",
  },
  {
    id: 3,
    title: "Minecraft Java Edition",
    category: "PC Games",
    image: "/minecraft-game-cover.png",
    rating: 4.7,
    size: "1 GB",
    releaseDate: "2011-11-18",
    description: "Sandbox game with endless possibilities for building and exploration.",
    tags: ["minecraft", "sandbox", "building", "survival", "creative", "mojang", "java"],
    tab: "pc-games",
  },
]

const tabs = [
  { id: "all", label: "All" },
  { id: "pc-games", label: "PC Games" },
]

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [serverItems, setServerItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          setServerItems(result.data)
        }
      } catch (error) {
        console.error("Error fetching items for search:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const combinedGames = [
    ...allGames,
    ...serverItems.map((item: any) => ({
      ...item,
      rating: typeof item.rating === "string" ? parseFloat(item.rating) || 4.0 : typeof item.rating === "number" && !isNaN(item.rating) ? item.rating : 4.0,
      tab: item.category === "PC Games" ? "pc-games" : "pc-games",
      tags: item.tags || [],
    })),
  ]

  const filteredGames = query
    ? combinedGames
      .filter((game) => {
        const searchTerm = query.toLowerCase().trim()
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0)

        // Enhanced search logic with multiple matching strategies
        const matchesSearch = (() => {
          // Exact title match (highest priority)
          if (game.title.toLowerCase().includes(searchTerm)) return true

          // Partial title word matches
          if (game.title.toLowerCase().split(' ').some((word: string) => searchWords.some((searchWord: string) => word.includes(searchWord)))) return true

          // Exact developer match
          if (game.developer && game.developer.toLowerCase().includes(searchTerm)) return true

          // Category match
          if (game.category.toLowerCase().includes(searchTerm)) return true

          // Description matches (long description has higher weight)
          if (game.longDescription && game.longDescription.toLowerCase().includes(searchTerm)) return true
          if (game.description.toLowerCase().includes(searchTerm)) return true

          // Tag matches (exact and partial)
          if (game.tags.some((tag: string) => {
            const tagLower = tag.toLowerCase()
            return tagLower.includes(searchTerm) || searchWords.some((word: string) => tagLower.includes(word))
          })) return true

          // Key features match
          if (game.keyFeatures && game.keyFeatures.some((feature: string) =>
            feature.toLowerCase().includes(searchTerm)
          )) return true

          // Size match (e.g., "2gb", "500mb")
          if (game.size && game.size.toLowerCase().replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))) return true

          // Acronym/Abbreviation matches (e.g., "gta" for "Grand Theft Auto")
          const titleWords = game.title.toLowerCase().split(' ')
          const searchChars = searchTerm.replace(/\s+/g, '')
          if (searchChars.length >= 2 && titleWords.some((word: string) =>
            word.startsWith(searchChars) ||
            word.includes(searchChars) ||
            searchChars.split('').every((char: string) => word.includes(char))
          )) return true

          // Fuzzy word matching - if search contains multiple words, check if all words appear somewhere
          if (searchWords.length > 1) {
            const titleText = [game.title, game.description, game.longDescription || '', game.developer || '', ...game.tags].join(' ').toLowerCase()
            const wordMatches = searchWords.filter((word: string) =>
              titleText.includes(word) || game.tags.some((tag: string) => tag.toLowerCase().includes(word))
            )
            if (wordMatches.length >= Math.ceil(searchWords.length * 0.6)) return true // 60% of search words match
          }

          return false
        })()

        const matchesFilter = activeFilter === "all" || game.tab === activeFilter

        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        const queryLower = query.toLowerCase()

        // Priority 1: Exact title match
        const aExactTitle = a.title.toLowerCase().includes(queryLower)
        const bExactTitle = b.title.toLowerCase().includes(queryLower)
        if (aExactTitle && !bExactTitle) return -1
        if (!aExactTitle && bExactTitle) return 1

        // Priority 2: Title starts with query
        const aTitleStarts = a.title.toLowerCase().startsWith(queryLower)
        const bTitleStarts = b.title.toLowerCase().startsWith(queryLower)
        if (aTitleStarts && !bTitleStarts) return -1
        if (!aTitleStarts && bTitleStarts) return 1

        // Priority 3: Word matches in title
        const aTitleWords = a.title.toLowerCase().split(' ')
        const bTitleWords = b.title.toLowerCase().split(' ')
        const aWordMatches = aTitleWords.filter((word: string) => queryLower.split(' ').some((q: string) => word.includes(q))).length
        const bWordMatches = bTitleWords.filter((word: string) => queryLower.split(' ').some((q: string) => word.includes(q))).length
        if (aWordMatches > bWordMatches) return -1
        if (aWordMatches < bWordMatches) return 1

        // Priority 4: Developer match
        const aDeveloperMatch = a.developer && a.developer.toLowerCase().includes(queryLower)
        const bDeveloperMatch = b.developer && b.developer.toLowerCase().includes(queryLower)
        if (aDeveloperMatch && !bDeveloperMatch) return -1
        if (!aDeveloperMatch && bDeveloperMatch) return 1

        // Priority 5: Rating (higher rated first)
        const aRating = typeof a.rating === "number" && !isNaN(a.rating) ? a.rating : 4.0
        const bRating = typeof b.rating === "number" && !isNaN(b.rating) ? b.rating : 4.0
        if (aRating !== bRating) return bRating - aRating

        // Priority 6: Newer items first (by upload date)
        const aDate = new Date(a.uploadDate || a.releaseDate || 0).getTime()
        const bDate = new Date(b.uploadDate || b.releaseDate || 0).getTime()
        return bDate - aDate
      })
    : combinedGames.filter((game) => activeFilter === "all" || game.tab === activeFilter)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Searching...</h2>
        <p className="text-gray-400">Loading available items</p>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Enter a search term</h2>
        <p className="text-gray-400">Use the search bar above to find games</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            variant={activeFilter === tab.id ? "default" : "outline"}
            className={`${activeFilter === tab.id
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Found {filteredGames.length} result{filteredGames.length !== 1 ? "s" : ""} for "{query}"
          {activeFilter !== "all" && ` in ${tabs.find((t) => t.id === activeFilter)?.label}`}
        </p>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
          <p className="text-gray-400">No games found for "{query}". Try different keywords.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 max-w-[1400px] mx-auto">
          {filteredGames.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`}>
              <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden p-0 rounded-lg">
                <div className="relative aspect-[3/3] w-full overflow-hidden bg-gray-800">
                  <Image
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    fill
                    className="absolute inset-0 w-full h-full object-cover object-top block transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, 30vw"
                  />
                  <Badge className="absolute top-1 right-1 bg-red-600 text-white text-[13px] px-1 py-0 z-10 pointer-events-none">
                    {game.category}
                  </Badge>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none bg-blue-500/90">
                    PC
                  </div>
                </div>
                <CardContent className="p-1.5 pointer-events-none">
                  <div className="flex flex-col gap-1 pointer-events-auto">
                    <h3 className="text-white font-bold transition-all line-clamp-1 text-sm hover:text-red-400 hover:scale-105 origin-left w-fit cursor-pointer">
                      {game.title}
                    </h3>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[11px] text-gray-400">{typeof game.rating === "number" && !isNaN(game.rating) ? game.rating.toFixed(1) : "4.0"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
