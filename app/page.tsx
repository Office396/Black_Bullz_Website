"use client"

import { Header } from "@/components/header"
import { HeroCarousel } from "@/components/hero-carousel"
import { SocialBar } from "@/components/social-bar"
import { TrendingSection } from "@/components/trending-section"
import { LatestSection } from "@/components/latest-section"
import { CategoriesSection } from "@/components/categories-section"
import { FeaturedGame } from "@/components/featured-game"
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

  // Derive sub-lists
  const trendingGames = items.filter(g => g.trending === true)
  const featuredGame = items.length > 0
    ? [...items].sort((a, b) => {
      const dA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
      const dB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
      return dB - dA
    })[0]
    : null

  // Loading skeleton
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          {/* Hero skeleton */}
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
            <div className="w-full h-[420px] bg-[#0f1d32] rounded-xl animate-pulse" />
          </div>
          {/* Content skeletons */}
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

      {/* Spacer for fixed header */}
      <div className="pt-16">
        {/* Hero Carousel */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
          <HeroCarousel games={items} />
        </div>

        {/* Social Bar */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <SocialBar />
        </div>

        {/* Trending Games */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <TrendingSection games={trendingGames.length > 0 ? trendingGames : items} />
        </div>

        {/* Latest Games */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <LatestSection games={items} />
        </div>

        {/* Categories */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <CategoriesSection games={items} />
        </div>

        {/* Featured Game of the Day */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <FeaturedGame game={featuredGame} />
        </div>

        {/* Footer */}
        <SiteFooter />
      </div>
    </div>
  )
}
