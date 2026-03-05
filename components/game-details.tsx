"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Star, Download, ExternalLink, Heart, Flag, MessageCircle,
  Monitor, Cpu, MemoryStick, HardDrive, Clock, User,
  Calendar, ChevronLeft, Play, ThumbsUp, Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Comments } from "@/components/comments"

interface SystemRequirements {
  os?: string
  processor?: string
  memory?: string
  graphics?: string
  storage?: string
}

interface GameData {
  id: number
  title: string
  category: string
  image: string
  rating?: number | string
  size?: string
  description: string
  longDescription?: string
  releaseDate?: string
  uploadDate?: string
  developer?: string
  publisher?: string
  screenshots?: string[]
  systemRequirements?: {
    minimum?: SystemRequirements
    recommended?: SystemRequirements
  }
  features?: string[]
  genres?: string[]
  views?: number
  downloads?: number
  uploader?: string
  version?: string
}

interface GameDetailsProps {
  game: GameData
}

export function GameDetails({ game }: GameDetailsProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const averageRating = typeof game.rating === 'number' ? game.rating : parseFloat(String(game.rating || '4.5'))

  // ESC key closes lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen])
  const recommendPercent = Math.min(95, Math.max(70, averageRating * 20))
  const views = game.views || Math.floor(Math.random() * 5000) + 500
  const downloads = game.downloads || Math.floor(Math.random() * 50000) + 1000

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown"
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const genres = game.genres || ['Action', 'Adventure', 'Open World', 'RPG']
  const features = game.features || [
    'Open world exploration',
    'Story-driven campaign',
    'Multiple endings',
    'Character customization'
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-[#9d4edd] transition-colors">Home</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <Link href="/games" className="hover:text-[#9d4edd] transition-colors">Games</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-white">{game.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1a103c] to-[#120b22] border border-[#2d1b54] rounded-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
          {/* Game Cover */}
          <div className="relative w-full lg:w-80 flex-shrink-0">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
              <img
                src={game.image || "/placeholder.svg"}
                alt={game.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded">
                v{game.version || '1.0'}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="flex-1 space-y-4">
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{game.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                    />
                  ))}
                  <span className="text-white font-semibold ml-1">{averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <span>Log in to rate</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  {recommendPercent}% recommend
                </Badge>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4 border-y border-[#2d1b54]">
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Monitor className="w-4 h-4" />
                  Platform
                </div>
                <p className="text-white font-medium">{game.category === "Android Games" ? "Android" : "PC"}</p>
              </div>
              {game.size && (
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <HardDrive className="w-4 h-4" />
                    File Size
                  </div>
                  <p className="text-white font-medium">{game.size}</p>
                </div>
              )}
              {game.releaseDate && (
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Release Year
                  </div>
                  <p className="text-white font-medium">{new Date(game.releaseDate).getFullYear()}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Published
                </div>
                <p className="text-white font-medium">{formatDate(game.uploadDate)}</p>
              </div>
            </div>

            {/* Uploader */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9d4edd]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#9d4edd]" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Uploaded by</p>
                <p className="text-white font-medium">{game.uploader || 'BullzGamez Team'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/game/${game.id}?action=download`} className="flex-1 sm:flex-initial">
                <Button className="w-full sm:w-auto bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold px-8 py-6 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
              </Link>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" />
                Watch Trailer
              </Button>
              <Button
                variant="outline"
                className={`border-white/20 ${isFavorite ? 'text-red-500 border-red-500/50' : 'text-white'}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500' : ''}`} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Flag className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>

            {/* Steam Link */}
            <a
              href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#9d4edd] hover:underline text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Get it on Steam (support developers)
            </a>

            {/* Genre Tags */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}>
                    <Badge className="bg-white/5 hover:bg-[#9d4edd]/20 text-gray-300 border border-white/10 cursor-pointer transition-colors hover:text-[#9d4edd] hover:border-[#9d4edd]/30">
                      {genre}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{DownloadsFormatter(downloads)}</p>
          <p className="text-gray-400 text-sm">Downloads</p>
        </div>
        <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{views.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Views</p>
        </div>
        <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
          <p className="text-gray-400 text-sm">Score</p>
        </div>
      </div>

      {/* Description */}
      <Card className="bg-[#120b22] border border-[#2d1b54]">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">About {game.title}</h2>
          <p className="text-gray-300 leading-relaxed">{game.longDescription || game.description}</p>
        </CardContent>
      </Card>


      {/* Features */}
      <Card className="bg-[#120b22] border border-[#2d1b54]">
        <CardHeader>
          <CardTitle className="text-white">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-[#9d4edd] rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Screenshots Gallery */}
      {game.screenshots && game.screenshots.length > 0 && (
        <Card className="bg-[#120b22] border border-[#2d1b54]">
          <CardHeader>
            <CardTitle className="text-white">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {game.screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-[#9d4edd]/50 transition-all"
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true) }}
                >
                  <img
                    src={screenshot || "/placeholder.svg"}
                    alt={`${game.title} screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Screenshot Lightbox Modal */}
            {lightboxOpen && game.screenshots && (
              <div
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                onClick={() => setLightboxOpen(false)}
              >
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-bold z-[101] w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                >
                  ✕
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + game.screenshots!.length) % game.screenshots!.length) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-[101] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                >
                  ‹
                </button>
                <img
                  src={game.screenshots[lightboxIndex] || "/placeholder.svg"}
                  alt={`${game.title} screenshot ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % game.screenshots!.length) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-[101] w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                  {lightboxIndex + 1} / {game.screenshots.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Installation Guide & System Requirements Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation Guide */}
        <Card className="bg-[#120b22] border border-[#2d1b54]">
          <CardHeader>
            <CardTitle className="text-white">Installation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#9d4edd] font-bold">1</span>
                </div>
                <p className="text-gray-300 text-sm pt-1.5">
                  Game is pre-installed / portable. No installation needed.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#9d4edd] font-bold">2</span>
                </div>
                <p className="text-gray-300 text-sm pt-1.5">
                  Extract the RAR/ZIP file using 7-Zip or WinRAR.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#9d4edd] font-bold">3</span>
                </div>
                <p className="text-gray-300 text-sm pt-1.5">
                  Launch the game from the executable file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Requirements */}
        <Card className="bg-[#120b22] border border-[#2d1b54]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {game.systemRequirements?.recommended?.os && (
                <div className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-400">OS:</span>
                    <p className="text-white">{game.systemRequirements.recommended.os}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements?.recommended?.processor && (
                <div className="flex items-start gap-2">
                  <Cpu className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-400">Processor:</span>
                    <p className="text-white">{game.systemRequirements.recommended.processor}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements?.recommended?.memory && (
                <div className="flex items-start gap-2">
                  <MemoryStick className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-400">Memory:</span>
                    <p className="text-white">{game.systemRequirements.recommended.memory}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements?.recommended?.graphics && (
                <div className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-400">Graphics:</span>
                    <p className="text-white">{game.systemRequirements.recommended.graphics}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements?.recommended?.storage && (
                <div className="flex items-start gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-400">Storage:</span>
                    <p className="text-white">{game.systemRequirements.recommended.storage}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Perspectives */}
      <Card className="bg-[#120b22] border border-[#2d1b54]">
        <CardHeader>
          <CardTitle className="text-white">Player Perspectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{averageRating.toFixed(1)}</div>
              <div className="text-gray-400 text-sm">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{recommendPercent}%</div>
              <div className="text-gray-400 text-sm">Recommend</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{Math.floor(Math.random() * 50) + 10}</div>
              <div className="text-gray-400 text-sm">Written Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{Math.floor(Math.random() * 200) + 50}</div>
              <div className="text-gray-400 text-sm">Verified Downloads</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Recommend
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              Write Review
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Comments gameId={game.id} itemName={game.title} />
    </div>
  )
}

function DownloadsFormatter(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}