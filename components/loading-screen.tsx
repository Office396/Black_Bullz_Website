"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function LoadingScreen() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show briefly when route changes
    setIsVisible(true)
    
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-[#9d4edd] z-[99999] animate-pulse" />
  )
}
