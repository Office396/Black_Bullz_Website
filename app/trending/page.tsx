import { getItems } from "@/lib/server/items-store"
import { getPageModifierData } from "@/lib/server/page-modifier-store"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { TrendingUp, Download } from "lucide-react"
import Link from "next/link"
import { SafeImage } from "@/components/safe-image"

export default async function TrendingGamesPage() {
  let items: any[] = []
  let trendingGames: any[] = []

  try {
    const [itemsData, modifiersData] = await Promise.all([
      getItems(),
      getPageModifierData()
    ])
    items = itemsData

    if (modifiersData.trendingGames.length > 0) {
      trendingGames = modifiersData.trendingGames
        .sort((a, b) => a.order - b.order)
        .map(tg => items.find(g => g.id === tg.gameId))
        .filter(Boolean)
    } else {
      trendingGames = items.filter(g => g.trending).slice(0, 50)
    }
  } catch (error) {
    console.error("Error fetching data:", error)
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">Trending Games (Weekly)</h1>
            </div>
            <p className="text-gray-400">The hottest games trending this week</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#9d4edd]/20 to-[#120b22] border border-[#9d4edd]/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Trending Now</span>
              </div>
              <p className="text-2xl font-bold text-white">{trendingGames.length}</p>
            </div>
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{items.length.toLocaleString()}</p>
            </div>
          </div>

          {trendingGames.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Top Rising
                  </h3>
                  <div className="space-y-3">
                    {trendingGames.slice(0, 5).map((game: any, index: number) => (
                      <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 p-3 bg-[#120b22] border border-[#2d1b54] rounded-xl hover:border-[#9d4edd]/50 transition-all group">
                        <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white bg-green-500">{index + 1}</span>
                            <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{game.title}</h4>
                          </div>
                          <p className="text-gray-500 text-xs">{game.size}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-bold text-white mb-4">Trending Games</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {trendingGames.slice(0, 16).map((game: any) => (
                      <Link key={game.id} href={`/game/${game.id}`} className="group relative">
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                          <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none bg-blue-500/90">
                            PC
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#9d4edd]/90 text-white text-xs font-bold rounded flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            TRENDING
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-white text-sm font-medium mt-2 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{game.title}</h4>
                        <p className="text-gray-500 text-xs">{game.size}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-4">All Trending</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                  {trendingGames.map((game: any) => (
                    <Link key={game.id} href={`/game/${game.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none bg-blue-500/90">
                          PC
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-white text-xs font-medium mt-1.5 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{game.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No Trending Games Yet</h2>
              <p className="text-gray-500">Set trending games in the admin panel to display them here.</p>
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
