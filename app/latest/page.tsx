import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GameGrid } from "@/components/game-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PageLoader } from "@/components/page-loader"
import { Suspense } from "react"

export default function LatestPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <PageLoader />
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Latest Releases</h1>
                <p className="text-gray-400">Recently added games and software</p>
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
