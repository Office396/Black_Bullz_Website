"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Star, Search } from "lucide-react"
import { useState } from "react"

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
    title: "Adobe Photoshop 2024",
    category: "Software",
    image: "/adobe-photoshop-icon.jpg",
    rating: 4.9,
    size: "3.2 GB",
    releaseDate: "2023-10-10",
    description: "Professional image editing and graphic design software with AI features.",
    tags: ["photoshop", "adobe", "design", "editing", "graphics", "photo", "creative", "ai"],
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
    description: "Battle royale game for mobile devices with 100 players.",
    tags: ["pubg", "battle royale", "mobile", "shooter", "survival", "multiplayer", "tencent"],
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
    description: "Sandbox game with endless possibilities for building and exploration.",
    tags: ["minecraft", "sandbox", "building", "survival", "creative", "mojang", "java"],
    tab: "pc-games",
  },
]

const tabs = [
  { id: "all", label: "All" },
  { id: "pc-games", label: "PC Games" },
  { id: "android-games", label: "Android Games" },
  { id: "software", label: "Software" },
]

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState("all")

  const adminItems = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("admin_items") || "[]") : []
  const combinedGames = [
    ...allGames,
    ...adminItems.map((item: any) => ({
      ...item,
      rating: typeof item.rating === "number" && !isNaN(item.rating) ? item.rating : 4.0,
      tab: item.category === "PC Games" ? "pc-games" : item.category === "Android Games" ? "android-games" : "software",
      tags: item.tags || [],
    })),
  ]

  const filteredGames = query
    ? combinedGames
        .filter((game) => {
          const searchTerm = query.toLowerCase().trim()
          const matchesSearch =
            game.title.toLowerCase().includes(searchTerm) ||
            game.description.toLowerCase().includes(searchTerm) ||
            game.category.toLowerCase().includes(searchTerm) ||
            game.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)) ||
            game.title
              .toLowerCase()
              .split(" ")
              .some((word) => word.startsWith(searchTerm)) ||
            game.tags.some((tag: string) => tag.toLowerCase().startsWith(searchTerm))

          const matchesFilter = activeFilter === "all" || game.tab === activeFilter

          return matchesSearch && matchesFilter
        })
        .sort((a, b) => {
          const aExact = a.title.toLowerCase().includes(query.toLowerCase())
          const bExact = b.title.toLowerCase().includes(query.toLowerCase())
          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1
          const aRating = typeof a.rating === "number" && !isNaN(a.rating) ? a.rating : 4.0
          const bRating = typeof b.rating === "number" && !isNaN(b.rating) ? b.rating : 4.0
          return bRating - aRating
        })
    : combinedGames.filter((game) => activeFilter === "all" || game.tab === activeFilter)

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Enter a search term</h2>
        <p className="text-gray-400">Use the search bar above to find games and software</p>
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
            className={`${
              activeFilter === tab.id
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
          <p className="text-gray-400">No games or software found for "{query}". Try different keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`}>
              <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden">
                <div className="relative">
                  <Image
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 right-2 bg-red-600 text-white">{game.category}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-red-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{game.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {typeof game.rating === "number" && !isNaN(game.rating) ? game.rating.toFixed(1) : "4.0"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(game.releaseDate).getFullYear()}</span>
                    </div>
                    <span className="font-medium">{game.size}</span>
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
