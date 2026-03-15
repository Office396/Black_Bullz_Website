import { getItems } from "@/lib/server/items-store"
import { getPageModifierData } from "@/lib/server/page-modifier-store"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { FolderHeart, ArrowLeft, Star, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface GamePageProps {
  params: { id: string }
}

export default async function CollectionDetailPage({ params }: GamePageProps) {
  const collectionId = params.id
  let collection: any = null
  let games: any[] = []

  try {
    const [itemsData, modifiersData] = await Promise.all([
      getItems(),
      getPageModifierData()
    ])
    collection = modifiersData.collections.find((c: any) => c.id === collectionId) || null
    if (collection) {
      games = collection.gameIds
        .map((id: number) => itemsData.find((g: any) => g.id === id))
        .filter(Boolean)
    }
  } catch (error) {
    console.error("Error fetching collection:", error)
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#090514]">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="text-center py-20">
              <FolderHeart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">Collection Not Found</h2>
              <p className="text-gray-500 mb-6">This collection doesn't exist or has been removed.</p>
              <Link href="/collections" className="inline-flex items-center gap-2 px-6 py-3 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Collections
              </Link>
            </div>
          </div>
          <SiteFooter />
        </div>
      </div>
    )
  }

  const avgRating = games.length > 0
    ? (games.reduce((sum: number, g: any) => sum + (g.rating || 0), 0) / games.length).toFixed(1)
    : "0.0"

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <Link href="/collections" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#9d4edd] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <FolderHeart className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
            </div>
            <p className="text-gray-400 mb-4">A curated collection of {games.length} {games.length === 1 ? 'game' : 'games'} from this series.</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#120b22] border border-[#2d1b54] rounded-lg">
                <FolderHeart className="w-4 h-4 text-[#9d4edd]" />
                <span className="text-white font-semibold">{games.length}</span>
                <span className="text-gray-400 text-sm">{games.length === 1 ? 'Game' : 'Games'}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#120b22] border border-[#2d1b54] rounded-lg">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-white font-semibold">{avgRating}</span>
                <span className="text-gray-400 text-sm">Avg Rating</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#120b22] border border-[#2d1b54] rounded-lg">
                <Download className="w-4 h-4 text-green-500" />
                <span className="text-white font-semibold">
                  {games.reduce((sum: number, g: any) => { const n = parseFloat(g.size); return sum + (isNaN(n) ? 0 : n) }, 0).toFixed(1)} GB
                </span>
                <span className="text-gray-400 text-sm">Total Size</span>
              </div>
            </div>
          </div>
          {games.length === 0 ? (
            <div className="text-center py-20">
              <FolderHeart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No Games in Collection</h2>
              <p className="text-gray-500">This collection is empty. Add games in the admin panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
              {games.map((game: any) => (
                <Link key={game.id} href={`/game/${game.id}`} className="group game-card-hover">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                    <Image src={game.image || "/placeholder.svg"} alt={game.title} fill className="object-cover transition-transform duration-300 hover:scale-110" sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 11vw" />
                    <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[9px] font-bold uppercase shadow-lg z-10 ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                      {game.category === "Android Games" ? "ANDROID" : "PC"}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
