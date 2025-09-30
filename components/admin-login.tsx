"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, User, Eye, EyeOff, Save } from "lucide-react"

interface AdminLoginProps {
  onLogin: () => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const [newCredentials, setNewCredentials] = useState({ username: "", password: "" })
  const [successMessage, setSuccessMessage] = useState("")
  const [currentUsername, setCurrentUsername] = useState("admin")

  useEffect(() => {
    // Fetch current username from server
    const fetchUsername = async () => {
      try {
        const response = await fetch("/api/admin")
        const result = await response.json()
        if (result.success) {
          setCurrentUsername(result.username)
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }
    }
    fetchUsername()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        localStorage.setItem("admin_token", "authenticated")
        onLogin()
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
    }
  }

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUsername: credentials.username,
          currentPassword: credentials.password,
          newUsername: newCredentials.username,
          newPassword: newCredentials.password,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessMessage("Credentials updated successfully!")
        setCurrentUsername(newCredentials.username)
        setIsUpdateMode(false)
        setCredentials({ username: "", password: "" })
        setNewCredentials({ username: "", password: "" })
      } else {
        setError(result.error || "Failed to update credentials")
      }
    } catch (err) {
      console.error("Update credentials error:", err)
      setError("Failed to update credentials. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Admin Portal</CardTitle>
          <p className="text-gray-400">
            {isUpdateMode ? "Update Admin Credentials" : "Sign in to manage BlackBullz content"}
          </p>
        </CardHeader>
        <CardContent>
          {!isUpdateMode ? (
            // Login Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <Alert className="bg-red-900 border-red-700">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="bg-green-900 border-green-700">
                  <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Sign In
              </Button>
              <Button 
                type="button" 
                onClick={() => setIsUpdateMode(true)}
                className="w-full bg-gray-700 hover:bg-gray-600 mt-2"
              >
                Update Credentials
              </Button>
            </form>
          ) : (
            // Update Credentials Form
            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="space-y-4 mb-6">
                <p className="text-white text-sm">Current Credentials</p>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Current username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-white text-sm">New Credentials</p>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="New username"
                    value={newCredentials.username}
                    onChange={(e) => setNewCredentials({ ...newCredentials, username: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newCredentials.password}
                    onChange={(e) => setNewCredentials({ ...newCredentials, password: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900 border-red-700">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="bg-green-900 border-green-700">
                  <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsUpdateMode(false)
                    setCredentials({ username: "", password: "" })
                    setNewCredentials({ username: "", password: "" })
                    setError("")
                    setSuccessMessage("")
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
