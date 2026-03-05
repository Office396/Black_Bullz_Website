"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { FolderHeart, ChevronRight, Gamepad2 } from "lucide-react"

const collections = [
  { name: "Final Fantasy Series", slug: "final-fantasy", count: 15, image: "/placeholder.svg" },
  { name: "Metal Gear Solid Series", slug: "metal-gear-solid", count: 8, image: "/placeholder.svg" },
  { name: "Far Cry Series", slug: "far-cry", count: 12, image: "/placeholder.svg" },
  { name: "Fallout Series", slug: "fallout", count: 7, image: "/placeholder.svg" },
  { name: "Assassin's Creed Series", slug: "assassins-creed", count: 14, image: "/placeholder.svg" },
  { name: "Resident Evil Series", slug: "resident-evil", count: 10, image: "/placeholder.svg" },
  { name: "Call of Duty Series", slug: "call-of-duty", count: 18, image: "/placeholder.svg" },
  { name: "Grand Theft Auto Series", slug: "gta", count: 9, image: "/placeholder.svg" },
  { name: "Battlefield Series", slug: "battlefield", count: 11, image: "/placeholder.svg" },
  { name: "Tomb Raider Series", slug: "tomb-raider", count: 12, image: "/placeholder.svg" },
  { name: "Need for Speed Series", slug: "need-for-speed", count: 15, image: "/placeholder.svg" },
  { name: "The Witcher Series", slug: "witcher", count: 5, image: "/placeholder.svg" },
  { name: "Dragon Age Series", slug: "dragon-age", count: 4, image: "/placeholder.svg" },
  { name: "Mass Effect Series", slug: "mass-effect", count: 4, image: "/placeholder.svg" },
  { name: "Borderlands Series", slug: "borderlands", count: 6, image: "/placeholder.svg" },
  { name: "Hitman Series", slug: "hitman", count: 8, image: "/placeholder.svg" },
  { name: "Dark Souls Series", slug: "dark-souls", count: 5, image: "/placeholder.svg" },
  { name: "Diablo Series", slug: "diablo", count: 4, image: "/placeholder.svg" },
  { name: "Elder Scrolls Series", slug: "elder-scrolls", count: 6, image: "/placeholder.svg" },
  { name: "Bioshock Series", slug: "bioshock", count: 3, image: "/placeholder.svg" },
  { name: "Halo Series", slug: "halo", count: 7, image: "/placeholder.svg" },
  { name: "Forza Series", slug: "forza", count: 8, image: "/placeholder.svg" },
  { name: "FIFA Series", slug: "fifa", count: 12, image: "/placeholder.svg" },
  { name: "NBA 2K Series", slug: "nba-2k", count: 10, image: "/placeholder.svg" },
  { name: "Minecraft Series", slug: "minecraft", count: 3, image: "/placeholder.svg" },
  { name: "Portal Series", slug: "portal", count: 2, image: "/placeholder.svg" },
  { name: "Half-Life Series", slug: "half-life", count: 4, image: "/placeholder.svg" },
  { name: "Left 4 Dead Series", slug: "left-4-dead", count: 2, image: "/placeholder.svg" },
]

export default function CollectionsPage() {
  const totalCollections = collections.length
  const totalGames = collections.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FolderHeart className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">Game Collections</h1>
            </div>
            <p className="text-gray-400">
              Explore {totalCollections} carefully curated game collections featuring {totalGames}+ pre-installed PC games.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <FolderHeart className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Collections</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCollections}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Gamepad2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalGames}+</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ChevronRight className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">New This Month</span>
              </div>
              <p className="text-2xl font-bold text-white">5</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="group"
              >
                <div className="relative bg-gradient-to-br from-[#1a103c] to-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden hover:border-[#9d4edd]/50 transition-all duration-300 hover:scale-[1.02]">
                  <div className="relative aspect-video">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#9d4edd]/90 text-white text-[10px] font-bold uppercase rounded shadow-lg z-10 pointer-events-none">
                      COLLECTION
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-base line-clamp-2 group-hover:text-[#9d4edd] transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {collection.count} Games
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}