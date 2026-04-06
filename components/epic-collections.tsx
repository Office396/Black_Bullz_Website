"use client"

import Link from "next/link"
import { FolderHeart } from "lucide-react"
import { CardFan } from "@/components/card-fan"

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

interface EpicCollectionsProps {
    collections?: Collection[]
    allGames?: Game[]
}

export function EpicCollections({ collections = [], allGames = [] }: EpicCollectionsProps) {
    // If no collections from admin, show nothing
    if (collections.length === 0) {
        return null
    }

    // Sort collections by order
    const sortedCollections = [...collections].sort((a, b) => a.order - b.order)

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderHeart className="w-5 h-5 text-[#9d4edd]" />
                    Epic Collections
                </h2>
                <Link
                    href="/collections"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-all duration-200 hover:scale-105"
                >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {sortedCollections.map((collection) => {
                    // Get games for this collection
                    const collectionGames = collection.gameIds
                        .map(id => allGames.find(g => g.id === id))
                        .filter(Boolean) as Game[]
                    
                    // Get images from games
                    const images = collectionGames.map(g => g.image)
                    
                    return (
                        <Link
                            key={collection.id}
                            href={`/collections/${collection.id}`}
                            className="group block"
                        >
                            <div className="relative bg-gradient-to-br from-[#1a103c] dark:from-[#1a103c] to-[#120b22] dark:to-[#120b22] border border-[#2d1b54] rounded-xl p-3 hover:border-[#9d4edd]/50 transition-all duration-300 keep-white">
                                {/* Card fan fills the top area; overflow visible so fan pops up */}
                                <div className="relative mb-3" style={{ overflow: "visible" }}>
                                    <CardFan
                                        images={images}
                                        count={collectionGames.length}
                                        name={collection.name}
                                    />
                                    {/* SERIES badge */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#9d4edd]/90 text-white text-[10px] font-bold uppercase rounded shadow-lg z-20 pointer-events-none whitespace-nowrap">
                                        SERIES
                                    </div>
                                </div>
                                <h3 className="text-white dark:text-white font-medium text-sm line-clamp-2 group-hover:text-[#9d4edd] transition-colors text-center">
                                    {collection.name}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-500 text-xs text-center mt-1">
                                    {collectionGames.length} {collectionGames.length === 1 ? 'Game' : 'Games'}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
