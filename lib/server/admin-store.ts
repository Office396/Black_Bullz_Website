import { promises as fs } from 'fs'
import path from 'path'

export interface AdminCredentials {
  username: string
  password: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json')

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: "admin",
  password: "blackbullz2024"
}

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

export async function getAdminCredentials(): Promise<AdminCredentials> {
  return await readJsonFile<AdminCredentials>(ADMIN_FILE, DEFAULT_CREDENTIALS)
}

export async function updateAdminCredentials(credentials: AdminCredentials): Promise<void> {
  await writeJsonFile(ADMIN_FILE, credentials)
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const stored = await getAdminCredentials()
  return username === stored.username && password === stored.password
}