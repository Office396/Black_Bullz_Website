// ============================================================
// Upload Workers - File hosting integrations
// Supports: 1fichier, GoFile, Pixeldrain, MediaFire
// ============================================================

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

// ============================================================
// TYPES
// ============================================================

interface UploadResult {
  success: boolean
  url: string
  fileName: string
  fileSize: string
  host: string
  error?: string
}

interface FileHostConfig {
  apiKey?: string
  apiToken?: string
  folderId?: string
  channelId?: string
}

// ============================================================
// 1FICHIER API
// ============================================================

export class UnfilichierUploader {
  private apiToken: string
  private baseUrl = 'https://api.1fichier.com/v1'

  constructor(config: FileHostConfig) {
    this.apiToken = config.apiToken || process.env.ONEFICHIER_API_TOKEN || ''
  }

  async uploadFile(filePath: string, onProgress?: (pct: number) => void): Promise<UploadResult> {
    if (!this.apiToken) {
      return { success: false, url: '', fileName: '', fileSize: '', host: '1fichier', error: 'API token not configured' }
    }

    try {
      // Step 1: Get upload server
      const serverResponse = await axios.get(`${this.baseUrl}/upload/server.json`, {
        headers: { 'Authorization': `Bearer ${this.apiToken}` },
      })

      const uploadUrl = serverResponse.data?.url
      if (!uploadUrl) throw new Error('Failed to get upload server')

      // Step 2: Upload file
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('pass', '')
      formData.append('ssl', '1')

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiToken}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
          }
        },
      })

      const url = uploadResponse.data?.url
      const fileName = path.basename(filePath)
      const fileSize = formatFileSize(fs.statSync(filePath).size)

      return {
        success: true,
        url,
        fileName,
        fileSize,
        host: '1fichier',
      }
    } catch (error: any) {
      console.error('[1fichier] Upload error:', error.message)
      return { success: false, url: '', fileName: path.basename(filePath), fileSize: '', host: '1fichier', error: error.message }
    }
  }

  async checkLinkStatus(url: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/url/infos.json`, { urls: [url] }, {
        headers: { 'Authorization': `Bearer ${this.apiToken}` },
      })
      return response.data?.[0]?.status === 'ok'
    } catch {
      return false
    }
  }
}

// ============================================================
// GOFILE API
// ============================================================

export class GoFileUploader {
  private apiToken: string
  private server: string = 'store1'

  constructor(config: FileHostConfig) {
    this.apiToken = config.apiToken || process.env.GOFOLDER_API_TOKEN || ''
  }

  private async getBestServer(): Promise<string> {
    try {
      const response = await axios.get('https://api.gofile.io/servers')
      if (response.data?.status === 'ok') {
        const servers = response.data.data?.servers
        if (servers?.length > 0) {
          return servers[0].name
        }
      }
    } catch {}
    return 'store1'
  }

  async uploadFile(filePath: string, onProgress?: (pct: number) => void): Promise<UploadResult> {
    try {
      this.server = await this.getBestServer()

      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))

      const headers: any = {
        ...formData.getHeaders(),
      }
      if (this.apiToken) {
        headers['Authorization'] = `Bearer ${this.apiToken}`
      }

      const uploadResponse = await axios.post(
        `https://${this.server}.gofile.io/contents/uploadfile`,
        formData,
        {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
            }
          },
        }
      )

      if (uploadResponse.data?.status === 'ok') {
        const data = uploadResponse.data.data
        const fileName = path.basename(filePath)
        const fileSize = formatFileSize(fs.statSync(filePath).size)

        return {
          success: true,
          url: data?.downloadPage || `https://gofile.io/d/${data?.code}`,
          fileName,
          fileSize,
          host: 'GoFile',
        }
      }

      throw new Error('Upload failed')
    } catch (error: any) {
      console.error('[GoFile] Upload error:', error.message)
      return { success: false, url: '', fileName: path.basename(filePath), fileSize: '', host: 'GoFile', error: error.message }
    }
  }
}

// ============================================================
// PIXELDRAIN API
// ============================================================

export class PixeldrainUploader {
  private apiKey: string

  constructor(config: FileHostConfig) {
    this.apiKey = config.apiKey || process.env.PIXELDRAIN_API_KEY || ''
  }

  async uploadFile(filePath: string, onProgress?: (pct: number) => void): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))

      const headers: any = {
        ...formData.getHeaders(),
      }
      if (this.apiKey) {
        headers['Authorization'] = `Basic ${Buffer.from(`:${this.apiKey}`).toString('base64')}`
      }

      const uploadResponse = await axios.post(
        'https://pixeldrain.com/api/file',
        formData,
        {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
            }
          },
        }
      )

      if (uploadResponse.data?.id) {
        const id = uploadResponse.data.id
        const fileName = path.basename(filePath)
        const fileSize = formatFileSize(fs.statSync(filePath).size)

        return {
          success: true,
          url: `https://pixeldrain.com/u/${id}`,
          fileName,
          fileSize,
          host: 'Pixeldrain',
        }
      }

      throw new Error('Upload failed')
    } catch (error: any) {
      console.error('[Pixeldrain] Upload error:', error.message)
      return { success: false, url: '', fileName: path.basename(filePath), fileSize: '', host: 'Pixeldrain', error: error.message }
    }
  }
}

// ============================================================
// MEDIAFIRE (Unofficial)
// ============================================================

export class MediaFireUploader {
  private email: string
  private password: string

  constructor(config: FileHostConfig) {
    this.email = config.apiKey || process.env.MEDIAFIRE_EMAIL || ''
    this.password = config.apiToken || process.env.MEDIAFIRE_PASSWORD || ''
  }

  async uploadFile(filePath: string, folderKey?: string): Promise<UploadResult> {
    try {
      // MediaFire upload requires session-based auth
      // This is a simplified version - full implementation needs session management
      const formData = new FormData()
      formData.append('Filedata', fs.createReadStream(filePath))
      if (folderKey) {
        formData.append('folderkey', folderKey)
      }

      const uploadResponse = await axios.post(
        'https://upload.mediafire.com/simpleupload.php',
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      )

      if (uploadResponse.data?.url) {
        const fileName = path.basename(filePath)
        const fileSize = formatFileSize(fs.statSync(filePath).size)

        return {
          success: true,
          url: uploadResponse.data.url,
          fileName,
          fileSize,
          host: 'MediaFire',
        }
      }

      throw new Error('Upload failed')
    } catch (error: any) {
      console.error('[MediaFire] Upload error:', error.message)
      return { success: false, url: '', fileName: path.basename(filePath), fileSize: '', host: 'MediaFire', error: error.message }
    }
  }
}

// ============================================================
// MULTI-HOST UPLOAD (Upload to all configured hosts)
// ============================================================

export async function uploadToAllHosts(
  filePath: string,
  hosts: string[] = ['gofile', 'pixeldrain'],
  onProgress?: (host: string, pct: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (const host of hosts) {
    let uploader: UnfilichierUploader | GoFileUploader | PixeldrainUploader | MediaFireUploader

    switch (host.toLowerCase()) {
      case '1fichier':
        uploader = new UnfilichierUploader({})
        break
      case 'gofile':
        uploader = new GoFileUploader({})
        break
      case 'pixeldrain':
        uploader = new PixeldrainUploader({})
        break
      case 'mediafire':
        uploader = new MediaFireUploader({})
        break
      default:
        continue
    }

    const result = await uploader.uploadFile(filePath, (pct) => onProgress?.(host, pct))
    results.push(result)
  }

  return results
}

// ============================================================
// QBITTORRENT API (For torrent management)
// ============================================================

export class QBittorrentClient {
  private baseUrl: string
  private username: string
  private password: string
  private cookie: string = ''

  constructor(config: { url?: string; username?: string; password?: string }) {
    this.baseUrl = config.url || process.env.QBITTORRENT_URL || 'http://localhost:8080'
    this.username = config.username || process.env.QBITTORRENT_USER || 'admin'
    this.password = config.password || process.env.QBITTORRENT_PASS || 'adminadmin'
  }

  async login(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v2/auth/login`,
        `username=${this.username}&password=${this.password}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      const cookies = response.headers['set-cookie']
      if (cookies) {
        this.cookie = cookies[0]?.split(';')[0] || ''
      }
      return response.data === 'Ok.'
    } catch {
      return false
    }
  }

  async addTorrent(magnetOrFile: string, savePath?: string): Promise<boolean> {
    try {
      const formData = new FormData()
      if (magnetOrFile.startsWith('magnet:')) {
        formData.append('urls', magnetOrFile)
      } else {
        formData.append('torrents', fs.createReadStream(magnetOrFile))
      }
      if (savePath) {
        formData.append('savepath', savePath)
      }

      await axios.post(`${this.baseUrl}/api/v2/torrents/add`, formData, {
        headers: { ...formData.getHeaders(), Cookie: this.cookie },
      })
      return true
    } catch (error: any) {
      console.error('[qBittorrent] Add torrent error:', error.message)
      return false
    }
  }

  async getTorrents(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        headers: { Cookie: this.cookie },
      })
      return response.data || []
    } catch {
      return []
    }
  }

  async pauseTorrent(hash: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/api/v2/torrents/pause`, `hashes=${hash}`, {
        headers: { Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return true
    } catch {
      return false
    }
  }

  async resumeTorrent(hash: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/api/v2/torrents/resume`, `hashes=${hash}`, {
        headers: { Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return true
    } catch {
      return false
    }
  }

  async deleteTorrent(hash: string, deleteFiles = false): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/api/v2/torrents/delete`, `hashes=${hash}&deleteFiles=${deleteFiles}`, {
        headers: { Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return true
    } catch {
      return false
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
