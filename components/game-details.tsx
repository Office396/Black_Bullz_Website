"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Star, Download, Monitor, Smartphone, HardDrive, Cpu, MemoryStick, ArrowLeft } from "lucide-react"
import { generateTempDownloadUrl } from "@/lib/download-utils"

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
  const handleDownload = (downloadId: number) => {
    // Get the game's download information
    const item = JSON.parse(localStorage.getItem("admin_items") || "[]")
      .find((i: any) => i.id === downloadId)
    
    if (item?.downloadLinks?.[0]?.url) {
      // Generate a new temporary download URL with the GP Link
      const tempDownloadUrl = generateTempDownloadUrl(downloadId, item.downloadLinks[0].url)
      // Redirect to the temporary download page
      window.location.href = tempDownloadUrl.url
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
                    {game.developer && (
                      <div>
                        <span className="text-gray-400">Developer:</span>
                        <p className="text-white font-medium">{game.developer}</p>
                      </div>
                    )}
                    {game.releaseDate && (
                      <div>
                        <span className="text-gray-400">Release Date:</span>
                        <p className="text-white font-medium">{new Date(game.releaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Date Uploaded:</span>
                      <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                    {game.rating && (
                      <div>
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-white font-medium">{game.rating}</span>
                          <span className="text-gray-400">/5</span>
                        </div>
                      </div>
                    )}
                    {game.size && (
                      <div>
                        <span className="text-gray-400">File Size:</span>
                        <p className="text-white font-medium">{game.size}</p>
                      </div>
                    )}
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
              {game.downloadLinks?.length > 0 && game.downloadLinks.slice(0, 1).map((link, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{link.name || "Direct Download"}</span>
                    <span className="text-gray-400 text-sm">{link.size}</span>
                  </div>
                  <Button
                    onClick={() => handleDownload(game.id)}
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
      {game.longDescription && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">About {game.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{game.longDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* System Requirements (PC Games and Software only) */}
      {game.systemRequirements?.recommended && Object.values(game.systemRequirements.recommended).some(value => value) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Recommended System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {game.systemRequirements.recommended.os && (
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400">OS:</span>
                    <p className="text-gray-300">{game.systemRequirements.recommended.os}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements.recommended.processor && (
                <div className="flex items-start gap-2">
                  <Cpu className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400">Processor:</span>
                    <p className="text-gray-300">{game.systemRequirements.recommended.processor}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements.recommended.memory && (
                <div className="flex items-start gap-2">
                  <MemoryStick className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400">Memory:</span>
                    <p className="text-gray-300">{game.systemRequirements.recommended.memory}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements.recommended.graphics && (
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400">Graphics:</span>
                    <p className="text-gray-300">{game.systemRequirements.recommended.graphics}</p>
                  </div>
                </div>
              )}
              {game.systemRequirements.recommended.storage && (
                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400">Storage:</span>
                    <p className="text-gray-300">{game.systemRequirements.recommended.storage}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Requirements (Android Games only) */}
      {game.androidRequirements?.recommended && Object.values(game.androidRequirements.recommended).some(value => value) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Recommended Android Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {game.androidRequirements.recommended.os && (
                <div>
                  <span className="text-gray-400">OS:</span>
                  <p className="text-gray-300">{game.androidRequirements.recommended.os}</p>
                </div>
              )}
              {game.androidRequirements.recommended.ram && (
                <div>
                  <span className="text-gray-400">RAM:</span>
                  <p className="text-gray-300">{game.androidRequirements.recommended.ram}</p>
                </div>
              )}
              {game.androidRequirements.recommended.storage && (
                <div>
                  <span className="text-gray-400">Storage:</span>
                  <p className="text-gray-300">{game.androidRequirements.recommended.storage}</p>
                </div>
              )}
              {game.androidRequirements.recommended.processor && (
                <div>
                  <span className="text-gray-400">Processor:</span>
                  <p className="text-gray-300">{game.androidRequirements.recommended.processor}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Features (Software only) */}
      {game.keyFeatures && Array.isArray(game.keyFeatures) && game.keyFeatures.filter(feature => typeof feature === 'string' && feature.trim()).length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {game.keyFeatures
                .filter(feature => typeof feature === 'string' && feature.trim())
                .map((feature, index) => (
                  <li key={index} className="text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                    {feature}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Screenshots */}
      {game.screenshots && Array.isArray(game.screenshots) && game.screenshots.filter(url => typeof url === 'string' && url.trim()).length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {game.screenshots
                .filter(url => typeof url === 'string' && url.trim())
                .map((url, index) => (
                  <div key={index} className="relative aspect-video">
                    <Image
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
