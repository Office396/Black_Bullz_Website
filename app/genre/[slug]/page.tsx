import { getItems } from "@/lib/server/items-store"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Gamepad2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"

interface GenrePageProps {
  params: { slug: string }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const genreSlug = params.slug
  const genreName = genreSlug.charAt(0).toUpperCase() + genreSlug.slice(1).replace(/-/g, " ")

  let items: any[] = []
  let genres: any[] = []
  try {
    [items, { data: genres }] = await Promise.all([
      getItems(),
      supabase.from('custom_genres').select('name, slug').order('name').limit(12),
    ])
  } catch (error) {
    console.error("Error fetching items:", error)
  }

  const filteredGames = items.filter(game => {
    if (genreSlug === "all") return true
    const genreMatch = genreSlug.replace(/-/g, " ").toLowerCase()
    // Check genres array field first
    if (Array.isArray(game.genres) && game.genres.length > 0) {
      return game.genres.some((g: string) => g.toLowerCase() === genreMatch || g.toLowerCase().replace(/ /g, '-') === genreSlug)
    }
    // Fallback: category match
    return game.category.toLowerCase().includes(genreMatch)
  })

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="w-8 h-8 text-[#9d4edd]" />
              <h1 className="text-3xl font-bold text-white">{genreName} Games</h1>
            </div>
            <p className="text-gray-400">Browse {filteredGames.length} games in the {genreName} genre</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href="/genres" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">
              All Genres
            </Link>
            {(genres || []).map((genre: any) => (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  genre.slug === genreSlug
                    ? "bg-[#9d4edd] text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {genre.name}
              </Link>
            ))}
          </div>
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredGames.map((game: any) => (
                <Link key={game.id} href={`/game/${game.id}`} className="group">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                    <SafeImage src={game.image || "/placeholder.svg"} alt={game.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[10px] font-bold uppercase shadow-lg z-10 pointer-events-none ${game.category === "Android Games" ? "bg-green-500/90" : "bg-blue-500/90"}`}>
                      {game.category === "Android Games" ? "ANDROID" : "PC"}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium line-clamp-2">{game.title}</p>
                      {game.size && <p className="text-gray-400 text-xs">{game.size}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">No games found in this genre</p>
              <Link href="/games" className="inline-flex items-center gap-2 px-4 py-2 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white rounded-lg">
                Browse All Games
              </Link>
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
