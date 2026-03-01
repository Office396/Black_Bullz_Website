"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface GameItem {
    id: number
    title: string
    category: string
    image: string
    description: string
    size?: string
    releaseDate?: string
}

export function HeroCarousel({ games }: { games: GameItem[] }) {
    const [current, setCurrent] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const featured = games.slice(0, 8)

    const goTo = useCallback((index: number) => {
        if (isAnimating) return
        setIsAnimating(true)
        setCurrent(index)
        setTimeout(() => setIsAnimating(false), 600)
    }, [isAnimating])

    const next = useCallback(() => {
        goTo((current + 1) % featured.length)
    }, [current, featured.length, goTo])

    const prev = useCallback(() => {
        goTo((current - 1 + featured.length) % featured.length)
    }, [current, featured.length, goTo])

    // Auto-advance
    useEffect(() => {
        if (featured.length <= 1) return
        const timer = setInterval(next, 5000)
        return () => clearInterval(timer)
    }, [next, featured.length])

    if (featured.length === 0) return null

    const game = featured[current]

    return (
        <section className="relative w-full h-[420px] sm:h-[480px] md:h-[520px] overflow-hidden rounded-xl">
            {/* Background Image */}
            {featured.map((g, i) => (
                <div
                    key={g.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <Image
                        src={g.image || "/placeholder.svg"}
                        alt={g.title}
                        fill
                        className="object-cover object-center"
                        priority={i === 0}
                        sizes="100vw"
                    />
                </div>
            ))}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 max-w-2xl" key={current}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight hero-text-anim tracking-wide uppercase">
                    {game.title}
                </h2>

                <div className="flex items-center gap-2 mb-3 hero-slide-up" style={{ animationDelay: '0.1s' }}>
                    <span className="px-2.5 py-0.5 bg-[#00bcd4] text-white text-xs font-bold rounded">
                        {game.category}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#1a2a44] text-gray-300 text-xs rounded border border-[#1e3050]">
                        PC
                    </span>
                    {game.size && (
                        <span className="text-gray-400 text-xs">{game.size}</span>
                    )}
                </div>

                <p className="text-gray-300 text-sm md:text-base mb-5 line-clamp-3 hero-slide-up" style={{ animationDelay: '0.2s' }}>
                    {game.description}
                </p>

                <div className="flex items-center gap-3 hero-slide-up" style={{ animationDelay: '0.3s' }}>
                    <Link
                        href={`/game/${game.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00bcd4] hover:bg-[#0097a7] text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                    >
                        Download Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                    <Link
                        href={`/game/${game.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all duration-200 text-sm"
                    >
                        Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {featured.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`transition-all duration-300 rounded-full ${i === current
                                ? "w-7 h-2.5 bg-[#00bcd4]"
                                : "w-2.5 h-2.5 bg-white/30 hover:bg-white/50"
                            }`}
                    />
                ))}
            </div>

            {/* Nav arrows */}
            <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0a1628]/60 hover:bg-[#0a1628]/90 text-white transition-all hover:scale-110 backdrop-blur-sm hidden sm:flex items-center justify-center"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0a1628]/60 hover:bg-[#0a1628]/90 text-white transition-all hover:scale-110 backdrop-blur-sm hidden sm:flex items-center justify-center"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </section>
    )
}
