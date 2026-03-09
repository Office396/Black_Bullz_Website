"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { TrendingUp, Eye, Download, Star } from "lucide-react"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  size?: string
  rating?: number
  trending?: boolean
  uploadDate?: string
}

interface TrendingGame {
  gameId: number
  order: number
}

export default function TrendingGamesPage() {
  const [items, setItems] = useState<GameItem[]>([])
  const [trendingGames, setTrendingGames] = useState<GameItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all games
        const gamesResponse = await fetch("/api/items")
        const gamesResult = await gamesResponse.json()
        
        // Fetch trending games from admin panel
        const trendingResponse = await fetch("/api/admin/trending-games")
        const trendingResult = await trendingResponse.json()

        if (gamesResult.success) {
          setItems(gamesResult.data)
          
          // If admin has set trending games, use those
          if (trendingResult.games && trendingResult.games.length > 0) {
            const trendingGamesData = trendingResult.games
              .sort((a: TrendingGame, b: TrendingGame) => a.order - b.order)
              .map((tg: TrendingGame) => gamesResult.data.find((g: GameItem) => g.id === tg.gameId))
              .filter(Boolean) as GameItem[]
            
            setTrendingGames(trendingGamesData)
          } else {
            // Fallback to games with trending flag
            const fallbackTrending = gamesResult.data.filter((g: GameItem) => g.trending).slice(0, 50)
            setTrendingGames(fallbackTrending)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchData()
  }, [])

  const weeklyDownloads = Math.floor(Math.random() * 500000) + 100000

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="h-10 w-48 bg-[#1a103c] rounded animate-pulse mb-6" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#1a103c] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">Trending Games (Weekly)</h1>
            </div>
            <p className="text-gray-400">The hottest games trending this week</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#9d4edd]/20 to-[#120b22] border border-[#9d4edd]/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Weekly Downloads</span>
              </div>
              <p className="text-2xl font-bold text-white">{(weeklyDownloads / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{items.length.toLocaleString()}</p>
            </div>
          </div>

          {trendingGames.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Top Rising
                  </h3>
                  <div className="space-y-3">
                    {trendingGames.slice(0, 5).map((game, index) => (
                      <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 p-3 bg-[#120b22] border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 transition-all group">
                        <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                          <div className={`absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-white text-[7px] font-bold uppercase z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                            {game.category === "Android Games" ? "APK" : "PC"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white bg-green-500">
                              {index + 1}
                            </span>
                            <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#9d4edd] transition-colors">
                              {game.title}
                            </h4>
                          </div>
                          <p className="text-gray-500 text-xs">{game.size}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <h3 className="text-xl font-bold text-white mb-4">Trending Games</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {trendingGames.slice(0, 16).map((game, index) => (
                      <Link key={game.id} href={`/game/${game.id}`} className="group relative">
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                            {game.category === "Android Games" ? "ANDROID" : "PC"}
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#9d4edd]/90 text-white text-xs font-bold rounded flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            TRENDING
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-white text-sm font-medium mt-2 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">
                          {game.title}
                        </h4>
                        <p className="text-gray-500 text-xs">{game.size}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">All Trending</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                  {trendingGames.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                          {game.category === "Android Games" ? "ANDROID" : "PC"}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-white text-xs font-medium mt-1.5 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">
                        {game.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No Trending Games Yet</h2>
              <p className="text-gray-500">Set trending games in the admin panel to display them here.</p>
            </div>
          )}
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
