"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
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

interface CarouselModifier {
    id: string
    gameId: number
    landscapeImage: string
    logoImage: string
    order: number
}

interface HeroCarouselProps {
    games: GameItem[]
    modifiers?: CarouselModifier[]
}

export function HeroCarousel({ games, modifiers = [] }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [lightOn, setLightOn] = useState(false)
    
    // Use modifiers if available, otherwise use first 8 games
    const featured = modifiers.length > 0 
        ? modifiers.sort((a, b) => a.order - b.order).slice(0, 8)
        : games.slice(0, 8)

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

    // Get current item - could be a modifier or a game
    const currentItem = featured[current]
    const isModifier = 'landscapeImage' in currentItem
    
    // Get game data
    const game = isModifier 
        ? games.find(g => g.id === (currentItem as CarouselModifier).gameId) || currentItem
        : currentItem as GameItem
    
    // Get image to display
    const displayImage = isModifier 
        ? (currentItem as CarouselModifier).landscapeImage 
        : (currentItem as GameItem).image
    
    // Get logo if available
    const logoImage = isModifier ? (currentItem as CarouselModifier).logoImage : null

    return (
        <>
            {/* 
            INSTRUCTION TO CHANGE CAROUSEL HEIGHT:
            To change the height of this large hero image section, edit the values below:
            - "h-[420px]" is for mobile screens
            - "sm:h-[480px]" is for tablets
            - "md:h-[520px]" is for desktops
            Change these pixel numbers (e.g., h-[600px]) to instantly resize the slideshow.
        */}

            <section className="relative w-full h-[500px] sm:h-[650px] md:h-[700px] overflow-hidden rounded-2xl keep-white" style={{ backgroundColor: '#090514' }}>

                {/* Background Image - Only load current and preload next */}
                {featured.map((item, i) => {
                    if (i !== current && i !== (current + 1) % featured.length) return null
                    
                    const isModifier = 'landscapeImage' in item
                    const imageUrl = isModifier ? (item as CarouselModifier).landscapeImage : (item as GameItem).image
                    const itemGame = isModifier ? games.find(g => g.id === (item as CarouselModifier).gameId) : item
                    
                    return (
                        <div
                            key={isModifier ? (item as CarouselModifier).id : (item as GameItem).id}
                            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            <SafeImage
                                src={imageUrl || "/placeholder.svg"}
                                alt={(itemGame as GameItem)?.title || 'Game'}
                                fill
                                priority={i === current || i === (current + 1) % featured.length}
                                sizes="100vw"
                                className="object-cover"
                            />
                        </div>
                    )
                })}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-60 bg-gradient-to-l from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-60 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Brighten effect - four corner lights when bulb is on */}
                {lightOn && (
                  <>
                    {/* Top Right corner light */}
                    <div className="absolute top-0 right-0 w-[50%] h-[50%] pointer-events-none z-20"
                      style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 50%, transparent 80%)' }} />
                    {/* Top Left corner light */}
                    <div className="absolute top-0 left-0 w-[50%] h-[50%] pointer-events-none z-20"
                      style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 50%, transparent 80%)' }} />
                    {/* Bottom Right corner light */}
                    <div className="absolute bottom-0 right-0 w-[50%] h-[50%] pointer-events-none z-20"
                      style={{ background: 'radial-gradient(ellipse at bottom right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 80%)' }} />
                    {/* Bottom Left corner light */}
                    <div className="absolute bottom-0 left-0 w-[50%] h-[50%] pointer-events-none z-20"
                      style={{ background: 'radial-gradient(ellipse at bottom left, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 80%)' }} />
                  </>
                )}

                {/* Content - Elevated z-index to stay on top of all gradients/glows */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 max-w-2xl z-30" key={current}>
                    {/* Logo Image if available */}
                    {logoImage && (
                        <div className="mb-4 hero-slide-up">
                            <SafeImage 
                                src={logoImage} 
                                alt={(game as GameItem).title}
                                width={600}
                                height={200}
                                priority
                                className="h-24 md:h-32 w-auto drop-shadow-2xl object-contain object-left"
                                style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
                            />
                        </div>
                    )}
                    
                    {/* Title - only show if no logo */}
                    {!logoImage && (
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight hero-text-anim tracking-wide uppercase">
                            {(game as GameItem).title}
                        </h2>
                    )}

                    <div className="flex items-center gap-2 mb-3 hero-slide-up" style={{ animationDelay: '0.1s' }}>
                        <span className="px-2.5 py-0.5 bg-[#9d4edd] text-white text-xs font-bold rounded">
                            {(game as GameItem).category}
                        </span>
                        <span className="px-2.5 py-0.5 bg-[#1a103c] text-gray-300 text-xs rounded border border-[#2d1b54] uppercase">
                            {(game as GameItem).category === "Android Games" ? "Android" : "PC"}
                        </span>
                        {(game as GameItem).size && (
                            <span className="text-gray-400 text-xs">{(game as GameItem).size}</span>
                        )}
                    </div>

                    <p className="text-gray-300 text-sm md:text-base mb-5 line-clamp-3 hero-slide-up" style={{ animationDelay: '0.2s' }}>
                        {(game as GameItem).description}
                    </p>

                    <div className="flex items-center gap-3 hero-slide-up" style={{ animationDelay: '0.3s' }}>
                        <Link
                            href={`/game/${(game as GameItem).id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                            Download Now
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <Link
                            href={`/game/${(game as GameItem).id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all duration-200 text-sm"
                        >
                            Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Dot indicators - styled like download/details buttons */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-[#090514]/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
                    {featured.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`transition-all duration-300 rounded-full ${i === current
                                ? "w-8 h-3 bg-[#9d4edd] shadow-[0_0_12px_rgba(157,78,221,0.9)]"
                                : "w-3 h-3 bg-white/50 hover:bg-white/80 hover:scale-110"
                            }`}
                        />
                    ))}
                </div>

                {/* Nav arrows - styled like download/details buttons */}
                <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#090514]/60 hover:bg-[#9d4edd] border border-white/10 hover:border-[#9d4edd] text-white transition-all hover:scale-110 backdrop-blur-md hidden sm:flex items-center justify-center shadow-lg z-30"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#090514]/60 hover:bg-[#9d4edd] text-white transition-all hover:scale-110 backdrop-blur-sm hidden sm:flex items-center justify-center"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bulb Light Toggle */}
                <button
                    onClick={() => setLightOn(!lightOn)}
                    className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${lightOn ? 'bg-yellow-400/90 shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-110' : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'}`}
                    title={lightOn ? 'Turn off light' : 'Turn on light'}
                >
                    <svg className={`w-5 h-5 transition-colors ${lightOn ? 'text-yellow-900' : 'text-white/70'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                </button>

                {/* Corner glow when bulb is on — Pure intense white corners */}
                {lightOn && (
                    <>
                        {/* Top Right - Max Brightness */}
                        <div className="absolute top-0 right-0 w-[50%] h-[50%] pointer-events-none z-20"
                            style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 50%)' }} />

                        {/* Top Left */}
                        <div className="absolute top-0 left-0 w-[50%] h-[50%] pointer-events-none z-20"
                            style={{ background: 'radial-gradient(circle at top left, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 30%, transparent 50%)' }} />

                        {/* Bottom Right */}
                        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] pointer-events-none z-20"
                            style={{ background: 'radial-gradient(circle at bottom right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 30%, transparent 50%)' }} />

                        {/* Bottom Left */}
                        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] pointer-events-none z-20"
                            style={{ background: 'radial-gradient(circle at bottom left, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 30%, transparent 50%)' }} />
                    </>
                )}

            </section>
        </>
    )
}
