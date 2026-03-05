"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Building2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

const publishers = [
  { name: "Electronic Arts", games: 45, slug: "electronic-arts" },
  { name: "Ubisoft", games: 38, slug: "ubisoft" },
  { name: "Activision", games: 32, slug: "activision" },
  { name: "Bethesda", games: 28, slug: "bethesda" },
  { name: "Square Enix", games: 35, slug: "square-enix" },
  { name: "Capcom", games: 22, slug: "capcom" },
  { name: "Bandai Namco", games: 30, slug: "bandai-namco" },
  { name: "SEGA", games: 25, slug: "sega" },
  { name: "THQ Nordic", games: 40, slug: "thq-nordic" },
  { name: "Deep Silver", games: 20, slug: "deep-silver" },
  { name: "Rockstar Games", games: 8, slug: "rockstar-games" },
  { name: "CD Projekt Red", games: 6, slug: "cd-projekt-red" },
  { name: "Paradox Interactive", games: 18, slug: "paradox-interactive" },
  { name: "505 Games", games: 28, slug: "505-games" },
  { name: "Devolver Digital", games: 15, slug: "devolver-digital" },
  { name: "Raw Fury", games: 12, slug: "raw-fury" },
  { name: "Annapurna Interactive", games: 10, slug: "annapurna-interactive" },
  { name: "Team17", games: 22, slug: "team17" },
  { name: "Curve Digital", games: 18, slug: "curve-digital" },
  { name: "Focus Home Interactive", games: 24, slug: "focus-home-interactive" },
  { name: "Nacon", games: 16, slug: "nacon" },
  { name: "Koch Media", games: 14, slug: "koch-media" },
  { name: "Maximum Games", games: 12, slug: "maximum-games" },
  { name: "Merge Games", games: 8, slug: "merge-games" },
  { name: "Modus Games", games: 10, slug: "modus-games" },
  { name: "Epic Games", games: 5, slug: "epic-games" },
  { name: "Valve", games: 7, slug: "valve" },
  { name: "Microsoft Studios", games: 15, slug: "microsoft-studios" },
  { name: "Sony Interactive", games: 12, slug: "sony-interactive" },
  { name: "Take-Two Interactive", games: 10, slug: "take-two-interactive" },
  { name: "Warner Bros", games: 18, slug: "warner-bros" },
  { name: "2K Games", games: 14, slug: "2k-games" },
  { name: "Codemasters", games: 11, slug: "codemasters" },
  { name: "Koei Tecmo", games: 16, slug: "koei-tecmo" },
  { name: "Spike Chunsoft", games: 8, slug: "spike-chunsoft" },
  { name: "Marvelous", games: 9, slug: "marvelous" },
  { name: "NIS America", games: 12, slug: "nis-america" },
  { name: "Idea Factory", games: 10, slug: "idea-factory" },
  { name: "Aksys Games", games: 7, slug: "aksys-games" },
  { name: "Arc System Works", games: 11, slug: "arc-system-works" },
]

const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(i + 65))

export default function PublishersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  const filteredPublishers = publishers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLetter = !selectedLetter || p.name.toUpperCase().startsWith(selectedLetter)
    return matchesSearch && matchesLetter
  })

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">Publishers</h1>
            </div>
            <p className="text-gray-400">
              Browse games by {publishers.length} game publishers and developers
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search publishers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a103c] border border-[#2d1b54] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#9d4edd] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedLetter(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  !selectedLetter
                    ? "bg-[#9d4edd] text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                All
              </button>
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                    selectedLetter === letter
                      ? "bg-[#9d4edd] text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPublishers.map((publisher) => (
              <Link
                key={publisher.slug}
                href={`/publishers/${publisher.slug}`}
                className="group"
              >
                <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 hover:border-[#9d4edd]/50 transition-all text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#9d4edd]/20 to-[#120b22] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {publisher.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#9d4edd] transition-colors mb-1">
                    {publisher.name}
                  </h3>
                  <p className="text-gray-500 text-xs">{publisher.games} Games</p>
                </div>
              </Link>
            ))}
          </div>

          {filteredPublishers.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No publishers found</p>
            </div>
          )}
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}