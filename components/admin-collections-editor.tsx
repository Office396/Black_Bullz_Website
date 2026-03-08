"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Grid3x3, X, Search } from "lucide-react"

interface Game {
  id: number
  title: string
  image: string
  category: string
}

interface Collection {
  id: string
  name: string
  gameIds: number[]
  order: number
}

interface CollectionsEditorProps {
  collections: Collection[]
  games: Game[]
  onChange: (collections: Collection[]) => void
}

export function CollectionsEditor({ collections, games, onChange }: CollectionsEditorProps) {
  const [newCollectionName, setNewCollectionName] = useState("")
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [gameSearches, setGameSearches] = useState<Record<string, string>>({})

  const getFilteredGames = (collectionId: string) => {
    const search = gameSearches[collectionId] || ""
    if (!search.trim()) return games
    const searchLower = search.toLowerCase()
    return games.filter(game => 
      game.title.toLowerCase().includes(searchLower) ||
      game.category.toLowerCase().includes(searchLower)
    )
  }

  const setGameSearch = (collectionId: string, value: string) => {
    setGameSearches(prev => ({ ...prev, [collectionId]: value }))
  }

  const createCollection = () => {
    if (!newCollectionName.trim()) {
      alert("Please enter a collection name")
      return
    }

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName,
      gameIds: [],
      order: collections.length,
    }

    onChange([...collections, newCollection])
    setNewCollectionName("")
  }

  const deleteCollection = (id: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      onChange(collections.filter(c => c.id !== id))
    }
  }

  const addGameToCollection = (collectionId: string) => {
    if (!selectedGameId) {
      alert("Please select a game")
      return
    }

    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        if (c.gameIds.includes(selectedGameId)) {
          alert("This game is already in the collection")
          return c
        }
        return { ...c, gameIds: [...c.gameIds, selectedGameId] }
      }
      return c
    })

    onChange(updatedCollections)
    setSelectedGameId(null)
  }

  const removeGameFromCollection = (collectionId: string, gameId: number) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, gameIds: c.gameIds.filter(id => id !== gameId) }
      }
      return c
    })

    onChange(updatedCollections)
  }

  const getGame = (gameId: number) => {
    return games.find(g => g.id === gameId)
  }

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-[#9d4edd]" />
          Collections Manager
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Create game series/collections. Games will display with the existing animation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Collection */}
        <div className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#9d4edd]" />
            Create New Collection
          </h3>
          
          <div className="flex gap-4">
            <Input
              placeholder="Collection name (e.g., Grand Theft Auto Series)"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="bg-[#120b22] border-[#2d1b54] text-white flex-1"
            />
            <Button
              onClick={createCollection}
              className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Existing Collections */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Collections ({collections.length})</h3>
          
          {collections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Grid3x3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No collections yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="p-4 bg-[#1a103c] border border-[#2d1b54] rounded-lg space-y-4"
                >
                  {/* Collection Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold text-lg">{collection.name}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCollection(collection.id)}
                      className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Add Game to Collection */}
                  <div className="flex gap-2">
                    <Select value={selectedGameId?.toString()} onValueChange={(v) => setSelectedGameId(Number(v))}>
                      <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white flex-1">
                        <SelectValue placeholder="Add a game..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#120b22] border-[#2d1b54] max-h-[300px]">
                        <div className="sticky top-0 p-2 bg-[#120b22] border-b border-[#2d1b54]">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Search games..."
                              value={gameSearches[collection.id] || ""}
                              onChange={(e) => setGameSearch(collection.id, e.target.value)}
                              className="pl-8 bg-[#1a103c] border-[#2d1b54] text-white text-sm h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {getFilteredGames(collection.id).length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No games found</div>
                          ) : (
                            getFilteredGames(collection.id).map((game) => (
                              <SelectItem key={game.id} value={game.id.toString()} className="text-white hover:bg-[#9d4edd]/20">
                                {game.title}
                              </SelectItem>
                            ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => addGameToCollection(collection.id)}
                      className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Games in Collection */}
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Games in this collection ({collection.gameIds.length})</p>
                    {collection.gameIds.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">No games added yet</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {collection.gameIds.map((gameId) => {
                          const game = getGame(gameId)
                          if (!game) return null

                          return (
                            <div
                              key={gameId}
                              className="relative group bg-[#120b22] border border-[#2d1b54] rounded-lg overflow-hidden"
                            >
                              <img
                                src={game.image}
                                alt={game.title}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2">
                                <p className="text-white text-xs font-medium truncate">{game.title}</p>
                              </div>
                              <button
                                onClick={() => removeGameFromCollection(collection.id, gameId)}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
