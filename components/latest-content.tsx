"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Star, Calendar, ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react"
import { getAllGames } from "@/lib/game-data"
import Link from "next/link"

export function LatestContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Sort all games by date (newest first)
  const allGames = getAllGames().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
    return allGames.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(allGames.length / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
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

  const isNewRelease = (date: string) => {
    const releaseDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - releaseDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 // Consider items from last 7 days as "new"
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-balance">
              Latest <span className="text-primary">Releases</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground text-pretty">
            Stay up to date with the newest games and software. Fresh content added regularly.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{allGames.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </Card>
          <Card className="text-center p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{allGames.filter((game) => isNewRelease(game.date)).length}</span>
            </div>
            <p className="text-sm text-muted-foreground">New This Week</p>
          </Card>
          <Card className="text-center p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Download className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {allGames.reduce((sum, game) => sum + Number.parseFloat(game.downloads.replace("M", "")), 0).toFixed(1)}
                M
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total Downloads</p>
          </Card>
        </div>

        {/* Latest Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getCurrentPageItems().map((item, index) => (
            <Link key={index} href={`/game/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
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
                  {isNewRelease(item.date) && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
                    </div>
                  )}
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
      </div>
    </main>
  )
}
