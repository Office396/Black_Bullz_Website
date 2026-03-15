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
import { getItems } from "@/lib/server/items-store"
import { getPageModifierData, type PageModifierData } from "@/lib/server/page-modifier-store"

export default async function HomePage() {
  let items: any[] = []
  let pageModifiers: PageModifierData = { carousel: [], trendingGames: [], gameOfTheDay: null, collections: [] }

  try {
    const [itemsData, modifiersData] = await Promise.all([
      getItems(),
      getPageModifierData()
    ])
    items = itemsData
    pageModifiers = modifiersData
  } catch (error) {
    console.error("Error fetching home page data:", error)
  }

  // Get carousel games based on admin settings or fallback to first 8
  const carouselGames = pageModifiers.carousel.length > 0
    ? (pageModifiers.carousel as any[])
        .sort((a, b) => a.order - b.order)
        .map((item: any) => items.find((g) => g.id === item.gameId))
        .filter(Boolean)
    : items.slice(0, 8)

  // Get trending games based on admin settings or fallback to trending flag
  const trendingGames = pageModifiers.trendingGames.length > 0
    ? (pageModifiers.trendingGames as any[])
        .sort((a, b) => a.order - b.order)
        .map((item: any) => items.find((g) => g.id === item.gameId))
        .filter(Boolean)
    : items.filter((g) => g.trending === true)

  // Get featured game (game of the day or latest)
  const featuredGame = pageModifiers.gameOfTheDay
    ? items.find((g) => g.id === (pageModifiers.gameOfTheDay as any).gameId)
    : items.length > 0
    ? [...items].sort((a, b) => {
        const dA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
        const dB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
        return dB - dA
      })[0]
    : null

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
