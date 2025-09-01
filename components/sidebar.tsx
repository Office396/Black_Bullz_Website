"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Gamepad2, Download } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

const trendingGames = [
  { name: "Cyberpunk 2077", category: "PC Games", downloads: "2.5M", id: "cyberpunk-2077" },
  { name: "PUBG Mobile", category: "Android Games", downloads: "5.6M", id: "pubg-mobile" },
  { name: "Adobe Photoshop", category: "Software", downloads: "3.2M", id: "adobe-photoshop-2024" },
  { name: "Call of Duty", category: "PC Games", downloads: "4.1M", id: "call-of-duty-modern-warfare" },
  { name: "Genshin Impact", category: "Android Games", downloads: "4.3M", id: "genshin-impact" },
]

const categories = [
  { name: "PC Games", count: 6, tab: "pc-games" },
  { name: "Android Games", count: 6, tab: "android-games" },
  { name: "Software", count: 6, tab: "software" },
]

export function Sidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryClick = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`/?${params.toString()}`)
  }

  return (
    <aside className="hidden lg:block w-80 min-h-screen bg-sidebar border-r border-sidebar-border p-6">
      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors"
              onClick={() => handleCategoryClick(category.tab)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Games */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Trending Now
        </h3>
        <div className="space-y-3">
          {trendingGames.map((game, index) => (
            <Link key={index} href={`/game/${game.id}`}>
              <Card className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-balance">{game.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{game.category}</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      {game.downloads}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
