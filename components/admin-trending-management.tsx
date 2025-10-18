"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TrendingUp, Search, Plus } from "lucide-react"
import Image from "next/image"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  rating: number
  size: string
  description: string
  developer: string
  trending?: boolean
  latest?: boolean
}

export function AdminTrendingManagement() {
  const [items, setItems] = useState<GameItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const toggleTrending = async (itemId: number, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
          trending: !currentStatus
        }),
      })

      const result = await response.json()
      if (result.success) {
        fetchItems() // Refresh the list
      } else {
        alert("Failed to update trending status: " + result.error)
      }
    } catch (error) {
      console.error("Error updating trending status:", error)
      alert("Failed to update trending status")
    }
  }


  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const searchTerm = searchQuery.toLowerCase()
    return items.filter((item) =>
      item.title?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm) ||
      item.developer?.toLowerCase().includes(searchTerm)
    )
  }, [items, searchQuery])

  const trendingItems = items.filter(item => item.trending).slice(0, 7)
  const allItems = filteredItems

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by title, category, or developer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </CardContent>
      </Card>

      {/* Trending Items */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Items ({trendingItems.length}/7 max)
          </CardTitle>
          <p className="text-gray-400 text-sm mt-1">
            These items appear in the trending section on the home page. Maximum 7 items allowed.
          </p>
        </CardHeader>
        <CardContent>
          {trendingItems.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No trending items</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingItems.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-orange-500/20">
                  <div className="flex gap-3 mb-3">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm truncate">{item.title}</h4>
                      <p className="text-gray-400 text-xs">{item.developer}</p>
                      <Badge className="bg-red-600 text-white text-xs mt-1">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleTrending(item.id, item.trending || false)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Remove from Trending
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Trending */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-500" />
            Add Items to Trending
          </CardTitle>
          <p className="text-gray-400 text-sm mt-1">
            Search and select items to add to the trending section. Maximum 7 items allowed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search items by title, category, or developer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="max-h-96 overflow-y-auto">
              {allItems.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No items found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allItems.map((item) => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex gap-3 mb-3">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          width={50}
                          height={50}
                          className="rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm truncate">{item.title}</h4>
                          <p className="text-gray-400 text-xs">{item.developer}</p>
                          <Badge className="bg-red-600 text-white text-xs mt-1">{item.category}</Badge>
                          {item.trending && <Badge className="bg-orange-600 text-white text-xs mt-1 ml-1">Trending</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.trending ? (
                          <Button
                            onClick={() => toggleTrending(item.id, item.trending || false)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Remove from Trending
                          </Button>
                        ) : (
                          <Button
                            onClick={() => toggleTrending(item.id, item.trending || false)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                            disabled={trendingItems.length >= 7}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Add to Trending
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}