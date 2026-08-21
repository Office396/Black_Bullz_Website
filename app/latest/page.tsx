import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GameGrid } from "@/components/game-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Suspense } from "react"

export default function LatestPage() {
  return (
    <div className="min-h-screen bg-gray-900 relative" style={{
        backgroundImage: 'url("https://img.freepik.com/premium-photo/horror-game-background_670382-279176.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Latest Releases</h1>
                <p className="text-gray-400">Recently added games</p>
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <GameGrid filterLatest={true} />
              </Suspense>
            </div>
          </main>
          <aside className="w-80 hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}
