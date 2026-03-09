"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Clock, Calendar, Download, TrendingUp } from "lucide-react"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  size?: string
  uploadDate?: string
  releaseDate?: string
  updatedDate?: string
}

export default function RecentUpdatesPage() {
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

  const recentGames = [...items]
    .sort((a, b) => {
      // Priority: updatedDate > uploadDate > releaseDate > game ID (for newly added games without dates)
      // This ensures the most recently added or edited games appear first
      const dateA = new Date(a.updatedDate || a.uploadDate || a.releaseDate || 0).getTime()
      const dateB = new Date(b.updatedDate || b.uploadDate || b.releaseDate || 0).getTime()
      
      // If dates are equal (or both missing), sort by ID (higher ID = newer)
      if (dateA === dateB) {
        return b.id - a.id
      }
      
      return dateB - dateA // Newest first
    })

  const groupedByDate = recentGames.reduce((acc, game) => {
    // Use the most recent date available (updatedDate > uploadDate > releaseDate)
    const gameDate = game.updatedDate || game.uploadDate || game.releaseDate
    
    let date: string
    if (gameDate) {
      date = new Date(gameDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else {
      // For games without any date, group them as "Recently Added"
      date = "Recently Added (No Date)"
    }
    
    if (!acc[date]) acc[date] = []
    acc[date].push(game)
    return acc
  }, {} as Record<string, GameItem[]>)

  const totalGames = items.length
  const updatesThisWeek = Math.min(50, items.length)
  const daysActive = 365

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="h-10 w-64 bg-[#1a103c] rounded animate-pulse mb-6" />
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-[#1a103c] rounded-xl animate-pulse" />
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
            <h1 className="text-3xl font-bold text-white mb-2">Recent Updates</h1>
            <p className="text-gray-400">Your Daily Dose of Wait, They Updated AGAIN?!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalGames.toLocaleString()}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Updates This Week</span>
              </div>
              <p className="text-2xl font-bold text-white">{updatesThisWeek}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Days Active</span>
              </div>
              <p className="text-2xl font-bold text-white">{daysActive}</p>
            </div>
          </div>

          {Object.entries(groupedByDate).map(([date, games]) => (
            <div key={date} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[#9d4edd]" />
                <h2 className="text-lg font-bold text-white">{date}</h2>
                <span className="text-gray-500 text-sm">({games.length} updates)</span>
              </div>
              <div className="space-y-3">
                {games.map((game) => (
                  <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-4 p-4 bg-[#120b22] border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 transition-all group">
                    <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                      <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-white text-[7px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                        {game.category === "Android Games" ? "APK" : "PC"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium group-hover:text-[#9d4edd] transition-colors line-clamp-1">
                          {game.title}
                        </h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${game.category === "Android Games" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {game.category === "Android Games" ? "ANDROID" : "PC"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-500 text-sm">{game.category}</span>
                        {game.size && <span className="text-gray-600 text-xs">•</span>}
                        {game.size && <span className="text-gray-500 text-sm">{game.size}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-2.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                        Updated
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}