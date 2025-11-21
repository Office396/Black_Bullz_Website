"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { Star, Download, Monitor, Smartphone, HardDrive, Cpu, MemoryStick, ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react"
import { createSurveyLink, createDownloadPage } from "@/lib/link-shortener"

// ImageSkeleton component
const ImageSkeleton = ({ src, alt, className = "", fill = true, width, height, priority }: { src: string; alt: string; className?: string; fill?: boolean; width?: number; height?: number; priority?: boolean }) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [retryCount, setRetryCount] = useState(0)

    const handleImageError = () => {
      console.log('Main image failed to load:', {
        src,
        retryCount,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      })

      if (retryCount < 1) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          setHasError(true)
        }, 2000)
      } else {
        setHasError(true)
      }
    }

    return (
      <div className={`relative overflow-hidden ${!isLoaded && !hasError ? 'bg-gray-700 animate-pulse rounded-lg' : ''} ${className}`}>
        {!hasError && (
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            className="object-cover transition-all duration-300 rounded-lg"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            priority={priority}
            unoptimized={retryCount > 0}
          />
        )}
        {hasError && (
          <div className={`w-full h-full flex items-center justify-center bg-gray-700 rounded-lg ${fill ? 'absolute inset-0' : ''}`}>
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs">Image unavailable</p>
              <button
                onClick={() => window.open(src, '_blank')}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline"
              >
                Open externally
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

// Function to clean screenshot URLs from RiotPixels and similar services
const cleanScreenshotUrl = (url: string): string => {
  if (!url) return url

  // Handle RiotPixels URLs with size modifiers and additional paths
  if (url.includes('riotpixels.net')) {
    // Find the pattern where .jpg is followed by size modifier (like .jpg.480p.jpg)
    // Look for .jpg followed by .[number]p.jpg
    const jpgSizePattern = url.match(/\.jpg\.\d+p\.jpg/)
    if (jpgSizePattern) {
      // Find the position of this pattern
      const patternIndex = url.indexOf(jpgSizePattern[0])
      // Find if there's a slash after this pattern
      const slashAfterPattern = url.indexOf('/', patternIndex)
      if (slashAfterPattern !== -1) {
        url = url.substring(0, slashAfterPattern)
      }
    }

    // Remove size modifiers: .240p.jpg, .480p.jpg, .1080p.jpg
    // These appear as: filename.jpg.240p.jpg -> filename.jpg
    url = url.replace(/\.240p\.jpg$/, '.jpg')
    url = url.replace(/\.480p\.jpg$/, '.jpg')
    url = url.replace(/\.1080p\.jpg$/, '.jpg')

    // Also handle cases where the extension might be .jpg.jpg (double extension)
    url = url.replace(/\.jpg\.jpg$/, '.jpg')

    // Ensure HTTPS protocol
    url = url.replace(/^http:/, 'https:')
  }

  // Handle other common image size modifiers (can be extended for other services)
  // Remove common size patterns
  url = url.replace(/_\d+x\d+\./g, '.') // Remove _1920x1080. patterns
  url = url.replace(/-thumb\./g, '.') // Remove -thumb. patterns
  url = url.replace(/-small\./g, '.') // Remove -small. patterns
  url = url.replace(/-medium\./g, '.') // Remove -medium. patterns

  return url
}

// ScreenshotSkeleton component
const ScreenshotSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  const cleanedSrc = cleanScreenshotUrl(src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Add debugging for failed images
  const handleImageError = () => {
    console.log('Screenshot failed to load:', {
      original: src,
      cleaned: cleanedSrc,
      retryCount,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    })

    if (retryCount < 2) {
      // Retry with original URL after cleaning fails
      setRetryCount(prev => prev + 1)
      setTimeout(() => {
        setHasError(true)
      }, 1000) // Shorter timeout for retries
    } else {
      setHasError(true)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={`relative aspect-video cursor-pointer group overflow-hidden rounded-lg ${!isLoaded && !hasError ? 'bg-gray-700 animate-pulse' : ''}`}>
          {!hasError && (
            <Image
              src={cleanedSrc}
              alt={alt}
              fill
              className="object-cover transition-all duration-300 rounded-lg"
              onLoad={() => setIsLoaded(true)}
              onError={handleImageError}
              unoptimized={retryCount > 0} // Try unoptimized on retry
            />
          )}
          {hasError && (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-lg">
              <div className="text-center text-gray-400">
                <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs">Failed to load</p>
              </div>
            </div>
          )}
        </div>
      </DialogTrigger>
      {!hasError && (
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black/80 border-none flex items-center justify-center">
          <div className="relative">
            <Image
              src={cleanedSrc}
              alt={`${alt} - Full Size`}
              width={1920}
              height={1080}
              className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain"
              priority
              unoptimized
            />
            <DialogClose className="absolute top-3 right-3 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogContent>
      )}
      {hasError && (
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black/80 border-none flex items-center justify-center">
          <div className="relative flex items-center justify-center min-h-[50vh] min-w-[50vw]">
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Screenshot Unavailable</h3>
              <p className="text-gray-400 mb-4">This image could not be loaded due to external hosting restrictions.</p>
              <DialogClose className="absolute top-3 right-3 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110">
                <X className="h-5 w-5" />
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

// Intelligent screenshot gallery with prev/next arrows, keyboard and swipe navigation
const ScreenshotGallery = ({ screenshots, altPrefix = 'Screenshot' }: { screenshots: string[]; altPrefix?: string }) => {
  const cleaned = (screenshots || []).map((s) => cleanScreenshotUrl(s)).filter(Boolean)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const idleTimer = useRef<any>(null)

  const hasPrev = current > 0
  const hasNext = current < cleaned.length - 1

  const openAt = (idx: number) => {
    setCurrent(idx)
    setOpen(true)
    setShowControls(true)
    resetIdleTimer()
  }

  const prev = () => {
    if (hasPrev) setCurrent((i) => Math.max(0, i - 1))
  }
  const next = () => {
    if (hasNext) setCurrent((i) => Math.min(cleaned.length - 1, i + 1))
  }

  const resetIdleTimer = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
    // Respect reduced motion users by not auto-hiding too aggressively
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    idleTimer.current = window.setTimeout(() => setShowControls(!prefersReducedMotion && cleaned.length > 1 ? false : true), 2000)
  }

  useEffect(() => {
    if (!open) return
    setShowControls(true)
    resetIdleTimer()
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
    }
  }, [open, current])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); resetIdleTimer() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); resetIdleTimer() }
    else if (e.key === 'Home') { e.preventDefault(); setCurrent(0); resetIdleTimer() }
    else if (e.key === 'End') { e.preventDefault(); setCurrent(cleaned.length - 1); resetIdleTimer() }
  }

  if (!cleaned.length) return null

  return (
    <>
      {/* Thumbnails grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaned.map((url, idx) => (
          <button
            key={idx}
            onClick={() => openAt(idx)}
            className="relative aspect-video overflow-hidden rounded-lg group focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`${altPrefix} ${idx + 1}`}
          >
            <Image
              src={url}
              alt={`${altPrefix} ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 bg-black/90 border-none flex items-center justify-center">
          <div
            className="relative select-none"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseMove={() => { if (!showControls) setShowControls(true); resetIdleTimer() }}
            onTouchStart={(e) => { setTouchStartX(e.changedTouches[0].clientX); setShowControls(true); resetIdleTimer() }}
            onTouchEnd={(e) => {
              if (touchStartX === null) return
              const dx = e.changedTouches[0].clientX - touchStartX
              if (Math.abs(dx) > 40) { dx > 0 ? prev() : next() }
              setTouchStartX(null)
              resetIdleTimer()
            }}
          >
            <Image
              src={cleaned[current]}
              alt={`${altPrefix} ${current + 1} of ${cleaned.length}`}
              width={1920}
              height={1080}
              className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain"
              priority
              unoptimized
            />

            {/* Close button */}
            <DialogClose className={`absolute top-3 right-3 z-50 rounded-full p-2 transition-all duration-200 bg-red-600 ${showControls ? 'opacity-100' : 'opacity-0'} hover:bg-red-700 text-white`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogClose>

            {/* Prev/Next arrows */}
            {cleaned.length > 1 && (
              <>
                {hasPrev && (
                  <button
                    type="button"
                    onClick={() => { prev(); resetIdleTimer() }}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full text-white transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'} ${hasPrev ? 'bg-black/60 hover:bg-black/80' : 'bg-black/40 cursor-not-allowed opacity-30'}`}
                    aria-label="Previous screenshot"
                    disabled={!hasPrev}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={() => { next(); resetIdleTimer() }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full text-white transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'} ${hasNext ? 'bg-black/60 hover:bg-black/80' : 'bg-black/40 cursor-not-allowed opacity-30'}`}
                    aria-label="Next screenshot"
                    disabled={!hasNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}

            {/* Index indicator */}
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full text-white text-sm bg-black/60 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {current + 1} / {cleaned.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

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
      version?: string
      partsNumber?: number
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
    // Immediately show loading state to prevent multiple clicks
    const downloadButton = document.querySelector(`[data-cloud-download="${cloudIndex}"]`) as HTMLButtonElement
    if (downloadButton) {
      downloadButton.disabled = true
      downloadButton.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Creating Link...</div>'
    }

    try {
      // Access control removed - no browser cache

      const validLinks = gameData?.cloudDownloads?.[cloudIndex]?.actualDownloadLinks?.filter((link: any) => link.url && link.url.trim()) || []
      if (!validLinks.length) {
        alert(`${cloudName} download not configured for this item. Please contact admin.`)
        // Reset button immediately
        if (downloadButton) {
          downloadButton.disabled = false
          downloadButton.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download'
        }
        return
      }

      // Create download page data first for this specific cloud
      console.log(`Creating download page data for ${cloudName}...`)
      const pageData = await createDownloadPage(gameId, cloudIndex)

      console.log(`Attempting to create survey link for ${cloudName}:`, gameId)
      console.log('Download page URL will be:', `${window.location.origin}/download/${gameId}?cloud=${cloudIndex}&token=${pageData.token}`)

      try {
        // Try to create survey link with comprehensive fallback
        const result = await createSurveyLink(gameId, cloudIndex, pageData.token)

        if (result.success && result.shortenedUrl) {
          console.log('✅ Survey link created successfully:', result.shortenedUrl)
          console.log('Provider used:', result.provider)

          // Reset button and open link immediately
          if (downloadButton) {
            downloadButton.disabled = false
            downloadButton.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download'
          }

          // Open survey link immediately
          window.open(result.shortenedUrl, '_blank')

        } else {
          throw new Error(result.error || 'Failed to create survey link')
        }

      } catch (apiError) {
        console.error('❌ Survey link creation failed:', apiError)

        // Reset button
        if (downloadButton) {
          downloadButton.disabled = false
          downloadButton.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download'
        }

        // BACKUP: Redirect directly to PIN page if survey fails
        console.log('Redirecting to PIN page as backup...')
        const pinPageUrl = `${window.location.origin}/download/${gameId}?cloud=${cloudIndex}&token=${pageData.token}`
        window.open(pinPageUrl, '_blank')
      }

    } catch (error) {
      console.error('💥 Download process completely failed:', error)

      // Reset button immediately
      if (downloadButton) {
        downloadButton.disabled = false
        downloadButton.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download'
      }

      alert(`${cloudName} download temporarily unavailable. Please try again later.`)
    }
  }


  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between ">
        <Link
          href={typeof window !== 'undefined' && sessionStorage.getItem('previousPage') ? sessionStorage.getItem('previousPage')! : '/'}
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
              <ImageSkeleton
                src={game?.image || "/placeholder.svg"}
                alt={game?.title || "Game"}
                fill={true}
                width={200}
                height={300}
                className="rounded-lg object-fill w-80 h-100 md:object-top"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-600 text-white">{game?.category || "Game"}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-red-500 mb-2">{game?.title || "Game"}</h1>
                <p className="text-gray-400 text-lg">{game?.description || "No description available"}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {game?.developer && (
                  <div>
                    <span className="text-gray-400">Developer:</span>
                    <p className="text-white font-medium">{game.developer}</p>
                  </div>
                )}
                {game?.releaseDate && (
                  <div>
                    <span className="text-gray-400">Release Date:</span>
                    <p className="text-white font-medium">{new Date(game.releaseDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Date Uploaded:</span>
                  <p className="text-white font-medium">{game?.uploadDate ? new Date(game.uploadDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
                {game?.rating && (
                  <div>
                    <span className="text-gray-400">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-medium">{game.rating}</span>
                      <span className="text-gray-400"></span>
                    </div>
                  </div>
                )}
                {game?.size && (
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
      {game?.longDescription && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500">About {game?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{game.longDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* System Requirements (PC Games and Software only) */}
      {game?.systemRequirements?.recommended && Object.values(game.systemRequirements.recommended).some(value => value) && (
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
      {game?.category === "Android Games" && game?.androidRequirements?.recommended && Object.values(game.androidRequirements.recommended).some((value: any) => value) && (
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
      {game?.keyFeatures && Array.isArray(game.keyFeatures) && game.keyFeatures.filter(feature => typeof feature === 'string' && feature.trim()).length > 0 && (
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
      {game?.screenshots && Array.isArray(game.screenshots) && game.screenshots.filter(url => typeof url === 'string' && url.trim()).length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const filtered = game.screenshots.filter((url: any) => typeof url === 'string' && url.trim())
              return <ScreenshotGallery screenshots={filtered} altPrefix={game?.title || 'Screenshot'} />
            })()}
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
              <span className="text-gray-400 text-sm">{game?.size}</span>
            </div>
            
            {/* Download Process and PIN section - side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Download Process section */}
              <div className="inline-block w-fit max-w-full bg-grey-900/20 border border-grey-600 p-4 rounded-lg">
                <p className="text-white text-sm mb-3 font-bold">📋 Download Process:</p>
                <ul className="text-blue-100 text-x space-y-1 list-disc pl-4 font-semibold">
                  {game?.category === "PC Games" && <li>Use <strong className="text-yellow-400 font-bold">Data Nodes</strong> Or <strong className="text-red-400 font-bold">Fucking Fast</strong> Cloud Providers,For Addition DLC /Bonus Content /Other Optional Languages /Mode Packs /4k Videos /Sign Language Videos Or More Additional things</li>}
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
            {gameData?.cloudDownloads && gameData.cloudDownloads.filter((cd: any) => cd.cloudName !== "Update").length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Choose Download Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Define the priority order - Direct Link first, then others
                    const priorityOrder = ['Direct Link', 'Google Drive', 'GoFile', 'MediaFire', 'Data Nodes', 'Fucking Fast']

                    // Sort cloud downloads according to priority and sub-priority for Direct Links
                    const sortedCloudDownloads = gameData.cloudDownloads
                      .map((cloudDownload: any, index: number) => ({ cloudDownload, originalIndex: index }))
                      .filter((item: { cloudDownload: any; originalIndex: number }) => item.cloudDownload.cloudName !== "Update")
                      .sort((a: { cloudDownload: any; originalIndex: number }, b: { cloudDownload: any; originalIndex: number }) => {
                        const aName = a.cloudDownload.cloudName || ''
                        const bName = b.cloudDownload.cloudName || ''

                        // Get priority index, default to high number for unknown providers
                        let aPriority = priorityOrder.indexOf(aName)
                        let bPriority = priorityOrder.indexOf(bName)

                        // Special handling for Direct Link sub-priorities
                        if (aName === 'Direct Link' && bName === 'Direct Link') {
                          // Sub-priority for Direct Link providers
                          const aProvider = a.cloudDownload.actualProvider || a.cloudDownload.customProvider || ''
                          const bProvider = b.cloudDownload.actualProvider || b.cloudDownload.customProvider || ''

                          // Black Bullz(Updated) has highest sub-priority (0)
                          // Black Bullz has second highest sub-priority (1)
                          // Others have lower priority (2)
                          const getDirectLinkSubPriority = (provider: string) => {
                            if (provider === 'Black bullz(Updated)' || provider === 'Black bullz(updated)') return 0
                            if (provider === 'Black bullz') return 1
                            return 2
                          }

                          const aSubPriority = getDirectLinkSubPriority(aProvider)
                          const bSubPriority = getDirectLinkSubPriority(bProvider)

                          if (aSubPriority !== bSubPriority) {
                            return aSubPriority - bSubPriority
                          }
                        }

                        // If both are in priority list, sort by priority
                        if (aPriority !== -1 && bPriority !== -1) {
                          return aPriority - bPriority
                        }
                        // If only one is in priority list, prioritize it
                        if (aPriority !== -1) return -1
                        if (bPriority !== -1) return 1
                        // If neither is in priority list, sort alphabetically
                        return aName.localeCompare(bName)
                      })

                    return sortedCloudDownloads.map((item: { cloudDownload: any; originalIndex: number }) => {
                      const { cloudDownload, originalIndex } = item
                      return (
                        <div key={originalIndex} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium">{cloudDownload.cloudName || `Cloud ${originalIndex + 1}`}</h4>
                            <div className="bg-blue-900/20 border border-blue-600 px-2 py-1 rounded">
                              <span className="text-blue-300 text-xs">Parts: {cloudDownload.partsNumber || cloudDownload.actualDownloadLinks?.filter((link: any) => link.url && link.url.trim()).length || 0}</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs mb-3">
                            Provider: {cloudDownload.customProvider || (cloudDownload.actualProvider && cloudDownload.actualProvider !== cloudDownload.cloudName ? cloudDownload.actualProvider : cloudDownload.cloudName) || `Cloud ${originalIndex + 1}`}
                          </p>
                          <Button
                            data-cloud-download={originalIndex}
                            onClick={() => handleCloudDownload(game?.id, originalIndex, cloudDownload.cloudName || `Cloud ${originalIndex + 1}`)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )
                    })
                  })()}
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

      {/* Updates Section - Shows only if Update cloud provider exists */}
      {gameData?.cloudDownloads && gameData.cloudDownloads.some((cd: any) => cd.cloudName === "Update") && (() => {
        // Group updates by version
        const updatesByVersion = gameData.cloudDownloads
          .map((cloudDownload: any, index: number) => ({ cloudDownload, originalIndex: index }))
          .filter((item: { cloudDownload: any; originalIndex: number }) => item.cloudDownload.cloudName === "Update")
          .reduce((groups: any, item: { cloudDownload: any; originalIndex: number }) => {
            const version = item.cloudDownload.version || 'general'
            if (!groups[version]) {
              groups[version] = []
            }
            groups[version].push(item)
            return groups
          }, {})

        const typedUpdatesByVersion = updatesByVersion as Record<string, Array<{ cloudDownload: any; originalIndex: number }>>

        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-500 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Updates Available
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="inline-block w-fit max-w-full bg-grey-900/20 border border-grey-600 p-4 rounded-lg">
                <p className="text-white text-sm mb-3 font-bold">🔄 Update Information:</p>
                <ul className="text-blue-100 text-x space-y-1 list-disc pl-4 font-semibold">
                  <li>Updates are used to update the game (if you got any issue in installing the game use this update)</li>
                  <li>Click update download button to start survey</li>
                  <li>Complete Ad-survey to access download page</li>
                  <li>Enter the update PIN (same like download PIN before) to get download links</li>
                  <li>Update download pages expire in 24 hours</li>
                </ul>
              </div>

              {/* Update PIN */}
              <div className="bg-grey-900/20 border border-grey-600 p-4 rounded-lg">
                <p className="text-white text-sm mb-2 font-semibold">🔑 Update PIN Code:</p>
                <p className="bg-grey-800/40 p-3 rounded text-left border border-grey-500 max-w-xs x-auto">
                  <span className="text-white text-lg font-bold font-mono tracking-wider">{gameData.sharedPinCode}</span>
                </p>
                <p className="text-grey-200 text-xs mt-2 text-left font-bold">
                  Use this PIN to access update download pages
                </p>
              </div>

              <div className="space-y-6">
                {Object.entries(typedUpdatesByVersion).map(([version, updates]) => (
                  <div key={version} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-lg">
                        {version === 'general' ? 'Updates' : `Update`}
                      </h3>
                      {version !== 'general' && (
                        <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                          v{version}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {updates.map((item) => {
                        const { cloudDownload, originalIndex } = item
                        return (
                          <div key={originalIndex} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-medium">Provider: { cloudDownload.customProvider || cloudDownload.actualProvider || 'Direct Link'}</h4>
                              <div className="bg-blue-900/20 border border-blue-600 px-2 py-1 rounded">
                                <span className="text-blue-300 text-xs">Parts: {cloudDownload.partsNumber || cloudDownload.actualDownloadLinks?.filter((link: any) => link.url && link.url.trim()).length || 0}</span>
                              </div>
                            </div>

                            <Button
                              data-cloud-download={originalIndex}
                              onClick={() => {
                                // For update downloads, use the same PIN as regular downloads
                                const updatePin = gameData.sharedPinCode
                                // Update the game data temporarily for this download
                                const updatedGameData = { ...gameData }
                                if (updatedGameData.cloudDownloads && updatedGameData.cloudDownloads[originalIndex]) {
                                  updatedGameData.sharedPinCode = updatePin
                                }
                                setGameData(updatedGameData)

                                // Call the download handler
                                handleCloudDownload(game?.id, originalIndex, cloudDownload.cloudName || `Update`)
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Update
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Installation Notes (PC Games, Software, and Android Games) */}
      {(game?.category === "PC Games" || game?.category === "Software" || game?.category === "Android Games") && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation Notes & Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {game.category === "Android Games" ? (
                <>
                  <div className="text-lg space-y-3">
                    <p className="text-gray-300 font-medium text-xl">Quick Installation Guide:</p>
                    <ul className="space-y-2 text-gray-300 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">If download fails, try another cloud provider</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Links may not work in all countries - disable VPN/proxy/adblock</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Download APK file and enable "Unknown Sources" in settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Install APK and grant necessary permissions when prompted</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Clear app cache if game won't launch or crashes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">For questions, visit contact page or comment - our team replies urgently</span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg space-y-3">
                    <p className="text-gray-300 font-medium text-xl">Quick Installation Guide:</p>
                    <ul className="space-y-2 text-gray-300 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Use <strong className="text-yellow-400 font-bold">Data Nodes</strong> Or <strong className="text-red-400 font-bold">Fucking Fast</strong> Cloud Providers,For Addition DLC /Bonus Content /Other Optional Languages /Mode Packs /4k Videos /Sign Language Videos Or More Additional things</span>
                      </li>                      
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">If download fails, try another cloud provider</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Links may not work in all countries - disable VPN/proxy/adblock</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Use 7-Zip to extract ZIP files by right-clicking and "Extract to folder"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Run as administrator and check Redist folder for missing DLLs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">Update GPU drivers and temporarily disable antivirus if needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-xl">•</span>
                        <span className="text-lg">For questions, visit contact page or comment - our team replies urgently</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

