"use client"

import { useEffect, useState } from "react"

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <video autoPlay loop muted className="w-48 h-48 mx-auto mb-4 object-cover">
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/700_F_669683156_9EPE8bLAvgoRhMnBfGOSQF6CGLKhsEEe_ST%20%28online-video-cutter.com%29-9p0CdowwI5OwXM4iOSRhEsn6F3lxo3.mp4" type="video/mp4" />
        </video>
        <div className="text-white text-xl font-bold">BlackBullz</div>
        <div className="text-gray-400 text-sm mt-2">Loading...</div>
      </div>
    </div>
  )
}
