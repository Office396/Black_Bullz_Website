"use client"

import NextTopLoader from "nextjs-toploader"

export function PageLoader() {
  return (
    <NextTopLoader
      color="#9d4edd"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #9d4edd,0 0 5px #c77dff"
    />
  )
}
