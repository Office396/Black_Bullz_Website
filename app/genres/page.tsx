"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"

const allGenres = [
  { name: "Action", slug: "action", count: 250 },
  { name: "Adventure", slug: "adventure", count: 180 },
  { name: "Anime", slug: "anime", count: 95 },
  { name: "Classic", slug: "classic", count: 45 },
  { name: "Fighting", slug: "fighting", count: 68 },
  { name: "Horror", slug: "horror", count: 72 },
  { name: "Indie", slug: "indie", count: 310 },
  { name: "Multiplayer", slug: "multiplayer", count: 145 },
  { name: "Open World", slug: "open-world", count: 98 },
  { name: "Puzzle", slug: "puzzle", count: 56 },
  { name: "Racing", slug: "racing", count: 84 },
  { name: "RPG", slug: "rpg", count: 210 },
  { name: "Simulation", slug: "simulation", count: 135 },
  { name: "Sports", slug: "sports", count: 110 },
  { name: "Survival", slug: "survival", count: 78 },
  { name: "VR", slug: "vr", count: 32 },
  { name: "FPS", slug: "fps", count: 165 },
  { name: "Strategy", slug: "strategy", count: 145 },
  { name: "Platformer", slug: "platformer", count: 120 },
  { name: "Stealth", slug: "stealth", count: 42 },
  { name: "Roguelike", slug: "roguelike", count: 67 },
  { name: "Sandbox", slug: "sandbox", count: 89 },
  { name: "Visual Novel", slug: "visual-novel", count: 55 },
  { name: "Casual", slug: "casual", count: 175 },
  { name: "Educational", slug: "educational", count: 28 },
  { name: "Music", slug: "music", count: 34 },
]

const featuredGenres = ["Action", "Adventure", "Horror", "Indie", "Multiplayer", "RPG"]

export default function GenresPage() {
  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">All Genres</h1>
            </div>
            <p className="text-gray-400">
              Browse games by genre and find your perfect match
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Featured Genres</h2>
            <div className="flex flex-wrap gap-3">
              {featuredGenres.map((genre) => (
                <Link
                  key={genre}
                  href={`/genre/${genre.toLowerCase()}`}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "bg-[#9d4edd] text-white hover:bg-[#7b2cbf]"
                  )}
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">All Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allGenres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  className="group"
                >
                  <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 hover:border-[#9d4edd]/50 transition-all">
                    <h3 className="text-white font-medium group-hover:text-[#9d4edd] transition-colors mb-1">
                      {genre.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{genre.count} games</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}