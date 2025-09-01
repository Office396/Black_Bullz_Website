import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SearchResults } from "@/components/search-results"

interface SearchPageProps {
  searchParams: {
    q?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <SearchResults query={query} />
      </div>
    </div>
  )
}
