"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Download, Lock, Shield, Clock, ExternalLink } from "lucide-react"
import { getDownloadPage, type DownloadPageData } from "@/lib/link-shortener"

export default function DownloadPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token')
  const [downloadPage, setDownloadPage] = useState<DownloadPageData | null>(null)
  const [gameData, setGameData] = useState<any>(null)
  const [cloudData, setCloudData] = useState<any>(null)
  const [pinInput, setPinInput] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hasVisitedMain, setHasVisitedMain] = useState(false)
  const [error, setError] = useState("")
  const [pageExpiryTime, setPageExpiryTime] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // Access control removed - no browser cache
      setHasVisitedMain(true)

      // Load download page data
      const gameId = Number.parseInt(params.id as string)
      const cloudIndex = searchParams.get('cloud') ? Number.parseInt(searchParams.get('cloud') as string) : 0
      const token = searchParams.get('token') || undefined

      // Try to get existing page first
      let page = await getDownloadPage(gameId, cloudIndex, token)

      // If no page exists and we have a token, the user came from a survey link
      // Create the download page immediately instead of showing loading
      if (!page && token) {
        console.log('Creating download page for survey completion...')
        try {
          // Call the API directly to create the download page
          const createResponse = await fetch('/api/download-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, cloudIndex }),
          })

          if (createResponse.ok) {
            page = await createResponse.json()
            console.log('Download page created successfully')
          } else {
            console.error('Failed to create download page:', createResponse.status, createResponse.statusText)
          }
        } catch (error) {
          console.error('Failed to create download page:', error)
        }
      }

      if (page) {
        setDownloadPage(page)

        // Calculate remaining time
        const now = Date.now()
        const expiresAt = new Date(page.expiresAt).getTime()
        const initialExpiryTime = expiresAt
        setPageExpiryTime(initialExpiryTime)

        // Check if page has already expired
        if (now >= expiresAt) {
          // Page has expired, remove from localStorage and redirect
          const pageKey = `download_page_${gameId}_${cloudIndex}_${token || ''}`
          localStorage.removeItem(pageKey)
          router.push("/")
          return
        }

        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
        setTimeLeft(remaining)

        // Get game data for title and cloud data
        try {
          const response = await fetch('/api/items')
          const result = await response.json()
          if (result.success) {
            const adminItems = result.data
            const game = adminItems.find((item: any) => item.id === gameId)
            setGameData(game)

            // Get specific cloud data
            if (game?.cloudDownloads?.[cloudIndex]) {
              setCloudData(game.cloudDownloads[cloudIndex])
            }
          }
        } catch (error) {
          console.error("Error fetching game data:", error)
        }
      }
    }
    loadData()
  }, [params.id, searchParams])

  // Token handling - no browser cache
  useEffect(() => {
    if (tokenParam) {
      // Token present, allow access
    }
  }, [tokenParam])

  useEffect(() => {
    if (!downloadPage || !pageExpiryTime) return

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((pageExpiryTime - now) / 1000))
      setTimeLeft(remaining)

      if (remaining === 0) {
        setIsUnlocked(false)
        // Clear the download page from localStorage when it expires
        const gameId = Number.parseInt(params.id as string)
        const cloudIndex = searchParams.get('cloud') ? Number.parseInt(searchParams.get('cloud') as string) : 0
        const token = searchParams.get('token') || undefined
        const pageKey = `download_page_${gameId}_${cloudIndex}_${token || ''}`
        localStorage.removeItem(pageKey)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [downloadPage, pageExpiryTime, params.id, searchParams])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!downloadPage) return

    if (pinInput === downloadPage.pinCode) {
      setIsUnlocked(true)
      setError("")
      // Do not reset timer; it reflects true expiry
    } else {
      setError("Invalid pin code. Please try again.")
    }
  }

  const handleDownload = (url: string) => {
    // Simulate survey/link shortener redirect
    const confirmed = confirm("You will be redirected to complete a short survey before downloading. Continue?")
    if (confirmed) {
      window.open(url, "_blank")
    }
  }

  const visitMainSite = () => {
    router.push("/")
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!downloadPage) {
    // Show loading state while trying to create the download page
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <video autoPlay loop muted className="w-full h-full object-contain">
                <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/700_F_669683156_9EPE8bLAvgoRhMnBfGOSQF6CGLKhsEEe_ST%20%28online-video-cutter.com%29-9p0CdowwI5OwXM4iOSRhEsn6F3lxo3.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="text-gray-400 mb-4">Creating download page...</p>
            <Button onClick={() => router.push("/")} className="bg-red-600 hover:bg-red-700">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access control removed - no browser cache restrictions

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-500" />
              {gameData?.title || 'Download'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <Label className="text-white">Enter 4-Digit Pin Code</Label>
                <Input
                  type="text"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  className="bg-gray-600 border-gray-500 text-white text-center text-lg tracking-widest"
                  placeholder="••••"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                <Lock className="h-4 w-4 mr-2" />
                Unlock Downloads
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
          {cloudData?.cloudName && (
            <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Cloud Provider:</strong> {cloudData.customProvider || cloudData.actualProvider || cloudData.cloudName}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                These links are hosted on {cloudData.customProvider || cloudData.actualProvider || cloudData.cloudName}. Please follow their terms of service.
              </p>
            </div>
          )}

        {/* Download Links */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">
              {cloudData?.cloudName ? `${cloudData.cloudName} Download Links` : 'Download Links'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {downloadPage.actualDownloadLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">{link.name}</h3>
                  <p className="text-gray-400 text-sm">Size: {link.size}</p>
                </div>
                <Button
                  onClick={() => window.open(link.url, '_blank')}
                  className="bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Note (if exists) */}
        {gameData?.note && (
          <Card className="bg-yellow-900/20 border-yellow-600 mb-6">
            <CardHeader>
              <CardTitle className="text-yellow-300 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Important Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-100 whitespace-pre-wrap">{gameData.note}</p>
            </CardContent>
          </Card>
        )}

        {/* Download Info */}
        {(downloadPage.rarPassword || cloudData?.cloudName || (gameData?.category === "PC Games" || gameData?.category === "Software")) && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Download Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* RAR Password for PC Games and Software */}
              {(gameData?.category === "PC Games" || gameData?.category === "Software") && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <Label className="text-gray-300">RAR Password:</Label>
                  <code className="block bg-gray-600 px-3 py-2 rounded text-white font-mono mt-1">
                    {downloadPage.rarPassword || "www.ovagames.com"}
                  </code>
                  <p className="text-gray-400 text-xs mt-1">
                    Use this password to extract compressed files
                  </p>
                </div>
              )}

              {/* RAR Password for Android Games (if set) */}
              {gameData?.category === "Android Games" && downloadPage.rarPassword && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <Label className="text-gray-300">RAR Password:</Label>
                  <code className="block bg-gray-600 px-3 py-2 rounded text-white font-mono mt-1">
                    {downloadPage.rarPassword}
                  </code>
                </div>
              )}
              {/* Installation Notes for PC Games and Software */}
              {(gameData?.category === "PC Games" || gameData?.category === "Software") && (
                <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                  <h3 className="text-blue-300 font-semibold mb-3 text-xl">Installation Notes & Tips</h3>
                  <div className="text-lg space-y-3">
                    <ul className="space-y-2 text-blue-100">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Links are interchangeable - if one fails, try another cloud provider</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Every part is available but there is for some games their part number are incorrect</span>
                      </li>                     
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Rar password: {downloadPage.rarPassword || "www.ovagames.com"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Content may not work in all countries - disable VPN/proxy/adblock if needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">For questions, visit contact page or comment - our team replies urgently</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Locate .zip file and right-click → Choose "Extract to (file name)" (7-Zip required)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Open extracted folder and run game as administrator</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Check Redist folder and install DirectX, Vcredist, and dependencies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">If corrupted, re-download and extract again</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Run as administrator to avoid save issues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Temporarily disable antivirus during extraction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Update GPU drivers for better performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Try compatibility mode or install DirectX if game won't launch</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">Install Visual C++ Redistributables if getting errors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 text-xl">•</span>
                        <span className="text-lg">If missing DLL errors → open Redist folder and install required programs</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>Note:</strong> This page will expire in {formatTime(timeLeft)}. You'll need to visit the main
                  site again to access downloads.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
