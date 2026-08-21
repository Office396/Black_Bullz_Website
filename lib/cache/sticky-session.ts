// ============================================================
// STICKY SESSION MANAGER
// Session affinity for affiliate links
// User gets same affiliate for 24 hours = consistent experience
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface SessionData {
  sessionId: string
  userId?: string
  affiliateId: number
  affiliateNetwork: string
  affiliateUrl: string
  assignedAt: string
  expiresAt: string
  pageViews: number
  downloads: number
  country: string
  userAgent: string
}

interface StickySessionConfig {
  // How long to keep affiliate assignment (ms)
  sessionTtlMs: number

  // Max page views per session
  maxPageViews: number

  // Max downloads per session
  maxDownloads: number

  // Enable/disable sticky sessions
  enabled: boolean
}

// ============================================================
// CONFIGURATION
// ============================================================

const SESSION_CONFIG: StickySessionConfig = {
  sessionTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  maxPageViews: 100,
  maxDownloads: 10,
  enabled: true,
}

// ============================================================
// IN-MEMORY SESSION STORE (Redis alternative)
// ============================================================

class SessionStore {
  private store: Map<string, SessionData> = new Map()
  private maxSessions: number

  constructor(maxSessions = 50000) {
    this.maxSessions = maxSessions

    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  get(sessionId: string): SessionData | null {
    const session = this.store.get(sessionId)
    if (!session) return null

    // Check expiry
    if (Date.now() > new Date(session.expiresAt).getTime()) {
      this.store.delete(sessionId)
      return null
    }

    // Check limits
    if (session.pageViews >= SESSION_CONFIG.maxPageViews) return null
    if (session.downloads >= SESSION_CONFIG.maxDownloads) return null

    return session
  }

  set(sessionId: string, data: SessionData): void {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxSessions) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) this.store.delete(oldestKey)
    }

    this.store.set(sessionId, data)
  }

  update(sessionId: string, updates: Partial<SessionData>): void {
    const existing = this.store.get(sessionId)
    if (existing) {
      this.store.set(sessionId, { ...existing, ...updates })
    }
  }

  delete(sessionId: string): void {
    this.store.delete(sessionId)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, session] of this.store) {
      if (now > new Date(session.expiresAt).getTime()) {
        this.store.delete(key)
      }
    }
  }

  getStats(): { activeSessions: number; totalAffiliateAssignments: number } {
    return {
      activeSessions: this.store.size,
      totalAffiliateAssignments: this.store.size,
    }
  }
}

// Global session store
const sessionStore = new SessionStore()

// ============================================================
// STICKY SESSION MANAGER
// ============================================================

export class StickySessionManager {
  // ============================================================
  // GET OR CREATE SESSION
  // ============================================================

  async getOrCreateSession(
    request: Request,
    category: string
  ): Promise<SessionData> {
    const sessionId = this.extractSessionId(request)
    const country = this.extractCountry(request)
    const userAgent = request.headers.get('user-agent') || ''

    // Check existing session
    const existing = sessionStore.get(sessionId)
    if (existing && existing.affiliateNetwork) {
      // Update page views
      sessionStore.update(sessionId, {
        pageViews: existing.pageViews + 1,
      })
      return existing
    }

    // Create new session with affiliate assignment
    const affiliate = await this.assignAffiliate(category, country)

    const session: SessionData = {
      sessionId,
      affiliateId: affiliate.id,
      affiliateNetwork: affiliate.network,
      affiliateUrl: affiliate.url,
      assignedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_CONFIG.sessionTtlMs).toISOString(),
      pageViews: 1,
      downloads: 0,
      country,
      userAgent,
    }

    sessionStore.set(sessionId, session)

    // Persist to database
    await supabase
      .from('sticky_sessions')
      .upsert({
        session_id: sessionId,
        affiliate_id: affiliate.id,
        affiliate_network: affiliate.network,
        affiliate_url: affiliate.url,
        country,
        expires_at: session.expiresAt,
      })
      .then(() => {})
      .catch(() => {})

    return session
  }

  // ============================================================
  // ASSIGN AFFILIATE (sticky for 24h)
  // ============================================================

  private async assignAffiliate(
    category: string,
    country: string
  ): Promise<{ id: number; network: string; url: string }> {
    // Get active affiliates for this category
    const { data: affiliates } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('active', true)
      .eq('category', category)
      .order('priority', { ascending: false })

    if (!affiliates || affiliates.length === 0) {
      return { id: 0, network: 'none', url: '#' }
    }

    // Score by country preference
    const scored = affiliates.map(aff => {
      let score = aff.priority || 50

      // Boost if network matches country preference
      const network = aff.network.toLowerCase()
      if (country === 'US' && network.includes('amazon_us')) score += 50
      else if (country === 'IN' && network.includes('flipkart')) score += 50
      else if (country === 'DE' && network.includes('amazon_de')) score += 50
      else if (country === 'JP' && network.includes('rakuten')) score += 50
      // Generic boost for Amazon in most countries
      else if (network.includes('amazon')) score += 30
      else if (network.includes('clickbank')) score += 20

      return { ...aff, score }
    })

    // Sort by score
    scored.sort((a, b) => b.score - a.score)

    // Weighted random selection (top 3)
    const top3 = scored.slice(0, 3)
    const totalScore = top3.reduce((sum, a) => sum + a.score, 0)
    let random = Math.random() * totalScore

    for (const aff of top3) {
      random -= aff.score
      if (random <= 0) {
        return { id: aff.id, network: aff.network, url: aff.url }
      }
    }

    return { id: top3[0].id, network: top3[0].network, url: top3[0].url }
  }

  // ============================================================
  // TRACK DOWNLOAD (increment counter)
  // ============================================================

  async trackDownload(sessionId: string): Promise<void> {
    const session = sessionStore.get(sessionId)
    if (session) {
      sessionStore.update(sessionId, {
        downloads: session.downloads + 1,
      })

      // Track in database
      await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_id: session.affiliateId,
          country: session.country,
          revenue: 0,
        })
        .then(() => {})
        .catch(() => {})
    }
  }

  // ============================================================
  // GET SESSION AFFILIATE
  // ============================================================

  async getSessionAffiliate(
    sessionId: string
  ): Promise<{ url: string; network: string } | null> {
    const session = sessionStore.get(sessionId)
    if (!session) return null

    return {
      url: session.affiliateUrl,
      network: session.affiliateNetwork,
    }
  }

  // ============================================================
  // EXTRACT SESSION ID FROM REQUEST
  // ============================================================

  private extractSessionId(request: Request): string {
    // Check cookie first
    const cookieHeader = request.headers.get('cookie') || ''
    const sessionMatch = cookieHeader.match(/session_id=([^;]+)/)
    if (sessionMatch) return sessionMatch[1]

    // Check header
    const headerSession = request.headers.get('x-session-id')
    if (headerSession) return headerSession

    // Generate from IP + User Agent (fallback)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0'
    const ua = request.headers.get('user-agent') || 'unknown'
    let hash = 0
    const str = `${ip}:${ua}`
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return `sess_${Math.abs(hash).toString(36)}`
  }

  // ============================================================
  // EXTRACT COUNTRY FROM REQUEST
  // ============================================================

  private extractCountry(request: Request): string {
    // Check Cloudflare header
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'XX') return cfCountry

    // Check custom header
    const customCountry = request.headers.get('x-country')
    if (customCountry) return customCountry

    return 'US' // Default
  }

  // ============================================================
  // GET STATS (for admin)
  // ============================================================

  getStats(): { activeSessions: number; config: StickySessionConfig } {
    return {
      activeSessions: sessionStore.getStats().activeSessions,
      config: SESSION_CONFIG,
    }
  }
}

// Singleton
export const stickySessions = new StickySessionManager()
