"use client"

import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"

interface GameItem {
    id: number
    title: string
    image: string
    category: string
    description: string
    size?: string
    rating?: number
    releaseDate?: string
    uploadDate?: string
}

export function FeaturedGame({ game }: { game: GameItem | null }) {
    if (!game) return null

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <section className="py-6">
            <div className="relative bg-[#0f1d32] border border-[#1e3050] rounded-2xl overflow-hidden">
                {/* Background blur */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
                    <Image
                        src={game.image || "/placeholder.svg"}
                        alt=""
                        fill
                        className="object-cover blur-2xl"
                        sizes="50vw"
                    />
                </div>

                <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
                    {/* Game Cover */}
                    <div className="relative w-48 h-64 md:w-56 md:h-72 flex-shrink-0 mx-auto md:mx-0">
                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
                            <Image
                                src={game.image || "/placeholder.svg"}
                                alt={game.title}
                                fill
                                className="object-cover"
                                sizes="224px"
                            />
                            {/* Star badge */}
                            <div className="absolute top-2 right-2 w-8 h-8 bg-[#00bcd4] rounded-full flex items-center justify-center">
                                <Star className="w-4 h-4 text-white fill-white" />
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-[#00bcd4] text-white text-xs font-bold rounded uppercase tracking-wider">
                                Game of the Day
                            </span>
                            <span className="text-gray-400 text-sm">{today}</span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            {game.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-2.5 py-0.5 bg-[#1a2a44] text-gray-300 text-xs rounded border border-[#1e3050]">
                                PC
                            </span>
                            <span className="text-gray-500 text-xs">—</span>
                            <span className="text-[#00bcd4] text-xs font-medium">{game.category}</span>
                        </div>

                        <p className="text-gray-400 text-sm md:text-base mb-5 line-clamp-3 max-w-xl">
                            {game.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 mb-5 text-sm">
                            {game.size && (
                                <div className="text-center">
                                    <p className="text-white font-semibold">{game.size}</p>
                                    <p className="text-gray-500 text-xs uppercase">Size</p>
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-white font-semibold">{game.rating || '4.5'}</p>
                                <p className="text-gray-500 text-xs uppercase">Score</p>
                            </div>
                        </div>

                        <Link
                            href={`/game/${game.id}`}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all duration-200 hover:scale-105 w-fit text-sm"
                        >
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
