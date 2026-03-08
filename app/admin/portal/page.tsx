"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Force dark mode on admin page regardless of user preference
    document.documentElement.classList.add("dark")
    document.documentElement.style.backgroundColor = "#090514"
    document.body.style.backgroundColor = "#090514"
    document.body.style.color = "#ffffff"

    // Check if user is already logged in
    const adminToken = localStorage.getItem("admin_token")
    if (adminToken === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)

    return () => {
      // Restore previous theme when leaving admin page
      document.documentElement.style.backgroundColor = ""
      document.body.style.backgroundColor = ""
      document.body.style.color = ""
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#9d4edd] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
}
