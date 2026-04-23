"use client"

import Image, { ImageProps } from "next/image"
import { needsDirectLoad } from "@/lib/image-utils"

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string
}

/**
 * A wrapper around Next.js <Image> that automatically falls back to a native
 * <img> tag for Cloudflare-protected domains that block server-side optimization.
 * 
 * For all other domains, it uses the optimized Next.js <Image> component.
 */
export function SafeImage({ src, alt, fill, sizes, width, height, className, priority, ...rest }: SafeImageProps) {
  if (needsDirectLoad(src)) {
    // Use native img for Cloudflare-protected domains
    // The browser can pass Cloudflare challenges, but Next.js server cannot
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt as string || ''}
        className={`${fill ? 'absolute inset-0 w-full h-full' : ''} ${className || ''}`}
        style={fill ? { objectFit: 'cover' } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        width={!fill ? (width as number) : undefined}
        height={!fill ? (height as number) : undefined}
      />
    )
  }

  // Use optimized Next.js Image for everything else
  return (
    <Image
      src={src}
      alt={alt as string || ''}
      fill={fill}
      sizes={sizes}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      priority={priority}
      {...rest}
    />
  )
}
