"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  rating: number
  size: string
  description: string
  releaseDate?: string
  uploadDate?: string
  latest?: boolean
  tab?: string
}


const tabs = [
  { id: "all", label: "All" },
  { id: "pc-games", label: "Free PC Games" },
  { id: "android-games", label: "Free Android Apps" },
  { id: "software", label: "Free Software" },
]

interface GameGridProps {
  filterLatest?: boolean
}

export function GameGrid({ filterLatest = false }: GameGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "all"
  const [currentPage, setCurrentPage] = useState(1)
  const [adminItems, setAdminItems] = useState<GameItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const itemsPerPage = 12 // Show 12 items per page on home page

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoaded(false) // Start loading
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          setAdminItems(result.data)
        } else {
          console.error("Failed to fetch items:", result.error)
        }
      } catch (error) {
        console.error("Error fetching items:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchItems()
  }, [])

  const allGames = useMemo(() => 
    adminItems.map((item) => ({
      ...item,
      tab: item.category === "PC Games" ? "pc-games" : item.category === "Android Games" ? "android-games" : "software",
    })),
    [adminItems]
  )

  const filteredGames = useMemo(() => {
    let games = activeTab === "all" ? allGames : allGames.filter((game) => game.tab === activeTab)

    if (filterLatest) {
      games = games.filter((game) => {
        if (game.latest) return true
        const gameDate = new Date(game.releaseDate || game.uploadDate || Date.now())
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return gameDate >= thirtyDaysAgo
      })
    }

    return games
  }, [allGames, activeTab, filterLatest])

  const totalPages = Math.ceil(filteredGames.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGames = filteredGames.slice(startIndex, startIndex + itemsPerPage)

  const handleTabChange = (tabId: string) => {
    setCurrentPage(1)
    if (tabId === "all") {
      router.push("/")
    } else {
      router.push(`/?tab=${tabId}`)
    }
  }

  // Don't render anything until the initial load is complete
  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-800 h-8 w-32 rounded"></div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!filterLatest && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const count = tab.id === "all" 
              ? allGames.length 
              : allGames.filter((g) => g.tab === tab.id).length
            return (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                variant={activeTab === tab.id ? "default" : "outline"}
                className={`${
                  activeTab === tab.id
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.label} ({count})
              </Button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {filterLatest
            ? "Latest Items"
            : activeTab === "all"
              ? "Latest Games & Software"
              : activeTab === "pc-games"
                ? "Free PC Games"
                : activeTab === "android-games"
                  ? "Free Android Apps"
                  : "Free Software"}
        </h1>
      </div>

      <div
        className={`grid gap-2 sm:gap-3 ${
          activeTab === "android-games"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
        } max-w-[1400px] mx-auto`}
      >
        {paginatedGames.map((game) => (
          <Link key={game.id} href={`/game/${game.id}`}>
            <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden p-0 rounded-lg">
              {/* Image container — must be first child so it sits flush at the top of the card */}
              <div className="relative aspect-[3/3] w-full overflow-hidden bg-gray-800">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  fill
                  className="absolute inset-0 w-full h-full object-cover object-top block group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, 30vw"
                />
                <Badge className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1 py-0 z-10">
                  {game.category}
                </Badge>
              </div>
              <CardContent className="p-1.5">
                <div className="flex flex-col gap-1">
                  <h3
                    className={`text-white font-bold group-hover:text-red-400 transition-colors line-clamp-1 ${
                      activeTab === "android-games" ? "text-xs" : "text-sm"
                    }`}
                  >
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] text-gray-400">{game.rating || 4.0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && paginatedGames.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


