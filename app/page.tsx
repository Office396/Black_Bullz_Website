"use client"

import { Header } from "@/components/header"
import { HeroCarousel } from "@/components/hero-carousel"
import { SocialBar } from "@/components/social-bar"
import { TrendingSection } from "@/components/trending-section"
import { UpcomingGames } from "@/components/upcoming-games"
import { LatestSection } from "@/components/latest-section"
import { CategoriesSection } from "@/components/categories-section"
import { FeaturedGame } from "@/components/featured-game"
import { EpicCollections } from "@/components/epic-collections"
import { SiteFooter } from "@/components/site-footer"
import { useEffect, useState } from "react"

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
  trending?: boolean
}

export default function HomePage() {
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

  const trendingGames = items.filter(g => g.trending === true)
  const featuredGame = items.length > 0
    ? [...items].sort((a, b) => {
      const dA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
      const dB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
      return dB - dA
    })[0]
    : null

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
            <div className="w-full h-[420px] bg-[#0f1d32] rounded-xl animate-pulse" />
          </div>
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-8 space-y-8">
            <div className="h-6 w-40 bg-[#1a2a44] rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#1a2a44] rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-6 w-40 bg-[#1a2a44] rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#1a2a44] rounded-xl animate-pulse" />
              ))}
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
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
          <HeroCarousel games={items} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <SocialBar />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <TrendingSection games={trendingGames.length > 0 ? trendingGames : items} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <UpcomingGames games={items} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <LatestSection games={items} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <FeaturedGame game={featuredGame} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <EpicCollections />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <CategoriesSection games={items} />
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}