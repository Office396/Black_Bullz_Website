import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { GameDetails } from "@/components/game-details"
import { getItemById, getRelatedGames, getPopularGameIds } from "@/lib/server/items-store"
import Link from "next/link"

interface GamePageProps {
  params: { id: string }
}

export async function generateStaticParams() {
  try {
    const ids = await getPopularGameIds(20)
    return ids.map((id) => ({ id: String(id) }))
  } catch {
    return []
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const gameId = Number.parseInt(params.id)

  let game = null
  let relatedGames: any[] = []
  try {
    game = await getItemById(gameId)
    
    if (game) {
      relatedGames = await getRelatedGames(game.category, gameId)
    }
  } catch (error) {
    console.error("Error fetching game:", error)
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
              <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
              <Link href="/games" className="inline-flex items-center gap-2 px-6 py-3 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-medium rounded-lg">
                Browse All Games
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full page background image - visible in both modes */}
      {game.landscapeImage && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${game.landscapeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay only in dark mode - lighter so image shows more */}
          <div className="hidden dark:block absolute inset-0 bg-[#090514]/50" />
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <GameDetails game={game} allGames={relatedGames} />
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
