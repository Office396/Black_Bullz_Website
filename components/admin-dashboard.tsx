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
import { AdminPageModifier } from "@/components/admin-page-modifier"
import AdminSystemStatus from "@/components/admin-system-status"
import AdminDetailsAutomation from "@/components/admin-details-automation"
import { LogOut, Plus, List, Settings, Search, MessageSquare, Activity, Edit3, Workflow } from "lucide-react"

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
    <div className="min-h-screen bg-[#090514] text-white">
      {/* Header */}
      <header className="bg-[#090514]/90 backdrop-blur-md border-b border-[#2d1b54] sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-[#9d4edd]/50 shadow-[0_0_15px_rgba(157,78,221,0.5)]">
                <img src="/bull-logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] via-[#c77dff] to-[#00bcd4]">
                  BULLZGAMEZ
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold -mt-1">ADMIN PORTAL</span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-[#120b22] border border-[#2d1b54] p-1 h-auto flex-wrap md:flex-nowrap">
              <TabsTrigger value="list" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <List className="h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Plus className="h-4 w-4" />
                Add New
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Workflow className="h-4 w-4" />
                Auto Scraper
              </TabsTrigger>
              <TabsTrigger value="modifier" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Edit3 className="h-4 w-4" />
                Modifier
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all relative cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                Msgs
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-[#9d4edd] data-[state=active]:text-white text-gray-400 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer">
                <Activity className="h-4 w-4" />
                System Status
              </TabsTrigger>
            </TabsList>

            {activeTab === "list" && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search store inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#120b22] border-[#2d1b54] text-white placeholder-gray-600 focus:border-[#9d4edd] focus:ring-[#9d4edd]/20 rounded-xl"
                />
              </div>
            )}
          </div>

          <TabsContent value="list" className="mt-0 outline-none">
            <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#2d1b54] bg-gradient-to-r from-[#1a103c] to-[#120b22]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <List className="h-5 w-5 text-[#9d4edd]" />
                  Inventory Management
                </h3>
              </div>
              <div className="p-0 md:p-6">
                <AdminItemList searchQuery={searchQuery} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-0 outline-none">
            <AdminItemForm />
          </TabsContent>

          <TabsContent value="automation" className="mt-0 outline-none">
            <AdminDetailsAutomation />
          </TabsContent>

          <TabsContent value="modifier" className="mt-0 outline-none">
            <AdminPageModifier />
          </TabsContent>

          <TabsContent value="feedback" className="mt-0 outline-none">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="system" className="mt-0 outline-none">
            <AdminSystemStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
