"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameDetails } from "@/components/game-details"
import { Plus, Trash2, Save, Copy, ExternalLink } from "lucide-react"
import Editor from "@monaco-editor/react"

const cleanScreenshotUrl = (url: string): string => {
  if (!url) return url
  if (url.includes('riotpixels.net')) {
    const lastJpgIndex = url.lastIndexOf('.jpg')
    const slashAfterJpg = url.indexOf('/', lastJpgIndex)
    if (slashAfterJpg !== -1) url = url.substring(0, slashAfterJpg)
    url = url.replace(/\.240p\.jpg$/, '.jpg').replace(/\.480p\.jpg$/, '.jpg').replace(/\.1080p\.jpg$/, '.jpg').replace(/\.jpg\.jpg$/, '.jpg').replace(/^http:/, 'https:')
  }
  url = url.replace(/_\d+x\d+\./g, '.').replace(/-thumb\./g, '.').replace(/-small\./g, '.').replace(/-medium\./g, '.')
  return url
}

interface FormData {
  title: string; category: string; description: string; longDescription: string
  developer: string; publisher?: string; size: string; releaseDate: string; image: string
  rating: string; latest: boolean; keyFeatures: string[]; screenshots: string[]; note?: string
  systemRequirements: { recommended: { os: string; processor: string; memory: string; graphics: string; storage: string; directx: string; sound_card: string } }
  androidRequirements: { recommended: { os: string; ram: string; storage: string; processor: string } }
  sharedPinCode: string; sharedRarPassword?: string
  cloudDownloads: Array<{ cloudName: string; actualProvider?: string; customProvider?: string; partsNumber?: number; version?: string; actualDownloadLinks: Array<{ name: string; url: string; size: string }> }>
}

const initialFormData: FormData = {
  title: "", category: "", description: "", longDescription: "", developer: "", publisher: "",
  size: "", releaseDate: "", image: "", rating: "4.0", latest: true, keyFeatures: [""],
  screenshots: [], note: "",
  systemRequirements: { recommended: { os: "", processor: "", memory: "", graphics: "", storage: "", directx: "", sound_card: "" } },
  androidRequirements: { recommended: { os: "Android 12", ram: "8 GB", storage: "350 MB", processor: "Snapdragon / MediaTek (Average Processors)" } },
  sharedPinCode: "1234", sharedRarPassword: "",
  cloudDownloads: [{ cloudName: "", partsNumber: undefined, version: undefined, actualDownloadLinks: [{ name: "", url: "", size: "" }] }],
}

export function AdminItemForm({ editItem, onSave }: { editItem?: any; onSave?: () => void }) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (editItem) {
      return {
        ...editItem,
        publisher: editItem.publisher || "",
        screenshots: editItem.screenshots || [],
        note: editItem.note || "",
        sharedPinCode: editItem.sharedPinCode || "1234",
        sharedRarPassword: editItem.sharedRarPassword || "",
        cloudDownloads: editItem.cloudDownloads || [{ cloudName: "", partsNumber: undefined, version: undefined, actualDownloadLinks: [{ name: "", url: "", size: "" }] }],
        systemRequirements: editItem.systemRequirements || { recommended: { os: "", processor: "", memory: "", graphics: "", storage: "", directx: "", sound_card: "" } },
        androidRequirements: editItem.androidRequirements || { recommended: { os: "Android 12", ram: "8 GB", storage: "350 MB", processor: "Snapdragon / MediaTek (Average Processors)" } },
      }
    }
    return { ...initialFormData, sharedPinCode: String(Math.floor(1000 + Math.random() * 9000)) }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = "/api/items"
      const method = editItem ? "PUT" : "POST"
      const body = editItem ? { id: editItem.id, ...formData } : formData
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const result = await response.json()
      if (response.ok && result.success) {
        alert(editItem ? "Item updated successfully!" : "Item saved successfully!")
        if (onSave) onSave()
        if (!editItem) setFormData({ ...initialFormData, sharedPinCode: String(Math.floor(1000 + Math.random() * 9000)) })
      } else { throw new Error(result.error || "Failed to save item.") }
    } catch (err) { console.error("Failed to save item", err); alert("Failed to save item. Please try again.") }
  }

  const addKeyFeature = () => setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, ""] })
  const removeKeyFeature = (i: number) => setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, idx) => idx !== i) })
  const updateKeyFeature = (i: number, v: string) => { const u = [...formData.keyFeatures]; u[i] = v; setFormData({ ...formData, keyFeatures: u }) }

  const addCloudDownload = () => setFormData({ ...formData, cloudDownloads: [...formData.cloudDownloads, { cloudName: "", partsNumber: undefined, version: undefined, actualDownloadLinks: [{ name: "", url: "", size: "" }] }] })
  const removeCloudDownload = (ci: number) => setFormData({ ...formData, cloudDownloads: formData.cloudDownloads.filter((_, i) => i !== ci) })
  const duplicateCloudDownload = (ci: number) => {
    const c = formData.cloudDownloads[ci]
    const dup = { ...c, actualDownloadLinks: c.actualDownloadLinks.map(l => ({ ...l })), partsNumber: undefined, version: undefined }
    const u = [...formData.cloudDownloads]; u.splice(ci + 1, 0, dup); setFormData({ ...formData, cloudDownloads: u })
  }
  const updateCloudDownload = (ci: number, field: string, value: any) => { const u = [...formData.cloudDownloads]; u[ci] = { ...u[ci], [field]: value }; setFormData({ ...formData, cloudDownloads: u }) }
  const addDownloadLink = (ci: number) => { const u = [...formData.cloudDownloads]; u[ci].actualDownloadLinks.push({ name: "", url: "", size: "" }); setFormData({ ...formData, cloudDownloads: u }) }
  const removeDownloadLink = (ci: number, li: number) => { const u = [...formData.cloudDownloads]; u[ci].actualDownloadLinks = u[ci].actualDownloadLinks.filter((_, i) => i !== li); setFormData({ ...formData, cloudDownloads: u }) }
  const duplicateDownloadLink = (ci: number, li: number) => { const u = [...formData.cloudDownloads]; const l = u[ci].actualDownloadLinks[li]; if (!l) return; u[ci].actualDownloadLinks.splice(li + 1, 0, { ...l }); setFormData({ ...formData, cloudDownloads: u }) }
  const updateDownloadLink = (ci: number, li: number, field: string, value: string) => { const u = [...formData.cloudDownloads]; u[ci].actualDownloadLinks[li] = { ...u[ci].actualDownloadLinks[li], [field]: value }; setFormData({ ...formData, cloudDownloads: u }) }
  const generateNewSharedPin = () => setFormData({ ...formData, sharedPinCode: String(Math.floor(1000 + Math.random() * 9000)) })

  const showSystemRequirements = formData.category === "PC Games" || formData.category === "Software"
  const showAndroidRequirements = formData.category === "Android Games"
  const showKeyFeatures = formData.category === "Software"

  const [multiLinkMode, setMultiLinkMode] = useState<Record<number, boolean>>({})
  const [multiLinkSections, setMultiLinkSections] = useState<Record<number, Array<{ name: string; size: string; text: string }>>>({})
  const handleToggleMultiLink = (ci: number, checked: boolean) => {
    if (checked) setMultiLinkSections({ ...multiLinkSections, [ci]: [{ name: "", size: "", text: "" }] })
    setMultiLinkMode({ ...multiLinkMode, [ci]: checked })
  }

  const [sysReqTextMode, setSysReqTextMode] = useState(false)
  const [sysReqTextInput, setSysReqTextInput] = useState("")

  const parseSystemRequirements = useCallback((text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0)
    const r = { os: "", processor: "", memory: "", graphics: "", storage: "" }
    lines.forEach(line => {
      const ll = line.toLowerCase()
      if (ll.includes("os:") || ll.includes("operating system")) r.os = line.replace(/^(os:|operating system:?)/i, "").trim()
      else if (ll.includes("processor:") || ll.includes("cpu:")) r.processor = line.replace(/^(processor:|cpu:?)/i, "").trim()
      else if (ll.includes("memory:") || ll.includes("ram:")) r.memory = line.replace(/^(memory:|ram:?)/i, "").trim()
      else if (ll.includes("graphics:") || ll.includes("gpu:") || ll.includes("video card:")) r.graphics = line.replace(/^(graphics:|gpu:|video card:?)/i, "").trim()
      else if (ll.includes("storage:") || ll.includes("disk space:") || ll.includes("hard drive:")) r.storage = line.replace(/^(storage:|disk space:|hard drive:?)/i, "").trim()
    })
    return r
  }, [])

  const handleApplySystemRequirements = useCallback(() => {
    const parsed = parseSystemRequirements(sysReqTextInput)
    setFormData(fd => ({ ...fd, systemRequirements: { ...fd.systemRequirements, recommended: { ...fd.systemRequirements.recommended, os: parsed.os || fd.systemRequirements.recommended.os, processor: parsed.processor || fd.systemRequirements.recommended.processor, memory: parsed.memory || fd.systemRequirements.recommended.memory, graphics: parsed.graphics || fd.systemRequirements.recommended.graphics, storage: parsed.storage || fd.systemRequirements.recommended.storage } } }))
    setSysReqTextInput(""); setSysReqTextMode(false)
  }, [sysReqTextInput, parseSystemRequirements])

  const handleApplyMultipleLinks = useCallback((ci: number) => {
    const sections = multiLinkSections[ci] || []
    const allNewLinks: Array<{ name: string; url: string; size: string }> = []
    sections.forEach(section => {
      const lines = section.text.split("\n").filter(l => l.trim().length > 0)
      if (lines.length === 0) return
      lines.forEach((line, idx) => allNewLinks.push({ name: section.name ? `${section.name} - Part ${idx + 1}` : `Part ${idx + 1}`, url: line.trim(), size: section.size || "" }))
    })
    const u = [...formData.cloudDownloads]; u[ci] = { ...u[ci], actualDownloadLinks: allNewLinks }
    setFormData({ ...formData, cloudDownloads: u })
    setMultiLinkSections({ ...multiLinkSections, [ci]: [] })
  }, [formData, multiLinkSections])

  const previewGameData = {
    id: editItem?.id || 9999, title: formData.title || "Untitled Game", category: formData.category || "Uncategorized",
    image: formData.image || "/placeholder.svg", rating: formData.rating || "4.0", size: formData.size,
    description: formData.description || "No description provided.", longDescription: formData.longDescription,
    developer: formData.developer, publisher: formData.publisher, releaseDate: formData.releaseDate,
    uploadDate: new Date().toISOString(), screenshots: formData.screenshots.filter(s => s.trim().length > 0),
    systemRequirements: formData.systemRequirements, features: formData.keyFeatures.filter(f => f.trim().length > 0),
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
                    <Label htmlFor="title" className="text-white text-sm">Title *</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" required />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white text-sm">Category *</Label>
                    <Select value={formData.category} onValueChange={value => {
                      const u = { ...formData, category: value }
                      if (value === "Android Games" && formData.cloudDownloads[0]?.cloudName === "") u.cloudDownloads = [{ ...formData.cloudDownloads[0], cloudName: "MediaFire" }]
                      setFormData(u)
                    }}>
                      <SelectTrigger className="bg-[#1a103c] border-[#2d1b54] text-white text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
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
                    <Label htmlFor="developer" className="text-white text-sm">Developer</Label>
                    <Input id="developer" value={formData.developer} onChange={e => setFormData({ ...formData, developer: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="publisher" className="text-white text-sm">Publisher</Label>
                    <Input id="publisher" placeholder="e.g. Electronic Arts, Ubisoft..." value={formData.publisher || ""} onChange={e => setFormData({ ...formData, publisher: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-white text-sm">Options</Label>
                  <div className="flex flex-wrap gap-4">
                    <Label htmlFor="latest" className="text-white flex items-center space-x-2 text-sm">
                      <input type="checkbox" id="latest" checked={formData.latest} onChange={e => setFormData({ ...formData, latest: e.target.checked })} className="w-4 h-4 text-green-600 bg-[#1a103c] border-[#2d1b54] rounded" />
                      <span>Latest</span>
                    </Label>
                    <Label htmlFor="hasNote" className="text-white flex items-center space-x-2 text-sm">
                      <input type="checkbox" id="hasNote" checked={formData.note !== undefined} onChange={e => setFormData({ ...formData, note: e.target.checked ? "" : undefined })} className="w-4 h-4 text-green-600 bg-[#1a103c] border-[#2d1b54] rounded" />
                      <span>Note</span>
                    </Label>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-600 p-3 rounded-lg">
                    <p className="text-blue-300 text-sm">📊 Use the "Trending Management" tab to add/remove items from trending section.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="size" className="text-white text-sm">File Size</Label>
                    <Input id="size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder="e.g., 2.5 GB" />
                  </div>
                  <div>
                    <Label htmlFor="rating" className="text-white text-sm">Rating</Label>
                    <Input id="rating" type="number" min="1" max="10" step="0.1" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="image" className="text-white text-sm">Image URL</Label>
                    <Input id="image" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder="https://example.com/image.jpg" />
                  </div>
                </div>

                <div>
                  <Label className="text-white text-sm">Short Description</Label>
                  <Editor value={formData.description} onChange={v => setFormData({ ...formData, description: v || "" })} language="plaintext" theme="vs-dark" height="80px" options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: "on" }} />
                </div>
                <div>
                  <Label className="text-white text-sm">Long Description</Label>
                  <Editor value={formData.longDescription} onChange={v => setFormData({ ...formData, longDescription: v || "" })} language="plaintext" theme="vs-dark" height="120px" options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: "on" }} />
                </div>

                {formData.note !== undefined && (
                  <div>
                    <Label htmlFor="note" className="text-white text-sm">Note (Optional)</Label>
                    <Textarea id="note" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm min-h-[80px]" placeholder="Enter a note that will be displayed to users..." />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Features (Software only) */}
            {showKeyFeatures && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4"><CardTitle className="text-white text-lg">Key Features</CardTitle></CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  {formData.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={feature} onChange={e => updateKeyFeature(index, e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1" placeholder="Enter key feature" />
                      <Button type="button" onClick={() => removeKeyFeature(index)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-10 w-10 p-0"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" onClick={addKeyFeature} variant="outline" className="bg-[#1a103c] border-[#2d1b54] text-white w-full md:w-auto"><Plus className="h-4 w-4 mr-2" />Add Feature</Button>
                </CardContent>
              </Card>
            )}

            {/* Screenshots */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4"><CardTitle className="text-white text-lg">Screenshots (Max 5)</CardTitle></CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                {formData.screenshots.map((screenshot, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={screenshot} onChange={e => {
                      let url = e.target.value
                      if (url.includes('riotpixels.net')) url = cleanScreenshotUrl(url)
                      const u = [...formData.screenshots]; u[index] = url; setFormData({ ...formData, screenshots: u })
                    }} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1" placeholder="Enter screenshot URL" />
                    <Button type="button" onClick={() => setFormData({ ...formData, screenshots: formData.screenshots.filter((_, i) => i !== index) })} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-10 w-10 p-0"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {formData.screenshots.length < 5 && (
                  <Button type="button" onClick={() => setFormData({ ...formData, screenshots: [...formData.screenshots, ""] })} variant="outline" className="bg-[#1a103c] border-[#2d1b54] text-white w-full md:w-auto"><Plus className="h-4 w-4 mr-2" />Add Screenshot</Button>
                )}
              </CardContent>
            </Card>

            {/* System Requirements (PC/Software) */}
            {showSystemRequirements && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg">System Requirements</CardTitle>
                  <Button type="button" onClick={() => setSysReqTextMode(!sysReqTextMode)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-white mt-2">
                    {sysReqTextMode ? "Manual Input" : "Paste Text"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  {sysReqTextMode ? (
                    <div className="space-y-3">
                      <Textarea value={sysReqTextInput} onChange={e => setSysReqTextInput(e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm min-h-[120px]" placeholder={"OS: Windows 10\nProcessor: Intel i5\nMemory: 8 GB RAM\nGraphics: GTX 1060\nStorage: 50 GB"} />
                      <Button type="button" onClick={handleApplySystemRequirements} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white">Apply</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "os", label: "OS", placeholder: "Windows 10 64-bit" },
                        { key: "processor", label: "Processor", placeholder: "Intel Core i5-8400" },
                        { key: "memory", label: "Memory", placeholder: "8 GB RAM" },
                        { key: "graphics", label: "Graphics", placeholder: "NVIDIA GTX 1060" },
                        { key: "storage", label: "Storage", placeholder: "50 GB available space" },
                        { key: "directx", label: "DirectX", placeholder: "Version 11" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <Label className="text-white text-sm">{label}</Label>
                          <Input value={(formData.systemRequirements.recommended as any)[key] || ""} onChange={e => setFormData({ ...formData, systemRequirements: { ...formData.systemRequirements, recommended: { ...formData.systemRequirements.recommended, [key]: e.target.value } } })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder={placeholder} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Android Requirements */}
            {showAndroidRequirements && (
              <Card className="bg-[#120b22] border-[#2d1b54]">
                <CardHeader className="pb-4"><CardTitle className="text-white text-lg">Android Requirements</CardTitle></CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "os", label: "Android Version", placeholder: "Android 12" },
                      { key: "ram", label: "RAM", placeholder: "8 GB" },
                      { key: "storage", label: "Storage", placeholder: "350 MB" },
                      { key: "processor", label: "Processor", placeholder: "Snapdragon / MediaTek" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <Label className="text-white text-sm">{label}</Label>
                        <Input value={(formData.androidRequirements.recommended as any)[key] || ""} onChange={e => setFormData({ ...formData, androidRequirements: { ...formData.androidRequirements, recommended: { ...formData.androidRequirements.recommended, [key]: e.target.value } } })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PIN & RAR Password */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4"><CardTitle className="text-white text-lg">Access Codes</CardTitle></CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm">Shared PIN Code</Label>
                    <div className="flex gap-2">
                      <Input value={formData.sharedPinCode} onChange={e => setFormData({ ...formData, sharedPinCode: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm font-mono" />
                      <Button type="button" onClick={generateNewSharedPin} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-white whitespace-nowrap">New PIN</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white text-sm">RAR Password (Optional)</Label>
                    <Input value={formData.sharedRarPassword || ""} onChange={e => setFormData({ ...formData, sharedRarPassword: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm font-mono" placeholder="Leave empty if no password" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cloud Downloads */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Download Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-4 md:px-6">
                {formData.cloudDownloads.map((cloud, ci) => (
                  <div key={ci} className="border border-[#2d1b54] rounded-xl p-4 space-y-4 bg-[#1a103c]/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        <div>
                          <Label className="text-white text-xs">Cloud Provider</Label>
                          <select value={cloud.cloudName} onChange={e => updateCloudDownload(ci, "cloudName", e.target.value)} className="w-full bg-[#1a103c] border border-[#2d1b54] text-white rounded-lg px-3 py-2 text-sm">
                            <option value="">Select provider</option>
                            {["Google Drive","MediaFire","OneDrive","MEGA","Telegram","Pixeldrain","Buzzheavier","GoFile"].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-white text-xs">Version (Optional)</Label>
                          <Input value={cloud.version || ""} onChange={e => updateCloudDownload(ci, "version", e.target.value || undefined)} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder="e.g. v1.0.5" />
                        </div>
                        <div>
                          <Label className="text-white text-xs">Parts Number</Label>
                          <Input type="number" value={cloud.partsNumber || ""} onChange={e => updateCloudDownload(ci, "partsNumber", e.target.value ? parseInt(e.target.value) : undefined)} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder="e.g. 3" />
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button type="button" onClick={() => duplicateCloudDownload(ci)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-blue-400 h-8 w-8 p-0"><Copy className="h-3 w-3" /></Button>
                        <Button type="button" onClick={() => removeCloudDownload(ci)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    {/* Multi-link mode toggle */}
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`multi-${ci}`} checked={!!multiLinkMode[ci]} onChange={e => handleToggleMultiLink(ci, e.target.checked)} className="w-4 h-4 text-[#9d4edd] bg-[#1a103c] border-[#2d1b54] rounded" />
                      <Label htmlFor={`multi-${ci}`} className="text-gray-400 text-xs cursor-pointer">Paste multiple links at once</Label>
                    </div>

                    {multiLinkMode[ci] ? (
                      <div className="space-y-3">
                        {(multiLinkSections[ci] || []).map((section, si) => (
                          <div key={si} className="border border-[#2d1b54]/50 rounded-lg p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={section.name} onChange={e => { const u = [...(multiLinkSections[ci] || [])]; u[si] = { ...u[si], name: e.target.value }; setMultiLinkSections({ ...multiLinkSections, [ci]: u }) }} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs" placeholder="Part name (optional)" />
                              <Input value={section.size} onChange={e => { const u = [...(multiLinkSections[ci] || [])]; u[si] = { ...u[si], size: e.target.value }; setMultiLinkSections({ ...multiLinkSections, [ci]: u }) }} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs" placeholder="Size (optional)" />
                            </div>
                            <Textarea value={section.text} onChange={e => { const u = [...(multiLinkSections[ci] || [])]; u[si] = { ...u[si], text: e.target.value }; setMultiLinkSections({ ...multiLinkSections, [ci]: u }) }} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs min-h-[80px]" placeholder="Paste one URL per line..." />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => setMultiLinkSections({ ...multiLinkSections, [ci]: [...(multiLinkSections[ci] || []), { name: "", size: "", text: "" }] })} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-white text-xs"><Plus className="h-3 w-3 mr-1" />Add Section</Button>
                          <Button type="button" onClick={() => handleApplyMultipleLinks(ci)} size="sm" className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-xs">Apply Links</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cloud.actualDownloadLinks.map((link, li) => (
                          <div key={li} className="grid grid-cols-[1fr,1fr,auto,auto,auto] gap-2 items-center">
                            <Input value={link.name} onChange={e => updateDownloadLink(ci, li, "name", e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs" placeholder="Part name" />
                            <Input value={link.url} onChange={e => updateDownloadLink(ci, li, "url", e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs" placeholder="https://..." />
                            <Input value={link.size} onChange={e => updateDownloadLink(ci, li, "size", e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-xs w-20" placeholder="Size" />
                            <Button type="button" onClick={() => duplicateDownloadLink(ci, li)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-blue-400 h-8 w-8 p-0"><Copy className="h-3 w-3" /></Button>
                            <Button type="button" onClick={() => removeDownloadLink(ci, li)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-red-400 h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                        <Button type="button" onClick={() => addDownloadLink(ci)} variant="outline" size="sm" className="bg-[#1a103c] border-[#2d1b54] text-white text-xs"><Plus className="h-3 w-3 mr-1" />Add Link</Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button type="button" onClick={addCloudDownload} variant="outline" className="bg-[#1a103c] border-[#2d1b54] text-white w-full"><Plus className="h-4 w-4 mr-2" />Add Cloud Provider</Button>
              </CardContent>
            </Card>

            {/* Release Date */}
            <Card className="bg-[#120b22] border-[#2d1b54]">
              <CardHeader className="pb-4"><CardTitle className="text-white text-lg">Release Date</CardTitle></CardHeader>
              <CardContent className="px-4 md:px-6">
                <Input type="date" value={formData.releaseDate} onChange={e => setFormData({ ...formData, releaseDate: e.target.value })} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="sticky bottom-0 bg-[#090514]/95 backdrop-blur-md border-t border-[#2d1b54] p-4 -mx-4 flex gap-3">
              <Button type="submit" className="flex-1 bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-bold py-3 text-base">
                <Save className="h-5 w-5 mr-2" />
                {editItem ? "Update Game" : "Save Game"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <div className="mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#9d4edd] rounded-full"></span>
              <h3 className="text-white font-bold text-lg">Live Preview</h3>
            </div>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-[#2d1b54] bg-[#120b22] p-4 scrollbar-hide">
              <GameDetails game={previewGameData as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
