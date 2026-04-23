import { NextRequest, NextResponse } from 'next/server'

/**
 * Image proxy route that fetches external images with browser-like headers
 * to bypass strict hotlink protection (e.g. ankergames.net returns 403).
 * 
 * Usage: /api/image-proxy?url=<encoded-image-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    const parsedUrl = new URL(url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
        'Origin': `${parsedUrl.protocol}//${parsedUrl.hostname}`,
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin',
        'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    })

    if (!response.ok) {
      // If the primary fetch fails, try a simpler approach
      const fallbackResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'image/*,*/*',
        },
      })

      if (!fallbackResponse.ok) {
        return new NextResponse('Image not found', { status: 404 })
      }

      const fallbackBuffer = await fallbackResponse.arrayBuffer()
      const fallbackContentType = fallbackResponse.headers.get('content-type') || 'image/jpeg'

      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': fallbackContentType,
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
