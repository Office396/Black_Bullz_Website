// ============================================================
// DISCORD REPACK MONITOR
// Monitors private Discord channels for new repacks
// Gets content BEFORE competitors - this is the revenue edge
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface DiscordMessage {
  id: string
  content: string
  author: { username: string; id: string; bot?: boolean }
  timestamp: string
  attachments: Array<{ filename: string; url: string; size: number }>
  embeds: Array<{ title?: string; description?: string; url?: string; image?: { url?: string } }>
  channel_id: string
}

interface RepackSignal {
  repacker: string
  gameTitle: string
  version: string
  rawTitle: string
  source: 'discord' | 'rss' | 'ipt' | 'hdbits'
  channelName?: string
  messageUrl?: string
  torrentUrl?: string
  nfoText?: string
  detectedAt: string
  confidence: number // 0-1 how confident we are this is a real repack
}

interface MonitorConfig {
  enabled: boolean
  checkIntervalMs: number
  discordBotToken: string
  channelIds: string[]
  rssFeeds: RSSFeed[]
  iptRssUrl: string
  hdbitsRssUrl: string
  minConfidence: number
  autoImport: boolean // Auto-create scrape job if confidence > threshold
}

interface RSSFeed {
  name: string
  url: string
  repacker?: string // If this feed is repacker-specific
  type: 'repacker' | 'scene' | 'p2p'
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG: MonitorConfig = {
  enabled: process.env.DISCORD_MONITOR_ENABLED === 'true',
  checkIntervalMs: parseInt(process.env.DISCORD_CHECK_INTERVAL || '60000'), // 1 min
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  channelIds: (process.env.DISCORD_CHANNEL_IDS || '').split(',').filter(Boolean),
  rssFeeds: [
    // Repacker-specific feeds (highest priority)
    { name: 'FitGirl', url: 'https://fitgirl-repacks.site/feed/', repacker: 'fitgirl', type: 'repacker' },
    { name: 'DODI', url: 'https://dodi-repacks.site/feed/', repacker: 'dodi', type: 'repacker' },
    { name: 'OvaGames', url: 'https://ovagames.com/feed/', repacker: 'ovagames', type: 'repacker' },
    { name: 'ElAmigos', url: 'https://elamigos-games.com/feed/', repacker: 'elamigos', type: 'repacker' },
    // Scene feeds (for comparison)
    { name: 'Scene-RLS', url: 'https://predb.ovh/api/v1/get?limit=50&type=game', type: 'scene' },
    { name: 'srrdb', url: 'https://srrdb.com/api/games/search/?search=&category=game', type: 'scene' },
  ],
  iptRssUrl: process.env.IPT_RSS_URL || '',
  hdbitsRssUrl: process.env.HDBITS_RSS_URL || '',
  minConfidence: 0.7,
  autoImport: process.env.AUTO_IMPORT_REPACKS === 'true',
}

// ============================================================
// REPACKER SIGNATURES (for detection confidence)
// ============================================================

const REPACKER_SIGNATURES: Record<string, { patterns: RegExp[]; weight: number }> = {
  fitgirl: {
    patterns: [/fitgirl/i, /fit girl/i, /fit-girl/i],
    weight: 1.0,
  },
  dodi: {
    patterns: [/dodi/i, /dodi repacks/i],
    weight: 0.95,
  },
  elamigos: {
    patterns: [/elamigos/i, /el amigos/i, /el-amigos/i],
    weight: 0.9,
  },
  ovagames: {
    patterns: [/ovagames/i, /ova games/i, /ova-games/i],
    weight: 0.85,
  },
  kaos: {
    patterns: [/kaos/i, /kaoskrew/i],
    weight: 0.8,
  },
  cpy: {
    patterns: [/\bcpy\b/i, /copy/i],
    weight: 0.75,
  },
  plaza: {
    patterns: [/\bplaza\b/i, /scene plaza/i],
    weight: 0.7,
  },
  codex: {
    patterns: [/\bcodex\b/i],
    weight: 0.65,
  },
}

// ============================================================
// GAME TITLE EXTRACTION
// ============================================================

// Patterns to extract game title from repack release names
// e.g., "Cyberpunk.2077.v2.1.Dubbed-ElAmigos" → "Cyberpunk 2077"
const TITLE_PATTERNS = [
  // Standard scene naming: Title.Version.Group
  /^(.+?)\.v?[\d.]+.*?-(.+)$/i,
  // FitGirl style: Title (vX.X) [Repack by FitGirl]
  /^(.+?)\s*\(v[\d.]+\).*?(?:repack|fitgirl)/i,
  // DODI style: Title - V[X.X] - [DODI Repack]
  /^(.+?)\s*-\s*v[\d.]+\s*-\s*\[?(?:dodi|fitgirl)/i,
  // Generic: Title with dots/underscores as spaces
  /^(.+?)(?:\.|_)(?:v\d| steam| gog| multi| cracked)/i,
]

function extractGameTitle(raw: string): { title: string; version: string; confidence: number } {
  let title = ''
  let version = ''
  let confidence = 0

  // Try each pattern
  for (const pattern of TITLE_PATTERNS) {
    const match = raw.match(pattern)
    if (match) {
      title = match[1]
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      confidence = 0.8
      break
    }
  }

  // Fallback: take everything before first version-like string
  if (!title) {
    const versionMatch = raw.match(/[\s._-]v?\d+\.\d+/i)
    if (versionMatch) {
      title = raw.substring(0, versionMatch.index)
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      confidence = 0.6
    } else {
      // Last resort: clean up the whole string
      title = raw
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/-\w+$/i, '') // Remove trailing group name
        .trim()
      confidence = 0.4
    }
  }

  // Extract version
  const versionPatterns = [
    /v(\d+(?:\.\d+)+)/i,
    /version\s*(\d+(?:\.\d+)+)/i,
    /\.(\d{4,})\./, // Date-based versions like 20240115
  ]

  for (const vp of versionPatterns) {
    const vm = raw.match(vp)
    if (vm) {
      version = vm[1]
      break
    }
  }

  return { title, version, confidence }
}

// ============================================================
// DETECT REPACKER FROM MESSAGE
// ============================================================

function detectRepacker(text: string): { repacker: string; confidence: number } {
  let bestMatch = 'unknown'
  let bestConfidence = 0

  for (const [name, sig] of Object.entries(REPACKER_SIGNATURES)) {
    for (const pattern of sig.patterns) {
      if (pattern.test(text)) {
        const conf = sig.weight
        if (conf > bestConfidence) {
          bestMatch = name
          bestConfidence = conf
        }
      }
    }
  }

  return { repacker: bestMatch, confidence: bestConfidence }
}

// ============================================================
// EXTRACT TORRENT/MAGNET LINKS
// ============================================================

function extractLinks(text: string, attachments: DiscordMessage['attachments']): {
  torrentUrl?: string
  magnetLink?: string
  nfoText?: string
} {
  // Magnet links
  const magnetMatch = text.match(/magnet:\?xt=urn:[a-zA-Z0-9]+:[a-zA-Z0-9]{32,}/i)
  const magnetLink = magnetMatch ? magnetMatch[0] : undefined

  // Torrent URLs
  const torrentPatterns = [
    /https?:\/\/[^\s]+\.(?:torrent|mp4|mkv)/gi,
    /https?:\/\/(?:tinyurl|bit\.ly|rentry|gayol)[^\s]+/gi,
  ]
  let torrentUrl: string | undefined
  for (const tp of torrentPatterns) {
    const tm = text.match(tp)
    if (tm) {
      torrentUrl = tm[0]
      break
    }
  }

  // Check attachments for .torrent files
  const torrentAttachment = attachments.find(a => a.filename.endsWith('.torrent'))
  if (torrentAttachment) {
    torrentUrl = torrentAttachment.url
  }

  // NFO content (usually in code blocks or attachments)
  const nfoMatch = text.match(/```[\s\S]*?```/)
  const nfoText = nfoMatch ? nfoMatch[0].replace(/```\n?/g, '').trim() : undefined

  return { torrentUrl, magnetLink, nfoText }
}

// ============================================================
// PARSE DISCORD MESSAGE INTO REPACK SIGNAL
// ============================================================

function parseDiscordMessage(msg: DiscordMessage): RepackSignal | null {
  const text = msg.content
  if (!text || text.length < 10) return null

  // Detect repacker
  const { repacker, confidence: repackerConf } = detectRepacker(text)

  // Extract game title and version
  const { title, version, confidence: titleConf } = extractGameTitle(text)

  if (!title || titleConf < 0.3) return null

  // Extract links
  const { torrentUrl, magnetLink, nfoText } = extractLinks(text, msg.attachments)

  // Overall confidence
  const confidence = (repackerConf * 0.6) + (titleConf * 0.4)

  return {
    repacker,
    gameTitle: title,
    version,
    rawTitle: text.substring(0, 200),
    source: 'discord',
    channelName: msg.channel_id,
    messageUrl: `https://discord.com/channels/@me/${msg.channel_id}/${msg.id}`,
    torrentUrl: torrentUrl || magnetLink,
    nfoText,
    detectedAt: msg.timestamp,
    confidence,
  }
}

// ============================================================
// PARSE RSS FEED ITEM INTO REPACK SIGNAL
// ============================================================

function parseRssItem(item: any, feed: RSSFeed): RepackSignal | null {
  const title = item.title || item.name || ''
  const link = item.link || item.url || ''
  const description = item.description || item.content || ''

  if (!title) return null

  const { repacker, confidence: repackerConf } = feed.repacker
    ? { repacker: feed.repacker, confidence: 0.9 }
    : detectRepacker(title + ' ' + description)

  const { title: gameTitle, version, confidence: titleConf } = extractGameTitle(title)

  if (!gameTitle || titleConf < 0.3) return null

  const confidence = (repackerConf * 0.5) + (titleConf * 0.5)

  return {
    repacker,
    gameTitle,
    version,
    rawTitle: title,
    source: feed.type === 'repacker' ? 'rss' : 'ipt',
    torrentUrl: link,
    detectedAt: item.pubDate || new Date().toISOString(),
    confidence,
  }
}

// ============================================================
// MAIN MONITOR CLASS
// ============================================================

export class DiscordRepackMonitor {
  private lastCheck: Map<string, string> = new Map() // channelId -> last message ID
  private checkTimer: NodeJS.Timeout | null = null
  private signalBuffer: RepackSignal[] = []

  async start(): Promise<void> {
    if (!CONFIG.enabled) {
      console.log('[DiscordMonitor] Disabled')
      return
    }

    console.log('[DiscordMonitor] Starting monitor...')
    console.log(`[DiscordMonitor] Channels: ${CONFIG.channelIds.length}`)
    console.log(`[DiscordMonitor] RSS Feeds: ${CONFIG.rssFeeds.length}`)

    // Initial check
    await this.checkAll()

    // Schedule periodic checks
    this.checkTimer = setInterval(() => this.checkAll(), CONFIG.checkIntervalMs)
  }

  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
    console.log('[DiscordMonitor] Stopped')
  }

  private async checkAll(): Promise<void> {
    const promises: Promise<void>[] = []

    // Check Discord channels
    if (CONFIG.discordBotToken && CONFIG.channelIds.length > 0) {
      promises.push(this.checkDiscordChannels())
    }

    // Check RSS feeds
    for (const feed of CONFIG.rssFeeds) {
      promises.push(this.checkRssFeed(feed))
    }

    // Check IPT/HDBits
    if (CONFIG.iptRssUrl) {
      promises.push(this.checkIptFeed())
    }

    await Promise.allSettled(promises)

    // Process buffered signals
    await this.processSignals()
  }

  private async checkDiscordChannels(): Promise<void> {
    for (const channelId of CONFIG.channelIds) {
      try {
        const lastId = this.lastCheck.get(channelId)
        let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`
        if (lastId) {
          url += `&after=${lastId}`
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bot ${CONFIG.discordBotToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`[DiscordMonitor] Channel ${channelId}: ${response.status}`)
          continue
        }

        const messages: DiscordMessage[] = await response.json()

        // Process newest first, update last seen
        if (messages.length > 0) {
          this.lastCheck.set(channelId, messages[0].id)
        }

        // Parse each message
        for (const msg of messages.reverse()) {
          if (msg.author.bot) continue // Skip bot messages
          const signal = parseDiscordMessage(msg)
          if (signal && signal.confidence >= CONFIG.minConfidence) {
            this.signalBuffer.push(signal)
            console.log(`[DiscordMonitor] Signal: ${signal.gameTitle} v${signal.version} by ${signal.repacker} (${(signal.confidence * 100).toFixed(0)}%)`)
          }
        }
      } catch (error: any) {
        console.error(`[DiscordMonitor] Channel ${channelId} error:`, error.message)
      }
    }
  }

  private async checkRssFeed(feed: RSSFeed): Promise<void> {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'RepackMonitor/1.0' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) return

      const text = await response.text()

      // Simple XML parsing (no external deps)
      const items = this.parseRssXml(text)

      for (const item of items) {
        const signal = parseRssItem(item, feed)
        if (signal && signal.confidence >= CONFIG.minConfidence) {
          // Dedup against recent signals
          const isDuplicate = this.signalBuffer.some(s =>
            s.gameTitle.toLowerCase() === signal.gameTitle.toLowerCase() &&
            s.repacker === signal.repacker
          )
          if (!isDuplicate) {
            this.signalBuffer.push(signal)
            console.log(`[RSSMonitor] Signal from ${feed.name}: ${signal.gameTitle} v${signal.version}`)
          }
        }
      }
    } catch (error: any) {
      console.error(`[RSSMonitor] ${feed.name} error:`, error.message)
    }
  }

  private async checkIptFeed(): Promise<void> {
    try {
      const response = await fetch(CONFIG.iptRssUrl, {
        headers: { 'User-Agent': 'RepackMonitor/1.0' },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) return
      const text = await response.text()
      const items = this.parseRssXml(text)
      for (const item of items) {
        const signal = parseRssItem(item, { name: 'IPT', url: '', type: 'ipt' })
        if (signal && signal.confidence >= CONFIG.minConfidence) {
          this.signalBuffer.push(signal)
        }
      }
    } catch {}
  }

  private parseRssXml(xml: string): any[] {
    const items: any[] = []
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || []
    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''
      const link = itemXml.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1] || ''
      const description = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || ''
      const pubDate = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)?.[1] || ''
      items.push({ title, link, description, pubDate })
    }
    return items
  }

  // ============================================================
  // PROCESS SIGNALS -> CREATE SCRAPE JOBS
  // ============================================================

  private async processSignals(): Promise<void> {
    if (this.signalBuffer.length === 0) return

    const signals = [...this.signalBuffer]
    this.signalBuffer = []

    for (const signal of signals) {
      try {
        // Check if game already exists
        const { data: existing } = await supabase
          .from('games')
          .select('id, title')
          .ilike('title', `%${signal.gameTitle}%`)
          .single()

        if (existing) {
          console.log(`[DiscordMonitor] Game already exists: ${existing.title}`)
          continue
        }

        // Check if we already have a scrape job for this
        const { data: existingJob } = await supabase
          .from('scrape_jobs')
          .select('id')
          .eq('status', 'pending')
          .ilike('source_url', `%${signal.gameTitle}%`)
          .single()

        if (existingJob) continue

        // Create scrape job
        if (CONFIG.autoImport && signal.confidence >= 0.8) {
          await supabase.from('scrape_jobs').insert({
            game_id: null,
            source: signal.source,
            source_url: signal.torrentUrl || signal.messageUrl || '',
            status: 'pending',
            priority: signal.repacker === 'fitgirl' ? 100 :
                     signal.repacker === 'dodi' ? 90 :
                     signal.repacker === 'elamigos' ? 80 : 50,
            metadata: {
              repacker: signal.repacker,
              gameTitle: signal.gameTitle,
              version: signal.version,
              rawTitle: signal.rawTitle,
              confidence: signal.confidence,
            },
          })

          console.log(`[DiscordMonitor] Created scrape job: ${signal.gameTitle} (confidence: ${(signal.confidence * 100).toFixed(0)}%)`)
        }

        // Store signal for analytics
        await supabase.from('daily_stats').upsert({
          stat_date: new Date().toISOString().split('T')[0],
          // Increment repack signals detected
        }, { onConflict: 'stat_date' })

      } catch (error: any) {
        console.error('[DiscordMonitor] Signal processing error:', error.message)
      }
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  getRecentSignals(limit = 20): RepackSignal[] {
    return this.signalBuffer.slice(-limit)
  }

  async getSignalStats(): Promise<{
    totalSignals: number
    signalsToday: number
    byRepacker: Record<string, number>
    bySource: Record<string, number>
  }> {
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('scrape_jobs')
      .select('metadata, source, created_at')
      .gte('created_at', `${today}T00:00:00`)

    const jobs = data || []
    const byRepacker: Record<string, number> = {}
    const bySource: Record<string, number> = {}

    for (const job of jobs) {
      const meta = job.metadata as any
      if (meta?.repacker) {
        byRepacker[meta.repacker] = (byRepacker[meta.repacker] || 0) + 1
      }
      bySource[job.source] = (bySource[job.source] || 0) + 1
    }

    return {
      totalSignals: jobs.length,
      signalsToday: jobs.length,
      byRepacker,
      bySource,
    }
  }
}

// Singleton
export const discordMonitor = new DiscordRepackMonitor()
