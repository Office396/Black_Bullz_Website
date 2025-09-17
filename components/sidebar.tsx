"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

const trendingGames = [
  {
    id: 1,
    title: "GTA V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    downloads: "2.5M",
  },
  {
    id: 2,
    title: "Call of Duty",
    category: "PC Games",
    image: "/call-of-duty-game-cover.jpg",
    downloads: "1.8M",
  },
  {
    id: 3,
    title: "Minecraft",
    category: "PC Games",
    image: "/minecraft-game-cover.png",
    downloads: "3.2M",
  },
  {
    id: 4,
    title: "Adobe Photoshop",
    category: "Software",
    image: "/adobe-photoshop-icon.jpg",
    downloads: "950K",
  },
  {
    id: 5,
    title: "PUBG Mobile",
    category: "Android Games",
    image: "/pubg-mobile-game-cover.jpg",
    downloads: "4.1M",
  },
]

export function Sidebar() {
  const [allGames, setAllGames] = useState<any[]>([])
  const [quickLinksData, setQuickLinksData] = useState([
    { href: "/?tab=pc-games", label: "PC Games", count: 0 },
    { href: "/?tab=android-games", label: "Android Games", count: 0 },
    { href: "/?tab=software", label: "Software", count: 0 },
    { href: "/categories", label: "All Categories", count: 0 },
  ])

  useEffect(() => {
    const adminItems = JSON.parse(localStorage.getItem("admin_items") || "[]")
    const defaultGames = [
      { category: "PC Games", tab: "pc-games" },
      { category: "PC Games", tab: "pc-games" },
      { category: "Software", tab: "software" },
      { category: "Android Games", tab: "android-games" },
      { category: "PC Games", tab: "pc-games" },
      { category: "Software", tab: "software" },
      { category: "Android Games", tab: "android-games" },
      { category: "PC Games", tab: "pc-games" },
      { category: "Android Games", tab: "android-games" },
      { category: "PC Games", tab: "pc-games" },
      { category: "Software", tab: "software" },
      { category: "Android Games", tab: "android-games" },
      { category: "PC Games", tab: "pc-games" },
      { category: "Software", tab: "software" },
      { category: "Android Games", tab: "android-games" },
    ]

    const combinedGames = [
      ...defaultGames,
      ...adminItems.map((item: any) => ({
        category: item.category,
        tab:
          item.category === "PC Games" ? "pc-games" : item.category === "Android Games" ? "android-games" : "software",
      })),
    ]

    setAllGames(combinedGames)

    const pcGamesCount = combinedGames.filter((g) => g.tab === "pc-games").length
    const androidGamesCount = combinedGames.filter((g) => g.tab === "android-games").length
    const softwareCount = combinedGames.filter((g) => g.tab === "software").length
    const totalCount = combinedGames.length

    setQuickLinksData([
      { href: "/?tab=pc-games", label: "PC Games", count: pcGamesCount },
      { href: "/?tab=android-games", label: "Android Games", count: androidGamesCount },
      { href: "/?tab=software", label: "Software", count: softwareCount },
      { href: "/categories", label: "All Categories", count: totalCount },
    ])
  }, [])

  const [displayTrending, setDisplayTrending] = useState(trendingGames)

  useEffect(() => {
    const adminItems = JSON.parse(localStorage.getItem("admin_items") || "[]")
    const trendingAdminItems = adminItems.filter((item: any) => item.trending)

    const combinedTrending = [
      ...trendingGames,
      ...trendingAdminItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image || "/placeholder.svg",
        downloads: "New",
      })),
    ]

    setDisplayTrending(combinedTrending.slice(0, 5))
  }, [])

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickLinksData.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <span className="text-gray-300 group-hover:text-white">{link.label}</span>
              <Badge variant="secondary" className="bg-red-600 text-white">
                {link.count}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Trending */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Trending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <p className="text-gray-500 text-xs">{game.downloads} downloads</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
