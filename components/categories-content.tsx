"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Star, Calendar, ChevronLeft, ChevronRight, Gamepad2, Smartphone, Monitor } from "lucide-react"
import { gameData } from "@/lib/game-data"
import Link from "next/link"

export function CategoriesContent() {
  const [activeTab, setActiveTab] = useState("pc-games")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const getCurrentPageItems = (items: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  const getTotalPages = (items: any[]) => {
    return Math.ceil(items.length / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  const getCategoryStats = (category: string) => {
    const items = gameData[category] || []
    const totalDownloads = items.reduce((sum, item) => {
      const downloads = Number.parseFloat(item.downloads.replace("M", "")) * 1000000
      return sum + downloads
    }, 0)
    return {
      count: items.length,
      totalDownloads: `${(totalDownloads / 1000000).toFixed(1)}M`,
    }
  }

  const categoryInfo = {
    "pc-games": {
      title: "PC Games",
      description:
        "High-quality PC games including AAA titles, indie games, and classic favorites. Experience gaming at its finest with stunning graphics and immersive gameplay.",
      icon: <Monitor className="h-6 w-6" />,
      color: "text-blue-500",
    },
    "android-games": {
      title: "Android Games",
      description:
        "Mobile gaming at your fingertips. From casual puzzle games to intense battle royales, find the perfect game for your Android device.",
      icon: <Smartphone className="h-6 w-6" />,
      color: "text-green-500",
    },
    software: {
      title: "Software",
      description:
        "Essential software and applications for productivity, creativity, and entertainment. From professional tools to everyday utilities.",
      icon: <Gamepad2 className="h-6 w-6" />,
      color: "text-purple-500",
    },
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance mb-4">
            Browse by <span className="text-primary">Categories</span>
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Explore our extensive collection organized by platform and type. Find exactly what you're looking for.
          </p>
        </div>

        {/* Category Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(categoryInfo).map(([key, info]) => {
            const stats = getCategoryStats(key)
            return (
              <Card key={key} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`${info.color}`}>{info.icon}</div>
                    <CardTitle className="text-xl">{info.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 text-pretty">{info.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{stats.count} items</Badge>
                      <Badge variant="outline">{stats.totalDownloads} downloads</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 mx-auto">
            <TabsTrigger value="pc-games" className="text-sm font-medium px-3">
              PC Games
            </TabsTrigger>
            <TabsTrigger value="android-games" className="text-sm font-medium px-3">
              Android Games
            </TabsTrigger>
            <TabsTrigger value="software" className="text-sm font-medium px-3">
              Software
            </TabsTrigger>
          </TabsList>

          {Object.entries(gameData).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentPageItems(items).map((item, index) => (
                  <Link key={index} href={`/game/${item.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                      <div className="relative overflow-hidden">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/50 text-white">
                            {item.size}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 text-balance">{item.title}</h3>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">{renderStars(item.rating)}</div>
                          <span className="text-sm text-muted-foreground">({item.rating})</span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {item.downloads}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </div>

                        <Button className="w-full" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Now
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {getTotalPages(items) > 1 && (
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
                    {Array.from({ length: getTotalPages(items) }, (_, i) => i + 1).map((page) => (
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
                    disabled={currentPage === getTotalPages(items)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  )
}
