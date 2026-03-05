"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameDetails } from "@/components/game-details"
import { Plus, Trash2, Save, Copy, ExternalLink } from "lucide-react"
import Editor from "@monaco-editor/react"

// Function to clean screenshot URLs from RiotPixels and similar services
const cleanScreenshotUrl = (url: string): string => {
  if (!url) return url

  // Handle RiotPixels URLs with size modifiers and additional paths
  if (url.includes('riotpixels.net')) {
    // Find the last .jpg extension (which includes size modifiers like .480p.jpg)
    const lastJpgIndex = url.lastIndexOf('.jpg')

    // If there's a slash after the .jpg extension, remove everything after it
    const slashAfterJpg = url.indexOf('/', lastJpgIndex)
    if (slashAfterJpg !== -1) {
      url = url.substring(0, slashAfterJpg)
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

interface FormData {
  title: string
  category: string
  description: string
  longDescription: string
  developer: string
  size: string
  releaseDate: string
  image: string
  rating: string
  latest: boolean
  keyFeatures: string[]
  screenshots: string[] // Added screenshots array
  note?: string
  systemRequirements: {
    recommended: {
      // Removed minimum, kept only recommended
      os: string
      processor: string
      memory: string
      graphics: string
      storage: string
      directx: string
      sound_card: string
    }
  }
  androidRequirements: {
    recommended: {
      // Removed minimum, kept only recommended
      os: string
      ram: string
      storage: string
      processor: string
    }
  }
  sharedPinCode: string
  sharedRarPassword?: string
  cloudDownloads: Array<{
    cloudName: string
    actualProvider?: string
    customProvider?: string
    partsNumber?: number
    version?: string
    actualDownloadLinks: Array<{ name: string; url: string; size: string }>
  }>
}

const initialFormData: FormData = {
  title: "",
  category: "",
  description: "",
  longDescription: "",
  developer: "",
  size: "",
  releaseDate: "",
  image: "",
  rating: "4.0",
  latest: true,
  keyFeatures: [""],
  screenshots: [], // Added empty screenshots array
  note: "",
  systemRequirements: {
    recommended: { os: "", processor: "", memory: "", graphics: "", storage: "", directx: "", sound_card: "" }, // Only recommended
  },
  androidRequirements: {
    recommended: { os: "Android 12", ram: "8 GB", storage: "350 MB", processor: "Snapdragon / MediaTek (Average Processors)" }, // Only recommended
  },
  sharedPinCode: Math.floor(1000 + Math.random() * 9000).toString(), // Generate random 4-digit PIN
  sharedRarPassword: "",
  cloudDownloads: [{
    cloudName: "",
    partsNumber: undefined,
    version: undefined,
    actualDownloadLinks: [{ name: "", url: "", size: "" }],
  }],
}

export function AdminItemForm({ editItem, onSave }: { editItem?: any; onSave?: () => void }) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (editItem) {
      // Ensure all required fields exist for existing items
      return {
        ...editItem,
        screenshots: editItem.screenshots || [],
        note: editItem.note || "",
        sharedPinCode: editItem.sharedPinCode || Math.floor(1000 + Math.random() * 9000).toString(),
        sharedRarPassword: editItem.sharedRarPassword || "",
        cloudDownloads: editItem.cloudDownloads || [{
          cloudName: "",
          partsNumber: undefined,
          version: undefined,
          actualDownloadLinks: [{ name: "", url: "", size: "" }],
        }],
        systemRequirements: editItem.systemRequirements || {
          recommended: {
            os: "",
            processor: "",
            memory: "",
            graphics: "",
            storage: "",
          },
        },
        androidRequirements: editItem.androidRequirements || {
          recommended: {
            os: "Android 12",
            ram: "8 GB",
            storage: "350 MB",
            processor: "Snapdragon / MediaTek (Average Processors)",
          },
        },
      }
    }
    return initialFormData
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = "/api/items"
      const method = editItem ? "PUT" : "POST"
      const body = editItem ? { id: editItem.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(editItem ? "Item updated successfully!" : "Item saved successfully!")
        if (onSave) onSave()
        if (!editItem) setFormData(initialFormData)
      } else {
        throw new Error(result.error || "Failed to save item.")
      }
    } catch (err) {
      console.error("Failed to save item", err)
      alert("Failed to save item. Please try again.")
    }
  }

  const addKeyFeature = () => {
    setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, ""] })
  }

  const removeKeyFeature = (index: number) => {
    setFormData({
      ...formData,
      keyFeatures: formData.keyFeatures.filter((_, i) => i !== index),
    })
  }

  const updateKeyFeature = (index: number, value: string) => {
    const updated = [...formData.keyFeatures]
    updated[index] = value
    setFormData({ ...formData, keyFeatures: updated })
  }

  // Cloud Downloads Functions
  const addCloudDownload = () => {
    setFormData({
      ...formData,
      cloudDownloads: [...formData.cloudDownloads, {
        cloudName: "",
        partsNumber: undefined,
        version: undefined,
        actualDownloadLinks: [{ name: "", url: "", size: "" }],
      }],
    })
  }

  const removeCloudDownload = (cloudIndex: number) => {
    setFormData({
      ...formData,
      cloudDownloads: formData.cloudDownloads.filter((_, i) => i !== cloudIndex),
    })
  }

  const duplicateCloudDownload = (cloudIndex: number) => {
    const cloudToDuplicate = formData.cloudDownloads[cloudIndex]
    const duplicatedCloud = {
      ...cloudToDuplicate,
      actualDownloadLinks: cloudToDuplicate.actualDownloadLinks.map(link => ({ ...link }))
    }
    duplicatedCloud.partsNumber = undefined // Reset parts number for duplicated entry
    duplicatedCloud.version = undefined // Reset version for duplicated entry
    const updated = [...formData.cloudDownloads]
    updated.splice(cloudIndex + 1, 0, duplicatedCloud)
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const updateCloudDownload = (cloudIndex: number, field: string, value: string | number | undefined) => {
    const updated = [...formData.cloudDownloads]
    updated[cloudIndex] = { ...updated[cloudIndex], [field]: value }
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const addDownloadLink = (cloudIndex: number) => {
    const updated = [...formData.cloudDownloads]
    updated[cloudIndex].actualDownloadLinks.push({ name: "", url: "", size: "" })
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const removeDownloadLink = (cloudIndex: number, linkIndex: number) => {
    const updated = [...formData.cloudDownloads]
    updated[cloudIndex].actualDownloadLinks = updated[cloudIndex].actualDownloadLinks.filter((_, i) => i !== linkIndex)
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const duplicateDownloadLink = (cloudIndex: number, linkIndex: number) => {
    const updated = [...formData.cloudDownloads]
    const link = updated[cloudIndex].actualDownloadLinks[linkIndex]
    if (!link) return
    updated[cloudIndex].actualDownloadLinks.splice(linkIndex + 1, 0, { ...link })
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const updateDownloadLink = (cloudIndex: number, linkIndex: number, field: string, value: string) => {
    const updated = [...formData.cloudDownloads]
    updated[cloudIndex].actualDownloadLinks[linkIndex] = {
      ...updated[cloudIndex].actualDownloadLinks[linkIndex],
      [field]: value
    }
    setFormData({ ...formData, cloudDownloads: updated })
  }

  const generateNewSharedPin = () => {
    setFormData({
      ...formData,
      sharedPinCode: Math.floor(1000 + Math.random() * 9000).toString(),
    })
  }

  const showSystemRequirements = formData.category === "PC Games" || formData.category === "Software"
  const showAndroidRequirements = formData.category === "Android Games"
  const showKeyFeatures = formData.category === "Software"

  // State for multi-link text input mode per cloud
  const [multiLinkMode, setMultiLinkMode] = useState<Record<number, boolean>>({})
  const [multiLinkSections, setMultiLinkSections] = useState<Record<number, Array<{ name: string, size: string, text: string }>>>({})

  // Initialize with one empty section when toggling on
  const handleToggleMultiLink = (cloudIndex: number, checked: boolean) => {
    if (checked) {
      setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: [{ name: "", size: "", text: "" }] })
    }
    setMultiLinkMode({ ...multiLinkMode, [cloudIndex]: checked })
  }

  // State for system requirements text input
  const [sysReqTextMode, setSysReqTextMode] = useState(false)
  const [sysReqTextInput, setSysReqTextInput] = useState("")

  // Parse system requirements from text
  const parseSystemRequirements = useCallback((text: string) => {
    const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)

    const requirements = {
      os: "",
      processor: "",
      memory: "",
      graphics: "",
      storage: "",
    }

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase()

      // OS detection
      if (lowerLine.includes("os:") || lowerLine.includes("operating system")) {
        requirements.os = line.replace(/^(os:|operating system:?)/i, "").trim()
      }
      // Processor detection
      else if (lowerLine.includes("processor:") || lowerLine.includes("cpu:")) {
        requirements.processor = line.replace(/^(processor:|cpu:?)/i, "").trim()
      }
      // Memory detection
      else if (lowerLine.includes("memory:") || lowerLine.includes("ram:")) {
        requirements.memory = line.replace(/^(memory:|ram:?)/i, "").trim()
      }
      // Graphics detection
      else if (lowerLine.includes("graphics:") || lowerLine.includes("gpu:") || lowerLine.includes("video card:")) {
        requirements.graphics = line.replace(/^(graphics:|gpu:|video card:?)/i, "").trim()
      }
      // Storage detection
      else if (lowerLine.includes("storage:") || lowerLine.includes("disk space:") || lowerLine.includes("hard drive:")) {
        requirements.storage = line.replace(/^(storage:|disk space:|hard drive:?)/i, "").trim()
      }
    })

    return requirements
  }, [])

  // Apply parsed system requirements
  const handleApplySystemRequirements = useCallback(() => {
    const parsed = parseSystemRequirements(sysReqTextInput)

    setFormData({
      ...formData,
      systemRequirements: {
        ...formData.systemRequirements,
        recommended: {
          ...formData.systemRequirements.recommended,
          os: parsed.os || formData.systemRequirements.recommended.os,
          processor: parsed.processor || formData.systemRequirements.recommended.processor,
          memory: parsed.memory || formData.systemRequirements.recommended.memory,
          graphics: parsed.graphics || formData.systemRequirements.recommended.graphics,
          storage: parsed.storage || formData.systemRequirements.recommended.storage,
        },
      },
    })

    setSysReqTextInput("")
    setSysReqTextMode(false)
  }, [formData, sysReqTextInput, parseSystemRequirements])

  // Parse and apply multiple links from textarea
  const handleApplyMultipleLinks = useCallback((cloudIndex: number) => {
    const sections = multiLinkSections[cloudIndex] || []
    const allNewLinks: Array<{ name: string; url: string; size: string }> = []

    sections.forEach(section => {
      const lines = section.text.split("\n").filter(line => line.trim().length > 0)

      if (lines.length === 0) return

      const linkName = section.name || ""
      const linkSize = section.size || ""

      lines.forEach((line: string, idx: number) => {
        allNewLinks.push({
          name: linkName ? `${linkName} - Part ${idx + 1}` : `Part ${idx + 1}`,
          url: line.trim(),
          size: linkSize,
        })
      })
    })

    const updated = [...formData.cloudDownloads]
    updated[cloudIndex] = {
      ...updated[cloudIndex],
      actualDownloadLinks: allNewLinks, // Replace all existing links
    }
    setFormData({ ...formData, cloudDownloads: updated })

    // Clear sections after applying
    setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: [] })
  }, [formData, multiLinkSections])

  const previewGameData = {
    id: editItem?.id || 9999,
    title: formData.title || "Untitled Game",
    category: formData.category || "Uncategorized",
    image: formData.image || "/placeholder.svg",
    rating: formData.rating || "4.0",
    size: formData.size,
    description: formData.description || "No description provided.",
    longDescription: formData.longDescription,
    developer: formData.developer,
    releaseDate: formData.releaseDate,
    uploadDate: new Date().toISOString(),
    screenshots: formData.screenshots.filter(s => s.trim().length > 0),
    systemRequirements: formData.systemRequirements,
    features: formData.keyFeatures.filter(f => f.trim().length > 0),
    cloudDownloads: formData.cloudDownloads
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-8 bg-[#9d4edd] rounded-full"></span>
            {editItem ? "Edit Game Asset" : "Register New Game"}
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-4 font-medium uppercase tracking-wider">Premium Live Editor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,500px] 2xl:grid-cols-[1fr,600px] gap-8">
        {/* LEFT: FORM SIDE */}
        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8 pb-32">
            {/* Basic Information */}
            <Card className="bg-[#120b22] border-[#2d1b54] shadow-xl overflow-hidden group">
              <div className="h-1 w-full bg-gradient-to-r from-[#9d4edd] to-[#00bcd4] opacity-50 transition-opacity group-hover:opacity-100" />
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg md:text-xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1a103c] border border-[#2d1b54] flex items-center justify-center">
                    <Plus className="h-4 w-4 text-[#9d4edd]" />
                  </div>
                  Basic Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-white text-sm md:text-base">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white text-sm md:text-base">
                      Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        const updatedFormData = { ...formData, category: value }

                        // Auto-set MediaFire for Android Games
                        if (value === "Android Games" && formData.cloudDownloads[0]?.cloudName === "") {
                          updatedFormData.cloudDownloads = [{
                            ...formData.cloudDownloads[0],
                            cloudName: "MediaFire",
                          }]
                        }

                        setFormData(updatedFormData)
                      }}
                    >
                      <SelectTrigger className="bg-[#1a103c] border-[#2d1b54] text-white text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a103c] border-[#2d1b54]">
                        <SelectItem value="PC Games">PC Games</SelectItem>
                        <SelectItem value="Android Games">Android Games</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="developer" className="text-white text-sm md:text-base">
                      Developer
                    </Label>
                    <Input
                      id="developer"
                      value={formData.developer}
                      onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white text-sm md:text-base">Options</Label>
                    <div className="flex flex-wrap gap-4">
                      <Label htmlFor="latest" className="text-white flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          id="latest"
                          checked={formData.latest}
                          onChange={(e) => setFormData({ ...formData, latest: e.target.checked })}
                          className="w-4 h-4 text-green-600 bg-[#1a103c] border-[#2d1b54] rounded focus:ring-green-500"
                        />
                        <span>Latest</span>
                      </Label>
                      <Label htmlFor="hasNote" className="text-white flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          id="hasNote"
                          checked={formData.note !== undefined}
                          onChange={(e) => setFormData({ ...formData, note: e.target.checked ? "" : undefined })}
                          className="w-4 h-4 text-green-600 bg-[#1a103c] border-[#2d1b54] rounded focus:ring-green-500"
                        />
                        <span>Note</span>
                      </Label>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-600 p-3 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        📊 Use the "Trending Management" tab to add/remove items from trending section.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="size" className="text-white text-sm md:text-base">
                      File Size
                    </Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      placeholder="e.g., 2.5 GB"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating" className="text-white text-sm md:text-base">
                      Rating
                    </Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image" className="text-white text-sm md:text-base">
                      Image URL
                    </Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white text-sm md:text-base">
                    Short Description
                  </Label>
                  <Editor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value || "" })}
                    language="plaintext"
                    theme="vs-dark"
                    height="80px"
                    options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: "on" }}
                  />
                </div>

                <div>
                  <Label htmlFor="longDescription" className="text-white text-sm md:text-base">
                    Long Description
                  </Label>
                  <Editor
                    value={formData.longDescription}
                    onChange={(value) => setFormData({ ...formData, longDescription: value || "" })}
                    language="plaintext"
                    theme="vs-dark"
                    height="120px"
                    options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: "on" }}
                  />
                </div>

                {/* Note Input (when enabled) */}
                {formData.note !== undefined && (
                  <div>
                    <Label htmlFor="note" className="text-white text-sm md:text-base">
                      Note (Optional)
                    </Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm min-h-[80px]"
                      placeholder="Enter a note that will be displayed to users on the download page..."
                    />
                    <p className="text-gray-400 text-xs mt-1">This note will be shown to users after they enter the PIN and access the download page.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Features (Software only) */}
            {showKeyFeatures && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg md:text-xl">Key Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  {formData.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateKeyFeature(index, e.target.value)}
                        className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1"
                        placeholder="Enter key feature"
                      />
                      <Button
                        type="button"
                        onClick={() => removeKeyFeature(index)}
                        variant="outline"
                        size="sm"
                        className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addKeyFeature}
                    variant="outline"
                    className="bg-[#1a103c] border-[#2d1b54] text-white w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Screenshots */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg md:text-xl">Screenshots (Max 5)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                {formData.screenshots.map((screenshot, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={screenshot}
                      onChange={(e) => {
                        let cleanedUrl = e.target.value
                        // Auto-clean RiotPixels URLs when user types or pastes
                        if (cleanedUrl.includes('riotpixels.net')) {
                          cleanedUrl = cleanScreenshotUrl(cleanedUrl)
                        }
                        const updatedScreenshots = [...formData.screenshots]
                        updatedScreenshots[index] = cleanedUrl
                        setFormData({ ...formData, screenshots: updatedScreenshots })
                      }}
                      className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1"
                      placeholder="Enter screenshot URL - RiotPixels URLs will be auto-cleaned for full resolution"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const updatedScreenshots = formData.screenshots.filter((_, i) => i !== index)
                        setFormData({ ...formData, screenshots: updatedScreenshots })
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.screenshots.length < 5 && (
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, screenshots: [...formData.screenshots, ""] })}
                    variant="outline"
                    className="bg-[#1a103c] border-[#2d1b54] text-white w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Screenshot
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* System Requirements (PC Games and Software only) */}
            {showSystemRequirements && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg md:text-xl">Recommended System Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  {/* Toggle for intelligent text input */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sysreq-text-toggle"
                      checked={sysReqTextMode}
                      onChange={(e) => setSysReqTextMode(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-[#1a103c] border-[#2d1b54] rounded cursor-pointer"
                    />
                    <Label htmlFor="sysreq-text-toggle" className="text-white text-sm cursor-pointer">
                      Paste system requirements text
                    </Label>
                  </div>

                  {/* Intelligent text input mode */}
                  {sysReqTextMode && (
                    <div className="mb-4 p-4 bg-gray-600 rounded-lg border border-gray-500 space-y-3">
                      <Label className="text-white mb-2 block text-sm">Paste system requirements (one per line)</Label>
                      <Textarea
                        value={sysReqTextInput}
                        onChange={(e) => setSysReqTextInput(e.target.value)}
                        placeholder="OS: Windows 10&#10;Processor: Intel i7 gen 2 or AMD Ryzen&#10;Memory: 12 GB RAM&#10;Graphics: Nvidia GTX 2080 6GB&#10;Storage: 8 GB available space"
                        className="bg-gray-700 border-gray-500 text-white text-sm min-h-[150px]"
                      />
                      <p className="text-gray-300 text-xs">Supported keywords: OS, Operating System, Processor, CPU, Memory, RAM, Graphics, GPU, Video Card, Storage, Disk Space, Hard Drive</p>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleApplySystemRequirements}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm"
                        >
                          Apply Requirements
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setSysReqTextMode(false)
                            setSysReqTextInput("")
                          }}
                          variant="outline"
                          className="bg-[#120b22] border-[#2d1b54] text-white hover:bg-gray-600 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-gray-400 text-xs">Missing fields will be ignored. Existing values will be updated only if found in the text.</p>
                    </div>
                  )}

                  {/* Individual input fields */}
                  {!sysReqTextMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm md:text-base">Operating System</Label>
                        <Input
                          value={formData.systemRequirements.recommended.os}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, os: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">Processor</Label>
                        <Input
                          value={formData.systemRequirements.recommended.processor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, processor: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">Memory</Label>
                        <Input
                          value={formData.systemRequirements.recommended.memory}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, memory: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">Graphics</Label>
                        <Input
                          value={formData.systemRequirements.recommended.graphics}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, graphics: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">Storage</Label>
                        <Input
                          value={formData.systemRequirements.recommended.storage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, storage: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">DirectX</Label>
                        <Input
                          value={formData.systemRequirements.recommended.directx || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, directx: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm md:text-base">Sound Card</Label>
                        <Input
                          value={formData.systemRequirements.recommended.sound_card || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              systemRequirements: {
                                ...formData.systemRequirements,
                                recommended: { ...formData.systemRequirements.recommended, sound_card: e.target.value },
                              },
                            })
                          }
                          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Android Requirements (Android Games only) */}
            {showAndroidRequirements && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg md:text-xl">Recommended Android Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white text-sm md:text-base">Android Version</Label>
                      <Input
                        value={formData.androidRequirements.recommended.os}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            androidRequirements: {
                              ...formData.androidRequirements,
                              recommended: { ...formData.androidRequirements.recommended, os: e.target.value },
                            },
                          })
                        }
                        className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white text-sm md:text-base">RAM</Label>
                      <Input
                        value={formData.androidRequirements.recommended.ram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            androidRequirements: {
                              ...formData.androidRequirements,
                              recommended: { ...formData.androidRequirements.recommended, ram: e.target.value },
                            },
                          })
                        }
                        className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white text-sm md:text-base">Storage</Label>
                      <Input
                        value={formData.androidRequirements.recommended.storage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            androidRequirements: {
                              ...formData.androidRequirements,
                              recommended: { ...formData.androidRequirements.recommended, storage: e.target.value },
                            },
                          })
                        }
                        className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white text-sm md:text-base">Processor</Label>
                      <Input
                        value={formData.androidRequirements.recommended.processor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            androidRequirements: {
                              ...formData.androidRequirements,
                              recommended: { ...formData.androidRequirements.recommended, processor: e.target.value },
                            },
                          })
                        }
                        className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Cloud Downloads Configuration */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg md:text-xl">Cloud Downloads Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                <div className="bg-blue-900/20 border border-blue-600 p-3 md:p-4 rounded-lg mb-4">
                  <p className="text-blue-300 text-sm mb-2">📋 How it works:</p>
                  <ul className="text-blue-200 text-xs space-y-1 list-disc pl-4">
                    <li>Users click cloud download button → GP Links/V2Links survey opens automatically</li>
                    <li>After completing survey → PIN entry page appears</li>
                    <li>Users enter the shared PIN → Access to download page with direct links</li>
                    <li>All cloud providers use the same PIN and RAR password</li>
                    <li>Download pages expire after 12 hours for security</li>
                  </ul>
                </div>

                {/* Shared PIN and RAR Password */}
                <Card className="bg-[#1a103c] border-[#2d1b54]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-base md:text-lg">Shared Settings for All Cloud Providers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 md:px-6">
                    {/* Shared PIN Configuration */}
                    <div className="bg-gray-700 p-3 md:p-4 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <Label className="text-white text-sm md:text-base">Shared PIN Code (for all clouds)</Label>
                        <Button
                          type="button"
                          onClick={generateNewSharedPin}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-600 text-xs md:text-sm w-full sm:w-auto"
                        >
                          Generate New PIN
                        </Button>
                      </div>
                      <Input
                        value={formData.sharedPinCode}
                        onChange={(e) => setFormData({ ...formData, sharedPinCode: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white text-center text-lg font-mono tracking-widest"
                        maxLength={4}
                        placeholder="1234"
                      />
                      <p className="text-gray-400 text-xs mt-1">Users will need this PIN to access any cloud download page</p>
                    </div>

                    {/* Shared RAR Password (Optional) */}
                    <div>
                      <Label className="text-white mb-2 block text-sm md:text-base">Shared RAR/Archive Password (Optional)</Label>
                      <Input
                        value={formData.sharedRarPassword || ""}
                        onChange={(e) => setFormData({ ...formData, sharedRarPassword: e.target.value })}
                        className="bg-[#120b22] border-[#2d1b54] text-white text-sm"
                        placeholder="Enter password for compressed files"
                      />
                      <p className="text-gray-400 text-xs mt-1">Will be shown to users on all download pages</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cloud Providers */}
                {formData.cloudDownloads.map((cloudDownload, cloudIndex) => (
                  <Card key={cloudIndex} className="bg-[#1a103c] border-[#2d1b54]">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-white text-base md:text-lg">
                          Cloud Provider {cloudIndex + 1}
                        </CardTitle>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            onClick={() => duplicateCloudDownload(cloudIndex)}
                            variant="outline"
                            size="sm"
                            className="bg-[#120b22] border-[#2d1b54] text-blue-400 hover:bg-blue-600 hover:text-white w-full sm:w-auto"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </Button>
                          {formData.cloudDownloads.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeCloudDownload(cloudIndex)}
                              variant="outline"
                              size="sm"
                              className="bg-[#120b22] border-[#2d1b54] text-red-400 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Remove</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 md:px-6">
                      {/* Version (only for Update) */}
                      {cloudDownload.cloudName === "Update" && (
                        <div>
                          <Label className="text-white mb-2 block text-sm md:text-base">Version (Optional)</Label>
                          <Input
                            placeholder="e.g., v1.2.0, Hotfix 1.1.5 (leave empty for general updates)"
                            value={cloudDownload.version || ""}
                            onChange={(e) => {
                              updateCloudDownload(cloudIndex, "version", e.target.value || undefined)
                            }}
                            className="bg-[#120b22] border-[#2d1b54] text-white text-sm"
                          />
                          <p className="text-gray-400 text-xs mt-1">Version for this update. If empty, will be grouped with other general updates.</p>
                        </div>
                      )}

                      {/* Parts Number */}
                      <div>
                        <Label className="text-white mb-2 block text-sm md:text-base">Parts Number (Optional)</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 5 (leave empty to auto-count links)"
                          value={cloudDownload.partsNumber || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined
                            updateCloudDownload(cloudIndex, "partsNumber", value)
                          }}
                          className="bg-[#120b22] border-[#2d1b54] text-white text-sm"
                        />
                        <p className="text-gray-400 text-xs mt-1">Custom parts number to display. If empty, will show actual number of download links.</p>
                      </div>

                      {/* Cloud Name */}
                      <div>
                        <Label className="text-white mb-2 block text-sm md:text-base">Cloud Provider Name *</Label>
                        <Select
                          value={cloudDownload.cloudName || ""}
                          onValueChange={(value) => {
                            updateCloudDownload(cloudIndex, "cloudName", value)
                          }}
                        >
                          <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white text-sm">
                            <SelectValue placeholder="Select cloud provider" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#120b22] border-[#2d1b54]">
                            <SelectItem value="Black bullz">Black bullz</SelectItem>
                            <SelectItem value="Black bullz(updated)">Black bullz(updated)</SelectItem>
                            <SelectItem value="Direct Link">Direct Link</SelectItem>
                            <SelectItem value="Update">Update</SelectItem>
                            <SelectItem value="Google Drive">Google Drive</SelectItem>
                            <SelectItem value="GoFile">GoFile</SelectItem>
                            <SelectItem value="MediaFire">MediaFire</SelectItem>
                            <SelectItem value="MEGA UP">MEGA UP</SelectItem>
                            <SelectItem value="Dropbox">Dropbox</SelectItem>
                            <SelectItem value="pCloud">pCloud</SelectItem>
                            <SelectItem value="DDownload">DDownload</SelectItem>
                            <SelectItem value="RANOZ">RANOZ</SelectItem>
                            <SelectItem value="MEGA">MEGA</SelectItem>
                            <SelectItem value="Upload-Haven">Upload-Haven</SelectItem>
                            <SelectItem value="Multi-up">Multi-up</SelectItem>
                            <SelectItem value="Data Nodes">Data Nodes</SelectItem>
                            <SelectItem value="Pixel Drain">Pixel Drain</SelectItem>
                            <SelectItem value="RapidGator">RapidGator</SelectItem>
                            <SelectItem value="Viking File">Viking File</SelectItem>
                            <SelectItem value="Fucking Fast">Fucking Fast</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {(cloudDownload.cloudName === "Direct Link" || cloudDownload.cloudName === "Update") && (
                          <div className="mt-2">
                            <Label className="text-white mb-1 block text-sm">Actual Cloud Provider for {cloudDownload.cloudName}</Label>
                            <Select
                              value={cloudDownload.actualProvider || ""}
                              onValueChange={(value) => {
                                const updated = [...formData.cloudDownloads]
                                updated[cloudIndex].actualProvider = value
                                setFormData({ ...formData, cloudDownloads: updated })
                              }}
                            >
                              <SelectTrigger className="bg-[#120b22] border-[#2d1b54] text-white text-sm">
                                <SelectValue placeholder="Select actual cloud provider" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#120b22] border-[#2d1b54]">
                                <SelectItem value="Black bullz">Black bullz</SelectItem>
                                <SelectItem value="Black bullz(updated)">Black bullz(updated)</SelectItem>
                                <SelectItem value="Google Drive">Google Drive</SelectItem>
                                <SelectItem value="GoFile">GoFile</SelectItem>
                                <SelectItem value="MediaFire">MediaFire</SelectItem>
                                <SelectItem value="MEGA UP">MEGA UP</SelectItem>
                                <SelectItem value="Dropbox">Dropbox</SelectItem>
                                <SelectItem value="pCloud">pCloud</SelectItem>
                                <SelectItem value="DDownload">DDownload</SelectItem>
                                <SelectItem value="RANOZ">RANOZ</SelectItem>
                                <SelectItem value="MEGA">MEGA</SelectItem>
                                <SelectItem value="Upload-Haven">Upload-Haven</SelectItem>
                                <SelectItem value="Multi-up">Multi-up</SelectItem>
                                <SelectItem value="RapidGator">RapidGator</SelectItem>
                                <SelectItem value="Data Nodes">Data Nodes</SelectItem>
                                <SelectItem value="Pixel Drain">Pixel Drain</SelectItem>
                                <SelectItem value="Viking File">Viking File</SelectItem>
                                <SelectItem value="Fucking Fast">Fucking Fast</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {cloudDownload.actualProvider === "Other" || cloudDownload.cloudName === "Other" ? (
                          <Input
                            className="bg-[#120b22] border-[#2d1b54] text-white mt-2 text-sm"
                            placeholder="Enter custom cloud provider name"
                            value={cloudDownload.customProvider || ""}
                            onChange={(e) => {
                              const updated = [...formData.cloudDownloads]
                              updated[cloudIndex].customProvider = e.target.value
                              setFormData({ ...formData, cloudDownloads: updated })
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Download Links for this cloud */}
                      <div>
                        <Label className="text-white mb-2 block text-sm md:text-base">Download Links for {cloudDownload.cloudName || 'this cloud'}</Label>
                        <p className="text-gray-400 text-xs mb-3">These are the actual download links users will see after entering the shared PIN</p>

                        {/* Toggle for multi-link text input */}
                        <div className="mb-4 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`multilink-toggle-${cloudIndex}`}
                            checked={multiLinkMode[cloudIndex] || false}
                            onChange={(e) => handleToggleMultiLink(cloudIndex, e.target.checked)}
                            className="w-4 h-4 text-green-600 bg-[#120b22] border-[#2d1b54] rounded cursor-pointer"
                          />
                          <Label htmlFor={`multilink-toggle-${cloudIndex}`} className="text-white text-sm cursor-pointer">
                            Add multiple links at once
                          </Label>
                        </div>

                        {/* Multi-link text input mode */}
                        {multiLinkMode[cloudIndex] && (
                          <div className="mb-4 p-4 bg-gray-700 rounded-lg border border-gray-600 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-white text-sm font-medium">Multi-Link Input</Label>
                              <Button
                                type="button"
                                onClick={() => setMultiLinkMode({ ...multiLinkMode, [cloudIndex]: false })}
                                variant="outline"
                                size="sm"
                                className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>

                            {(multiLinkSections[cloudIndex] || []).map((section, sectionIdx) => (
                              <div key={sectionIdx} className="mb-4 p-3 bg-gray-600 rounded-lg border border-gray-500 space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-white text-sm font-medium">Section {sectionIdx + 1}</Label>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const updatedSections = [...(multiLinkSections[cloudIndex] || [])]
                                      updatedSections.splice(sectionIdx, 1)
                                      setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: updatedSections })
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-white mb-1 block text-sm">Link Name (Optional)</Label>
                                    <Input
                                      placeholder="e.g., Main File, Setup"
                                      value={section.name}
                                      onChange={(e) => {
                                        const updatedSections = [...(multiLinkSections[cloudIndex] || [])]
                                        updatedSections[sectionIdx] = { ...section, name: e.target.value }
                                        setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: updatedSections })
                                      }}
                                      className="bg-gray-800 border-gray-600 text-white text-sm"
                                    />
                                    <p className="text-gray-400 text-xs mt-1">Will be combined with Part number (e.g., "Main File - Part 1")</p>
                                  </div>
                                  <div>
                                    <Label className="text-white mb-1 block text-sm">File Size (Optional)</Label>
                                    <Input
                                      placeholder="e.g., 2.5 GB"
                                      value={section.size}
                                      onChange={(e) => {
                                        const updatedSections = [...(multiLinkSections[cloudIndex] || [])]
                                        updatedSections[sectionIdx] = { ...section, size: e.target.value }
                                        setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: updatedSections })
                                      }}
                                      className="bg-gray-800 border-gray-600 text-white text-sm"
                                    />
                                    <p className="text-gray-400 text-xs mt-1">Same size for all links</p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-white mb-2 block text-sm">Paste multiple download URLs (one per line)</Label>
                                  <Textarea
                                    value={section.text}
                                    onChange={(e) => {
                                      const updatedSections = [...(multiLinkSections[cloudIndex] || [])]
                                      updatedSections[sectionIdx] = { ...section, text: e.target.value }
                                      setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: updatedSections })
                                    }}
                                    placeholder="https://drive.google.com/file/d/...\nhttps://mega.nz/file/..."
                                    className="bg-gray-800 border-gray-600 text-white text-sm min-h-[120px]"
                                  />
                                </div>
                              </div>
                            ))}

                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  const updatedSections = [...(multiLinkSections[cloudIndex] || []), { name: "", size: "", text: "" }]
                                  setMultiLinkSections({ ...multiLinkSections, [cloudIndex]: updatedSections })
                                }}
                                variant="outline"
                                className="bg-blue-700 border-blue-600 text-white hover:bg-blue-600"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Section
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleApplyMultipleLinks(cloudIndex)}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm flex-1"
                              >
                                Apply Links
                              </Button>
                            </div>
                            <p className="text-gray-400 text-xs">This will add all links from all sections to the download links below.</p>
                          </div>
                        )}

                        {/* Single link editing mode */}
                        {!multiLinkMode[cloudIndex] && cloudDownload.actualDownloadLinks.map((link, linkIndex) => (
                          <div key={linkIndex} className="space-y-3 p-3 md:p-4 bg-gray-700 rounded-lg mb-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white mb-1 block text-sm">Link Name *</Label>
                                <Input
                                  placeholder="e.g., Part 1, Main File, Setup"
                                  value={link.name}
                                  onChange={(e) => updateDownloadLink(cloudIndex, linkIndex, "name", e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <Label className="text-white mb-1 block text-sm">File Size *</Label>
                                <Input
                                  placeholder="e.g., 2.5 GB"
                                  value={link.size}
                                  onChange={(e) => updateDownloadLink(cloudIndex, linkIndex, "size", e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white text-sm"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-white mb-1 block text-sm">Direct Download URL *</Label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                  placeholder="https://drive.google.com/... or https://mega.nz/..."
                                  value={link.url}
                                  onChange={(e) => updateDownloadLink(cloudIndex, linkIndex, "url", e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white flex-1 text-sm"
                                  required
                                />
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (link.url && link.url.trim()) {
                                      window.open(link.url.trim(), '_blank', 'noopener,noreferrer');
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-800 border-blue-700 text-white hover:bg-blue-600 w-full sm:w-auto"
                                  title="Open link in new tab"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Open</span>
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => duplicateDownloadLink(cloudIndex, linkIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-600 w-full sm:w-auto"
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Duplicate</span>
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => removeDownloadLink(cloudIndex, linkIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Remove</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {!multiLinkMode[cloudIndex] && (
                          <Button
                            type="button"
                            onClick={() => addDownloadLink(cloudIndex)}
                            variant="outline"
                            className="bg-[#120b22] border-[#2d1b54] text-white hover:bg-gray-600 w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Download Link
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  onClick={addCloudDownload}
                  variant="outline"
                  className="bg-[#1a103c] border-[#2d1b54] text-white hover:bg-gray-500 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cloud Provider
                </Button>
              </CardContent>
            </Card>
            <div className="flex justify-end pt-8 sticky bottom-8 z-30">
              <Button type="submit" className="bg-gradient-to-r from-[#9d4edd] to-[#7b2cbf] hover:from-[#7b2cbf] hover:to-[#5a189a] text-white font-bold h-14 px-10 rounded-xl shadow-[0_0_20px_rgba(157,78,221,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 group">
                <Save className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
                {editItem ? "Synchronize Updates" : "Deploy Game Assets"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: LIVE PREVIEW SIDE (STICKY) */}
        <div className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-[#9d4edd] uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9d4edd] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9d4edd]"></span>
                </span>
                Live Simulation
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">Real-time Reflection v1.0</span>
            </div>

            <div className="bg-[#090514] rounded-2xl border border-[#2d1b54] overflow-hidden shadow-2xl h-[calc(100vh-180px)] overflow-y-auto no-scrollbar scroll-smooth">
              <div className="transform scale-[0.85] origin-top">
                <div className="dark">
                  <GameDetails game={previewGameData as any} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#1a103c] to-[#120b22] p-4 rounded-xl border border-[#2d1b54] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <span className="text-xs font-medium text-gray-300">Ready for synchronization</span>
              </div>
              <p className="text-[10px] text-gray-500 italic max-w-[180px] text-right">Preview accurately reflects the public game details page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
