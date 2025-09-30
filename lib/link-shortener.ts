// GP Links and V2Links API Integration

// Download pages functions moved to API to avoid client-side fs import

const GP_LINKS_API_TOKEN = 'b6bc57fccf0a18409483ce920d4a611acbb23de1'
const V2_LINKS_API_TOKEN = 'dda37e26b732c2c143a0f4e3de09bb4edfb8ee26'

interface ShortenResponse {
  success: boolean
  shortenedUrl?: string
  error?: string
  provider?: 'gplinks' | 'v2links'
}

// Generate unique alias for each download
function generateAlias(gameId: number, cloudIndex?: number): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const cloudSuffix = cloudIndex !== undefined ? `_c${cloudIndex}` : ''
  return `game${gameId}${cloudSuffix}_${timestamp}_${random}`
}

// Shorten URL using GP Links API with both JSON and TEXT methods
async function shortenWithGPLinks(originalUrl: string, gameId: number, cloudIndex?: number): Promise<ShortenResponse> {
  const alias = generateAlias(gameId, cloudIndex)
  
  // Try TEXT format first
  try {
    console.log('Trying GP Links TEXT API...')
    const textApiUrl = `https://api.gplinks.com/api?api=${GP_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}&format=text`
    console.log('GP Links TEXT URL:', textApiUrl)
    
    const textResponse = await fetch(textApiUrl, {
      method: 'GET'
    })
    
    if (textResponse.ok) {
      const shortenedUrl = await textResponse.text()
      console.log('GP Links TEXT Response:', shortenedUrl)
      console.log('GP Links TEXT Response Length:', shortenedUrl.length)
      console.log('GP Links TEXT Response Trimmed:', shortenedUrl.trim())
      
      if (shortenedUrl && shortenedUrl.trim().startsWith('http')) {
        return {
          success: true,
          shortenedUrl: shortenedUrl.trim(),
          provider: 'gplinks'
        }
      } else {
        console.log('GP Links TEXT: Invalid response format')
      }
    } else {
      console.log('GP Links TEXT: HTTP Error:', textResponse.status, textResponse.statusText)
    }
  } catch (textError) {
    console.error('GP Links TEXT API failed:', textError)
  }
  
  // Try JSON format as fallback
  try {
    console.log('Trying GP Links JSON API...')
    const jsonApiUrl = `https://api.gplinks.com/api?api=${GP_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}`
    console.log('GP Links JSON URL:', jsonApiUrl)
    
    const jsonResponse = await fetch(jsonApiUrl, {
      method: 'GET'
    })
    
    if (jsonResponse.ok) {
      const jsonData = await jsonResponse.json()
      console.log('GP Links JSON Response:', jsonData)
      console.log('GP Links JSON Keys:', Object.keys(jsonData))
      
      // Check for error status and log the message
      if (jsonData.status === 'error') {
        console.log('GP Links JSON Error:', jsonData.message)
        console.log('GP Links JSON Error Details:', jsonData)
      }
      
      // Try different possible response formats
      if (jsonData.status === 'success' && jsonData.shortenedUrl) {
        return {
          success: true,
          shortenedUrl: jsonData.shortenedUrl,
          provider: 'gplinks'
        }
      } else if (jsonData.shortenedUrl) {
        return {
          success: true,
          shortenedUrl: jsonData.shortenedUrl,
          provider: 'gplinks'
        }
      } else if (jsonData.shorturl) {
        return {
          success: true,
          shortenedUrl: jsonData.shorturl,
          provider: 'gplinks'
        }
      } else if (jsonData.url) {
        return {
          success: true,
          shortenedUrl: jsonData.url,
          provider: 'gplinks'
        }
      } else {
        console.log('GP Links JSON: No valid URL found in response')
      }
    } else {
      console.log('GP Links JSON: HTTP Error:', jsonResponse.status, jsonResponse.statusText)
    }
  } catch (jsonError) {
    console.error('GP Links JSON API failed:', jsonError)
  }
  
  return {
    success: false,
    error: 'Both GP Links TEXT and JSON methods failed',
    provider: 'gplinks'
  }
}

// Shorten URL using V2Links API with both JSON and TEXT methods
async function shortenWithV2Links(originalUrl: string, gameId: number, cloudIndex?: number): Promise<ShortenResponse> {
  const alias = generateAlias(gameId, cloudIndex)
  
  // Try TEXT format first
  try {
    console.log('Trying V2Links TEXT API...')
    const textApiUrl = `https://v2links.com/api?api=${V2_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}&format=text`
    console.log('V2Links TEXT URL:', textApiUrl)
    
    const textResponse = await fetch(textApiUrl, {
      method: 'GET'
    })
    
    if (textResponse.ok) {
      const shortenedUrl = await textResponse.text()
      console.log('V2Links TEXT Response:', shortenedUrl)
      console.log('V2Links TEXT Response Length:', shortenedUrl.length)
      console.log('V2Links TEXT Response Trimmed:', shortenedUrl.trim())
      
      if (shortenedUrl && shortenedUrl.trim().startsWith('http')) {
        return {
          success: true,
          shortenedUrl: shortenedUrl.trim(),
          provider: 'v2links'
        }
      } else {
        console.log('V2Links TEXT: Invalid response format')
      }
    } else {
      console.log('V2Links TEXT: HTTP Error:', textResponse.status, textResponse.statusText)
    }
  } catch (textError) {
    console.error('V2Links TEXT API failed:', textError)
  }
  
  // Try JSON format as fallback
  try {
    console.log('Trying V2Links JSON API...')
    const jsonApiUrl = `https://v2links.com/api?api=${V2_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}`
    console.log('V2Links JSON URL:', jsonApiUrl)
    
    const jsonResponse = await fetch(jsonApiUrl, {
      method: 'GET'
    })
    
    if (jsonResponse.ok) {
      const jsonData = await jsonResponse.json()
      console.log('V2Links JSON Response:', jsonData)
      console.log('V2Links JSON Keys:', Object.keys(jsonData))
      
      // Check for error status and log the message
      if (jsonData.status === 'error') {
        console.log('V2Links JSON Error:', jsonData.message)
        console.log('V2Links JSON Error Details:', jsonData)
      }
      
      // Try different possible response formats
      if (jsonData.status === 'success' && jsonData.shortenedUrl) {
        return {
          success: true,
          shortenedUrl: jsonData.shortenedUrl,
          provider: 'v2links'
        }
      } else if (jsonData.shortenedUrl) {
        return {
          success: true,
          shortenedUrl: jsonData.shortenedUrl,
          provider: 'v2links'
        }
      } else if (jsonData.shorturl) {
        return {
          success: true,
          shortenedUrl: jsonData.shorturl,
          provider: 'v2links'
        }
      } else if (jsonData.url) {
        return {
          success: true,
          shortenedUrl: jsonData.url,
          provider: 'v2links'
        }
      } else {
        console.log('V2Links JSON: No valid URL found in response')
      }
    } else {
      console.log('V2Links JSON: HTTP Error:', jsonResponse.status, jsonResponse.statusText)
    }
  } catch (jsonError) {
    console.error('V2Links JSON API failed:', jsonError)
  }
  
  return {
    success: false,
    error: 'Both V2Links TEXT and JSON methods failed',
    provider: 'v2links'
  }
}

// Main function to shorten URL with fallback
export async function createSurveyLink(gameId: number, cloudIndex?: number, token?: string): Promise<ShortenResponse> {
  // Build the return URL (ngrok or production origin)
  const baseUrl = window.location.origin
  const downloadPageUrl = cloudIndex !== undefined
    ? `${baseUrl}/download/${gameId}?cloud=${cloudIndex}${token ? `&token=${token}` : ''}`
    : `${baseUrl}/download/${gameId}${token ? `?token=${token}` : ''}`

  // Call server-side endpoint to avoid CORS and provider restrictions
  try {
    const resp = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: downloadPageUrl, gameId, cloudIndex })
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      return { success: false, error: err?.error || `Shorten API error ${resp.status}` }
    }

    const data = await resp.json()
    if (data?.success && data?.shortenedUrl) {
      return { success: true, shortenedUrl: data.shortenedUrl, provider: data.provider }
    }

    return { success: false, error: data?.error || 'Shorten API returned no URL' }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to reach shorten API' }
  }
}

// Generate temporary download page data
export interface DownloadPageData {
  id: string
  gameId: number
  pinCode: string
  actualDownloadLinks: Array<{ name: string; url: string; size: string }>
  rarPassword?: string
  createdAt: string
  expiresAt: string
  token: string
}

export async function createDownloadPage(gameId: number, cloudIndex?: number): Promise<DownloadPageData> {
  const response = await fetch('/api/download-pages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameId, cloudIndex }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to create download page')
  }

  return await response.json()
}

// Get active download page data
export async function getDownloadPage(gameId: number, cloudIndex?: number, token?: string): Promise<DownloadPageData | null> {
  const params = new URLSearchParams({
    gameId: gameId.toString(),
    ...(cloudIndex !== undefined && { cloudIndex: cloudIndex.toString() }),
    ...(token && { token }),
  })

  const response = await fetch(`/api/download-pages?${params}`)
  if (response.ok) {
    return await response.json()
  } else if (response.status === 404) {
    return null
  } else {
    throw new Error('Failed to get download page')
  }
}

// Clean up expired download pages
export async function cleanupExpiredPages(): Promise<void> {
  await fetch('/api/download-pages', { method: 'DELETE' })
}