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

  useEffect(() => {
    const loadData = async () => {
      // Access control removed - no browser cache
      setHasVisitedMain(true)

      // Load download page data
      const gameId = Number.parseInt(params.id as string)
      const cloudIndex = searchParams.get('cloud') ? Number.parseInt(searchParams.get('cloud') as string) : 0
      const token = searchParams.get('token') || undefined
      const page = await getDownloadPage(gameId, cloudIndex, token)

      if (page) {
        setDownloadPage(page)

        // Calculate remaining time
        const now = Date.now()
        const expiresAt = new Date(page.expiresAt).getTime()
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
    if (!downloadPage) return
    const expiresAt = new Date(downloadPage.expiresAt).getTime()
    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        setIsUnlocked(false)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [downloadPage])

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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h1 className="text-white text-xl font-bold mb-4">Download Page Not Found</h1>
            <p className="text-gray-400 mb-4">The requested download page does not exist.</p>
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
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl">{gameData?.title || 'Download'}</CardTitle>
                {cloudData?.cloudName && (
                  <p className="text-gray-400 text-sm mt-1">Cloud Provider: {cloudData.cloudName}</p>
                )}
              </div>
              <Badge className="bg-green-600 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

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
              {cloudData?.cloudName && (
                <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Cloud Provider:</strong> {cloudData.cloudName}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    These links are hosted on {cloudData.cloudName}. Please follow their terms of service.
                  </p>
                </div>
              )}
              {/* Installation Notes for PC Games and Software */}
              {(gameData?.category === "PC Games" || gameData?.category === "Software") && (
                <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                  <h3 className="text-blue-300 font-semibold mb-3">Installation Notes & Tips</h3>
                  <div className="text-sm space-y-2">
                    <ul className="space-y-1 text-blue-100">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Links are interchangeable - if one fails, try another cloud provider</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Rar password: {downloadPage.rarPassword || "www.ovagames.com"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Content may not work in all countries - disable VPN/proxy/adblock if needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>For questions, visit contact page or comment - our team replies urgently</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Locate .zip file and right-click → Choose "Extract to (file name)" (7-Zip required)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Open extracted folder and run game as administrator</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Check Redist folder and install DirectX, Vcredist, and dependencies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>If corrupted, re-download and extract again</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Run as administrator to avoid save issues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Temporarily disable antivirus during extraction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Update GPU drivers for better performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Try compatibility mode or install DirectX if game won't launch</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Install Visual C++ Redistributables if getting errors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>If missing DLL errors → open Redist folder and install required programs</span>
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
