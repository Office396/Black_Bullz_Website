"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Star, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { gameData, getAllGames } from "@/lib/game-data"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export function MainContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["all", "pc-games", "android-games", "software"].includes(tabParam)) {
      setActiveTab(tabParam)
      setCurrentPage(1)
    }
  }, [searchParams])

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
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/?${params.toString()}`)
  }

  const getCurrentItems = () => {
    if (activeTab === "all") {
      return getAllGames()
    }
    return gameData[activeTab] || []
  }

  const currentItems = getCurrentItems()

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance mb-4">
            Welcome to <span className="text-primary">Black Bulls</span>
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Your ultimate destination for free PC games, Android games, and software downloads. Discover the latest
            releases and trending titles.
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-8 mx-auto">
            <TabsTrigger value="all" className="text-sm font-medium px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="pc-games" className="text-sm font-medium px-3">
              <span className="block sm:hidden">PC</span>
              <span className="hidden sm:block">PC Games</span>
            </TabsTrigger>
            <TabsTrigger value="android-games" className="text-sm font-medium px-3">
              <span className="block sm:hidden">Android</span>
              <span className="hidden sm:block">Android Games</span>
            </TabsTrigger>
            <TabsTrigger value="software" className="text-sm font-medium px-3">
              Software
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {getCurrentPageItems(currentItems).map((item, index) => (
                <Link key={index} href={`/game/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer w-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-36 sm:h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                          {item.size}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">{renderStars(item.rating)}</div>
                        <span className="text-xs text-muted-foreground">({item.rating})</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <Download className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{item.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <Button className="w-full text-xs sm:text-sm h-8 sm:h-9" size="sm">
                        <Download className="h-3 w-3 mr-2" />
                        Download Now
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {getTotalPages(currentItems) > 1 && (
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
                  {Array.from({ length: getTotalPages(currentItems) }, (_, i) => i + 1).map((page) => (
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
                  disabled={currentPage === getTotalPages(currentItems)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
