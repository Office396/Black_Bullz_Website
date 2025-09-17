import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SearchResults } from "@/components/search-results"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Suspense } from "react"

interface SearchPageProps {
  searchParams: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
                {query && (
                  <p className="text-gray-400">
                    Showing results for: <span className="text-red-400 font-medium">"{query}"</span>
                  </p>
                )}
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <SearchResults query={query} />
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
