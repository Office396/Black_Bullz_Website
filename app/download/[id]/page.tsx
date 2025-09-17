"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Download, Lock, Shield, Clock, ExternalLink } from "lucide-react"

interface DownloadPage {
  id: string
  itemId: string
  itemTitle: string
  pinCode: string
  domainUrl: string
  downloadLinks: Array<{ name: string; url: string; size: string }>
  rarPassword: string
  createdAt: string
}

export default function DownloadPage() {
  const params = useParams()
  const router = useRouter()
  const [downloadPage, setDownloadPage] = useState<DownloadPage | null>(null)
  const [pinInput, setPinInput] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [hasVisitedMain, setHasVisitedMain] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user visited main site recently
    const lastVisit = localStorage.getItem("last_main_visit")
    const now = Date.now()
    if (lastVisit && now - Number.parseInt(lastVisit) < 600000) {
      // 10 minutes
      setHasVisitedMain(true)
    }

    // Load download page data
    const pages = JSON.parse(localStorage.getItem("download_pages") || "[]")
    const page = pages.find((p: DownloadPage) => p.id === params.id)

    if (page) {
      setDownloadPage(page)
    }
  }, [params.id])

  useEffect(() => {
    if (isUnlocked && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsUnlocked(false)
            return 300
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isUnlocked, timeLeft])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!downloadPage) return

    if (pinInput === downloadPage.pinCode) {
      setIsUnlocked(true)
      setError("")
      setTimeLeft(300) // Reset timer
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
    localStorage.setItem("last_main_visit", Date.now().toString())
    router.push("/")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

  if (!hasVisitedMain) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">To access this download page, you must first visit our main website.</p>
            <Button onClick={visitMainSite} className="w-full bg-red-600 hover:bg-red-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit BlackBullz Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-500" />
              {downloadPage.itemTitle}
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
              <CardTitle className="text-white text-2xl">{downloadPage.itemTitle}</CardTitle>
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
            <CardTitle className="text-white">Download Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {downloadPage.downloadLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">{link.name}</h3>
                  <p className="text-gray-400 text-sm">Size: {link.size}</p>
                </div>
                <Button
                  onClick={() => handleDownload(link.url)}
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
        {downloadPage.rarPassword && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Download Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-700 p-4 rounded-lg">
                <Label className="text-gray-300">RAR Password:</Label>
                <code className="block bg-gray-600 px-3 py-2 rounded text-white font-mono mt-1">
                  {downloadPage.rarPassword}
                </code>
              </div>
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
