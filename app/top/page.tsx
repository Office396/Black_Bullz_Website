"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Trophy, TrendingUp, Download, Eye, Star } from "lucide-react"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  size?: string
  rating?: number
  views?: number
  downloads?: number
  uploadDate?: string
}

export default function TopGamesPage() {
  const [items, setItems] = useState<GameItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

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

  const topGames = [...items]
    .sort((a, b) => ((b.downloads || b.views || 0) - (a.downloads || a.views || 0)))
    .slice(0, 100)

  const featuredGame = topGames[0]
  const runnerUps = topGames.slice(1, 5)
  const totalDownloads = items.reduce((sum, g) => sum + (g.downloads || Math.floor(Math.random() * 50000) + 1000), 0)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="h-10 w-48 bg-[#1a2a44] rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-[#1a2a44] rounded-xl animate-pulse" />
              <div className="h-96 bg-[#1a2a44] rounded-xl animate-pulse" />
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
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">Top Games (All-Time)</h1>
            </div>
            <p className="text-gray-400">The most downloaded games of all time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Total Downloads</span>
              </div>
              <p className="text-2xl font-bold text-white">{(totalDownloads / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-[#0f1d32] border border-[#1e3050] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-[#00bcd4]" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{items.length.toLocaleString()}</p>
            </div>
            <div className="bg-[#0f1d32] border border-[#1e3050] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-[#00bcd4]" />
                <span className="text-gray-400 text-sm">Average Rating</span>
              </div>
              <p className="text-2xl font-bold text-white">4.7</p>
            </div>
          </div>

          {featuredGame && (
            <div className="relative bg-gradient-to-br from-[#1a2a44] to-[#0f1d32] border border-[#1e3050] rounded-2xl overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-yellow-500 text-black font-bold text-sm rounded-full flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                #1 MOST DOWNLOADED
              </div>
              <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
                <div className="relative w-48 h-64 lg:w-56 lg:h-72 flex-shrink-0 mx-auto lg:mx-0">
                  <img
                    src={featuredGame.image || "/placeholder.svg"}
                    alt={featuredGame.title}
                    className="w-full h-full object-cover rounded-xl shadow-2xl"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">{featuredGame.title}</h2>
                  <p className="text-gray-400 mb-4">{featuredGame.category}</p>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{featuredGame.rating || 4.8}</span>
                    </div>
                    {featuredGame.size && (
                      <span className="text-gray-400">{featuredGame.size}</span>
                    )}
                  </div>
                  <Link
                    href={`/game/${featuredGame.id}`}
                    className="inline-flex items-center justify-center lg:justify-start gap-2 px-6 py-3 bg-[#00bcd4] hover:bg-[#0097a7] text-white font-semibold rounded-lg transition-all w-fit mx-auto lg:mx-0"
                  >
                    <Download className="w-5 h-5" />
                    Download Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <h3 className="text-xl font-bold text-white mb-4">All Top Games</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {topGames.slice(0, 24).map((game, index) => (
                  <Link key={game.id} href={`/game/${game.id}`} className="group relative">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a2a44]">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {index < 3 && (
                        <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                          index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                        }`}>
                          {index + 1}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-white text-sm font-medium mt-2 line-clamp-1 group-hover:text-[#00bcd4] transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-gray-500 text-xs">{game.size}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00bcd4]" />
                Runner Ups
              </h3>
              <div className="space-y-3">
                {runnerUps.map((game, index) => (
                  <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 p-3 bg-[#0f1d32] border border-[#1e3050] rounded-xl hover:border-[#00bcd4]/50 transition-all group">
                    <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                          index === 0 ? "bg-gray-400" : index === 1 ? "bg-amber-700" : "bg-gray-600"
                        }`}>
                          {index + 2}
                        </span>
                        <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#00bcd4] transition-colors">
                          {game.title}
                        </h4>
                      </div>
                      <p className="text-gray-500 text-xs">{game.size}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}