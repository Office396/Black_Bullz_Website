import { promises as fs } from 'fs'
import path from 'path'

export interface Item {
  id: number
  title: string
  category: string
  description: string
  longDescription: string
  developer: string
  size: string
  releaseDate: string
  image: string
  rating: string
  trending: boolean
  latest: boolean
  keyFeatures: string[]
  screenshots: string[]
  systemRequirements: {
    recommended: {
      os: string
      processor: string
      memory: string
      graphics: string
      storage: string
    }
  }
  androidRequirements: {
    recommended: {
      os: string
      ram: string
      storage: string
      processor: string
    }
  }
  sharedPinCode: string
  sharedRarPassword?: string
  cloudDownloads: Array<{
    cloudName: string
    actualDownloadLinks: Array<{ name: string; url: string; size: string }>
  }>
  uploadDate: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const ITEMS_FILE = path.join(DATA_DIR, 'items.json')

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

export async function getItems(): Promise<Item[]> {
  return await readJsonFile<Item[]>(ITEMS_FILE, [])
}

export async function saveItems(items: Item[]): Promise<void> {
  await writeJsonFile(ITEMS_FILE, items)
}

export async function addItem(itemData: Omit<Item, 'id' | 'uploadDate'>): Promise<Item> {
  const items = await getItems()
  const now = new Date()
  const newItem: Item = {
    ...itemData,
    id: Date.now(),
    uploadDate: now.toISOString().split('T')[0], // YYYY-MM-DD
  }
  items.unshift(newItem) // Add to beginning
  await saveItems(items)
  return newItem
}

export async function updateItem(id: number, itemData: Partial<Item>): Promise<Item | null> {
  const items = await getItems()
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return null
  items[index] = { ...items[index], ...itemData }
  await saveItems(items)
  return items[index]
}

export async function deleteItem(id: number): Promise<boolean> {
  const items = await getItems()
  const filtered = items.filter(item => item.id !== id)
  if (filtered.length === items.length) return false
  await saveItems(filtered)
  return true
}