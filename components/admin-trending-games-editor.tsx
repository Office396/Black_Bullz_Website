"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MoveUp, MoveDown, TrendingUp, Search } from "lucide-react"

interface Game {
  id: number
  title: string
  image: string
  category: string
}

interface TrendingGame {
  gameId: number
  order: number
}

interface TrendingGamesEditorProps {
  trendingGames: TrendingGame[]
  games: Game[]
  onChange: (games: TrendingGame[]) => void
}

export function TrendingGamesEditor({ trendingGames, games, onChange }: TrendingGamesEditorProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [gameSearch, setGameSearch] = useState("")

  const filteredGames = useMemo(() => {
    if (!gameSearch.trim()) return games
    const search = gameSearch.toLowerCase()
    return games.filter(game => 
      game.title.toLowerCase().includes(search) ||
      game.category.toLowerCase().includes(search)
    )
  }, [games, gameSearch])

  const addTrendingGame = () => {
    if (!selectedGameId) {
      alert("Please select a game")
      return
    }

    if (trendingGames.some(g => g.gameId === selectedGameId)) {
      alert("This game is already in trending")
      return
    }

    const newGame: TrendingGame = {
      gameId: selectedGameId,
      order: trendingGames.length,
    }

    onChange([...trendingGames, newGame])
    setSelectedGameId(null)
    setGameSearch("")
  }

  const removeGame = (gameId: number) => {
    onChange(trendingGames.filter(g => g.gameId !== gameId))
  }

  const moveGame = (index: number, direction: "up" | "down") => {
    const newGames = [...trendingGames]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newGames.length) return
    
    [newGames[index], newGames[targetIndex]] = [newGames[targetIndex], newGames[index]]
    newGames.forEach((game, idx) => game.order = idx)
    
    onChange(newGames)
  }

  const getGame = (gameId: number) => {
    return games.find(g => g.id === gameId)
  }

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#9d4edd]" />
          Trending Games Manager
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Manage which games appear in the trending section on the home page.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Game */}
        <div className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#9d4edd]" />
            Add Game to Trending
          </h3>
          
          <div className="flex gap-4">
            <Select 
              value={selectedGameId?.toString() || ""} 
              onValueChange={(v) => {
                if (v) setSelectedGameId(Number(v))
              }}
            >
              <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white flex-1">
                <SelectValue placeholder="Choose a game..." />
              </SelectTrigger>
              <SelectContent className="bg-[#120b22] border-[#2d1b54] max-h-[300px]">
                <div className="sticky top-0 p-2 bg-[#120b22] border-b border-[#2d1b54] z-50">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input
                      placeholder="Search games..."
                      value={gameSearch}
                      onChange={(e) => {
                        e.stopPropagation()
                        setGameSearch(e.target.value)
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="pl-8 bg-[#1a103c] border-[#2d1b54] text-white text-sm h-8"
                    />
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredGames.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No games found</div>
                  ) : (
                    filteredGames.map((game) => (
                      <SelectItem key={game.id} value={game.id.toString()} className="text-white hover:bg-[#9d4edd]/20">
                        {game.title}
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>

            <Button
              onClick={addTrendingGame}
              className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Current Trending Games */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Current Trending Games ({trendingGames.length})</h3>
          
          {trendingGames.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No trending games yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trendingGames.sort((a, b) => a.order - b.order).map((trendingGame, index) => {
                const game = getGame(trendingGame.gameId)
                if (!game) return null

                return (
                  <div
                    key={trendingGame.gameId}
                    className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg flex items-center gap-4"
                  >
                    {/* Game Image */}
                    <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-black">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{game.title}</h4>
                      <p className="text-gray-400 text-sm">{game.category}</p>
                      <p className="text-gray-500 text-xs">Position: {index + 1}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveGame(index, "up")}
                        disabled={index === 0}
                        className="border-[#2d1b54] text-gray-400 hover:text-white"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveGame(index, "down")}
                        disabled={index === trendingGames.length - 1}
                        className="border-[#2d1b54] text-gray-400 hover:text-white"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeGame(trendingGame.gameId)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
