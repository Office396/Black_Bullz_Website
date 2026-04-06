"use client"

import NextTopLoader from "nextjs-toploader"

export function PageLoader() {
  return (
    <NextTopLoader
      color="#9d4edd"
      height={3}
      speed={300}
      showSpinner={false}
      shadow="0 0 10px #9d4edd"
    />
  )
}
