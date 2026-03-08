"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AdminItemForm } from "@/components/admin-item-form"
import { Edit, Trash2, Eye, Star, TrendingUp } from "lucide-react"
import Image from "next/image"

interface AdminItemListProps {
  searchQuery: string
}

const tabs = [
  { id: "all", label: "All" },
  { id: "pc-games", label: "PC Games" },
  { id: "android-games", label: "Android Games" },
]

export function AdminItemList({ searchQuery }: AdminItemListProps) {
  const [items, setItems] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  // Use the searchQuery prop as the single source of truth for global search
  const globalSearch = searchQuery

  const itemsPerPage = 10

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      const result = await response.json()
      if (result.success) {
        setItems(result.data)
      } else {
        console.error("Failed to fetch items:", result.error)
        setItems([])
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      setItems([])
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Calculate cloud providers count for each item
  const itemsWithCloudCount = useMemo(() => {
    return items.map(item => {
      const cloudCount = item.cloudDownloads?.length || 0
      return { ...item, cloudCount }
    })
  }, [items])

  // Global search across all items
  const globalFilteredItems = useMemo(() => {
    if (!globalSearch?.trim()) return itemsWithCloudCount

    const searchTerm = globalSearch.toLowerCase()
    return itemsWithCloudCount.filter((item) =>
      item.title?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm) ||
      item.developer?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.size?.toLowerCase().includes(searchTerm)
    )
  }, [itemsWithCloudCount, globalSearch])

  // Category and search filtering
  const filteredItems = useMemo(() => {
    let filtered = itemsWithCloudCount

    // Apply category filter
    if (activeTab !== "all") {
      const categoryMap: Record<string, string> = {
          "pc-games": "PC Games",
          "android-games": "Android Games",
        }
        filtered = filtered.filter(item => item.category === categoryMap[activeTab])
    }

    // Apply search filter
    if (globalSearch?.trim()) {
      const searchTerm = globalSearch.toLowerCase()
      filtered = filtered.filter((item) =>
        item.title?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm) ||
        item.developer?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.size?.toLowerCase().includes(searchTerm)
      )
    }

    // Sort items by cloud providers count (lowest first, then ascending)
    return filtered.sort((a: any, b: any) => a.cloudCount - b.cloudCount)
  }, [itemsWithCloudCount, globalSearch, activeTab])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage)

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

  if (loading && !initialLoadComplete) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-8 w-32 rounded"></div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-700 rounded w-48"></div>
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                    <div className="h-3 bg-gray-700 rounded w-12"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
        {tabs.map((tab) => {
          const count = tab.id === "all"
            ? itemsWithCloudCount.length
              : itemsWithCloudCount.filter((item) => {
                const categoryMap: Record<string, string> = {
                  "pc-games": "PC Games",
                  "android-games": "Android Games",
                }
                return item.category === categoryMap[tab.id]
              }).length
          return (
            <Button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setCurrentPage(1)
              }}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              className={`${activeTab === tab.id
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                } text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0`}
            >
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
              <span className="ml-1">({count})</span>
            </Button>
          )
        })}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400 mb-4">
        Showing {paginatedItems.length} of {filteredItems.length} items
        {globalSearch && ` (filtered from ${items.length} total)`}
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {paginatedItems.map((item) => (
          <Card key={item.id} className="bg-gray-700 border-gray-600">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  width={70}
                  height={70}
                  className="rounded-lg object-cover flex-shrink-0 mx-auto sm:mx-0"
                />
                <div className="flex-1 space-y-2 min-w-0">
                  {/* Title and badges row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-base md:text-lg truncate">{item.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{item.developer}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                      <Badge className="bg-red-600 text-white text-xs self-start sm:self-center">{item.category}</Badge>
                      <div className="flex gap-1 flex-shrink-0">
                        {item.trending && (
                          <Badge className="bg-orange-600 text-white flex items-center gap-1 text-xs">
                            <TrendingUp className="h-2.5 w-2.5" />
                            <span className="hidden sm:inline">Trending</span>
                          </Badge>
                        )}
                        {item.latest && (
                          <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs">
                            <Star className="h-2.5 w-2.5" />
                            <span className="hidden sm:inline">Latest</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-end sm:justify-start">
                    <Button
                      onClick={() => window.open(`/game/${item.id}`, "_blank")}
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 border-gray-500 text-gray-300 px-2 md:px-3"
                      title="View"
                    >
                      <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline ml-1">View</span>
                    </Button>
                    <Button
                      onClick={() => handleEdit(item)}
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 border-gray-500 text-blue-400 px-2 md:px-3"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline ml-1">Edit</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 border-gray-500 text-red-400 px-2 md:px-3"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline ml-1">Delete</span>
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm line-clamp-2">{item.description}</p>

                  {/* Bottom info */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-400">
                    <span>Size: {item.size}</span>
                    <span>Rating: {item.rating}/5</span>
                    <span>Clouds: {item.cloudCount}</span>
                    <span className="hidden sm:inline">Added: {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : new Date(item.id).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 md:mt-8">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              size="sm"
              className="px-2 md:px-3 py-1 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    size="sm"
                    className={`px-2 md:px-3 py-1 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${currentPage === pageNum ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              size="sm"
              className="px-2 md:px-3 py-1 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
            </Button>
          </div>
        </div>
      )}

      {/* Page info */}
      {totalPages > 1 && (
        <div className="text-center text-xs md:text-sm text-gray-400 mt-3 md:mt-4">
          <span className="hidden sm:inline">Page {currentPage} of {totalPages} ({filteredItems.length} total items)</span>
          <span className="sm:hidden">{currentPage}/{totalPages} ({filteredItems.length})</span>
        </div>
      )}
    </div>
  )
}

