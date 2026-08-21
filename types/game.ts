// ============================================================
// New Game Types for the repack site system
// ============================================================

export interface Game {
  id: number
  title: string
  slug: string
  description: string
  longDescription: string

  developer: string
  publisher: string
  releaseDate: string
  repackDate: string
  updatedDate: string

  coverImage: string
  landscapeImage: string
  screenshots: string[]

  genres: string[]
  tags: string[]
  rating: number

  originalSize: string
  repackSize: string

  repackerName: string
  repackerUrl: string

  systemRequirements: {
    minimum: RequirementSpec
    recommended: RequirementSpec
  }

  languages: string
  mirrors: Mirror[]
  magnetLink: string
  torrentSeeders: number
  torrentLeechers: number
  torrentInfoHash: string

  installationNotes: string
  rarPassword: string

  metaTitle: string
  metaDescription: string
  canonicalUrl: string

  downloads: number
  views: number
  likes: number
  dislikes: number

  status: 'draft' | 'published' | 'archived' | 'removed'
  trending: boolean
  featured: boolean
  pinned: boolean

  source: 'manual' | 'scraper' | 'api' | 'import'
  sourceUrl: string
  sourceId: string
  nfoContent: string

  createdAt: string
  publishedAt: string
}

export interface RequirementSpec {
  os: string
  processor: string
  memory: string
  graphics: string
  storage: string
  directx: string
  soundCard: string
  network: string
}

export interface Mirror {
  id: number
  gameId: number
  hostName: string
  hostIcon: string
  downloadUrl: string
  partNumber: number
  totalParts: number
  fileName: string
  fileSize: string
  fileType: string
  status: 'active' | 'dead' | 'checking'
  lastChecked: string
  lastAlive: string
  monetizedUrl: string
  priority: number
  clicks: number
}

export interface Repacker {
  id: number
  name: string
  slug: string
  url: string
  logoUrl: string
  description: string
  totalGames: number
  totalDownloads: number
  active: boolean
}

export interface Genre {
  id: number
  name: string
  slug: string
  description: string
  gameCount: number
}

export interface Earning {
  id: number
  source: 'shortener' | 'ads' | 'affiliate' | 'donation' | 'premium' | 'other'
  provider: string
  amount: number
  currency: string
  gameId: number
  mirrorId: number
  clickId: string
  transactionId: string
  details: Record<string, any>
  earnedDate: string
}

export interface ScrapeJob {
  id: number
  jobType: 'scrape' | 'upload' | 'publish' | 'check_mirrors' | 'update_metadata'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  sourceUrl: string
  sourceName: string
  gameId: number
  result: Record<string, any>
  error: string
  attempts: number
  maxAttempts: number
  scheduledAt: string
  startedAt: string
  completedAt: string
}

export interface WorkerStatus {
  id: number
  workerName: string
  status: 'idle' | 'running' | 'stopped' | 'error'
  lastHeartbeat: string
  totalProcessed: number
  totalErrors: number
  lastJobId: number
  lastError: string
  config: Record<string, any>
}

export interface DailyStats {
  id: number
  statDate: string
  pageViews: number
  uniqueVisitors: number
  downloads: number
  earningsTotal: number
  earningsShortener: number
  earningsAds: number
  earningsAffiliate: number
  gamesAdded: number
  mirrorsAdded: number
  mirrorsDead: number
}

export interface AdConfig {
  id: number
  adNetwork: string
  adType: 'popunder' | 'banner' | 'native' | 'interstitial' | 'video' | 'smartlink'
  position: string
  scriptCode: string
  adTag: string
  cpm: number
  impressions: number
  clicks: number
  earnings: number
  active: boolean
  priority: number
  config: Record<string, any>
}

export interface ScrapeSource {
  id: number
  name: string
  type: 'rss' | 'api' | 'scraper' | 'manual'
  url: string
  parseConfig: Record<string, any>
  active: boolean
  lastScraped: string
  totalScraped: number
  totalErrors: number
  rateLimitMs: number
}
