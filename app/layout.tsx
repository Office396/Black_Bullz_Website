import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { UserProvider } from "@/lib/user-context"
import { ThemeProvider } from "@/components/theme-provider"
import { PageLoader } from "@/components/page-loader"
import { BFCacheFix } from "@/components/bfcache-fix"
import "./globals.css"

export const metadata: Metadata = {
  title: "BullzGamez - Free PC Games (Pre-Installed & Installable)",
  description: "Download the latest free PC games (Pre-Installed & Installable) for free. No registration required.",
  generator: "BullzGamez",
  icons: {
    icon: "/bull-logo.png",
    apple: "/bull-logo.png",
  },
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({

  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="font-sans" style={{ backgroundColor: "#090514", minHeight: "100vh" }}>
        <UserProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="bullzgamez-theme"
        >
          <BFCacheFix />
          <PageLoader />
          {children}
        </ThemeProvider>
        <Analytics />
        </UserProvider>
      </body>
    </html>
  )
}
