import { getItems } from "@/lib/server/items-store"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Trophy, TrendingUp, Download, Star } from "lucide-react"
import Link from "next/link"
import { SafeImage } from "@/components/safe-image"

export default async function TopGamesPage() {
  let items: any[] = []
  try {
    items = await getItems()
  } catch (error) {
    console.error("Error fetching items:", error)
  }

  const topGames = [...items]
    .sort((a, b) => {
      const downloadsA = a.downloads || 0
      const downloadsB = b.downloads || 0
      if (downloadsB !== downloadsA) return downloadsB - downloadsA
      const viewsA = a.views || 0
      const viewsB = b.views || 0
      if (viewsB !== viewsA) return viewsB - viewsA
      return (b.rating || 0) - (a.rating || 0)
    })
    .slice(0, 100)

  const featuredGame = topGames[0]
  const runnerUps = topGames.slice(1, 5)
  const totalDownloads = items.reduce((sum, g) => sum + (g.downloads || 5000), 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">Top Games</h1>
            </div>
            <p className="text-gray-400">The most downloaded games in our website</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Total Downloads</span>
              </div>
              <p className="text-2xl font-bold text-white">{(totalDownloads / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Total Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{items.length.toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-[#9d4edd]" />
                <span className="text-gray-400 text-sm">Average Rating</span>
              </div>
              <p className="text-2xl font-bold text-white">4.7</p>
            </div>
          </div>

          {featuredGame && (
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden mb-8 pt-12">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-yellow-500 text-black font-bold text-sm rounded-full flex items-center gap-1 z-10">
                <Trophy className="w-4 h-4" />
                #1 MOST DOWNLOADED
              </div>
              <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
                <div className="relative w-48 h-64 lg:w-56 lg:h-72 flex-shrink-0 mx-auto lg:mx-0">
                  <SafeImage src={featuredGame.image || "/placeholder.svg"} alt={featuredGame.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover rounded-xl shadow-2xl" />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none bg-blue-500/90">
                    PC
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">{featuredGame.title}</h2>
                  <p className="text-gray-400 mb-4">{featuredGame.category}</p>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{featuredGame.rating || 4.8}</span>
                    </div>
                    {featuredGame.size && <span className="text-gray-400">{featuredGame.size}</span>}
                  </div>
                  <Link href={`/game/${featuredGame.id}`} className="inline-flex items-center justify-center lg:justify-start gap-2 px-6 py-3 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold rounded-lg transition-all w-fit mx-auto lg:mx-0">
                    <Download className="w-5 h-5" />
                    Download Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <h3 className="text-xl font-bold text-white mb-4">All Top Games</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {topGames.slice(0, 24).map((game, index) => (
                  <Link key={game.id} href={`/game/${game.id}`} className="group relative">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary">
                      <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      {index < 3 && (
                        <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"}`}>
                          {index + 1}
                        </div>
                      )}
                      <div className={`absolute ${index < 3 ? 'top-2 right-2' : 'top-2 left-2'} px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none bg-blue-500/90`}>
                        PC
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-white text-sm font-medium mt-2 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{game.title}</h4>
                    <p className="text-gray-500 text-xs">{game.size}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#9d4edd]" />
                Runner Ups
              </h3>
              <div className="space-y-3">
                {runnerUps.map((game, index) => (
                  <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-[#9d4edd]/50 transition-all group">
                    <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${index === 0 ? "bg-gray-400" : index === 1 ? "bg-amber-700" : "bg-gray-600"}`}>
                          {index + 2}
                        </span>
                        <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{game.title}</h4>
                      </div>
                      <p className="text-gray-500 text-xs">{game.size}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
