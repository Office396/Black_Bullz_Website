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
import AdminSystemStatus from "@/components/admin-system-status"
import { LogOut, Plus, List, Settings, Search, MessageSquare, Activity } from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [searchQuery, setSearchQuery] = useState("")

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
          <TabsList className="bg-gray-800 border-gray-700 grid w-full grid-cols-3 md:flex md:w-auto">
            <TabsTrigger value="list" className="data-[state=active]:bg-red-600 text-xs md:text-sm">
              <List className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Manage Items</span>
              <span className="md:hidden">Items</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-red-600 text-xs md:text-sm">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add New Item</span>
              <span className="md:hidden">Add</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-red-600 text-xs md:text-sm">
              <MessageSquare className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Feedback</span>
              <span className="md:hidden">Msgs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-red-600 text-xs md:text-sm hidden md:flex">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-red-600 text-xs md:text-sm hidden md:flex">
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

          <TabsContent value="settings" className="hidden md:block">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="feedback">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="system" className="hidden md:block">
            <AdminSystemStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
