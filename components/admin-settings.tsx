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
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Load current credentials
    const stored = localStorage.getItem("admin_credentials")
    if (stored) {
      const parsed = JSON.parse(stored)
      setCredentials({ username: parsed.username, password: "" })
    } else {
      setCredentials({ username: "admin", password: "" })
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (!credentials.username || !credentials.password) {
      setMessage("Please fill in both username and password")
      return
    }

    localStorage.setItem("admin_credentials", JSON.stringify(credentials))
    setMessage("Credentials updated successfully!")

    setTimeout(() => setMessage(""), 3000)
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
              <Label htmlFor="password" className="text-white">
                New Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
                {JSON.parse(localStorage.getItem("admin_items") || "[]").length}
              </div>
              <div className="text-gray-400 text-sm">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {
                  JSON.parse(localStorage.getItem("admin_items") || "[]").filter(
                    (item: any) => item.category === "PC Games",
                  ).length
                }
              </div>
              <div className="text-gray-400 text-sm">PC Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {
                  JSON.parse(localStorage.getItem("admin_items") || "[]").filter(
                    (item: any) => item.category === "Software",
                  ).length
                }
              </div>
              <div className="text-gray-400 text-sm">Software</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
