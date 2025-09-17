"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const games = [
  {
    id: 1,
    title: "Grand Theft Auto V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    rating: 4.8,
    size: "65 GB",
    releaseDate: "2015-04-14",
    description: "Open world action-adventure game set in Los Santos.",
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
    description: "First-person shooter with intense multiplayer action.",
    tab: "pc-games",
  },
  {
    id: 3,
    title: "Adobe Photoshop 2024",
    category: "Software",
    image: "/adobe-photoshop-icon.jpg",
    rating: 4.9,
    size: "3.2 GB",
    releaseDate: "2023-10-10",
    description: "Professional image editing and graphic design software.",
    tab: "software",
  },
  {
    id: 4,
    title: "PUBG Mobile",
    category: "Android Games",
    image: "/pubg-mobile-game-cover.jpg",
    rating: 4.3,
    size: "2.1 GB",
    releaseDate: "2018-03-19",
    description: "Battle royale game for mobile devices.",
    tab: "android-games",
  },
  {
    id: 5,
    title: "Minecraft Java Edition",
    category: "PC Games",
    image: "/minecraft-game-cover.png",
    rating: 4.7,
    size: "1 GB",
    releaseDate: "2011-11-18",
    description: "Sandbox game with endless possibilities.",
    tab: "pc-games",
  },
  {
    id: 6,
    title: "Microsoft Office 2021",
    category: "Software",
    image: "/microsoft-office-suite.jpg",
    rating: 4.5,
    size: "4.5 GB",
    releaseDate: "2021-10-05",
    description: "Complete office productivity suite.",
    tab: "software",
  },
  {
    id: 7,
    title: "Among Us",
    category: "Android Games",
    image: "/among-us-game-characters.jpg",
    rating: 4.2,
    size: "250 MB",
    releaseDate: "2018-06-15",
    description: "Social deduction game with friends.",
    tab: "android-games",
  },
  {
    id: 8,
    title: "Cyberpunk 2077",
    category: "PC Games",
    image: "/cyberpunk-2077-futuristic-city.jpg",
    rating: 4.1,
    size: "70 GB",
    releaseDate: "2020-12-10",
    description: "Futuristic open-world RPG.",
    tab: "pc-games",
  },
  {
    id: 9,
    title: "WhatsApp",
    category: "Android Games",
    image: "/whatsapp-app-icon.png",
    rating: 4.4,
    size: "120 MB",
    releaseDate: "2009-05-03",
    description: "Messaging app for communication.",
    tab: "android-games",
  },
  {
    id: 10,
    title: "Valorant",
    category: "PC Games",
    image: "/valorant-tactical-shooter.jpg",
    rating: 4.6,
    size: "23 GB",
    releaseDate: "2020-06-02",
    description: "Tactical first-person shooter.",
    tab: "pc-games",
  },
  {
    id: 11,
    title: "Visual Studio Code",
    category: "Software",
    image: "/visual-studio-code-editor.jpg",
    rating: 4.8,
    size: "200 MB",
    releaseDate: "2015-04-29",
    description: "Powerful code editor for developers.",
    tab: "software",
  },
  {
    id: 12,
    title: "Clash of Clans",
    category: "Android Games",
    image: "/clash-of-clans-gameplay.jpg",
    rating: 4.5,
    size: "180 MB",
    releaseDate: "2012-08-02",
    description: "Strategy game with clan battles.",
    tab: "android-games",
  },
  {
    id: 13,
    title: "FIFA 24",
    category: "PC Games",
    image: "/fifa-24-gameplay.jpg",
    rating: 4.3,
    size: "50 GB",
    releaseDate: "2023-09-29",
    description: "Latest football simulation game.",
    tab: "pc-games",
  },
  {
    id: 14,
    title: "Chrome Browser",
    category: "Software",
    image: "/google-chrome-browser.jpg",
    rating: 4.4,
    size: "150 MB",
    releaseDate: "2008-09-02",
    description: "Fast and secure web browser.",
    tab: "software",
  },
  {
    id: 15,
    title: "Genshin Impact",
    category: "Android Games",
    image: "/genshin-impact-gameplay.jpg",
    rating: 4.7,
    size: "15 GB",
    releaseDate: "2020-09-28",
    description: "Open-world action RPG with anime style.",
    tab: "android-games",
  },
]

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
  const [adminItems, setAdminItems] = useState<any[]>([])

  const itemsPerPage = activeTab === "android-games" ? 15 : 12

  useEffect(() => {
    if (typeof window !== "undefined") {
      const items = JSON.parse(localStorage.getItem("admin_items") || "[]")
      setAdminItems(items)
    }
  }, [])

  const allGames = [
    ...games,
    ...adminItems.map((item: any) => ({
      ...item,
      tab: item.category === "PC Games" ? "pc-games" : item.category === "Android Games" ? "android-games" : "software",
    })),
  ]

  let filteredGames = activeTab === "all" ? allGames : allGames.filter((game) => game.tab === activeTab)

  if (filterLatest) {
    filteredGames = filteredGames.filter((game) => {
      if (game.latest) return true
      const gameDate = new Date(game.releaseDate || game.uploadDate)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return gameDate >= thirtyDaysAgo
    })
  }

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

  return (
    <div className="space-y-6">
      {!filterLatest && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
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
              {tab.label} ({tab.id === "all" ? allGames.length : allGames.filter((g) => g.tab === tab.id).length})
            </Button>
          ))}
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
                    activeTab === "android-games" ? "h-24" : "h-32"
                  }`}
                  style={{ objectPosition: "center" }}
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
