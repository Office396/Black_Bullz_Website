import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { PageLoader } from "@/components/page-loader"
import "./globals.css"

export const metadata: Metadata = {
  title: "BlackBullz - Free PC Games, Android Apps & Software",
  description: "Download the latest free PC games, Android apps, and software for free. No registration required.",
  generator: "BlackBullz",
}

export default function RootLayout({
  
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-gray-900`}>
        {/* PageLoader handles client-side route changes with a controlled delay */}
        <PageLoader />
        {/* Suspense ensures client components that suspend show a fallback immediately */}
        <Suspense fallback={
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <video autoPlay loop muted className="w-full h-full object-contain">
                  <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/700_F_669683156_9EPE8bLAvgoRhMnBfGOSQF6CGLKhsEEe_ST%20%28online-video-cutter.com%29-9p0CdowwI5OwXM4iOSRhEsn6F3lxo3.mp4" type="video/mp4" />
                </video>
              </div>
              <p className="text-white text-lg font-semibold">Loading...</p>
            </div>
          </div>
        }>
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
