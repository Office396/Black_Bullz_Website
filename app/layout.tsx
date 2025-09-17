import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { PageLoader } from "@/components/page-loader"
import "./globals.css"

export const metadata: Metadata = {
  title: "BlackBullz - Download Games & Software",
  description: "Download the latest PC games, Android games, and software for free",
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
        <PageLoader />
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
