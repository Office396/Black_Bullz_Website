"use client"

import Link from "next/link"
import Image from "next/image"

interface GameItem {
    id: number
    title: string
    image: string
    category: string
}

const categories = [
  {
    name: "PC Games",
    slug: "pc-games",
    description: "Pre-installed & Installable",
    icon: "🎮",
    color: "from-blue-500/20 to-blue-600/5"
  },
  {
    name: "Pre-installed PC Games",
    slug: "pre-installed",
    description: "No installation required",
    icon: "💾",
    color: "from-green-500/20 to-green-600/5"
  },
  {
    name: "Installable PC Games",
    slug: "installable",
    description: "Traditional installation",
    icon: "💿",
    color: "from-purple-500/20 to-purple-600/5"
  },
  {
    name: "Android Mod APKs",
    slug: "android-mod",
    description: "Modded Android Games",
    icon: "📱",
    color: "from-orange-500/20 to-orange-600/5"
  }
]

interface CategoriesSectionProps {
  games: GameItem[]
}

export function CategoriesSection({ games }: CategoriesSectionProps) {
    const getCategoryCount = (categoryName: string) => {
      if (categoryName === "PC Games") {
        return games.filter(g => 
          g.category?.toLowerCase().includes('pc') || 
          g.category?.toLowerCase().includes('game')
        ).length
      }
      if (categoryName === "Pre-installed Games") {
        return Math.floor(games.length * 0.6) // Estimate
      }
      if (categoryName === "Installable Games") {
        return Math.floor(games.length * 0.4) // Estimate
      }
      if (categoryName === "Android Mod APKs") {
        return games.filter(g => 
          g.category?.toLowerCase().includes('android') ||
          g.category?.toLowerCase().includes('apk')
        ).length || Math.floor(games.length * 0.1)
      }
      return games.length
    }

    return (
        <section className="py-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#00bcd4] rounded-full"></span>
                Browse Categories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={`/games?category=${cat.slug}`}
                        className="group"
                    >
                        <div className={`relative bg-gradient-to-br ${cat.color} border border-[#1e3050] rounded-xl p-5 hover:border-[#00bcd4]/50 transition-all duration-300 hover:scale-[1.02]`}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{cat.icon}</span>
                                <div>
                                    <h3 className="text-white font-semibold text-base group-hover:text-[#00bcd4] transition-colors">
                                        {cat.name}
                                    </h3>
                                    <p className="text-gray-500 text-xs">{cat.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-sm">{getCategoryCount(cat.name)} Games</p>
                                <svg className="w-5 h-5 text-gray-500 group-hover:text-[#00bcd4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-[#00bcd4]/10 via-[#0f1d32] to-[#00bcd4]/10 border border-[#00bcd4]/20 rounded-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white font-semibold">PC Games Available as:</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            <span className="text-green-400">Pre-installed</span> (Recommended) - No installation needed, just extract & play! 
                            <span className="mx-2">•</span> 
                            <span className="text-purple-400">Installable</span> - Traditional setup with installer
                        </p>
                    </div>
                    <Link
                        href="/games"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00bcd4] hover:bg-[#0097a7] text-white font-medium rounded-lg transition-colors"
                    >
                        View All Games
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    )
}