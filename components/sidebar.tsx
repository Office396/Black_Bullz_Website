"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

interface TrendingGame {
  id: number
  title: string
  category: string
  image: string
  downloads: string
  trending: boolean
}

interface QuickLink {
  href: string
  label: string
  count: number
}


export function Sidebar() {
  const [allGames, setAllGames] = useState<Array<{ category: string, tab: string }>>([])
  const [quickLinksData, setQuickLinksData] = useState<QuickLink[]>([
    { href: "/?tab=pc-games", label: "PC Games", count: 0 },
    { href: "/?tab=android-games", label: "Android Games", count: 0 },
    { href: "/?tab=software", label: "Software", count: 0 },
    { href: "/categories", label: "All Categories", count: 0 },
  ])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          const adminItems = result.data

          // Get only valid items from admin that have all required fields
          const validAdminItems = adminItems.filter((item: any) =>
            item &&
            item.title &&
            item.category &&
            item.description
          )

          // Map items to their categories and get counts
          const counts = validAdminItems.reduce((acc: { [key: string]: number }, item: any) => {
            const category = item.category
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {})

          // Get specific counts
          const pcGamesCount = counts["PC Games"] || 0
          const androidGamesCount = counts["Android Games"] || 0
          const softwareCount = counts["Software"] || 0

          // Calculate total valid items
          const totalCount = validAdminItems.length

          // Update quick links with accurate counts
          setQuickLinksData([
            { href: "/?tab=pc-games", label: "PC Games", count: pcGamesCount },
            { href: "/?tab=android-games", label: "Android Games", count: androidGamesCount },
            { href: "/?tab=software", label: "Software", count: softwareCount },
            { href: "/categories", label: "All Categories", count: totalCount },
          ])
        }
      } catch (error) {
        console.error("Error fetching items:", error)
      }
    }
    fetchItems()
  }, [])

  const [displayTrending, setDisplayTrending] = useState<TrendingGame[]>([])

  // Separate useEffect for trending items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          const adminItems = result.data

          // Get only items marked as trending from admin items
          const trendingAdminItems = adminItems.filter((item: any) => item.trending === true)

          const combinedTrending = [
            ...trendingAdminItems.map((item: any) => ({
              id: item.id,
              title: item.title,
              category: item.category,
              image: item.image || "/placeholder.svg",
              downloads: "New",
              trending: true
            }))
          ]

          // Update trending display items
          setDisplayTrending(combinedTrending.slice(0, 7))
        }
      } catch (error) {
        console.error("Error fetching items:", error)
      }
    }
    fetchItems()
  }, [])

  return (
    <div className="space-y-5">
      {/* Trending */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Trending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {displayTrending.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate group-hover:text-red-400">{game.title}</h4>
                <p className="text-gray-400 text-xs">{game.category}</p>
                <p className="text-gray-500 text-xs">{game.downloads}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
            {/* How to downlaod games and softwares video */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">How to Downlaod games and softwares</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
