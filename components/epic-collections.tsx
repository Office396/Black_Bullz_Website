"use client"

import Link from "next/link"
import { FolderHeart, ChevronRight } from "lucide-react"
import { CardFan } from "@/components/card-fan"

const collections = [
    { name: "Final Fantasy Series", slug: "final-fantasy", count: 15, images: ["/placeholder.svg"] },
    { name: "Metal Gear Solid Series", slug: "metal-gear-solid", count: 8, images: ["/placeholder.svg"] },
    { name: "Far Cry Series", slug: "far-cry", count: 12, images: ["/placeholder.svg"] },
    { name: "Fallout Series", slug: "fallout", count: 7, images: ["/placeholder.svg"] },
    { name: "Assassin's Creed Series", slug: "assassins-creed", count: 14, images: ["/placeholder.svg"] },
    { name: "Resident Evil Series", slug: "resident-evil", count: 10, images: ["/placeholder.svg"] },
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
                        className="group block"
                    >
                        <div className="relative bg-gradient-to-br from-[#1a103c] to-[#120b22] border border-[#2d1b54] rounded-xl p-3 hover:border-[#9d4edd]/50 transition-all duration-300">
                            {/* Card fan fills the top area; overflow visible so fan pops up */}
                            <div className="relative mb-3" style={{ overflow: "visible" }}>
                                <CardFan
                                    images={collection.images}
                                    count={collection.count}
                                    name={collection.name}
                                />
                                {/* SERIES badge */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#9d4edd]/90 text-white text-[10px] font-bold uppercase rounded shadow-lg z-20 pointer-events-none whitespace-nowrap">
                                    SERIES
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
