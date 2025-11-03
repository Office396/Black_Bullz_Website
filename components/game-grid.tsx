"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

// ImageSkeleton component
const ImageSkeleton = ({ src, alt, className = "", fill = true, width, height, priority }: { src: string; alt: string; className?: string; fill?: boolean; width?: number; height?: number; priority?: boolean }) => {
   const [isLoaded, setIsLoaded] = useState(false)
   const [hasError, setHasError] = useState(false)
   const [isLoading, setIsLoading] = useState(true)

   useEffect(() => {
     if (src) {
       setIsLoading(true)
       setHasError(false)
       setIsLoaded(false)

       // Set a timeout to show error after 8 seconds of loading
       const timeoutId = setTimeout(() => {
         if (!isLoaded) {
           setHasError(true)
           setIsLoading(false)
         }
       }, 8000) // 8 seconds timeout

       return () => clearTimeout(timeoutId)
     }
   }, [src, isLoaded])

   return (
     <div className={`relative overflow-hidden ${isLoading && !hasError ? 'bg-gray-700 animate-pulse rounded-lg' : ''} ${className}`}>
       {!hasError && (
         <Image
           src={src}
           alt={alt}
           fill={fill}
           width={fill ? undefined : width}
           height={fill ? undefined : height}
           className="object-cover transition-all duration-300 rounded-lg"
           onLoad={() => {
             setIsLoaded(true)
             setIsLoading(false)
           }}
           onError={() => {
             // Don't immediately set error, let the timeout handle it
             setIsLoading(false)
           }}
           priority={priority}
         />
       )}
       {hasError && (
         <div className={`w-full h-full flex items-center justify-center bg-gray-700 rounded-lg ${fill ? 'absolute inset-0' : ''}`}>
           <div className="text-center text-gray-400">
             <div className="w-8 h-8 mx-auto mb-2 opacity-50">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
             </div>
             <p className="text-xs">Failed to load</p>
           </div>
         </div>
       )}
     </div>
   )
 }
import { Star } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"

interface GameItem {
  id: number
  title: string
  category: string
  image: string
  rating: number
  size: string
  description: string
  releaseDate?: string
  uploadDate?: string
  latest?: boolean
  tab?: string
}


const tabs = [
  { id: "all", label: "All" },
  { id: "pc-games", label: "Free PC Games" },
  { id: "android-games", label: "Free Android Apps" },
  { id: "software", label: "Free Software" },
]

interface GameGridProps {
  filterLatest?: boolean
}

export function GameGrid({ filterLatest = false }: GameGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "all"
  const [currentPage, setCurrentPage] = useState(1)
  const [adminItems, setAdminItems] = useState<GameItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const itemsPerPage = activeTab === "android-games" ? 20 : 12 // Show 20 items per page for Android games, 12 for others

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoaded(false) // Start loading
      try {
        const response = await fetch("/api/items")
        const result = await response.json()
        if (result.success) {
          setAdminItems(result.data)
        } else {
          console.error("Failed to fetch items:", result.error)
        }
      } catch (error) {
        console.error("Error fetching items:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchItems()
  }, [])

  const allGames = useMemo(() => 
    adminItems.map((item) => ({
      ...item,
      tab: item.category === "PC Games" ? "pc-games" : item.category === "Android Games" ? "android-games" : "software",
    })),
    [adminItems]
  )

  const filteredGames = useMemo(() => {
    let games = activeTab === "all" ? allGames : allGames.filter((game) => game.tab === activeTab)

    if (filterLatest) {
      games = games.filter((game) => game.latest)
      // Sort latest items by upload date (newest first)
      games.sort((a, b) => {
        const dateA = new Date(a.uploadDate || a.releaseDate || 0).getTime()
        const dateB = new Date(b.uploadDate || b.releaseDate || 0).getTime()
        return dateB - dateA
      })
    }

    return games
  }, [allGames, activeTab, filterLatest])

  const totalPages = Math.ceil(filteredGames.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGames = filteredGames.slice(startIndex, startIndex + itemsPerPage)

  const handleTabChange = (tabId: string) => {
    setCurrentPage(1)
    if (tabId === "all") {
      router.push("/")
    } else {
      router.push(`/?tab=${tabId}`)
    }
  }
  // Don't render anything until the initial load is complete
  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-800 h-8 w-32 rounded"></div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!filterLatest && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const count = tab.id === "all" 
              ? allGames.length 
              : allGames.filter((g) => g.tab === tab.id).length
            return (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                variant={activeTab === tab.id ? "default" : "outline"}
                className={`${
                  activeTab === tab.id
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.label} ({count})
              </Button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {filterLatest
            ? "Latest Items"
            : activeTab === "all"
              ? "Latest Games & Software"
              : activeTab === "pc-games"
                ? "Free PC Games"
                : activeTab === "android-games"
                  ? "Free Android Apps"
                  : "Free Software"}
        </h1>
      </div>

      <div
        className={`grid gap-2 sm:gap-3 ${
          activeTab === "android-games"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
        } max-w-[1400px] mx-auto`}
      >
        {paginatedGames.map((game) => (
          <Link key={game.id} href={`/game/${game.id}`}>
            <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden p-0 rounded-lg">
              {/* Image container — must be first child so it sits flush at the top of the card */}
              <div className="relative aspect-[3/3] w-full overflow-hidden bg-gray-700 animate-pulse">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  fill
                  className="absolute inset-0 w-full h-full object-cover object-top block group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, 30vw"
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = parent.className.replace('bg-gray-700 animate-pulse', 'bg-gray-800');
                    }
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = parent.className.replace('bg-gray-700 animate-pulse', 'bg-gray-700');
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'w-full h-full flex items-center justify-center bg-gray-700 rounded-lg absolute inset-0';
                      errorDiv.innerHTML = `
                        <div class="text-center text-gray-400">
                          <div class="w-8 h-8 mx-auto mb-2 opacity-50">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p class="text-xs">Failed to load</p>
                        </div>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                <Badge className="absolute top-1 right-1 bg-red-600 text-white text-[13px] px-1 py-0 z-10">
                  {game.category}
                </Badge>
              </div>
              <CardContent className="p-1.5">
                <div className="flex flex-col gap-1">
                  <h3
                    className={`text-white font-bold group-hover:text-red-400 transition-colors line-clamp-1 ${
                      activeTab === "android-games" ? "text-xs" : "text-sm"
                    }`}
                  >
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] text-gray-400">{game.rating || 4.0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && paginatedGames.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            {/* First page button */}
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              First
            </Button>
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous
            </Button>

            {/* Page numbers */}
            {(() => {
              const pages: (number | string)[] = []

              if (totalPages <= 7) {
                // Show all pages if 7 or fewer
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i)
                }
              } else {
                // Always show first 4 pages
                for (let i = 1; i <= Math.min(4, totalPages); i++) {
                  pages.push(i)
                }

                // Determine if we need ellipsis and where
                const startRange = currentPage - 1
                const endRange = currentPage + 1

                // Add ellipsis before middle section if needed
                if (startRange > 5) {
                  pages.push('...')
                }

                // Add middle section around current page (if not already included)
                for (let i = Math.max(5, startRange); i <= Math.min(endRange, totalPages - 2); i++) {
                  if (!pages.includes(i)) {
                    pages.push(i)
                  }
                }

                // Add ellipsis before last pages if needed
                if (endRange < totalPages - 2) {
                  pages.push('...')
                }

                // Always show last 2 pages (if not already included)
                for (let i = Math.max(totalPages - 1, 5); i <= totalPages; i++) {
                  if (!pages.includes(i)) {
                    pages.push(i)
                  }
                }
              }

              return pages.map((page, index) => (
                typeof page === 'number' ? (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                )
              ))
            })()}

            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Next
            </Button>
            {/* Last page button */}
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
