'use client'

import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { GameDetails } from "@/components/game-details"
import { useEffect, useState } from "react"

async function getGameData(gameId: number) {
  try {
    const response = await fetch("/api/items")
    const result = await response.json()
    if (result.success) {
      const adminItems = result.data
      const adminGame = adminItems.find((item: any) => item.id === gameId)
      if (adminGame) return adminGame
    }
  } catch (error) {
    console.error("Error fetching items:", error)
  }

  return staticGames.find(game => game.id === gameId) || null
}

const staticGames = [
  {
    id: 1,
    title: "Grand Theft Auto V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    rating: 4.8,
    size: "65 GB",
    releaseDate: "2015-04-14",
    description: "Grand Theft Auto V is an action-adventure game played from either a third-person or first-person perspective.",
    longDescription: "When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the criminal underworld, the U.S. government and the entertainment industry, they must pull off a series of dangerous heists to survive in a ruthless city in which they can trust nobody, least of all each other.",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    genres: ["Action", "Adventure", "Open World", "RPG"],
    features: ["Open world exploration", "Story-driven campaign", "Multiple characters", "Online multiplayer"],
    screenshots: ["/gta-v-game-cover.jpg", "/gta-v-game-cover.jpg", "/gta-v-game-cover.jpg"],
    systemRequirements: {
      recommended: {
        os: "Windows 10 64 Bit",
        processor: "Intel Core i5 3470 @ 3.2GHz / AMD X8 FX-8350 @ 4GHz",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 660 2GB / AMD HD 7870 2GB",
        storage: "65 GB available space"
      }
    },
    tab: "pc-games",
  },
  {
    id: 3,
    title: "Adobe Photoshop 2024",
    category: "Software",
    image: "/adobe-photoshop-icon.jpg",
    rating: 4.9,
    size: "3.2 GB",
    releaseDate: "2023-10-10",
    description: "Adobe Photoshop is a raster graphics editor developed and published by Adobe Inc.",
    longDescription: "Adobe Photoshop 2024 brings new AI-powered features, enhanced performance, and improved workflows for creative professionals. With advanced selection tools, neural filters, and cloud integration, it's the industry standard for digital image editing and graphic design.",
    developer: "Adobe Inc.",
    publisher: "Adobe Inc.",
    genres: ["Graphics", "Design", "Photo Editing"],
    features: ["AI-powered Neural Filters", "Advanced selection tools", "Cloud document sync", "3D design capabilities"],
    screenshots: ["/adobe-photoshop-icon.jpg", "/adobe-photoshop-icon.jpg"],
    systemRequirements: {
      recommended: {
        os: "Windows 11 64-bit",
        processor: "Intel or AMD processor with 64-bit support; 3 GHz or faster",
        memory: "16 GB RAM",
        graphics: "GPU with DirectX 12 support and 4 GB GPU memory",
        storage: "10 GB available space on SSD"
      }
    },
    tab: "software",
  },
  {
    id: 4,
    title: "PUBG Mobile",
    category: "Android Games",
    image: "/pubg-mobile-game-cover.jpg",
    rating: 4.3,
    size: "2.1 GB",
    releaseDate: "2018-03-19",
    description: "PUBG Mobile is a free-to-play battle royale video game developed by LightSpeed & Quantum Studio.",
    longDescription: "Experience the thrill of the world's most beloved battle royale game on mobile. Drop into massive battlegrounds with up to 100 players, scavenge for weapons and supplies, and fight to be the last one standing.",
    developer: "LightSpeed & Quantum Studio",
    publisher: "Tencent Games",
    genres: ["Battle Royale", "Action", "Multiplayer"],
    features: ["100-player battles", "Multiple game modes", "Voice chat", "Seasonal updates"],
    screenshots: ["/pubg-mobile-game-cover.jpg", "/pubg-mobile-game-cover.jpg"],
    systemRequirements: {
      recommended: {
        os: "Android 8.0 or above",
        processor: "Snapdragon 855 / Exynos 9820 or better",
        memory: "6 GB RAM or more",
        storage: "4 GB available space",
        graphics: "Adreno 640 or better"
      }
    },
    tab: "android-games",
  },
]

interface GamePageProps {
  params: { id: string }
}

export default function GamePage({ params }: GamePageProps) {
  const [game, setGame] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const gameId = Number.parseInt(params.id)

  useEffect(() => {
    const fetchGame = async () => {
      const foundGame = await getGameData(gameId)
      setGame(foundGame)
      setIsLoading(false)
    }
    fetchGame()
  }, [gameId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="animate-pulse space-y-6">
              <div className="h-6 w-48 bg-[#1a2a44] rounded" />
              <div className="h-96 bg-[#1a2a44] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
              <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
              <a href="/games" className="inline-flex items-center gap-2 px-6 py-3 bg-[#00bcd4] hover:bg-[#0097a7] text-white font-medium rounded-lg">
                Browse All Games
              </a>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <GameDetails game={game} />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}