"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Key, User } from "lucide-react"

export function AdminSettings() {
  const [credentials, setCredentials] = useState({ username: "", currentPassword: "", newPassword: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pcGames: 0, software: 0 })

  useEffect(() => {
    // Load current username and stats from server
    const fetchData = async () => {
      try {
        // Fetch username
        const adminResponse = await fetch("/api/admin")
        const adminResult = await adminResponse.json()
        if (adminResult.success) {
          setCredentials({ username: adminResult.username, currentPassword: "", newPassword: "" })
        } else {
          setCredentials({ username: "admin", currentPassword: "", newPassword: "" })
        }

        // Fetch items for stats
        const itemsResponse = await fetch("/api/items")
        const itemsResult = await itemsResponse.json()
        if (itemsResult.success) {
          const items = itemsResult.data
          const total = items.length
          const pcGames = items.filter((item: any) => item.category === "PC Games").length
          const software = items.filter((item: any) => item.category === "Software").length
          setStats({ total, pcGames, software })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setCredentials({ username: "admin", currentPassword: "", newPassword: "" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!credentials.username || !credentials.newPassword) {
      setMessage("Please fill in username and new password")
      return
    }

    if (!credentials.currentPassword) {
      setMessage("Please enter your current password for verification")
      return
    }

    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUsername: credentials.username,
          currentPassword: credentials.currentPassword,
          newUsername: credentials.username,
          newPassword: credentials.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage("Credentials updated successfully!")
        setCredentials({ ...credentials, currentPassword: "", newPassword: "" })
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(result.error || "Failed to update credentials")
      }
    } catch (error) {
      console.error("Error updating credentials:", error)
      setMessage("Failed to update credentials. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Admin Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="currentPassword" className="text-white">
                Current Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={credentials.currentPassword}
                  onChange={(e) => setCredentials({ ...credentials, currentPassword: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-white">
                New Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  value={credentials.newPassword}
                  onChange={(e) => setCredentials({ ...credentials, newPassword: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>
            {message && (
              <Alert
                className={
                  message.includes("successfully") ? "bg-green-900 border-green-700" : "bg-red-900 border-red-700"
                }
              >
                <AlertDescription className={message.includes("successfully") ? "text-green-200" : "text-red-200"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Website Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="text-center">
               <div className="text-2xl font-bold text-red-400">
                 {stats.total}
               </div>
               <div className="text-gray-400 text-sm">Total Items</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-blue-400">
                 {stats.pcGames}
               </div>
               <div className="text-gray-400 text-sm">PC Games</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-green-400">
                 {stats.software}
               </div>
               <div className="text-gray-400 text-sm">Software</div>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
