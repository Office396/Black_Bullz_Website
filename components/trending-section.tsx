"use client"

import Link from "next/link"
import Image from "next/image"

interface GameItem {
    id: number
    title: string
    image: string
    category: string
}

export function TrendingSection({ games }: { games: GameItem[] }) {
    if (games.length === 0) return null

    return (
        <section className="py-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#9d4edd] rounded-full"></span>
                Trending Games
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                {games.slice(0, 18).map((game) => (
                    <Link
                        key={game.id}
                        href={`/game/${game.id}`}
                        className="group game-card-hover"
                    >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                            <Image
                                src={game.image || "/placeholder.svg"}
                                alt={game.title}
                                fill
                                className="object-cover transition-transform duration-300 hover:scale-110"
                                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 11vw"
                            />
                            {/* Platform badge */}
                            <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[9px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                                {game.category === "Android Games" ? "ANDROID" : "PC"}
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
                                <p className="text-white text-xs font-medium truncate hover:text-[#9d4edd] hover:scale-105 transition-all cursor-pointer pointer-events-auto origin-bottom">{game.title}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
