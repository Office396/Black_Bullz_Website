"use client"

import Link from "next/link"
import Image from "next/image"

interface GameItem {
    id: number
    title: string
    image: string
    category: string
}

interface CategoryData {
    name: string
    slug: string
    games: GameItem[]
}

export function CategoriesSection({ games }: { games: GameItem[] }) {
    // Build category groups from the actual game data
    const categoryMap = new Map<string, GameItem[]>()
    games.forEach(game => {
        const cat = game.category
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, [])
        }
        categoryMap.get(cat)!.push(game)
    })

    const categories: CategoryData[] = Array.from(categoryMap.entries()).map(([name, items]) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        games: items,
    }))

    if (categories.length === 0) return null

    return (
        <section className="py-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#00bcd4] rounded-full"></span>
                Browse Categories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {categories.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={cat.slug === 'pc-games' ? '/?tab=pc-games' : cat.slug === 'android-games' ? '/?tab=android-games' : cat.slug === 'software' ? '/?tab=software' : `/categories`}
                        className="group"
                    >
                        <div className="relative bg-[#0f1d32] border border-[#1e3050] rounded-xl p-4 hover:border-[#00bcd4]/50 transition-all duration-300 hover:bg-[#1a2a44]/50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-white font-semibold text-base group-hover:text-[#00bcd4] transition-colors">
                                        {cat.name}
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-0.5">{cat.games.length} Games</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                {cat.games.slice(0, 3).map((game) => (
                                    <div key={game.id} className="relative w-14 h-18 rounded-lg overflow-hidden bg-[#1a2a44] flex-shrink-0">
                                        <Image
                                            src={game.image || "/placeholder.svg"}
                                            alt={game.title}
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
