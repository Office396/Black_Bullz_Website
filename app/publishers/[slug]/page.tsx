import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"

interface Props { params: { slug: string }; searchParams: { name?: string } }

export default async function PublisherPage({ params, searchParams }: Props) {
  const publisherName = searchParams.name || params.slug.replace(/-/g, ' ')
  const items = await getItems()
  const games = items.filter(item => (item as any).publisher?.toLowerCase() === publisherName.toLowerCase())

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10">
          <Link href="/publishers" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> All Publishers
          </Link>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black" style={{ background: "rgba(157,78,221,0.2)", color: "#9d4edd" }}>
              {publisherName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{publisherName}</h1>
              <p className="text-gray-400 text-sm">{games.length} game{games.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="text-gray-500">No games found for this publisher.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {games.map(game => (
                <Link key={game.id} href={`/game/${game.id}`} className="group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c] relative">
                    <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-gray-300 text-xs mt-2 line-clamp-2 group-hover:text-white transition-colors">{game.title}</p>
                  <p className="text-gray-600 text-xs">{game.category}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
