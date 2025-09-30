"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminItemForm } from "@/components/admin-item-form"
import { Edit, Trash2, Eye } from "lucide-react"
import Image from "next/image"

const mockItems = [
  {
    id: 1,
    title: "Grand Theft Auto V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    developer: "Rockstar Games",
    description: "Open world action-adventure game set in Los Santos.",
    size: "65 GB",
    rating: 4.8,
    dateAdded: "2024-01-15",
  },
  {
    id: 2,
    title: "Adobe Photoshop 2024",
    category: "Software",
    image: "/adobe-photoshop-icon.jpg",
    developer: "Adobe Inc.",
    description: "Professional image editing and graphic design software.",
    size: "3.2 GB",
    rating: 4.9,
    dateAdded: "2024-01-10",
  },
  {
    id: 3,
    title: "PUBG Mobile",
    category: "Android Games",
    image: "/pubg-mobile-game-cover.jpg",
    developer: "Tencent Games",
    description: "Battle royale game for mobile devices.",
    size: "2.1 GB",
    rating: 4.3,
    dateAdded: "2024-01-08",
  },
]

interface AdminItemListProps {
  searchQuery: string
}

export function AdminItemList({ searchQuery }: AdminItemListProps) {
  const [items, setItems] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      const result = await response.json()
      if (result.success) {
        setItems(result.data)
      } else {
        console.error("Failed to fetch items:", result.error)
        // Fallback to mock data if API fails
        setItems(mockItems)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      setItems(mockItems)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.developer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch("/api/items", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        })
        const result = await response.json()
        if (result.success) {
          fetchItems() // Refetch items
        } else {
          alert("Failed to delete item: " + result.error)
        }
      } catch (error) {
        console.error("Error deleting item:", error)
        alert("Failed to delete item. Please try again.")
      }
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
  }

  const handleSaveEdit = () => {
    fetchItems()
    setEditingItem(null)
  }

  if (editingItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Edit Item</h3>
          <Button
            onClick={() => setEditingItem(null)}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
        </div>
        <AdminItemForm editItem={editingItem} onSave={handleSaveEdit} />
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          {searchQuery ? `No items found matching "${searchQuery}"` : "No items found. Add some items to get started."}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.developer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white">{item.category}</Badge>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => window.open(`/game/${item.id}`, "_blank")}
                          size="sm"
                          variant="outline"
                          className="bg-gray-600 border-gray-500 text-gray-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(item)}
                          size="sm"
                          variant="outline"
                          className="bg-gray-600 border-gray-500 text-blue-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          size="sm"
                          variant="outline"
                          className="bg-gray-600 border-gray-500 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Size: {item.size}</span>
                    <span>Rating: {item.rating}/5</span>
                    <span>Added: {item.dateAdded || new Date(item.id).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
