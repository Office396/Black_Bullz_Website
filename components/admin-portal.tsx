"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Star, Download, Shield, Key, ImageIcon, LinkIcon } from "lucide-react"

interface GameData {
  category: string
  name: string
  totalSize: string
  keyFeatures: string[]
  systemRequirements: {
    os: string
    processor: string
    memory: string
    graphics: string
    storage: string
  }
  trending: boolean
  rating: number
  downloadLink: string
  description: string
  screenshots: File[]
  screenshotLinks: string[]
  profileImageLink: string
  rarPassword: string
  mainPagePassword: string
}

export function AdminPortal() {
  const [gameData, setGameData] = useState<GameData>({
    category: "",
    name: "",
    totalSize: "",
    keyFeatures: [],
    systemRequirements: {
      os: "",
      processor: "",
      memory: "",
      graphics: "",
      storage: "",
    },
    trending: false,
    rating: 0,
    downloadLink: "",
    description: "",
    screenshots: [],
    screenshotLinks: [],
    profileImageLink: "",
    rarPassword: "",
    mainPagePassword: "",
  })

  const [newFeature, setNewFeature] = useState("")
  const [newScreenshotLink, setNewScreenshotLink] = useState("")
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")

  const addFeature = () => {
    if (newFeature.trim() && gameData.keyFeatures.length < 10) {
      setGameData((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setGameData((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
    }))
  }

  const addScreenshotLink = () => {
    if (newScreenshotLink.trim() && gameData.screenshotLinks.length < 5) {
      setGameData((prev) => ({
        ...prev,
        screenshotLinks: [...prev.screenshotLinks, newScreenshotLink.trim()],
      }))
      setNewScreenshotLink("")
    }
  }

  const removeScreenshotLink = (index: number) => {
    setGameData((prev) => ({
      ...prev,
      screenshotLinks: prev.screenshotLinks.filter((_, i) => i !== index),
    }))
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (gameData.screenshots.length + files.length <= 5) {
      setGameData((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, ...files],
      }))
    }
  }

  const removeScreenshot = (index: number) => {
    setGameData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadStatus("uploading")

    // Simulate upload process
    setTimeout(() => {
      console.log("[v0] Game data submitted:", gameData)
      setUploadStatus("success")

      // Reset form after success
      setTimeout(() => {
        setUploadStatus("idle")
        setGameData({
          category: "",
          name: "",
          totalSize: "",
          keyFeatures: [],
          systemRequirements: {
            os: "",
            processor: "",
            memory: "",
            graphics: "",
            storage: "",
          },
          trending: false,
          rating: 0,
          downloadLink: "",
          description: "",
          screenshots: [],
          screenshotLinks: [],
          profileImageLink: "",
          rarPassword: "",
          mainPagePassword: "",
        })
      }, 2000)
    }, 2000)
  }

  const totalScreenshots = gameData.screenshots.length + gameData.screenshotLinks.length

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Black Bulls Admin Portal</h1>
          <p className="text-muted-foreground">Upload and manage games, software, and content</p>
          <div className="text-sm text-muted-foreground">
            Access URL: <code className="bg-muted px-2 py-1 rounded">/admin/portal</code>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={gameData.category}
                    onValueChange={(value) => setGameData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pc-games">PC Games</SelectItem>
                      <SelectItem value="android-games">Android Games</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={gameData.name}
                    onChange={(e) => setGameData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter game/software name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSize">Total Size *</Label>
                  <Input
                    id="totalSize"
                    value={gameData.totalSize}
                    onChange={(e) => setGameData((prev) => ({ ...prev, totalSize: e.target.value }))}
                    placeholder="e.g., 4.5 GB"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5 stars)</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setGameData((prev) => ({ ...prev, rating: star }))}
                        className={`p-1 ${star <= gameData.rating ? "text-yellow-500" : "text-gray-300"}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {gameData.rating > 0 ? `${gameData.rating}/5` : "No rating"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={gameData.description}
                  onChange={(e) => setGameData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short but important description for the game page"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImageLink" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Profile Image Link
                </Label>
                <Input
                  id="profileImageLink"
                  value={gameData.profileImageLink}
                  onChange={(e) => setGameData((prev) => ({ ...prev, profileImageLink: e.target.value }))}
                  placeholder="https://example.com/game-image.jpg (JPG, JPEG, PNG)"
                />
                {gameData.profileImageLink && (
                  <div className="mt-2">
                    <img
                      src={gameData.profileImageLink || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trending"
                  checked={gameData.trending}
                  onCheckedChange={(checked) => setGameData((prev) => ({ ...prev, trending: checked as boolean }))}
                />
                <Label htmlFor="trending">Add to Trending</Label>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a key feature"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} disabled={gameData.keyFeatures.length >= 10}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {gameData.keyFeatures.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature}
                    <button type="button" onClick={() => removeFeature(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="os">Operating System</Label>
                  <Input
                    id="os"
                    value={gameData.systemRequirements.os}
                    onChange={(e) =>
                      setGameData((prev) => ({
                        ...prev,
                        systemRequirements: { ...prev.systemRequirements, os: e.target.value },
                      }))
                    }
                    placeholder="e.g., Windows 10 64-bit"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processor">Processor</Label>
                  <Input
                    id="processor"
                    value={gameData.systemRequirements.processor}
                    onChange={(e) =>
                      setGameData((prev) => ({
                        ...prev,
                        systemRequirements: { ...prev.systemRequirements, processor: e.target.value },
                      }))
                    }
                    placeholder="e.g., Intel i5-8400 / AMD Ryzen 5 2600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memory">Memory</Label>
                  <Input
                    id="memory"
                    value={gameData.systemRequirements.memory}
                    onChange={(e) =>
                      setGameData((prev) => ({
                        ...prev,
                        systemRequirements: { ...prev.systemRequirements, memory: e.target.value },
                      }))
                    }
                    placeholder="e.g., 8 GB RAM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graphics">Graphics</Label>
                  <Input
                    id="graphics"
                    value={gameData.systemRequirements.graphics}
                    onChange={(e) =>
                      setGameData((prev) => ({
                        ...prev,
                        systemRequirements: { ...prev.systemRequirements, graphics: e.target.value },
                      }))
                    }
                    placeholder="e.g., NVIDIA GTX 1060 / AMD RX 580"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="storage">Storage</Label>
                  <Input
                    id="storage"
                    value={gameData.systemRequirements.storage}
                    onChange={(e) =>
                      setGameData((prev) => ({
                        ...prev,
                        systemRequirements: { ...prev.systemRequirements, storage: e.target.value },
                      }))
                    }
                    placeholder="e.g., 50 GB available space"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screenshots */}
          <Card>
            <CardHeader>
              <CardTitle>Screenshots (Max 5 total)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Screenshot Links
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newScreenshotLink}
                      onChange={(e) => setNewScreenshotLink(e.target.value)}
                      placeholder="https://example.com/screenshot.jpg"
                      disabled={totalScreenshots >= 5}
                    />
                    <Button
                      type="button"
                      onClick={addScreenshotLink}
                      disabled={totalScreenshots >= 5 || !newScreenshotLink.trim()}
                    >
                      Add Link
                    </Button>
                  </div>
                </div>

                {gameData.screenshotLinks.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {gameData.screenshotLinks.map((link, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={link || "/placeholder.svg"}
                          alt={`Screenshot Link ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = "/broken-image.png"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshotLink(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshots">Upload Screenshots</Label>
                <Input
                  id="screenshots"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  disabled={totalScreenshots >= 5}
                />
                <p className="text-sm text-muted-foreground">
                  {totalScreenshots}/5 screenshots ({gameData.screenshots.length} uploaded,{" "}
                  {gameData.screenshotLinks.length} linked)
                </p>
              </div>

              {gameData.screenshots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {gameData.screenshots.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="downloadLink">Download Link *</Label>
                <Input
                  id="downloadLink"
                  value={gameData.downloadLink}
                  onChange={(e) => setGameData((prev) => ({ ...prev, downloadLink: e.target.value }))}
                  placeholder="Enter download URL"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rarPassword" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    RAR Password
                  </Label>
                  <Input
                    id="rarPassword"
                    value={gameData.rarPassword}
                    onChange={(e) => setGameData((prev) => ({ ...prev, rarPassword: e.target.value }))}
                    placeholder="Password for RAR file (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainPagePassword" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Main Page Password
                  </Label>
                  <Input
                    id="mainPagePassword"
                    value={gameData.mainPagePassword}
                    onChange={(e) => setGameData((prev) => ({ ...prev, mainPagePassword: e.target.value }))}
                    placeholder="Password for download page (optional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={
                uploadStatus === "uploading" ||
                !gameData.category ||
                !gameData.name ||
                !gameData.totalSize ||
                !gameData.description ||
                !gameData.downloadLink
              }
              className="min-w-48"
            >
              {uploadStatus === "uploading" && "Uploading..."}
              {uploadStatus === "success" && "Upload Successful!"}
              {uploadStatus === "idle" && "Upload Game/Software"}
              {uploadStatus === "error" && "Upload Failed - Retry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
