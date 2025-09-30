"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { Star, Download, Monitor, Smartphone, HardDrive, Cpu, MemoryStick, ArrowLeft, X } from "lucide-react"
import { createSurveyLink, createDownloadPage } from "@/lib/link-shortener"

interface GameDetailsProps {
  game: {
    id: number
    title: string
    category: string
    image: string
    rating: number | string
    size: string
    releaseDate: string
    uploadDate?: string
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
    cloudDownloads?: Array<{
      cloudName: string
      actualDownloadLinks: Array<{ name: string; url: string; size: string }>
    }>
    sharedPinCode?: string
    sharedRarPassword?: string
    trending?: boolean
    latest?: boolean
    tab?: string
  }
}

export function GameDetails({ game }: GameDetailsProps) {
  const [gameData, setGameData] = useState<any>(game)

  const handleCloudDownload = async (gameId: number, cloudIndex: number, cloudName: string) => {
    try {
      // Access control removed - no browser cache

      const validLinks = gameData?.cloudDownloads?.[cloudIndex]?.actualDownloadLinks?.filter((link: any) => link.url && link.url.trim()) || []
      if (!validLinks.length) {
        alert(`${cloudName} download not configured for this item. Please contact admin.`)
        return
      }

      // Create download page data first for this specific cloud
      console.log(`Creating download page data for ${cloudName}...`)
      const pageData = await createDownloadPage(gameId, cloudIndex)
      
      // Show loading state - target the specific download button
      const downloadButton = document.querySelector(`[data-cloud-download="${cloudIndex}"]`) as HTMLButtonElement
      if (downloadButton) {
        downloadButton.disabled = true
        downloadButton.textContent = 'Creating Download Link...'
      }
      
      console.log(`Attempting to create survey link for ${cloudName}:`, gameId)
      console.log('Download page URL will be:', `${window.location.origin}/download/${gameId}?cloud=${cloudIndex}&token=${pageData.token}`)
      
      try {
        // Try to create survey link with comprehensive fallback
        const result = await createSurveyLink(gameId, cloudIndex, pageData.token)
        
        if (result.success && result.shortenedUrl) {
          console.log('✅ Survey link created successfully:', result.shortenedUrl)
          console.log('Provider used:', result.provider)
          
          // Reset button
          if (downloadButton) {
            downloadButton.disabled = false
            downloadButton.innerHTML = `<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download`
          }
          
          // Open survey link
          window.open(result.shortenedUrl, '_blank')
          
        } else {
          throw new Error(result.error || 'Failed to create survey link')
        }
        
      } catch (apiError) {
        console.error('❌ Survey link creation failed:', apiError)
        
        // Reset button
        if (downloadButton) {
          downloadButton.disabled = false
          downloadButton.innerHTML = `<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download`
        }
        
        // BACKUP: Redirect directly to PIN page if survey fails
        console.log('Redirecting to PIN page as backup...')
        const pinPageUrl = `${window.location.origin}/download/${gameId}?cloud=${cloudIndex}&token=${pageData.token}`
        window.open(pinPageUrl, '_blank')
      }
      
    } catch (error) {
      console.error('💥 Download process completely failed:', error)
      
      // Reset button
      const downloadButton = document.querySelector(`[data-cloud-download="${cloudIndex}"]`) as HTMLButtonElement
      if (downloadButton) {
        downloadButton.disabled = false
        downloadButton.innerHTML = `<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download`
      }
      
      alert(`${cloudName} download temporarily unavailable. Please try again later.`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between ">
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-red-600 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Main Game Info - Now spans full width */}
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
                <h1 className="text-3xl font-bold text-red-500 mb-2">{game.title}</h1>
                <p className="text-gray-400 text-lg">{game.description}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                  <p className="text-white font-medium">{game.uploadDate ? new Date(game.uploadDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
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

      {/* Description */}
      {game.longDescription && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500">About {game.title}</CardTitle>
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
            <CardTitle className="text-red-500 flex items-center gap-2">
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
            <CardTitle className="text-red-500 flex items-center gap-2">
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
            <CardTitle className="text-red-500">Key Features</CardTitle>
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
            <CardTitle className="text-red-500">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {game.screenshots
                .filter(url => typeof url === 'string' && url.trim())
                .map((url, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div className="relative aspect-video cursor-pointer group overflow-hidden rounded-lg">
                        <Image
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="group-hover:opacity-100 transition-opacity duration-300 bg-opacity-20 rounded-full p-1">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l6 6" />
                            </svg>
                          </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black/80 border-none flex items-center justify-center">
                      <div className="relative">
                        <Image
                          src={url}
                          alt={`Screenshot ${index + 1} - Full Size`}
                          width={1920}
                          height={1080}
                          className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain"
                          priority
                        />
                        <DialogClose className="absolute top-3 right-3 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110">
                          <X className="h-5 w-5" />
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Section - Now positioned after screenshots */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Download Available</span>
              <span className="text-gray-400 text-sm">{game.size}</span>
            </div>
            
            {/* Download Process and PIN section - side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Download Process section */}
              <div className="inline-block w-fit max-w-full bg-grey-900/20 border border-grey-600 p-4 rounded-lg">
                <p className="text-white text-sm mb-3 font-bold">📋 Download Process:</p>
                <ul className="text-blue-100 text-x space-y-1 list-disc pl-4 font-semibold">
                  <li>Choose your preferred cloud provider below</li>
                  <li>Click the cloud download button</li>
                  <li>Complete Ad-survey to access download page</li>
                  <li>Enter the PIN code shown</li>
                  <li>Access download page with direct links</li>
                  <li>Download expires in 12 hours</li>
                </ul>
              </div>

              {/* Show PIN prominently */}
              {gameData?.sharedPinCode && (
                <div className="bg-grey-900/20 border border-grey-600 p-4 rounded-lg">
                  <p className="text-white text-sm mb-2 font-semibold">🔑 PIN Code for All Downloads:</p>
                   <p className="bg-grey-800/40 p-3 rounded text-left border border-grey-500 max-w-xs x-auto">
                    <span className="text-white text-lg font-bold font-mono tracking-wider">{gameData.sharedPinCode}</span>
                  </p>
                  <p className="text-grey-200 text-xs mt-2 text-left font-bold">
                    Use this PIN after completing the Ad-Survey for any cloud provider
                  </p>
                </div>
              )}
            </div>

            {/* Cloud Download Buttons */}
            {gameData?.cloudDownloads && gameData.cloudDownloads.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Choose Download Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gameData.cloudDownloads.map((cloudDownload: any, index: number) => (
                    <div key={index} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">{cloudDownload.cloudName || `Cloud ${index + 1}`}</h4>
                        <div className="bg-green-900/20 border border-green-600 px-2 py-1 rounded">
                          <span className="text-green-300 text-xs">Parts: {cloudDownload.actualDownloadLinks?.filter((link: any) => link.url && link.url.trim()).length || 0}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mb-3">
                        Provider: {cloudDownload.cloudName || `Cloud ${index + 1}`}
                      </p>
                      <Button
                        data-cloud-download={index}
                        onClick={() => handleCloudDownload(game.id, index, cloudDownload.cloudName || `Cloud ${index + 1}`)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No download links configured for this item.</p>
                <p className="text-gray-500 text-sm">Please contact admin.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
