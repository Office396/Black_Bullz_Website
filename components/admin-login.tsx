"use client"

import type React from "react"

import { useState } from "react"
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

  // Default admin credentials (used only if no credentials are stored)
  const defaultCredentials = {
    username: "admin",
    password: "blackbullz2024",
  }

  // Get stored or default credentials
  const getStoredCredentials = () => {
    const storedCredentials = localStorage.getItem("admin_credentials")
    return storedCredentials ? JSON.parse(storedCredentials) : defaultCredentials
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    const adminCredentials = getStoredCredentials()

    if (credentials.username === adminCredentials.username && credentials.password === adminCredentials.password) {
      localStorage.setItem("admin_token", "authenticated")
      onLogin()
    } else {
      setError("Invalid username or password")
    }
  }

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    // Validate current credentials before allowing update
    const currentCredentials = getStoredCredentials()
    
    if (credentials.username === currentCredentials.username && credentials.password === currentCredentials.password) {
      // Store new credentials
      localStorage.setItem("admin_credentials", JSON.stringify({
        username: newCredentials.username,
        password: newCredentials.password
      }))
      
      setSuccessMessage("Credentials updated successfully!")
      setIsUpdateMode(false)
      setCredentials({ username: "", password: "" }) // Clear the form
    } else {
      setError("Please enter your current credentials correctly to update")
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
          
          {!isUpdateMode && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-gray-300 text-sm mb-2">Default Credentials:</p>
              <p className="text-gray-400 text-xs">Username: admin</p>
              <p className="text-gray-400 text-xs">Password: blackbullz2024</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
