"use client"

import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { SafeImage } from "@/components/safe-image"

interface GameItem {
    id: number
    title: string
    image: string
    category: string
    releaseDate?: string
}

export function UpcomingGames({ games }: { games: GameItem[] }) {
    if (games.length === 0) return null

    const upcoming = games
        .filter(g => g.releaseDate && new Date(g.releaseDate) > new Date())
        .sort((a, b) => {
            const dateA = new Date(a.releaseDate || 0).getTime()
            const dateB = new Date(b.releaseDate || 0).getTime()
            return dateA - dateB
        })
        .slice(0, 6)

    if (upcoming.length === 0) return null

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#9d4edd]" />
                    Upcoming Games
                </h2>
                <Link
                    href="/games?filter=upcoming"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-all duration-200 hover:scale-105"
                >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {upcoming.map((game) => (
                    <Link
                        key={game.id}
                        href={`/game/${game.id}`}
                        className="group"
                    >
                        <div className="relative bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden hover:border-[#9d4edd]/50 transition-all duration-300">
                            <div className="relative aspect-[3/4]">
                                <SafeImage
                                    src={game.image || "/placeholder.svg"}
                                    alt={game.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500/90 text-black text-xs font-bold rounded flex items-center gap-1 shadow-lg z-10">
                                    <Clock className="w-3 h-3" />
                                    UPCOMING
                                </div>
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                                    {game.category === "Android Games" ? "ANDROID" : "PC"}
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-[#9d4edd] transition-colors">
                                    {game.title}
                                </h3>
                                <p className="text-gray-500 text-xs mt-1">
                                    {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : "TBA"}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}