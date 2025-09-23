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
  { id: "pc-games", label: "PC Games" },
  { id: "android-games", label: "Android Games" },
  { id: "software", label: "Software" },
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

  const itemsPerPage = activeTab === "android-games" ? 15 : 12

  useEffect(() => {
    setIsLoaded(false) // Start loading
    if (typeof window !== "undefined") {
      try {
        const items = JSON.parse(localStorage.getItem("admin_items") || "[]") as GameItem[]
        setAdminItems(items)
      } catch (error) {
        console.error("Error loading items:", error)
      } finally {
        setIsLoaded(true)
      }
    }
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
        const gameDate = new Date(game.releaseDate || game.uploadDate)
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
          {[1, 2, 3, 4].map((i) => (
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
                ? "PC Games"
                : activeTab === "android-games"
                  ? "Android Games"
                  : "Software"}
        </h1>
      </div>

      <div
        className={`grid gap-4 ${
          activeTab === "android-games"
            ? "grid-cols-3 md:grid-cols-5 lg:grid-cols-5"
            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {paginatedGames.map((game) => (
          <Link key={game.id} href={`/game/${game.id}`}>
            <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden">
              <div className="relative">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  width={200}
                  height={150}
                  className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    activeTab === "android-games" 
                      ? "h-48 md:h-56" // Increased height for Android games
                      : "h-48 md:h-64" // Consistent height across categories
                  }`}
                  style={{ 
                    objectPosition: "center", 
                    objectFit: "cover" // Ensure full coverage
                  }}
                />
                <Badge className="absolute top-1 right-1 bg-red-600 text-white text-xs">{game.category}</Badge>
              </div>
              <CardContent className={`${activeTab === "android-games" ? "p-2" : "p-3"}`}>
                <h3
                  className={`text-white font-semibold mb-1 group-hover:text-red-400 transition-colors line-clamp-2 ${
                    activeTab === "android-games" ? "text-xs" : "text-sm"
                  }`}
                >
                  {game.title}
                </h3>
                <p
                  className={`text-gray-400 mb-2 line-clamp-2 ${activeTab === "android-games" ? "text-xs" : "text-sm"}`}
                >
                  {game.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{game.rating || 4.0}</span>
                  </div>
                  <span className="font-medium">{game.size}</span>
                </div>
                {game.uploadDate && (
                  <div className="text-xs text-gray-400 mt-1">
                    Added: {new Date(game.uploadDate).toLocaleDateString()}
                  </div>
                )}
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
