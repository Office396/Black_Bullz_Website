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
  const [pageModifiers, setPageModifiers] = useState<{
    carousel: any[]
    trendingGames: any[]
    gameOfTheDay: any
    collections: any[]
  }>({
    carousel: [],
    trendingGames: [],
    gameOfTheDay: null,
    collections: []
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all games
        const itemsResponse = await fetch("/api/items")
        const itemsResult = await itemsResponse.json()
        if (itemsResult.success) {
          setItems(itemsResult.data)
        }

        // Fetch page modifiers
        const [carouselRes, trendingRes, gotdRes, collectionsRes] = await Promise.all([
          fetch("/api/admin/carousel"),
          fetch("/api/admin/trending-games"),
          fetch("/api/admin/game-of-the-day"),
          fetch("/api/admin/collections")
        ])

        const carousel = await carouselRes.json()
        const trending = await trendingRes.json()
        const gotd = await gotdRes.json()
        const collections = await collectionsRes.json()

        setPageModifiers({
          carousel: carousel.items || [],
          trendingGames: trending.games || [],
          gameOfTheDay: gotd.game || null,
          collections: collections.collections || []
        })

        console.log('=== PAGE MODIFIERS LOADED ===')
        console.log('Carousel items:', carousel.items?.length || 0)
        console.log('Trending games:', trending.games?.length || 0)
        console.log('Collections:', collections.collections?.length || 0)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchData()
  }, [])

  // Get carousel games based on admin settings or fallback to first 8
  const carouselGames = pageModifiers.carousel.length > 0
    ? pageModifiers.carousel
        .sort((a, b) => a.order - b.order)
        .map(item => items.find(g => g.id === item.gameId))
        .filter(Boolean)
    : items.slice(0, 8)

  console.log('=== CAROUSEL DISPLAY ===')
  console.log('Using modifiers:', pageModifiers.carousel.length > 0)
  console.log('Carousel games count:', carouselGames.length)

  // Get trending games based on admin settings or fallback to trending flag
  const trendingGames = pageModifiers.trendingGames.length > 0
    ? pageModifiers.trendingGames
        .sort((a, b) => a.order - b.order)
        .map(item => items.find(g => g.id === item.gameId))
        .filter(Boolean)
    : items.filter(g => g.trending === true)

  // Get featured game (game of the day or latest)
  const featuredGame = pageModifiers.gameOfTheDay
    ? items.find(g => g.id === pageModifiers.gameOfTheDay.gameId)
    : items.length > 0
    ? [...items].sort((a, b) => {
      const dA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
      const dB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
      return dB - dA
    })[0]
    : null

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 pt-6">
            <div className="w-full h-[420px] bg-card rounded-xl animate-pulse" />
          </div>
          <div className="max-w-full mx-auto px-4 lg:px-6 pt-8 space-y-8">
            <div className="h-6 w-40 bg-card rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-card rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-6 w-40 bg-card rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 pt-6">
          <HeroCarousel games={carouselGames} modifiers={pageModifiers.carousel} />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <SocialBar />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <TrendingSection games={trendingGames.length > 0 ? trendingGames : items} />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <UpcomingGames games={items} />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <LatestSection games={items} />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <FeaturedGame 
            game={featuredGame} 
            trailerUrl={pageModifiers.gameOfTheDay?.trailerUrl}
          />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <EpicCollections collections={pageModifiers.collections} allGames={items} />
        </div>

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <CategoriesSection games={items} />
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}