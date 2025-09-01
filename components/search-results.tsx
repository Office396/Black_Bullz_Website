"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Star, Calendar, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { getAllGames } from "@/lib/game-data"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState(query)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const router = useRouter()
  const itemsPerPage = 12

  const allGames = getAllGames()

  const filteredGames = useMemo(() => {
    let results = allGames

    // Filter by search query with enhanced intelligence
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      const searchWords = searchTerm.split(" ").filter((word) => word.length > 0)

      results = results.filter((game) => {
        const searchableText = [
          game.title,
          game.description,
          game.category,
          ...(game.features || []),
          ...(game.requirements || []),
          game.genre || "",
          game.developer || "",
          game.publisher || "",
        ]
          .join(" ")
          .toLowerCase()

        // Exact phrase match gets highest priority
        if (searchableText.includes(searchTerm)) return true

        // All words must be found somewhere in the searchable text
        return searchWords.every((word) => searchableText.includes(word))
      })

      results.sort((a, b) => {
        const aText = a.title.toLowerCase()
        const bText = b.title.toLowerCase()

        // Title exact match first
        if (aText.includes(searchTerm) && !bText.includes(searchTerm)) return -1
        if (!aText.includes(searchTerm) && bText.includes(searchTerm)) return 1

        // Title starts with search term
        if (aText.startsWith(searchTerm) && !bText.startsWith(searchTerm)) return -1
        if (!aText.startsWith(searchTerm) && bText.startsWith(searchTerm)) return 1

        // Sort by rating and downloads as secondary criteria
        if (b.rating !== a.rating) return b.rating - a.rating
        return Number.parseInt(b.downloads.replace(/[^\d]/g, "")) - Number.parseInt(a.downloads.replace(/[^\d]/g, ""))
      })
    }

    // Filter by category
    if (selectedCategory !== "all") {
      results = results.filter((game) => game.category === selectedCategory)
    }

    return results
  }, [query, selectedCategory, allGames])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredGames.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(filteredGames.length / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "pc-games":
        return "PC Games"
      case "android-games":
        return "Android Games"
      case "software":
        return "Software"
      default:
        return category
    }
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "pc-games", label: "PC Games" },
    { value: "android-games", label: "Android Games" },
    { value: "software", label: "Software" },
  ]

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance mb-4">
            Search <span className="text-primary">Results</span>
          </h1>
          {query && (
            <p className="text-lg text-muted-foreground mb-6">
              {filteredGames.length > 0
                ? `Found ${filteredGames.length} result${filteredGames.length === 1 ? "" : "s"} for "${query}"`
                : `No results found for "${query}"`}
            </p>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search games, software, genres..."
                className="pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Category Filters */}
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredGames.length > 0 ? (
          <>
            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getCurrentPageItems().map((item, index) => (
                <Link key={index} href={`/game/${item.id}`}>
                  <Card className="gaming-card overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          {item.size}
                        </Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className="bg-white/90 text-black text-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 text-balance line-clamp-2">{item.title}</h3>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">{renderStars(item.rating)}</div>
                        <span className="text-xs text-muted-foreground">({item.rating})</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {item.downloads}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>

                      <Button className="w-full" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : query ? (
          /* No Results */
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or browse our categories to find what you're looking for.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/categories">
                <Button variant="outline">Browse Categories</Button>
              </Link>
              <Link href="/latest">
                <Button>View Latest</Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty Search */
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start your search</h3>
            <p className="text-muted-foreground">
              Enter a search term above to find games, software, and more from our collection.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
