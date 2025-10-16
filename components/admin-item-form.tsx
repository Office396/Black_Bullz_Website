"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save } from "lucide-react"
import Editor from "@monaco-editor/react"

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
  trending: boolean
  latest: boolean // Added latest checkbox
  keyFeatures: string[]
  screenshots: string[] // Added screenshots array
  systemRequirements: {
    recommended: {
      // Removed minimum, kept only recommended
      os: string
      processor: string
      memory: string
      graphics: string
      storage: string
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
  trending: false,
  latest: false, // Added latest field
  keyFeatures: [""],
  screenshots: [], // Added empty screenshots array
  systemRequirements: {
    recommended: { os: "", processor: "", memory: "", graphics: "", storage: "" }, // Only recommended
  },
  androidRequirements: {
    recommended: { os: "", ram: "", storage: "", processor: "" }, // Only recommended
  },
  sharedPinCode: Math.floor(1000 + Math.random() * 9000).toString(), // Generate random 4-digit PIN
  sharedRarPassword: "",
  cloudDownloads: [{
    cloudName: "",
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
        sharedPinCode: editItem.sharedPinCode || Math.floor(1000 + Math.random() * 9000).toString(),
        sharedRarPassword: editItem.sharedRarPassword || "",
        cloudDownloads: editItem.cloudDownloads || [{
          cloudName: "",
          actualDownloadLinks: editItem.downloadLinks || [{ name: "", url: "", size: "" }],
        }],
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

  const updateCloudDownload = (cloudIndex: number, field: string, value: string) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Basic Information */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg md:text-xl">Basic Information</CardTitle>
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
                className="bg-gray-600 border-gray-500 text-white text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-white text-sm md:text-base">
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-600 border-gray-500 text-white text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-600 border-gray-500">
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
                className="bg-gray-600 border-gray-500 text-white text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-white text-sm md:text-base">Options</Label>
              <div className="flex flex-wrap gap-4">
                <Label htmlFor="trending" className="text-white flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    id="trending"
                    checked={formData.trending}
                    onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                  />
                  <span>Trending</span>
                </Label>
                <Label htmlFor="latest" className="text-white flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    id="latest"
                    checked={formData.latest}
                    onChange={(e) => setFormData({ ...formData, latest: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                  />
                  <span>Latest</span>
                </Label>
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
                className="bg-gray-600 border-gray-500 text-white text-sm"
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
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="bg-gray-600 border-gray-500 text-white text-sm"
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
                className="bg-gray-600 border-gray-500 text-white text-sm"
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
        </CardContent>
      </Card>

      {/* Key Features (Software only) */}
      {showKeyFeatures && (
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg md:text-xl">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6">
            {formData.keyFeatures.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={feature}
                  onChange={(e) => updateKeyFeature(index, e.target.value)}
                  className="bg-gray-600 border-gray-500 text-white text-sm flex-1"
                  placeholder="Enter key feature"
                />
                <Button
                  type="button"
                  onClick={() => removeKeyFeature(index)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-600 border-gray-500 text-red-400 h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addKeyFeature}
              variant="outline"
              className="bg-gray-600 border-gray-500 text-white w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Screenshots */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg md:text-xl">Screenshots (Max 5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6">
          {formData.screenshots.map((screenshot, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={screenshot}
                onChange={(e) => {
                  const updatedScreenshots = [...formData.screenshots]
                  updatedScreenshots[index] = e.target.value
                  setFormData({ ...formData, screenshots: updatedScreenshots })
                }}
                className="bg-gray-600 border-gray-500 text-white text-sm flex-1"
                placeholder="Enter screenshot URL"
              />
              <Button
                type="button"
                onClick={() => {
                  const updatedScreenshots = formData.screenshots.filter((_, i) => i !== index)
                  setFormData({ ...formData, screenshots: updatedScreenshots })
                }}
                variant="outline"
                size="sm"
                className="bg-gray-600 border-gray-500 text-red-400 h-10 w-10 p-0"
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
              className="bg-gray-600 border-gray-500 text-white w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Screenshot
            </Button>
          )}
        </CardContent>
      </Card>

      {/* System Requirements (PC Games and Software only) */}
      {showSystemRequirements && (
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg md:text-xl">Recommended System Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6">
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Requirements (Android Games only) */}
      {showAndroidRequirements && (
        <Card className="bg-gray-700 border-gray-600">
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
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
                  className="bg-gray-600 border-gray-500 text-white text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloud Downloads Configuration */}
      <Card className="bg-gray-700 border-gray-600">
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
          <Card className="bg-gray-600 border-gray-500">
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
                  className="bg-gray-700 border-gray-600 text-white text-sm"
                  placeholder="Enter password for compressed files"
                />
                <p className="text-gray-400 text-xs mt-1">Will be shown to users on all download pages</p>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Providers */}
          {formData.cloudDownloads.map((cloudDownload, cloudIndex) => (
            <Card key={cloudIndex} className="bg-gray-600 border-gray-500">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-white text-base md:text-lg">
                    Cloud Provider {cloudIndex + 1}
                  </CardTitle>
                  {formData.cloudDownloads.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeCloudDownload(cloudIndex)}
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 border-gray-600 text-red-400 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                {/* Cloud Name */}
                <div>
                  <Label className="text-white mb-2 block text-sm md:text-base">Cloud Provider Name *</Label>
                  <Select
                    value={["Google Drive","MediaFire","Mega","OneDrive","Dropbox","pCloud","4shared","Zippyshare"].includes(cloudDownload.cloudName) ? cloudDownload.cloudName : "Other"}
                    onValueChange={(value) => {
                      if (value === "Other") {
                        updateCloudDownload(cloudIndex, "cloudName", "Other")
                      } else {
                        updateCloudDownload(cloudIndex, "cloudName", value)
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Select cloud provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="Direct Link">Direct Link</SelectItem>
                      <SelectItem value="Google Drive">Google Drive</SelectItem>
                      <SelectItem value="MediaFire">MediaFire</SelectItem>
                      <SelectItem value="Mega">Mega</SelectItem>
                      <SelectItem value="OneDrive">OneDrive</SelectItem>
                      <SelectItem value="Dropbox">Dropbox</SelectItem>
                      <SelectItem value="pCloud">pCloud</SelectItem>
                      <SelectItem value="4shared">4shared</SelectItem>
                      <SelectItem value="Zippyshare">Zippyshare</SelectItem>
                      <SelectItem value="Direct Link"></SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {(cloudDownload.cloudName === "Other" || !["Google Drive","MediaFire","Mega","OneDrive","Dropbox","pCloud","4shared","Zippyshare"].includes(cloudDownload.cloudName)) && (
                    <Input
                      className="bg-gray-700 border-gray-600 text-white mt-2 text-sm"
                      placeholder="Enter custom cloud provider name"
                      value={cloudDownload.cloudName === "Other" ? "" : cloudDownload.cloudName}
                      onChange={(e) => updateCloudDownload(cloudIndex, "cloudName", e.target.value)}
                    />
                  )}
                </div>

                {/* Download Links for this cloud */}
                <div>
                  <Label className="text-white mb-2 block text-sm md:text-base">Download Links for {cloudDownload.cloudName || 'this cloud'}</Label>
                  <p className="text-gray-400 text-xs mb-3">These are the actual download links users will see after entering the shared PIN</p>

                  {cloudDownload.actualDownloadLinks.map((link, linkIndex) => (
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

                  <Button
                    type="button"
                    onClick={() => addDownloadLink(cloudIndex)}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Download Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            onClick={addCloudDownload}
            variant="outline"
            className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500 w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cloud Provider
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-red-600 hover:bg-red-700 transition-colors w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {editItem ? "Update Item" : "Save Item"}
        </Button>
      </div>
    </form>
  )
}
