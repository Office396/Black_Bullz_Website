"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, Copy, Lock } from "lucide-react"

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

export function AdminDownloadPages() {
  const [downloadPages, setDownloadPages] = useState<DownloadPage[]>([])
  const [adminItems, setAdminItems] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [downloadLinks, setDownloadLinks] = useState([{ name: "", url: "", size: "" }])
  const [rarPassword, setRarPassword] = useState("")

  useEffect(() => {
    // Load existing download pages and admin items
    const pages = JSON.parse(localStorage.getItem("download_pages") || "[]")
    const items = JSON.parse(localStorage.getItem("admin_items") || "[]")
    setDownloadPages(pages)
    setAdminItems(items)
  }, [])

  const generatePinCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const generateDomainUrl = (itemTitle: string) => {
    const slug = itemTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
    const randomId = Math.random().toString(36).substring(2, 8)
    return `https://dl-${slug}-${randomId}.blackbullz.app`
  }

  const addDownloadLink = () => {
    setDownloadLinks([...downloadLinks, { name: "", url: "", size: "" }])
  }

  const removeDownloadLink = (index: number) => {
    setDownloadLinks(downloadLinks.filter((_, i) => i !== index))
  }

  const updateDownloadLink = (index: number, field: string, value: string) => {
    const updated = [...downloadLinks]
    updated[index] = { ...updated[index], [field]: value }
    setDownloadLinks(updated)
  }

  const handleCreateDownloadPage = () => {
    if (!selectedItemId) return

    const selectedItem = adminItems.find((item) => item.id.toString() === selectedItemId)
    if (!selectedItem) return

    const pinCode = generatePinCode()
    const domainUrl = generateDomainUrl(selectedItem.title)

    const newDownloadPage: DownloadPage = {
      id: Date.now().toString(),
      itemId: selectedItemId,
      itemTitle: selectedItem.title,
      pinCode,
      domainUrl,
      downloadLinks: downloadLinks.filter((link) => link.name && link.url),
      rarPassword,
      createdAt: new Date().toISOString(),
    }

    const updatedPages = [...downloadPages, newDownloadPage]
    setDownloadPages(updatedPages)
    localStorage.setItem("download_pages", JSON.stringify(updatedPages))

    // Update the item with download page password
    const updatedItems = adminItems.map((item) =>
      item.id.toString() === selectedItemId ? { ...item, downloadPagePassword: pinCode, rarPassword } : item,
    )
    setAdminItems(updatedItems)
    localStorage.setItem("admin_items", JSON.stringify(updatedItems))

    // Reset form
    setSelectedItemId("")
    setDownloadLinks([{ name: "", url: "", size: "" }])
    setRarPassword("")

    alert(`Download page created!\nPin Code: ${pinCode}\nDomain: ${domainUrl}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const deleteDownloadPage = (pageId: string) => {
    const updatedPages = downloadPages.filter((page) => page.id !== pageId)
    setDownloadPages(updatedPages)
    localStorage.setItem("download_pages", JSON.stringify(updatedPages))
  }

  const availableItems = adminItems.filter((item) => !downloadPages.some((page) => page.itemId === item.id.toString()))

  return (
    <div className="space-y-6">
      {/* Create New Download Page */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Create Download Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Select Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                <SelectValue placeholder="Choose an item" />
              </SelectTrigger>
              <SelectContent className="bg-gray-600 border-gray-500">
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">RAR Password (Optional)</Label>
            <Input
              value={rarPassword}
              onChange={(e) => setRarPassword(e.target.value)}
              className="bg-gray-600 border-gray-500 text-white"
              placeholder="Enter RAR password"
            />
          </div>

          <div>
            <Label className="text-white">Download Links</Label>
            {downloadLinks.map((link, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                <Input
                  placeholder="Link name"
                  value={link.name}
                  onChange={(e) => updateDownloadLink(index, "name", e.target.value)}
                  className="bg-gray-600 border-gray-500 text-white"
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateDownloadLink(index, "url", e.target.value)}
                  className="bg-gray-600 border-gray-500 text-white md:col-span-2"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Size"
                    value={link.size}
                    onChange={(e) => updateDownloadLink(index, "size", e.target.value)}
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                  <Button
                    type="button"
                    onClick={() => removeDownloadLink(index)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-600 border-gray-500 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addDownloadLink}
              variant="outline"
              className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500 mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Download Link
            </Button>
          </div>

          <Button
            onClick={handleCreateDownloadPage}
            disabled={!selectedItemId}
            className="bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Create Download Page
          </Button>
        </CardContent>
      </Card>

      {/* Existing Download Pages */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Existing Download Pages ({downloadPages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {downloadPages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No download pages created yet.</p>
          ) : (
            <div className="space-y-4">
              {downloadPages.map((page) => (
                <div key={page.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{page.itemTitle}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 text-white">
                        <Lock className="h-3 w-3 mr-1" />
                        {page.pinCode}
                      </Badge>
                      <Button
                        onClick={() => deleteDownloadPage(page.id)}
                        variant="outline"
                        size="sm"
                        className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-300">Pin Code:</Label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-600 px-2 py-1 rounded text-white">{page.pinCode}</code>
                        <Button
                          onClick={() => copyToClipboard(page.pinCode)}
                          variant="outline"
                          size="sm"
                          className="bg-gray-600 border-gray-500 text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Domain URL:</Label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-600 px-2 py-1 rounded text-white text-xs truncate max-w-48">
                          {page.domainUrl}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(page.domainUrl)}
                          variant="outline"
                          size="sm"
                          className="bg-gray-600 border-gray-500 text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {page.rarPassword && (
                      <div>
                        <Label className="text-gray-300">RAR Password:</Label>
                        <code className="bg-gray-600 px-2 py-1 rounded text-white">{page.rarPassword}</code>
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-300">Created:</Label>
                      <span className="text-white">{new Date(page.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-gray-300">Download Links ({page.downloadLinks.length}):</Label>
                    <div className="space-y-1 mt-1">
                      {page.downloadLinks.map((link, index) => (
                        <div key={index} className="bg-gray-600 p-2 rounded text-sm">
                          <span className="text-white font-medium">{link.name}</span>
                          <span className="text-gray-300 ml-2">({link.size})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
