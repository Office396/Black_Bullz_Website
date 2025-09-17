import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GameGrid } from "@/components/game-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <GameGrid />
            </Suspense>
          </main>
          <aside className="w-80 hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}
