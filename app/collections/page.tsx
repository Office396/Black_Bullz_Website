"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { CardFan } from "@/components/card-fan"
import { FolderHeart, ChevronRight, Gamepad2 } from "lucide-react"

interface Collection {
  id: string
  name: string
  gameIds: number[]
  order: number
}

interface Game {
  id: number
  title: string
  image: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch collections
        const collectionsRes = await fetch("/api/admin/collections")
        const collectionsData = await collectionsRes.json()
        
        // Fetch all games
        const gamesRes = await fetch("/api/items")
        const gamesData = await gamesRes.json()

        if (collectionsData.collections) {
          setCollections(collectionsData.collections)
        }
        
        if (gamesData.success) {
          setGames(gamesData.data)
        }
      } catch (error) {
        console.error("Error fetching collections:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchData()
  }, [])

  const sortedCollections = [...collections].sort((a, b) => a.order - b.order)
  const totalCollections = collections.length
  const totalGames = collections.reduce((sum, c) => sum + c.gameIds.length, 0)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-[#120b22] rounded" />
              <div className="h-4 w-96 bg-[#120b22] rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-48 bg-[#120b22] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FolderHeart className="w-8 h-8 text-[#9d4edd]" />
                <h1 className="text-3xl font-bold text-white">Game Collections</h1>
              </div>
              <p className="text-gray-400">
                Explore carefully curated game collections.
              </p>
            </div>
            <div className="text-center py-20">
              <FolderHeart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No Collections Yet</h2>
              <p className="text-gray-500">Collections will appear here once they are created in the admin panel.</p>
            </div>
          </div>
          <SiteFooter />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FolderHeart className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">Game Collections</h1>
            </div>
            <p className="text-gray-400">
              Explore {totalCollections} carefully curated game collections featuring {totalGames}+ games.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <FolderHeart className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Collections</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCollections}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Gamepad2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalGames}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ChevronRight className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Series Available</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCollections}</p>
            </div>
          </div>

          {/* Collections grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedCollections.map((collection) => {
              const collectionGames = collection.gameIds
                .map(id => games.find(g => g.id === id))
                .filter(Boolean) as Game[]
              
              const images = collectionGames.map(g => g.image)

              return (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="group block"
                >
                  <div className="relative bg-gradient-to-br from-[#1a103c] to-[#120b22] border border-[#2d1b54] rounded-xl p-3 hover:border-[#9d4edd]/50 transition-colors duration-300">
                    <div className="relative mb-3" style={{ overflow: "visible" }}>
                      <CardFan
                        images={images}
                        count={collectionGames.length}
                        name={collection.name}
                      />
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#9d4edd]/90 text-white text-[10px] font-bold uppercase rounded shadow-lg z-20 pointer-events-none whitespace-nowrap">
                        SERIES
                      </div>
                    </div>

                    <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-[#9d4edd] transition-colors text-center">
                      {collection.name}
                    </h3>
                    <p className="text-gray-400 text-xs text-center mt-1">
                      {collectionGames.length} {collectionGames.length === 1 ? 'Game' : 'Games'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
