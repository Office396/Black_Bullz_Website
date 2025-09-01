import { notFound } from "next/navigation"
import { getGameById } from "@/lib/game-data"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GameDetail } from "@/components/game-detail"

interface GamePageProps {
  params: {
    id: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  const game = getGameById(params.id)

  if (!game) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <GameDetail game={game} />
      </div>
    </div>
  )
}
