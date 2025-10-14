import { supabase } from '../supabase'
import { getItems } from './items-store'

export interface DownloadPage {
  id: string
  gameId: number
  pinCode: string
  actualDownloadLinks: Array<{ name: string; url: string; size: string }>
  rarPassword?: string
  createdAt: string
  expiresAt: string
  token: string
}

export async function getDownloadPages(): Promise<DownloadPage[]> {
  const now = new Date().toISOString()

  // Clean expired pages and get valid ones
  const { data, error } = await supabase
    .from('download_pages')
    .select('*')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching download pages:', error)
    return []
  }

  // Transform database fields to interface format
  return data.map(page => ({
    id: page.id,
    gameId: page.game_id,
    pinCode: page.pin_code,
    actualDownloadLinks: page.actual_download_links,
    rarPassword: page.rar_password,
    createdAt: page.created_at,
    expiresAt: page.expires_at,
    token: page.token
  }))
}

export async function saveDownloadPage(page: DownloadPage): Promise<void> {
  const { error } = await supabase
    .from('download_pages')
    .insert({
      id: page.id,
      game_id: page.gameId,
      pin_code: page.pinCode,
      actual_download_links: page.actualDownloadLinks,
      rar_password: page.rarPassword,
      created_at: page.createdAt,
      expires_at: page.expiresAt,
      token: page.token
    })

  if (error) {
    console.error('Error saving download page:', error)
    throw error
  }
}

export async function createDownloadPage(gameId: number, cloudIndex?: number): Promise<DownloadPage> {
  // Get game data from items store
  const items = await getItems()
  const gameData = items.find(item => item.id === gameId)

  // Support both old downloadPage structure and new cloudDownloads structure
  let downloadConfig
  let pinCode
  let rarPassword

  if (cloudIndex !== undefined && gameData?.cloudDownloads?.[cloudIndex]) {
    // New structure with shared PIN and RAR password
    downloadConfig = gameData.cloudDownloads[cloudIndex]
    pinCode = gameData.sharedPinCode || '0000'
    rarPassword = gameData.sharedRarPassword
  } else if (gameData?.cloudDownloads?.[0]) {
    // Default to first cloud download if no index specified
    downloadConfig = gameData.cloudDownloads[0]
    pinCode = gameData.sharedPinCode || '0000'
    rarPassword = gameData.sharedRarPassword
  } else {
    throw new Error('Game data or download page configuration not found')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours from now
  const token = Math.random().toString(36).slice(2, 10) + now.getTime().toString(36)
  const id = cloudIndex !== undefined ? `${gameId}_c${cloudIndex}_${token}` : `${gameId}_${token}`

  const downloadPageData: DownloadPage = {
    id,
    gameId,
    pinCode: pinCode,
    actualDownloadLinks: downloadConfig.actualDownloadLinks,
    rarPassword: rarPassword,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    token
  }

  await saveDownloadPage(downloadPageData)

  return downloadPageData
}

export async function getDownloadPage(gameId: number, cloudIndex?: number, token?: string): Promise<DownloadPage | null> {
  if (!token) return null

  const pageIdWithToken = cloudIndex !== undefined ? `${gameId}_c${cloudIndex}_${token}` : `${gameId}_${token}`

  // Try exact ID match first
  let { data, error } = await supabase
    .from('download_pages')
    .select('*')
    .eq('id', pageIdWithToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (data && !error) {
    return {
      id: data.id,
      gameId: data.game_id,
      pinCode: data.pin_code,
      actualDownloadLinks: data.actual_download_links,
      rarPassword: data.rar_password,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      token: data.token
    }
  }

  // Fallback: match by token and gameId
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('download_pages')
    .select('*')
    .eq('token', token)
    .eq('game_id', gameId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (fallbackData && !fallbackError) {
    return {
      id: fallbackData.id,
      gameId: fallbackData.game_id,
      pinCode: fallbackData.pin_code,
      actualDownloadLinks: fallbackData.actual_download_links,
      rarPassword: fallbackData.rar_password,
      createdAt: fallbackData.created_at,
      expiresAt: fallbackData.expires_at,
      token: fallbackData.token
    }
  }

  return null
}

export async function cleanupExpiredPages(): Promise<void> {
  // Supabase handles this automatically through the expires_at filter
  // But we can clean up old records periodically if needed
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { error } = await supabase
    .from('download_pages')
    .delete()
    .lt('expires_at', thirtyDaysAgo.toISOString())

  if (error) {
    console.error('Error cleaning up expired pages:', error)
  }
}