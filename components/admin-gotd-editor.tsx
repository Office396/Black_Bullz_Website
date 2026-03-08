"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Play, Trash2, Search } from "lucide-react"

interface Game {
  id: number
  title: string
  image: string
  category: string
}

interface GameOfTheDay {
  gameId: number
  trailerUrl: string
}

interface GameOfTheDayEditorProps {
  gameOfTheDay: GameOfTheDay | null
  games: Game[]
  onChange: (game: GameOfTheDay | null) => void
}

export function GameOfTheDayEditor({ gameOfTheDay, games, onChange }: GameOfTheDayEditorProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(gameOfTheDay?.gameId || null)
  const [trailerUrl, setTrailerUrl] = useState(gameOfTheDay?.trailerUrl || "")
  const [gameSearch, setGameSearch] = useState("")

  const filteredGames = useMemo(() => {
    if (!gameSearch.trim()) return games
    const search = gameSearch.toLowerCase()
    return games.filter(game => 
      game.title.toLowerCase().includes(search) ||
      game.category.toLowerCase().includes(search)
    )
  }, [games, gameSearch])

  const setGameOfTheDay = () => {
    if (!selectedGameId || !trailerUrl) {
      alert("Please select a game and provide a trailer URL")
      return
    }

    onChange({
      gameId: selectedGameId,
      trailerUrl,
    })
  }

  const removeGameOfTheDay = () => {
    onChange(null)
    setSelectedGameId(null)
    setTrailerUrl("")
  }

  const getGame = (gameId: number) => {
    return games.find(g => g.id === gameId)
  }

  const currentGame = gameOfTheDay ? getGame(gameOfTheDay.gameId) : null

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Star className="h-5 w-5 text-[#9d4edd]" />
          Game of the Day Manager
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Set the featured game of the day with a trailer that plays in the transparent section.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Game of the Day */}
        {currentGame && (
          <div className="p-4 bg-[#1a103c] border border-[#9d4edd]/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Current Game of the Day</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={removeGameOfTheDay}
                className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={currentGame.image}
                alt={currentGame.title}
                className="w-20 h-28 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">{currentGame.title}</h4>
                <p className="text-gray-400 text-sm">{currentGame.category}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Play className="h-4 w-4" />
                  <span className="truncate">{gameOfTheDay?.trailerUrl}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set New Game of the Day */}
        <div className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg space-y-4">
          <h3 className="text-white font-semibold">
            {currentGame ? "Update" : "Set"} Game of the Day
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Select Game</label>
              <Select value={selectedGameId?.toString()} onValueChange={(v) => setSelectedGameId(Number(v))}>
                <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white">
                  <SelectValue placeholder="Choose a game..." />
                </SelectTrigger>
                <SelectContent className="bg-[#120b22] border-[#2d1b54] max-h-[300px]">
                  <div className="sticky top-0 p-2 bg-[#120b22] border-b border-[#2d1b54]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search games..."
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        className="pl-8 bg-[#1a103c] border-[#2d1b54] text-white text-sm h-8"
                        onClick={(e) => e.stopPropagation()}
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
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Trailer URL (YouTube/Video)</label>
              <Input
                placeholder="https://www.youtube.com/embed/..."
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                className="bg-[#120b22] border-[#2d1b54] text-white"
              />
              <p className="text-xs text-gray-500">
                Use YouTube embed URL or direct video link. The trailer will play in the transparent section.
              </p>
            </div>
          </div>

          <Button
            onClick={setGameOfTheDay}
            className="w-full bg-[#9d4edd] hover:bg-[#7b2cbf] text-white"
          >
            <Star className="h-4 w-4 mr-2" />
            {currentGame ? "Update" : "Set"} Game of the Day
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
