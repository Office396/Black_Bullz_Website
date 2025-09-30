import { promises as fs } from 'fs'
import path from 'path'

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

const DATA_DIR = path.join(process.cwd(), 'data')
const DOWNLOAD_PAGES_FILE = path.join(DATA_DIR, 'download-pages.json')

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as T
  } catch (e: any) {
    if (e?.code === 'ENOENT') return fallback
    throw e
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getDownloadPages(): Promise<DownloadPage[]> {
  const pages = await readJsonFile<DownloadPage[]>(DOWNLOAD_PAGES_FILE, [])
  // Clean expired pages
  const now = new Date()
  const validPages = pages.filter(page => new Date(page.expiresAt) > now)
  if (validPages.length !== pages.length) {
    await writeJsonFile(DOWNLOAD_PAGES_FILE, validPages)
  }
  return validPages
}

export async function saveDownloadPage(page: DownloadPage): Promise<void> {
  const pages = await getDownloadPages()
  pages.push(page)
  await writeJsonFile(DOWNLOAD_PAGES_FILE, pages)
}

export async function createDownloadPage(gameId: number, cloudIndex?: number): Promise<DownloadPage> {
  // Get game data from server API
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/items`)
  const result = await response.json()
  if (!result.success) {
    throw new Error('Failed to fetch items from server')
  }
  const adminItems = result.data
  const gameData = adminItems.find((item: any) => item.id === gameId)

  // Support both old downloadPage structure and new cloudDownloads structure
  let downloadConfig
  let pinCode
  let rarPassword

  if (cloudIndex !== undefined && gameData?.cloudDownloads?.[cloudIndex]) {
    // New structure with shared PIN and RAR password
    downloadConfig = gameData.cloudDownloads[cloudIndex]
    pinCode = gameData.sharedPinCode || '0000'
    rarPassword = gameData.sharedRarPassword
  } else if (gameData?.downloadPage) {
    // Old structure for backward compatibility
    downloadConfig = gameData.downloadPage
    pinCode = downloadConfig.pinCode
    rarPassword = downloadConfig.rarPassword
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
  const pages = await getDownloadPages()

  if (token) {
    const pageIdWithToken = cloudIndex !== undefined ? `${gameId}_c${cloudIndex}_${token}` : `${gameId}_${token}`
    const pageById = pages.find(page => page.id === pageIdWithToken)
    if (pageById) return pageById
    // Fallback: match by token and gameId
    const pageByToken = pages.find(page => page.token === token && page.gameId === gameId)
    if (pageByToken) return pageByToken
  }

  return null
}

export async function cleanupExpiredPages(): Promise<void> {
  // Already cleaned in getDownloadPages
  await getDownloadPages()
}