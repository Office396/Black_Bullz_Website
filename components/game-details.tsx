"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Star, Download, Monitor, Smartphone, HardDrive, Cpu, MemoryStick, ArrowLeft } from "lucide-react"

interface GameDetailsProps {
  game: {
    id: number
    title: string
    category: string
    image: string
    rating: number
    size: string
    releaseDate: string
    description: string
    longDescription: string
    developer: string
    screenshots: string[]
    systemRequirements?: {
      recommended: {
        os: string
        processor: string
        memory: string
        graphics: string
        storage: string
      }
    }
    androidRequirements?: {
      recommended: {
        os: string
        ram: string
        storage: string
        processor: string
      }
    }
    keyFeatures?: string[]
    downloadLinks: Array<{
      name: string
      url: string
      size: string
    }>
    tab: string
  }
}

export function GameDetails({ game }: GameDetailsProps) {
  const handleDownload = (url: string) => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:text-red-400 transition-colors duration-200"
          style={{ color: "#ffffff" }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: "#ffffff" }} />
          Back to Home
        </Link>
      </div>

      {/* Main Game Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    width={200}
                    height={300}
                    className="rounded-lg object-cover w-full md:w-48 h-64 md:h-72"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-600 text-white">{game.category}</Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{game.title}</h1>
                    <p className="text-gray-400 text-lg">{game.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Developer:</span>
                      <p className="text-white font-medium">{game.developer}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Release Date:</span>
                      <p className="text-white font-medium">{new Date(game.releaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">File Size:</span>
                      <p className="text-white font-medium">{game.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-medium">{game.rating}</span>
                      <span className="text-gray-400">/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Section */}
        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.downloadLinks.slice(0, 1).map((link, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{link.name || "Direct Download"}</span>
                    <span className="text-gray-400 text-sm">{link.size}</span>
                  </div>
                  <Button
                    onClick={() => handleDownload(link.url)}
                    className="w-3/4 bg-red-800 hover:bg-red-900 text-white transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Now
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">About {game.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">{game.longDescription}</p>
        </CardContent>
      </Card>

      {/* System Requirements (PC Games and Software only) - moved after description */}
      {game.systemRequirements && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Recommended System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">OS:</span>
                  <p className="text-gray-300">{game.systemRequirements.recommended.os}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Processor:</span>
                  <p className="text-gray-300">{game.systemRequirements.recommended.processor}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MemoryStick className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Memory:</span>
                  <p className="text-gray-300">{game.systemRequirements.recommended.memory}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Graphics:</span>
                  <p className="text-gray-300">{game.systemRequirements.recommended.graphics}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Storage:</span>
                  <p className="text-gray-300">{game.systemRequirements.recommended.storage}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Requirements (Android Games only) - moved after description */}
      {game.androidRequirements && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Recommended Android Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">OS:</span>
                <p className="text-gray-300">{game.androidRequirements.recommended.os}</p>
              </div>
              <div>
                <span className="text-gray-400">RAM:</span>
                <p className="text-gray-300">{game.androidRequirements.recommended.ram}</p>
              </div>
              <div>
                <span className="text-gray-400">Storage:</span>
                <p className="text-gray-300">{game.androidRequirements.recommended.storage}</p>
              </div>
              <div>
                <span className="text-gray-400">Processor:</span>
                <p className="text-gray-300">{game.androidRequirements.recommended.processor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Features (Software only) - moved after system requirements */}
      {game.keyFeatures && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {game.keyFeatures.map((feature, index) => (
                <li key={index} className="text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
