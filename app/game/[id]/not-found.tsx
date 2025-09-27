import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-red-600">404</h1>
          <h2 className="text-2xl font-semibold text-white">Game Not Found</h2>
          <p className="text-gray-400 max-w-md">The game you're looking for doesn't exist or has been removed.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white hover:text-red-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Games
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
