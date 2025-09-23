// Simulated domains for rotating download URLs
const DOWNLOAD_DOMAINS = [
  'getfile.site',
  'download-secure.site',
  'fastdl.site',
  'securedl.site',
  'quickdl.site'
]

interface DownloadLink {
  id: string
  gameId: number
  url: string
  domain: string
  createdAt: string
  expiresAt: string
  gpLink: string
}

export function generateDownloadId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getRandomDomain(): string {
  return DOWNLOAD_DOMAINS[Math.floor(Math.random() * DOWNLOAD_DOMAINS.length)]
}

export function generateTempDownloadUrl(gameId: number, gpLink: string): DownloadLink {
  const id = generateDownloadId()
  const domain = getRandomDomain()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

  const downloadLink: DownloadLink = {
    id,
    gameId,
    url: `https://${domain}/dl/${id}`,
    domain,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    gpLink
  }

  // Store in localStorage
  const downloadLinks = JSON.parse(localStorage.getItem('download_links') || '[]')
  downloadLinks.push(downloadLink)
  localStorage.setItem('download_links', JSON.stringify(downloadLinks))

  return downloadLink
}

export function getValidDownloadLink(id: string): DownloadLink | null {
  const downloadLinks = JSON.parse(localStorage.getItem('download_links') || '[]')
  const link = downloadLinks.find((l: DownloadLink) => l.id === id)

  if (!link) return null

  // Check if expired
  if (new Date(link.expiresAt) < new Date()) {
    // Remove expired link
    const filteredLinks = downloadLinks.filter((l: DownloadLink) => l.id !== id)
    localStorage.setItem('download_links', JSON.stringify(filteredLinks))
    return null
  }

  return link
}

export function cleanExpiredLinks(): void {
  const downloadLinks = JSON.parse(localStorage.getItem('download_links') || '[]')
  const now = new Date()
  const validLinks = downloadLinks.filter((link: DownloadLink) => new Date(link.expiresAt) > now)
  localStorage.setItem('download_links', JSON.stringify(validLinks))
}