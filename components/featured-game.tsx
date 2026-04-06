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

interface FeaturedGameProps {
    game: GameItem | null
    trailerUrl?: string
}

// Helper function to detect video type and create proper embed
function getVideoEmbedConfig(url: string): { type: 'youtube' | 'video' | 'iframe', embedUrl: string } | null {
    if (!url) return null
    
    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = null
        
        // Already an embed URL
        if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0]
        }
        // Regular YouTube watch URL
        else if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(url.split('?')[1])
            videoId = urlParams.get('v')
        }
        // Short YouTube URL (youtu.be)
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0]
        }
        
        if (videoId) {
            return {
                type: 'youtube',
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
            }
        }
    }
    
    // Check if it's a direct video file (MP4, WebM, OGG)
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
    const isDirectVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext))
    
    if (isDirectVideo) {
        return {
            type: 'video',
            embedUrl: url
        }
    }
    
    // For other iframe embeds (Vimeo, Dailymotion, etc.)
    return {
        type: 'iframe',
        embedUrl: url
    }
}

export function FeaturedGame({ game, trailerUrl }: FeaturedGameProps) {
    if (!game) return null
    
    const videoConfig = trailerUrl ? getVideoEmbedConfig(trailerUrl) : null

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <section className="py-6">
            <div className="relative bg-[#120b22]/40 dark:bg-[#120b22]/40 border border-[#2d1b54]/50 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[400px] keep-white">
                {/* Video Background - Supports YouTube, direct video files, and other platforms */}
                {videoConfig && (
                    <div className="absolute inset-0 z-0">
                        {videoConfig.type === 'video' ? (
                            // Direct video file (MP4, WebM, etc.)
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            >
                                <source src={videoConfig.embedUrl} type="video/mp4" />
                                <source src={videoConfig.embedUrl} type="video/webm" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            // YouTube or other iframe embeds
                            <iframe
                                src={videoConfig.embedUrl}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    border: 'none'
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Game Trailer"
                            />
                        )}
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#120b22]/90 via-[#120b22]/60 to-[#120b22]/40" />
                    </div>
                )}

                {/* Static background blur if no trailer */}
                {!videoConfig && (
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
                        <Image
                            src={game.image || "/placeholder.svg"}
                            alt=""
                            fill
                            className="object-cover blur-2xl"
                            sizes="50vw"
                        />
                    </div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-8 min-h-[400px]">
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
                            <div className="absolute top-2 right-2 w-8 h-8 bg-[#9d4edd] rounded-full flex items-center justify-center shadow-lg z-10">
                                <Star className="w-4 h-4 text-white fill-white" />
                            </div>
                            {/* Platform badge */}
                            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                                {game.category === "Android Games" ? "ANDROID" : "PC"}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-[#9d4edd] text-white text-xs font-bold rounded uppercase tracking-wider">
                                Game of the Day
                            </span>
                            <span className="text-gray-400 text-sm">{today}</span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            {game.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-2.5 py-0.5 bg-[#1a103c] text-gray-300 text-xs rounded border border-[#2d1b54]">
                                PC
                            </span>
                            <span className="text-gray-500 text-xs">—</span>
                            <span className="text-[#9d4edd] text-xs font-medium">{game.category}</span>
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
