"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Clock, ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getValidDownloadLink, generateTempDownloadUrl } from "@/lib/download-utils"

interface DownloadItem {
  id: number
  title: string
  image: string
  category: string
  downloadLinks: Array<{
    name: string
    url: string
    size: string
  }>
}

// Extract download ID from URL path
function getDownloadIdFromPath(path: string): string | null {
  const matches = path.match(/\/dl\/([a-zA-Z0-9]+)$/)
  return matches ? matches[1] : null
}

export default function DownloadPage() {
  const router = useRouter()
  const [downloadItem, setDownloadItem] = useState&lt;DownloadItem | null>(null)
  const [countDown, setCountDown] = useState(15)
  const [verificationCompleted, setVerificationCompleted] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [gpLinkUrl, setGpLinkUrl] = useState("")

  useEffect(() => {
    const loadData = async () => {
      // Get the download ID from the URL
      const downloadId = getDownloadIdFromPath(window.location.pathname)
      if (!downloadId) {
        router.push('/')
        return
      }

      // Check if the download link is valid and not expired
      const downloadLink = getValidDownloadLink(downloadId)
      if (!downloadLink) {
        setLinkExpired(true)
        return
      }

      // Get the game details
      try {
        const response = await fetch('/api/items')
        const result = await response.json()
        if (result.success) {
          const items = result.data
          const item = items.find((i: any) => i.id === downloadLink.gameId)
          if (item) {
            setDownloadItem(item)
            setGpLinkUrl(downloadLink.gpLink)
          }
        }
      } catch (error) {
        console.error("Error fetching game data:", error)
      }
    }
    loadData()
  }, [router])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countDown > 0 && !verificationCompleted) {
      timer = setTimeout(() => {
        setCountDown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [countDown, verificationCompleted])

  const handleStartDownload = () => {
    // Simulate verification completion
    setVerificationCompleted(true)
  }

  if (linkExpired) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Download Link Expired</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span>This download link has expired or is invalid.</span>
                </div>
                <p className="text-gray-400">
                  Download links are valid for 24 hours. Please return to the game page and generate a new download link.
                </p>
                <Link href="/">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Homepage
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!downloadItem) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Download Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Info */}
              <div className="flex gap-4 items-center">
                <Image
                  src={downloadItem.image || "/placeholder.svg"}
                  alt={downloadItem.title}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">{downloadItem.title}</h3>
                  <p className="text-gray-400">{downloadItem.category}</p>
                </div>
              </div>

              {/* Verification Status */}
              <div className="border border-gray-700 rounded-lg p-4 space-y-4">
                {!verificationCompleted ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span>Waiting for verification...</span>
                      </div>
                      <span className="text-yellow-500 font-semibold">{countDown}s</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      <p>To access your download:</p>
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        <li>Click the "Complete Verification" button below</li>
                        <li>Complete the survey or view the ad</li>
                        <li>Your download will start automatically</li>
                      </ol>
                    </div>
                    <Button
                      onClick={handleStartDownload}
                      disabled={countDown > 0}
                      className={`w-full ${
                        countDown > 0
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {countDown > 0 ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Please wait {countDown} seconds...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Complete Verification
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="h-2 w-2 bg-green-400 rounded-full" />
                      <span>Verification completed!</span>
                    </div>
                    <p className="text-gray-400 text-sm">Your download is ready. Click the button below to start.</p>
                    <Button
                      onClick={() => window.open(gpLinkUrl, "_blank")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Now
                    </Button>
                  </>
                )}
              </div>

              {/* Additional Info */}
              <div className="text-sm text-gray-400">
                <p className="mb-2">
                  <strong className="text-white">Important:</strong> This download page will expire in 24 hours.
                  You'll need to generate a new download link after expiration.
                </p>
                <p>
                  Having issues? Return to the game page and try generating a new download link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )