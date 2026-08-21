// ============================================================
// ANALYTICS INTEGRATION
// Supports: Plausible, PostHog
// Privacy-friendly, lightweight tracking
// ============================================================

import axios from 'axios'

// ============================================================
// TYPES
// ============================================================

interface AnalyticsEvent {
  name: string
  url?: string
  domain?: string
  props?: Record<string, string | number | boolean>
}

interface AnalyticsStats {
  pageViews: number
  uniqueVisitors: number
  topPages: Array<{ page: string; views: number }>
  topReferrers: Array<{ referrer: string; views: number }>
  topCountries: Array<{ country: string; visitors: number }>
  bounceRate: number
  visitDuration: number
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Plausible Analytics (privacy-friendly)
  PLAUSIBLE_API_URL: process.env.PLAUSIBLE_API_URL || 'https://plausible.io/api/v1',
  PLAUSIBLE_API_KEY: process.env.PLAUSIBLE_API_KEY || '',
  PLAUSIBLE_SITE_ID: process.env.PLAUSIBLE_SITE_ID || '',

  // PostHog (product analytics)
  POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || '',
  POSTHOG_HOST: process.env.POSTHOG_HOST || 'https://app.posthog.com',
}

// ============================================================
// PLAUSIBLE ANALYTICS
// ============================================================

export class PlausibleAnalytics {
  private apiUrl: string
  private apiKey: string
  private siteId: string

  constructor() {
    this.apiUrl = CONFIG.PLAUSIBLE_API_URL
    this.apiKey = CONFIG.PLAUSIBLE_API_KEY
    this.siteId = CONFIG.PLAUSIBLE_SITE_ID
  }

  async getStats(
    period: 'day' | 'week' | 'month' | '6month' | '12month' | 'custom',
    date?: string,
    filters?: Record<string, string>
  ): Promise<AnalyticsStats | null> {
    if (!this.apiKey) {
      console.log('[Analytics] Plausible API key not configured')
      return null
    }

    try {
      const params: any = {
        site_id: this.siteId,
        period,
      }

      if (date) params.date = date
      if (filters) params.filters = JSON.stringify(filters)

      const response = await axios.get(`${this.apiUrl}/stats/aggregate`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params,
      })

      const aggregate = response.data

      // Get top pages
      const pagesResponse = await axios.get(`${this.apiUrl}/stats/breakdown`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: { ...params, property: 'event:page', limit: 10 },
      })

      // Get top referrers
      const referrersResponse = await axios.get(`${this.apiUrl}/stats/breakdown`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: { ...params, property: 'visit:referrer', limit: 10 },
      })

      // Get top countries
      const countriesResponse = await axios.get(`${this.apiUrl}/stats/breakdown`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: { ...params, property: 'visit:country', limit: 10 },
      })

      return {
        pageViews: aggregate?.pageviews?.value || 0,
        uniqueVisitors: aggregate?.visitors?.value || 0,
        topPages: (pagesResponse.data?.results || []).map((r: any) => ({ page: r.page, views: r.pageviews })),
        topReferrers: (referrersResponse.data?.results || []).map((r: any) => ({ referrer: r.referrer, views: r.visitors })),
        topCountries: (countriesResponse.data?.results || []).map((r: any) => ({ country: r.country, visitors: r.visitors })),
        bounceRate: aggregate?.bounce_rate?.value || 0,
        visitDuration: aggregate?.visit_duration?.value || 0,
      }
    } catch (error: any) {
      console.error('[Analytics] Plausible stats error:', error.message)
      return null
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.apiKey) return

    try {
      await axios.post(`${this.apiUrl}/event`, {
        name: event.name,
        url: event.url || '/',
        domain: event.domain || this.siteId,
        props: event.props,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (error: any) {
      console.error('[Analytics] Plausible event error:', error.message)
    }
  }
}

// ============================================================
// POSTHOG INTEGRATION
// ============================================================

export class PostHogAnalytics {
  private apiKey: string
  private host: string

  constructor() {
    this.apiKey = CONFIG.POSTHOG_API_KEY
    this.host = CONFIG.POSTHOG_HOST
  }

  async trackEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.apiKey) return

    try {
      await axios.post(`${this.host}/e/`, {
        api_key: this.apiKey,
        event,
        properties: properties || {},
        distinct_id: distinctId,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('[Analytics] PostHog event error:', error.message)
    }
  }

  async getInsights(
    insightType: 'trends' | 'funnels' | 'retention',
    config: any
  ): Promise<any> {
    if (!this.apiKey) return null

    try {
      const response = await axios.post(`${this.host}/api/insights/`, config, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })
      return response.data
    } catch (error: any) {
      console.error('[Analytics] PostHog insights error:', error.message)
      return null
    }
  }
}

// ============================================================
// GAME-SPECIFIC TRACKING
// ============================================================

export async function trackGameView(gameId: number, gameTitle: string, source: string): Promise<void> {
  const plausible = new PlausibleAnalytics()
  await plausible.trackEvent({
    name: 'Game View',
    props: {
      game_id: gameId,
      game_title: gameTitle,
      source,
    },
  })
}

export async function trackDownload(gameId: number, mirrorId: number, host: string): Promise<void> {
  const plausible = new PlausibleAnalytics()
  await plausible.trackEvent({
    name: 'Download Click',
    props: {
      game_id: gameId,
      mirror_id: mirrorId,
      host,
    },
  })
}

export async function trackSearch(query: string, results: number): Promise<void> {
  const plausible = new PlausibleAnalytics()
  await plausible.trackEvent({
    name: 'Search',
    props: {
      query,
      results_count: results,
    },
  })
}

export async function trackRepackerTraffic(repackerName: string): Promise<void> {
  const plausible = new PlausibleAnalytics()
  await plausible.trackEvent({
    name: 'Repacker Page View',
    props: {
      repacker: repackerName,
    },
  })
}

// ============================================================
// DAILY STATS AGGREGATOR
// ============================================================

export async function aggregateDailyStats(): Promise<void> {
  console.log('[Analytics] Aggregating daily stats...')

  const plausible = new PlausibleAnalytics()
  const today = new Date().toISOString().split('T')[0]

  const stats = await plausible.getStats('day', today)

  if (stats) {
    // Store in daily_stats table
    const { supabase } = await import('../supabase')

    await supabase.from('daily_stats').upsert({
      stat_date: today,
      page_views: stats.pageViews,
      unique_visitors: stats.uniqueVisitors,
    }, { onConflict: 'stat_date' })

    console.log(`[Analytics] Daily stats: ${stats.pageViews} views, ${stats.uniqueVisitors} visitors`)
  }
}

// ============================================================
// SINGLETON EXPORTS
// ============================================================

export const analytics = new PlausibleAnalytics()
export const posthog = new PostHogAnalytics()
