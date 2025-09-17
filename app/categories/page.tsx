"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Gamepad2, Smartphone, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    {
      id: "pc-games",
      name: "PC Games",
      description: "Latest PC games for Windows",
      count: 0,
      icon: Monitor,
      image: "/pc-gaming-setup.jpg",
      color: "bg-blue-600",
    },
    {
      id: "android-games",
      name: "Android Games",
      description: "Mobile games for Android devices",
      count: 0,
      icon: Smartphone,
      image: "/android-mobile-gaming.jpg",
      color: "bg-green-600",
    },
    {
      id: "software",
      name: "Software",
      description: "Productivity and utility software",
      count: 0,
      icon: Gamepad2,
      image: "/software-applications.jpg",
      color: "bg-purple-600",
    },
  ])

  useEffect(() => {
    const adminItems = JSON.parse(localStorage.getItem("admin_items") || "[]")
    const defaultGames = [
      { category: "PC Games" },
      { category: "PC Games" },
      { category: "Software" },
      { category: "Android Games" },
      { category: "PC Games" },
      { category: "Software" },
      { category: "Android Games" },
      { category: "PC Games" },
      { category: "Android Games" },
      { category: "PC Games" },
      { category: "Software" },
      { category: "Android Games" },
      { category: "PC Games" },
      { category: "Software" },
      { category: "Android Games" },
    ]

    const combinedGames = [...defaultGames, ...adminItems]

    const pcGamesCount = combinedGames.filter((g) => g.category === "PC Games").length
    const androidGamesCount = combinedGames.filter((g) => g.category === "Android Games").length
    const softwareCount = combinedGames.filter((g) => g.category === "Software").length

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        count: cat.id === "pc-games" ? pcGamesCount : cat.id === "android-games" ? androidGamesCount : softwareCount,
      })),
    )
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Browse Categories</h1>
                <p className="text-gray-400">Choose from our collection of games and software</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Link key={category.id} href={`/?tab=${category.id}`}>
                      <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 group overflow-hidden">
                        <div className="relative">
                          <Image
                            src={category.image || "/placeholder.svg"}
                            alt={category.name}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className={`${category.color} p-4 rounded-full`}>
                              <IconComponent className="h-12 w-12 text-white" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-bold text-xl group-hover:text-red-400 transition-colors">
                              {category.name}
                            </h3>
                            <Badge className="bg-red-600 text-white">{category.count}</Badge>
                          </div>
                          <p className="text-gray-400">{category.description}</p>
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
