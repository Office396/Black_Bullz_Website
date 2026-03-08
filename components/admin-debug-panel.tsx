"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface DebugPanelProps {
  carouselItems: any[]
  trendingGames: any[]
  gameOfTheDay: any
  collections: any[]
}

export function AdminDebugPanel({ carouselItems, trendingGames, gameOfTheDay, collections }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-yellow-500" />
            Debug Panel (Click to {isOpen ? 'Hide' : 'Show'})
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#1a103c] rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Carousel Items</p>
              <p className="text-white text-2xl font-bold">{carouselItems.length}</p>
            </div>
            <div className="p-3 bg-[#1a103c] rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Trending Games</p>
              <p className="text-white text-2xl font-bold">{trendingGames.length}</p>
            </div>
            <div className="p-3 bg-[#1a103c] rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Game of the Day</p>
              <p className="text-white text-2xl font-bold">{gameOfTheDay ? '✓' : '✗'}</p>
            </div>
            <div className="p-3 bg-[#1a103c] rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Collections</p>
              <p className="text-white text-2xl font-bold">{collections.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-400 text-sm font-semibold">Current State (JSON):</p>
            <div className="bg-black/50 p-3 rounded-lg overflow-auto max-h-[300px]">
              <pre className="text-xs text-green-400">
                {JSON.stringify({
                  carousel: carouselItems,
                  trending: trendingGames,
                  gotd: gameOfTheDay,
                  collections: collections
                }, null, 2)}
              </pre>
            </div>
          </div>

          <Button
            onClick={() => {
              console.log('=== CURRENT STATE ===')
              console.log('Carousel:', carouselItems)
              console.log('Trending:', trendingGames)
              console.log('GOTD:', gameOfTheDay)
              console.log('Collections:', collections)
            }}
            variant="outline"
            className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
          >
            <Bug className="h-4 w-4 mr-2" />
            Log State to Console
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
