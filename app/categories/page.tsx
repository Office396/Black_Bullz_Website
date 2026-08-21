"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Gamepad2, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    {
      id: "pc-games",
      name: "PC Games",
      description: "Free Latest PC games for Windows",
      count: 0,
      icon: Monitor,
      image: "/pc-gaming-setup.jpg",
      color: "bg-blue-600",
    },
  ])

  useEffect(() => {
    const adminItems = JSON.parse(localStorage.getItem("admin_items") || "[]")
    const defaultGames = [
      { category: "PC Games" },
    ]

    const combinedGames = [...defaultGames, ...adminItems]

    const pcGamesCount = 1000

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        count: cat.id === "pc-games" ? pcGamesCount : 0,
      })),
    )
  }, [])

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
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Browse Categories</h1>
                <p className="text-gray-400">Choose from our collection of PC games</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Link key={category.id} href={`/?tab=${category.id}`}>
                      <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden p-0 rounded-lg">
                        <div className="relative aspect-[3/3] w-full overflow-hidden bg-gray-800">
                          <Image
                            src={category.image || "/placeholder.svg"}
                            alt={category.name}
                            fill
                            className="absolute inset-0 w-full h-full object-cover object-top block group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, 30vw"
                          />
                          <Badge className="absolute top-1 right-1 bg-red-600 text-white text-[13px] px-1 py-0 z-10">
                            {category.name}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-top justify-between mb-3">
                            <h3 className="text-white font-bold text-m group-hover:text-red-400 transition-colors line-clamp-1">
                              {category.name}
                            </h3>
                            <Badge className="bg-gray-700 text-red-600">{category.count}+</Badge>
                          </div>
                          <p className="text-gray-400 line-clamp-4">{category.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
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
