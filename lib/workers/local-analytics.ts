// ============================================================
// LOCAL ANALYTICS (Fallback)
// Stores events in Supabase when external analytics not configured
// Replace with Plausible, Fathom, or Umami in production
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface LocalAnalyticsConfig {
  apiUrl: string
  apiKey: string
  siteId: string
}

interface AnalyticsEvent {
  name: string
  url: string
  domain: string
  props?: Record<string, string | number | boolean>
}

interface AnalyticsStats {
  pageViews: number
  uniqueVisitors: number
  topPages: Array<{ page: string; views: number }>
  topReferrers: Array<{ referrer: string; views: number }>
  topCountries: Array<{ country: string; visitors: number }>
  topBrowsers: Array<{ browser: string; visitors: number }>
  bounceRate: number
  visitDuration: number
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG: LocalAnalyticsConfig = {
  apiUrl: process.env.LOCAL_ANALYTICS_URL || '',
  apiKey: process.env.LOCAL_ANALYTICS_KEY || '',
  siteId: process.env.LOCAL_ANALYTICS_SITE_ID || '',
}

// ============================================================
// LOCAL ANALYTICS CLIENT
// Fallback when external analytics not configured
// ============================================================

export class LocalAnalyticsClient {
  private apiUrl: string
  private apiKey: string
  private siteId: string

  constructor() {
    this.apiUrl = CONFIG.apiUrl
    this.apiKey = CONFIG.apiKey
    this.siteId = CONFIG.siteId
  }

  // ============================================================
  // TRACK EVENT
  // ============================================================

  async trackEvent(event: AnalyticsEvent): Promise<boolean> {
    if (!this.apiKey) {
      console.log('[Analytics] No API key, storing locally')
      await this.storeEventLocally(event)
      return true
    }

    try {
      const response = await fetch(`${this.apiUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          domain: event.domain || this.siteId,
          name: event.name,
          url: event.url,
          props: event.props,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('[Analytics] Event tracking error:', error)
      await this.storeEventLocally(event)
      return false
    }
  }

  // ============================================================
  // GET STATS
  // ============================================================

  async getStats(
    period: 'day' | 'week' | 'month' | '6month' | '12month' | 'custom',
    date?: string,
    filters?: Record<string, string>
  ): Promise<AnalyticsStats | null> {
    if (!this.apiKey) {
      return this.getStatsLocally(period, date)
    }

    try {
      const params = new URLSearchParams({
        period,
        site_id: this.siteId,
      })

      if (date) params.set('date', date)
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => params.set(k, v))
      }

      const response = await fetch(`${this.apiUrl}/stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) return null

      const data = await response.json()
      return {
        pageViews: data.pageviews || 0,
        uniqueVisitors: data.visitors || 0,
        topPages: data.top_pages || [],
        topReferrers: data.top_referrers || [],
        topCountries: data.top_countries || [],
        topBrowsers: data.top_browsers || [],
        bounceRate: data.bounce_rate || 0,
        visitDuration: data.visit_duration || 0,
      }
    } catch (error) {
      console.error('[Analytics] Stats error:', error)
      return this.getStatsLocally(period, date)
    }
  }

  // ============================================================
  // LOCAL STORAGE FALLBACK
  // ============================================================

  private async storeEventLocally(event: AnalyticsEvent): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_name: event.name,
        event_url: event.url,
        event_domain: event.domain,
        event_props: event.props || {},
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[Analytics] Local storage error:', error)
    }
  }

  private async getStatsLocally(period: string, date?: string): Promise<AnalyticsStats> {
    const periodDays: Record<string, number> = {
      day: 1, week: 7, month: 30, '6month': 180, '12month': 365,
    }
    const days = periodDays[period] || 30
    const startDate = new Date(Date.now() - days * 24 * 3600000).toISOString()

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate)

    if (!events) {
      return {
        pageViews: 0, uniqueVisitors: 0, topPages: [], topReferrers: [],
        topCountries: [], topBrowsers: [], bounceRate: 0, visitDuration: 0,
      }
    }

    // Count page views
    const pageViews = events.filter(e => e.event_name === 'pageview').length

    // Unique visitors (by IP)
    const uniqueIps = new Set(events.map(e => e.event_props?.ip).filter(Boolean))
    const uniqueVisitors = uniqueIps.size

    // Top pages
    const pageCounts: Record<string, number> = {}
    events.filter(e => e.event_name === 'pageview').forEach(e => {
      const page = e.event_url || '/'
      pageCounts[page] = (pageCounts[page] || 0) + 1
    })
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }))

    // Top referrers
    const referrerCounts: Record<string, number> = {}
    events.forEach(e => {
      const ref = e.event_props?.referrer || 'direct'
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1
    })
    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, views]) => ({ referrer, views }))

    // Top countries
    const countryCounts: Record<string, number> = {}
    events.forEach(e => {
      const country = e.event_props?.country || 'unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    })
    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, visitors]) => ({ country, visitors }))

    return {
      pageViews,
      uniqueVisitors,
      topPages,
      topReferrers,
      topCountries,
      topBrowsers: [],
      bounceRate: 0,
      visitDuration: 0,
    }
  }

  // ============================================================
  // HELPER: Track Page View
  // ============================================================

  async trackPageView(url: string, props?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      name: 'pageview',
      url,
      domain: this.siteId,
      props: {
        ...props,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // ============================================================
  // HELPER: Track Download
  // ============================================================

  async trackDownload(gameId: number, gameTitle: string, mirrorHost: string): Promise<void> {
    await this.trackEvent({
      name: 'download',
      url: `/game/${gameId}`,
      domain: this.siteId,
      props: {
        game_id: gameId,
        game_title: gameTitle,
        mirror_host: mirrorHost,
        timestamp: new Date().toISOString(),
      },
    })

    // Update game download count
    await supabase.rpc('increment_downloads', { game_id: gameId })
  }

  // ============================================================
  // HELPER: Track Ad Impression
  // ============================================================

  async trackAdImpression(adType: string, revenue = 0): Promise<void> {
    await this.trackEvent({
      name: 'ad_impression',
      url: window?.location?.pathname || '/',
      domain: this.siteId,
      props: {
        ad_type: adType,
        revenue,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // ============================================================
  // HELPER: Track Ad Click
  // ============================================================

  async trackAdClick(adType: string, revenue = 0): Promise<void> {
    await this.trackEvent({
      name: 'ad_click',
      url: window?.location?.pathname || '/',
      domain: this.siteId,
      props: {
        ad_type: adType,
        revenue,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

// Singleton
export const localAnalytics = new LocalAnalyticsClient()
