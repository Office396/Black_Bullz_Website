"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, usePathname } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setIsSearchOpen(false)
    }
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/?tab=all", label: "All Games" },
    { href: "/latest", label: "Latest" },
    { href: "/categories", label: "Categories" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0a1628]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-[#0a1628]/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 hover:scale-105 transition-transform duration-200 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-[#00bcd4]/30">
              <img src="/bull-logo.png" alt="BlackBullz Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-white font-bold text-xl">
              <span className="text-[#00bcd4]">Black</span>Bullz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "text-[#00bcd4] bg-[#00bcd4]/10"
                    : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side - Search + Actions */}
          <div className="flex items-center space-x-2">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search games..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 bg-[#1a2a44] border-[#1e3050] text-white placeholder-gray-500 focus:border-[#00bcd4] focus:ring-[#00bcd4]/20 rounded-full pl-4 pr-10 h-9 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-[#00bcd4] transition-colors rounded-full hover:bg-white/5"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:text-[#00bcd4] hover:bg-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#1e3050] animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "text-[#00bcd4] bg-[#00bcd4]/10 font-semibold"
                      : "text-gray-300 hover:text-[#00bcd4] hover:bg-white/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form onSubmit={handleSearch} className="mt-3 px-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a2a44] border-[#1e3050] text-white placeholder-gray-500 focus:border-[#00bcd4] rounded-full pl-4 pr-10 h-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#00bcd4] hover:bg-[#0097a7] rounded-full p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
