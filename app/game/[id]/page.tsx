'use client'

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GameDetails } from "@/components/game-details"
import { Comments } from "@/components/comments"
import { PageLoader } from "@/components/page-loader"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"

// Helper function to get game data
function getGameData(gameId: number) {
  if (typeof window === 'undefined') return null
  
  // Try to get from admin items first
  const adminItems = JSON.parse(localStorage.getItem('admin_items') || '[]')
  const adminGame = adminItems.find((item: any) => item.id === gameId)
  if (adminGame) return adminGame

  // If not found in admin items, check static games
  return staticGames.find(game => game.id === gameId)
}

// Static games data - in real app this would come from database
const staticGames = [
  {
    id: 1,
    title: "Grand Theft Auto V",
    category: "PC Games",
    image: "/gta-v-game-cover.jpg",
    rating: 4.8,
    size: "65 GB",
    releaseDate: "2015-04-14",
    description:
      "Grand Theft Auto V is an action-adventure game played from either a third-person or first-person perspective. Players complete missions—linear scenarios with set objectives—to progress through the story. Outside of the missions, players may freely roam the open world.",
    longDescription:
      "When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the criminal underworld, the U.S. government and the entertainment industry, they must pull off a series of dangerous heists to survive in a ruthless city in which they can trust nobody, least of all each other.",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    genre: "Action, Adventure, Open World",
    screenshots: ["/gta-v-screenshot-1.jpg", "/gta-v-screenshot-2.jpg", "/gta-v-screenshot-3.jpg"],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64 Bit, Windows 8.1 64 Bit, Windows 8 64 Bit, Windows 7 64 Bit Service Pack 1",
        processor:
          "Intel Core 2 Quad CPU Q6600 @ 2.40GHz (4 CPUs) / AMD Phenom 9850 Quad-Core Processor (4 CPUs) @ 2.5GHz",
        memory: "4 GB RAM",
        graphics: "NVIDIA 9800 GT 1GB / AMD HD 4870 1GB (DX 10, 10.1, 11)",
        storage: "65 GB available space",
      },
      recommended: {
        os: "Windows 10 64 Bit, Windows 8.1 64 Bit, Windows 8 64 Bit, Windows 7 64 Bit Service Pack 1",
        processor: "Intel Core i5 3470 @ 3.2GHz (4 CPUs) / AMD X8 FX-8350 @ 4GHz (8 CPUs)",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 660 2GB / AMD HD 7870 2GB",
        storage: "65 GB available space",
      },
    },
    downloadLinks: [
      { name: "Direct Download", url: "#", size: "65 GB" },
      { name: "Torrent Download", url: "#", size: "65 GB" },
      { name: "Mirror 1", url: "#", size: "65 GB" },
    ],
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
    description:
      "Adobe Photoshop is a raster graphics editor developed and published by Adobe Inc. for Windows and macOS.",
    longDescription:
      "Adobe Photoshop 2024 brings new AI-powered features, enhanced performance, and improved workflows for creative professionals. With advanced selection tools, neural filters, and cloud integration, it's the industry standard for digital image editing and graphic design.",
    developer: "Adobe Inc.",
    publisher: "Adobe Inc.",
    genre: "Graphics, Design, Photo Editing",
    screenshots: ["/photoshop-screenshot-1.jpg", "/photoshop-screenshot-2.jpg", "/photoshop-screenshot-3.jpg"],
    keyFeatures: [
      "AI-powered Neural Filters",
      "Advanced selection tools",
      "Cloud document sync",
      "3D design capabilities",
      "Video editing support",
      "Extensive plugin ecosystem",
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit (version 1903) or later",
        processor: "Intel or AMD processor with 64-bit support; 2 GHz or faster",
        memory: "8 GB RAM",
        graphics: "GPU with DirectX 12 support and 2 GB GPU memory",
        storage: "4 GB available space",
      },
      recommended: {
        os: "Windows 11 64-bit (version 21H2) or later",
        processor: "Intel or AMD processor with 64-bit support; 3 GHz or faster",
        memory: "16 GB RAM or more",
        graphics: "GPU with DirectX 12 support and 4 GB GPU memory",
        storage: "10 GB available space on SSD",
      },
    },
    downloadLinks: [
      { name: "Official Installer", url: "#", size: "3.2 GB" },
      { name: "Portable Version", url: "#", size: "2.8 GB" },
      { name: "Mirror Download", url: "#", size: "3.2 GB" },
    ],
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
    longDescription:
      "Experience the thrill of the world's most beloved battle royale game on mobile. Drop into massive battlegrounds with up to 100 players, scavenge for weapons and supplies, and fight to be the last one standing. With multiple game modes, maps, and constant updates, PUBG Mobile delivers console-quality gaming on your phone.",
    developer: "LightSpeed & Quantum Studio",
    publisher: "Tencent Games",
    genre: "Battle Royale, Action, Multiplayer",
    screenshots: ["/pubg-screenshot-1.jpg", "/pubg-screenshot-2.jpg", "/pubg-screenshot-3.jpg"],
    androidRequirements: {
      minimum: {
        os: "Android 5.1.1 or above",
        ram: "3 GB RAM",
        storage: "2.5 GB available space",
        processor: "Snapdragon 660 / Exynos 8895 or equivalent",
      },
      recommended: {
        os: "Android 8.0 or above",
        ram: "6 GB RAM or more",
        storage: "4 GB available space",
        processor: "Snapdragon 855 / Exynos 9820 or better",
      },
    },
    downloadLinks: [
      { name: "Google Play Store", url: "#", size: "2.1 GB" },
      { name: "APK Direct Download", url: "#", size: "2.1 GB" },
      { name: "OBB + APK", url: "#", size: "2.1 GB" },
    ],
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
    const foundGame = getGameData(gameId)
    setGame(foundGame)
    setIsLoading(false)
  }, [gameId])

  if (!game) {
    return null // Let the layout PageLoader handle loading state
  }

  if (!game) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <GameDetails game={game} />
            <div className="mt-8">
              <Comments gameId={gameId} itemName={game.title} />
            </div>
          </main>
          <aside className="w-80 hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}
