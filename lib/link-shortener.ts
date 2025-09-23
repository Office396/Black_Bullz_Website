// GP Links and V2Links API Integration

const GP_LINKS_API_TOKEN = 'b6bc57fccf0a18409483ce920d4a611acbb23de1'
const V2_LINKS_API_TOKEN = 'dda37e26b732c2c143a0f4e3de09bb4edfb8ee26'

interface ShortenResponse {
  success: boolean
  shortenedUrl?: string
  error?: string
  provider?: 'gplinks' | 'v2links'
}

// Generate unique alias for each download
function generateAlias(gameId: number): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `game${gameId}_${timestamp}_${random}`
}

// Shorten URL using GP Links API with both JSON and TEXT methods
async function shortenWithGPLinks(originalUrl: string, gameId: number): Promise<ShortenResponse> {
  const alias = generateAlias(gameId)
  
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
async function shortenWithV2Links(originalUrl: string, gameId: number): Promise<ShortenResponse> {
  const alias = generateAlias(gameId)
  
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
export async function createSurveyLink(gameId: number): Promise<ShortenResponse> {
  // Create the download page URL that users will access after survey
  // For localhost testing, use ngrok URL or replace with your public domain
  let baseUrl = window.location.origin
  
  // If localhost, try to use ngrok URL (you need to set this manually)
  if (baseUrl.includes('localhost')) {
    // Replace this with your actual ngrok URL when testing
    // Example: baseUrl = 'https://abc123.ngrok.io'
    console.warn('⚠️ Using localhost URL - APIs may reject this. Use ngrok for testing.')
  }
  
  const downloadPageUrl = `${baseUrl}/download/${gameId}`
  
  // Randomly choose which service to try first
  const useGPLinksFirst = Math.random() < 0.5
  
  if (useGPLinksFirst) {
    // Try GP Links first, fallback to V2Links
    const gpResult = await shortenWithGPLinks(downloadPageUrl, gameId)
    if (gpResult.success) {
      return gpResult
    }
    
    // GP Links failed, try V2Links
    const v2Result = await shortenWithV2Links(downloadPageUrl, gameId)
    if (v2Result.success) {
      return v2Result
    }
    
    // Both failed
    return {
      success: false,
      error: `Both services failed. GP Links: ${gpResult.error}, V2Links: ${v2Result.error}`
    }
  } else {
    // Try V2Links first, fallback to GP Links
    const v2Result = await shortenWithV2Links(downloadPageUrl, gameId)
    if (v2Result.success) {
      return v2Result
    }
    
    // V2Links failed, try GP Links
    const gpResult = await shortenWithGPLinks(downloadPageUrl, gameId)
    if (gpResult.success) {
      return gpResult
    }
    
    // Both failed
    return {
      success: false,
      error: `Both services failed. V2Links: ${v2Result.error}, GP Links: ${gpResult.error}`
    }
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
}

export function createDownloadPage(gameId: number): DownloadPageData {
  // Get game data from localStorage
  const adminItems = JSON.parse(localStorage.getItem('admin_items') || '[]')
  const gameData = adminItems.find((item: any) => item.id === gameId)
  
  if (!gameData || !gameData.downloadPage) {
    throw new Error('Game data or download page configuration not found')
  }
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours from now
  
  const downloadPageData: DownloadPageData = {
    id: gameId.toString(),
    gameId,
    pinCode: gameData.downloadPage.pinCode,
    actualDownloadLinks: gameData.downloadPage.actualDownloadLinks,
    rarPassword: gameData.downloadPage.rarPassword,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  }
  
  // Store in localStorage with expiration
  const existingPages = JSON.parse(localStorage.getItem('active_download_pages') || '[]')
  const updatedPages = existingPages.filter((page: DownloadPageData) => 
    new Date(page.expiresAt) > now // Remove expired pages
  )
  
  // Add or update current page
  const pageIndex = updatedPages.findIndex((page: DownloadPageData) => page.gameId === gameId)
  if (pageIndex >= 0) {
    updatedPages[pageIndex] = downloadPageData
  } else {
    updatedPages.push(downloadPageData)
  }
  
  localStorage.setItem('active_download_pages', JSON.stringify(updatedPages))
  
  return downloadPageData
}

// Get active download page data
export function getDownloadPage(gameId: number): DownloadPageData | null {
  const activePages = JSON.parse(localStorage.getItem('active_download_pages') || '[]')
  const now = new Date()
  
  // Clean expired pages
  const validPages = activePages.filter((page: DownloadPageData) => 
    new Date(page.expiresAt) > now
  )
  localStorage.setItem('active_download_pages', JSON.stringify(validPages))
  
  // Find the requested page
  const page = validPages.find((page: DownloadPageData) => page.gameId === gameId)
  return page || null
}

// Clean up expired download pages
export function cleanupExpiredPages(): void {
  const activePages = JSON.parse(localStorage.getItem('active_download_pages') || '[]')
  const now = new Date()
  
  const validPages = activePages.filter((page: DownloadPageData) => 
    new Date(page.expiresAt) > now
  )
  
  localStorage.setItem('active_download_pages', JSON.stringify(validPages))
}