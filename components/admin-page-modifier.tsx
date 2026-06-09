"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Gamepad2, TrendingUp, Star, Grid3x3, Save, AlertCircle } from "lucide-react"
import { CarouselEditor } from "@/components/admin-carousel-editor"
import { TrendingGamesEditor } from "@/components/admin-trending-games-editor"
import { GameOfTheDayEditor } from "@/components/admin-gotd-editor"
import { CollectionsEditor } from "@/components/admin-collections-editor"
import { AdminSetupChecker } from "@/components/admin-setup-checker"
import { AdminDebugPanel } from "@/components/admin-debug-panel"

interface Game {
  id: number
  title: string
  image: string
  category: string
  trending?: boolean
}

interface CarouselItem {
  id: string
  gameId: number
  landscapeImage: string
  logoImage: string
  order: number
}

interface TrendingGame {
  gameId: number
  order: number
}

interface GameOfTheDay {
  gameId: number
  trailerUrl: string
}

interface Collection {
  id: string
  name: string
  gameIds: number[]
  order: number
}

const pages = [
  { value: "home", label: "Home Page", icon: Home },
]

export function AdminPageModifier() {
  const [selectedPage, setSelectedPage] = useState("home")
  const [games, setGames] = useState<Game[]>([])
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([])
  const [gameOfTheDay, setGameOfTheDay] = useState<GameOfTheDay | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Fetch all games
  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    if (selectedPage === "home" && games.length > 0) {
      fetchHomePageData()
    }
  }, [selectedPage, games])

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/items")
      const result = await response.json()
      if (result.success) {
        setGames(result.data)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    }
  }

  const fetchHomePageData = async () => {
    setLoading(true)
    try {
      // Fetch carousel data
      const carouselRes = await fetch("/api/admin/carousel")
      if (carouselRes.ok) {
        const data = await carouselRes.json()
        const items = data.items || []
        
        // If no carousel items exist, initialize with first 8 games (matching hero-carousel.tsx behavior)
        if (items.length === 0 && games.length > 0) {
          const defaultCarousel = games.slice(0, 8).map((game, index) => ({
            id: `default-${game.id}`,
            gameId: game.id,
            landscapeImage: game.image,
            logoImage: "",
            order: index
          }))
          setCarouselItems(defaultCarousel)
        } else {
          setCarouselItems(items)
        }
      }

      // Fetch trending games
      const trendingRes = await fetch("/api/admin/trending-games")
      if (trendingRes.ok) {
        const data = await trendingRes.json()
        const trendingGamesData = data.games || []
        
        // If no trending games exist, initialize with games marked as trending
        if (trendingGamesData.length === 0 && games.length > 0) {
          const defaultTrending = games
            .filter(g => g.trending === true)
            .slice(0, 12)
            .map((game, index) => ({
              gameId: game.id,
              order: index
            }))
          setTrendingGames(defaultTrending)
        } else {
          setTrendingGames(trendingGamesData)
        }
      }

      // Fetch game of the day
      const gotdRes = await fetch("/api/admin/game-of-the-day")
      if (gotdRes.ok) {
        const data = await gotdRes.json()
        setGameOfTheDay(data.game || null)
      }

      // Fetch collections
      const collectionsRes = await fetch("/api/admin/collections")
      if (collectionsRes.ok) {
        const data = await collectionsRes.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error("Error fetching home page data:", error)
    }
    setLoading(false)
  }

  const saveChanges = async () => {
    setLoading(true)
    console.log('=== SAVING CHANGES ===')
    console.log('Carousel items:', carouselItems.length)
    console.log('Trending games:', trendingGames.length)
    console.log('Game of the day:', gameOfTheDay)
    console.log('Collections:', collections.length)
    
    try {
      if (selectedPage === "home") {
        // Save all home page data
        const results = await Promise.allSettled([
          fetch("/api/admin/carousel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: carouselItems }),
          }),
          fetch("/api/admin/trending-games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ games: trendingGames }),
          }),
          fetch("/api/admin/game-of-the-day", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game: gameOfTheDay }),
          }),
          fetch("/api/admin/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collections }),
          }),
        ])

        console.log('API Results:', results)

        // Check if any failed
        const failed = results.filter(r => r.status === 'rejected')
        const responses = await Promise.all(
          results
            .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
            .map(r => r.value.json())
        )
        
        console.log('API Responses:', responses)
        
        const hasErrors = responses.some(r => r.success === false)
        
        if (failed.length > 0 || hasErrors) {
          console.error('Some saves failed:', { failed, responses })
          alert("⚠️ Warning: Some changes may not have been saved.\n\nPlease make sure you've run the database migration.\nSee database/page_modifiers_table.sql")
        } else {
          setHasUnsavedChanges(false)
          console.log('✅ All changes saved successfully')
          alert("✅ Changes saved successfully!")
          // Reload data to confirm
          fetchHomePageData()
        }
      }
    } catch (error) {
      console.error("Error saving changes:", error)
      alert("❌ Error saving changes.\n\nPlease check:\n1. Database migration is complete\n2. Supabase connection is working\n3. Browser console for details")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Setup Checker */}
      <AdminSetupChecker />

      {/* Debug Panel */}
      <AdminDebugPanel
        carouselItems={carouselItems}
        trendingGames={trendingGames}
        gameOfTheDay={gameOfTheDay}
        collections={collections}
      />

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-orange-200 font-semibold">You have unsaved changes!</p>
            <p className="text-orange-300 text-sm">Click "Save All Changes" to persist your modifications.</p>
          </div>
        </div>
      )}

      {/* Page Selector */}
      <Card className="bg-[#120b22] border-[#2d1b54]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-[#9d4edd]" />
            Page Modifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-gray-400 font-medium min-w-[120px]">Select Page:</label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="bg-[#1a103c] border-[#2d1b54] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#120b22] border-[#2d1b54]">
                {pages.map((page) => {
                  const Icon = page.icon
                  return (
                    <SelectItem key={page.value} value={page.value} className="text-white hover:bg-[#9d4edd]/20">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {page.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={saveChanges}
            disabled={loading}
            className={`w-full ${hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' : 'bg-[#9d4edd] hover:bg-[#7b2cbf]'} text-white`}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : hasUnsavedChanges ? "Save Changes (Unsaved!)" : "Save All Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Home Page Editor */}
      {selectedPage === "home" && (
        <Tabs defaultValue="carousel" className="space-y-4">
          <TabsList className="bg-[#120b22] border border-[#2d1b54]">
            <TabsTrigger value="carousel">Hero Carousel</TabsTrigger>
            <TabsTrigger value="trending">Trending Games</TabsTrigger>
            <TabsTrigger value="gotd">Game of the Day</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          {/* Carousel Editor */}
          <TabsContent value="carousel">
            <CarouselEditor
              items={carouselItems}
              games={games}
              onChange={(items) => {
                setCarouselItems(items)
                setHasUnsavedChanges(true)
              }}
            />
          </TabsContent>

          {/* Trending Games Editor */}
          <TabsContent value="trending">
            <TrendingGamesEditor
              trendingGames={trendingGames}
              games={games}
              onChange={(games) => {
                setTrendingGames(games)
                setHasUnsavedChanges(true)
              }}
            />
          </TabsContent>

          {/* Game of the Day Editor */}
          <TabsContent value="gotd">
            <GameOfTheDayEditor
              gameOfTheDay={gameOfTheDay}
              games={games}
              onChange={(game) => {
                setGameOfTheDay(game)
                setHasUnsavedChanges(true)
              }}
            />
          </TabsContent>

          {/* Collections Editor */}
          <TabsContent value="collections">
            <CollectionsEditor
              collections={collections}
              games={games}
              onChange={(collections) => {
                setCollections(collections)
                setHasUnsavedChanges(true)
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
