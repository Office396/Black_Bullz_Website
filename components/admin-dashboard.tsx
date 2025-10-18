"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminItemForm } from "@/components/admin-item-form"
import { AdminItemList } from "@/components/admin-item-list"
import { AdminSettings } from "@/components/admin-settings"
import { AdminFeedback } from "@/components/admin-feedback"
import { AdminTrendingManagement } from "@/components/admin-trending-management"
import AdminSystemStatus from "@/components/admin-system-status"
import { LogOut, Plus, List, Settings, Search, MessageSquare, Activity, TrendingUp, Menu } from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white">Admin Portal</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Mobile Tabs - Only 3 main tabs */}
          <div className="md:hidden">
            <TabsList className="bg-gray-800 border-gray-700 grid w-full grid-cols-3">
              <TabsTrigger value="list" className="data-[state=active]:bg-red-600 text-xs">
                <List className="h-4 w-4 mr-1" />
                Items
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-red-600 text-xs">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-red-600 text-xs">
                <MessageSquare className="h-4 w-4 mr-1" />
                Msgs
              </TabsTrigger>
            </TabsList>
            {/* Hamburger Menu for additional tabs */}
            <div className="flex justify-center mt-2">
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                <Menu className="h-4 w-4 mr-1" />
                More
              </Button>
            </div>
            {mobileMenuOpen && (
              <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setActiveTab("trending")
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:bg-gray-700 justify-start"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab("settings")
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:bg-gray-700 justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab("system")
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:bg-gray-700 justify-start"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tabs - All tabs */}
          <TabsList className="bg-gray-800 border-gray-700 hidden md:flex md:w-auto">
            <TabsTrigger value="list" className="data-[state=active]:bg-red-600 text-sm">
              <List className="h-4 w-4 mr-2" />
              Manage Items
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-red-600 text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-red-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-red-600 text-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-red-600 text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-red-600 text-sm">
              <Activity className="h-4 w-4 mr-2" />
              System Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 md:space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg md:text-xl">Manage Items</CardTitle>
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="relative flex-1 max-w-full md:max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-6">
                <AdminItemList searchQuery={searchQuery} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg md:text-xl">Add New Item</CardTitle>
              </CardHeader>
              <CardContent className="px-2 md:px-6">
                <AdminItemForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending">
            <AdminTrendingManagement />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="feedback">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="system">
            <AdminSystemStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
