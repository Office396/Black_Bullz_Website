"use client"

import Link from "next/link"
import { FolderHeart, ChevronRight } from "lucide-react"

const collections = [
    { name: "Final Fantasy Series", slug: "final-fantasy", count: 15, image: "/placeholder.svg" },
    { name: "Metal Gear Solid Series", slug: "metal-gear-solid", count: 8, image: "/placeholder.svg" },
    { name: "Far Cry Series", slug: "far-cry", count: 12, image: "/placeholder.svg" },
    { name: "Fallout Series", slug: "fallout", count: 7, image: "/placeholder.svg" },
    { name: "Assassin's Creed Series", slug: "assassins-creed", count: 14, image: "/placeholder.svg" },
    { name: "Resident Evil Series", slug: "resident-evil", count: 10, image: "/placeholder.svg" },
]

export function EpicCollections() {
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
                {collections.map((collection) => (
                    <Link
                        key={collection.slug}
                        href={`/collections/${collection.slug}`}
                        className="group"
                    >
                        <div className="relative bg-gradient-to-br from-[#1a103c] to-[#120b22] border border-[#2d1b54] rounded-xl p-4 hover:border-[#9d4edd]/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                                <img
                                    src={collection.image}
                                    alt={collection.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#9d4edd]/90 text-white text-[10px] font-bold uppercase rounded shadow-lg z-10 pointer-events-none">
                                    SERIES
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-[#9d4edd]/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        Explore <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-[#9d4edd] transition-colors text-center">
                                {collection.name}
                            </h3>
                            <p className="text-gray-500 text-xs text-center mt-1">
                                {collection.count} Games
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}