import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { GameDetails } from "@/components/game-details"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"

interface GamePageProps {
  params: { id: string }
}

export default async function GamePage({ params }: GamePageProps) {
  const gameId = Number.parseInt(params.id)

  let game = null
  let allGames: any[] = []
  try {
    const items = await getItems()
    game = items.find((item) => item.id === gameId) || null
    allGames = items
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glowing background */}
      {game.landscapeImage && (
        <div className="absolute top-0 left-0 w-full h-[600px] z-0 pointer-events-none opacity-30 dark:opacity-20 flex item-start justify-center">
          <div
            className="absolute inset-0 bg-cover bg-top blur-[60px] transform scale-110 opacity-70"
            style={{ backgroundImage: `url(${game.landscapeImage})` }}
          />
          {/* Fades into background color at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>
      )}

      <div className="relative z-10">
        <Header />
        <div className="pt-16">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
            <GameDetails game={game} allGames={allGames} />
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
