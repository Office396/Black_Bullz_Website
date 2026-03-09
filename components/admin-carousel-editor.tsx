"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MoveUp, MoveDown, Image as ImageIcon, Edit, Save, X, Search } from "lucide-react"

interface Game {
  id: number
  title: string
  image: string
  category: string
}

interface CarouselItem {
  id: string
  gameId: number
  landscapeImage: string
  logoImage: string
  order: number
}

interface CarouselEditorProps {
  items: CarouselItem[]
  games: Game[]
  onChange: (items: CarouselItem[]) => void
}

export function CarouselEditor({ items, games, onChange }: CarouselEditorProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [landscapeImage, setLandscapeImage] = useState("")
  const [logoImage, setLogoImage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLandscape, setEditLandscape] = useState("")
  const [editLogo, setEditLogo] = useState("")
  const [editGameId, setEditGameId] = useState<number | null>(null)
  const [gameSearch, setGameSearch] = useState("")
  const [editGameSearch, setEditGameSearch] = useState("")

  const filteredGames = useMemo(() => {
    if (!gameSearch.trim()) return games
    const search = gameSearch.toLowerCase()
    return games.filter(game => 
      game.title.toLowerCase().includes(search) ||
      game.category.toLowerCase().includes(search)
    )
  }, [games, gameSearch])

  const filteredEditGames = useMemo(() => {
    if (!editGameSearch.trim()) return games
    const search = editGameSearch.toLowerCase()
    return games.filter(game => 
      game.title.toLowerCase().includes(search) ||
      game.category.toLowerCase().includes(search)
    )
  }, [games, editGameSearch])

  const addCarouselItem = () => {
    if (!selectedGameId || !landscapeImage) {
      alert("Please select a game and provide a landscape image")
      return
    }

    const newItem: CarouselItem = {
      id: Date.now().toString(),
      gameId: selectedGameId,
      landscapeImage,
      logoImage,
      order: items.length,
    }

    onChange([...items, newItem])
    
    // Clear form
    setSelectedGameId(null)
    setLandscapeImage("")
    setLogoImage("")
    setGameSearch("")
  }

  const startEdit = (item: CarouselItem) => {
    setEditingId(item.id)
    setEditGameId(item.gameId)
    setEditLandscape(item.landscapeImage)
    setEditLogo(item.logoImage)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditGameId(null)
    setEditLandscape("")
    setEditLogo("")
  }

  const saveEdit = (id: string) => {
    if (!editGameId || !editLandscape) {
      alert("Please select a game and provide a landscape image")
      return
    }

    const updatedItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          gameId: editGameId,
          landscapeImage: editLandscape,
          logoImage: editLogo,
        }
      }
      return item
    })

    onChange(updatedItems)
    cancelEdit()
  }

  const removeItem = (id: string) => {
    if (confirm("Are you sure you want to remove this carousel item?")) {
      const newItems = items.filter(item => item.id !== id)
      console.log('Removing item:', id)
      console.log('Items before:', items.length)
      console.log('Items after:', newItems.length)
      onChange(newItems)
    }
  }

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    newItems.forEach((item, idx) => item.order = idx)
    
    onChange(newItems)
  }

  const getGameTitle = (gameId: number) => {
    return games.find(g => g.id === gameId)?.title || "Unknown Game"
  }

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader>
        <CardTitle className="text-white">Hero Carousel Manager</CardTitle>
        <p className="text-gray-400 text-sm">
          Add games to the hero carousel. Upload landscape images (1920x1080) and optional logo images (transparent PNG).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Item Form */}
        <div className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#9d4edd]" />
            Add New Carousel Item
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Select Game</label>
              <Select 
                value={selectedGameId?.toString() || ""} 
                onValueChange={(v) => {
                  if (v) setSelectedGameId(Number(v))
                }}
              >
                <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white">
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
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Landscape Image URL *</label>
              <Input
                placeholder="https://example.com/landscape.jpg"
                value={landscapeImage}
                onChange={(e) => setLandscapeImage(e.target.value)}
                className="bg-[#120b22] border-[#2d1b54] text-white"
              />
              <p className="text-xs text-gray-500">Recommended: 1920x1080px</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-gray-400 text-sm">Logo Image URL (Optional)</label>
              <Input
                placeholder="https://www.steamgriddb.com/logo/..."
                value={logoImage}
                onChange={(e) => setLogoImage(e.target.value)}
                className="bg-[#120b22] border-[#2d1b54] text-white"
              />
              <p className="text-xs text-gray-500">Get logos from: https://www.steamgriddb.com/</p>
            </div>
          </div>

          <Button
            onClick={addCarouselItem}
            className="w-full bg-[#9d4edd] hover:bg-[#7b2cbf] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Carousel
          </Button>
        </div>

        {/* Current Carousel Items */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Current Carousel Items ({items.length})</h3>
          
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No carousel items yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.sort((a, b) => a.order - b.order).map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg"
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">Editing Item</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(item.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="border-[#2d1b54] text-gray-400"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-gray-400 text-sm">Select Game</label>
                          <Select value={editGameId?.toString()} onValueChange={(v) => setEditGameId(Number(v))}>
                            <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#120b22] border-[#2d1b54] max-h-[300px]">
                              <div className="sticky top-0 p-2 bg-[#120b22] border-b border-[#2d1b54]">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                  <Input
                                    placeholder="Search games..."
                                    value={editGameSearch}
                                    onChange={(e) => setEditGameSearch(e.target.value)}
                                    className="pl-8 bg-[#1a103c] border-[#2d1b54] text-white text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto">
                                {filteredEditGames.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500 text-sm">No games found</div>
                                ) : (
                                  filteredEditGames.map((game) => (
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
                          <label className="text-gray-400 text-sm">Landscape Image URL</label>
                          <Input
                            value={editLandscape}
                            onChange={(e) => setEditLandscape(e.target.value)}
                            className="bg-[#120b22] border-[#2d1b54] text-white"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-gray-400 text-sm">Logo Image URL</label>
                          <Input
                            value={editLogo}
                            onChange={(e) => setEditLogo(e.target.value)}
                            className="bg-[#120b22] border-[#2d1b54] text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="relative w-32 h-18 flex-shrink-0 rounded overflow-hidden bg-black">
                        <img
                          src={item.landscapeImage}
                          alt={getGameTitle(item.gameId)}
                          className="w-full h-full object-cover"
                        />
                        {item.logoImage && (
                          <img
                            src={item.logoImage}
                            alt="Logo"
                            className="absolute top-2 left-2 h-8 w-auto drop-shadow-lg"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{getGameTitle(item.gameId)}</h4>
                        <p className="text-gray-400 text-sm">Order: {index + 1}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item)}
                          className="border-[#2d1b54] text-[#9d4edd] hover:bg-[#9d4edd] hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          className="border-[#2d1b54] text-gray-400 hover:text-white"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItem(index, "down")}
                          disabled={index === items.length - 1}
                          className="border-[#2d1b54] text-gray-400 hover:text-white"
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeItem(item.id)}
                          className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
