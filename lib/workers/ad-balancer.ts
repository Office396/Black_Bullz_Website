// ============================================================
// SMART AD-LOAD BALANCING
// A/B test ad densities, maximize revenue without killing UX
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface AdVariant {
  id: string
  name: string
  config: AdDensityConfig
  trafficPercent: number // % of traffic to split
  impressions: number
  clicks: number
  revenue: number
  ctr: number
  rpm: number // revenue per 1000 impressions
  active: boolean
}

interface AdDensityConfig {
  popunderFrequency: number // Show every N page views
  bannerDensity: 'low' | 'medium' | 'high' | 'aggressive'
  interstitialOnDownload: boolean
  prerollEnabled: boolean
  prerollFrequency: number // Show every N download page visits
  nativeAdsCount: number // Number of native ad slots
  stickyBannerEnabled: boolean
  affiliateRotation: boolean
}

interface ABTestResult {
  variantId: string
  variantName: string
  config: AdDensityConfig
  confidence: number // statistical confidence (0-1)
  lift: number // % improvement over control
  recommended: boolean
}

interface AdSession {
  userId: string
  variantId: string
  pageViews: number
  downloads: number
  impressions: number
  clicks: number
  revenue: number
  startTime: number
}

// ============================================================
// PREDEFINED AD DENSITY CONFIGS
// ============================================================

const AD_PRESETS: Record<string, AdDensityConfig> = {
  control: {
    popunderFrequency: 3,
    bannerDensity: 'medium',
    interstitialOnDownload: true,
    prerollEnabled: false,
    prerollFrequency: 0,
    nativeAdsCount: 2,
    stickyBannerEnabled: true,
    affiliateRotation: true,
  },
  aggressive: {
    popunderFrequency: 2,
    bannerDensity: 'high',
    interstitialOnDownload: true,
    prerollEnabled: true,
    prerollFrequency: 2,
    nativeAdsCount: 3,
    stickyBannerEnabled: true,
    affiliateRotation: true,
  },
  premium: {
    popunderFrequency: 5,
    bannerDensity: 'low',
    interstitialOnDownload: false,
    prerollEnabled: true,
    prerollFrequency: 3,
    nativeAdsCount: 1,
    stickyBannerEnabled: false,
    affiliateRotation: true,
  },
  maximum: {
    popunderFrequency: 1,
    bannerDensity: 'aggressive',
    interstitialOnDownload: true,
    prerollEnabled: true,
    prerollFrequency: 1,
    nativeAdsCount: 4,
    stickyBannerEnabled: true,
    affiliateRotation: true,
  },
}

// ============================================================
// AD LOAD BALANCER
// ============================================================

export class AdLoadBalancer {
  private variants: AdVariant[] = []
  private sessions: Map<string, AdSession> = new Map()
  private countryMultipliers: Record<string, number> = {
    // High-value countries: show more ads
    US: 1.2, GB: 1.15, CA: 1.1, AU: 1.1, DE: 1.05, FR: 1.05, JP: 1.1,
    // Low-value countries: show fewer ads
    IN: 0.7, BD: 0.6, PK: 0.6, NG: 0.5, PH: 0.65,
  }

  async initialize(): Promise<void> {
    // Load variants from database
    const { data } = await supabase
      .from('ad_variants')
      .select('*')
      .eq('active', true)

    if (data && data.length > 0) {
      this.variants = data.map(this.mapDbToVariant)
    } else {
      // Create default variants
      this.variants = [
        {
          id: 'control',
          name: 'Control (Medium)',
          config: AD_PRESETS.control,
          trafficPercent: 34,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          ctr: 0,
          rpm: 0,
          active: true,
        },
        {
          id: 'aggressive',
          name: 'Aggressive',
          config: AD_PRESETS.aggressive,
          trafficPercent: 33,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          ctr: 0,
          rpm: 0,
          active: true,
        },
        {
          id: 'premium',
          name: 'Premium (Low Ads)',
          config: AD_PRESETS.premium,
          trafficPercent: 33,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          ctr: 0,
          rpm: 0,
          active: true,
        },
      ]
    }
  }

  // ============================================================
  // ASSIGN VARIANT TO USER
  // ============================================================

  assignVariant(userId: string, country?: string): AdDensityConfig {
    // Check if already assigned
    const existing = this.sessions.get(userId)
    if (existing) {
      const variant = this.variants.find(v => v.id === existing.variantId)
      if (variant) return this.adjustForCountry(variant.config, country)
    }

    // Weighted random selection based on traffic splits
    const random = Math.random() * 100
    let cumulative = 0

    for (const variant of this.variants) {
      cumulative += variant.trafficPercent
      if (random <= cumulative) {
        // Track assignment
        this.sessions.set(userId, {
          userId,
          variantId: variant.id,
          pageViews: 0,
          downloads: 0,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          startTime: Date.now(),
        })

        return this.adjustForCountry(variant.config, country)
      }
    }

    // Fallback to control
    return this.adjustForCountry(AD_PRESETS.control, country)
  }

  // ============================================================
  // ADJUST FOR COUNTRY VALUE
  // ============================================================

  private adjustForCountry(config: AdDensityConfig, country?: string): AdDensityConfig {
    if (!country) return config

    const multiplier = this.countryMultipliers[country] || 1.0

    // Adjust popunder frequency based on country value
    const adjustedPopunderFreq = Math.max(1, Math.round(config.popunderFrequency / multiplier))

    return {
      ...config,
      popunderFrequency: adjustedPopunderFreq,
      // Keep other settings as-is for now
    }
  }

  // ============================================================
  // SHOULD SHOW POPUNDER?
  // ============================================================

  shouldShowPopunder(userId: string): boolean {
    const session = this.sessions.get(userId)
    if (!session) return true

    const variant = this.variants.find(v => v.id === session.variantId)
    if (!variant) return true

    session.pageViews++
    return session.pageViews % variant.config.popunderFrequency === 0
  }

  // ============================================================
  // SHOULD SHOW INTERSTITIAL?
  // ============================================================

  shouldShowInterstitial(userId: string): boolean {
    const session = this.sessions.get(userId)
    if (!session) return true

    const variant = this.variants.find(v => v.id === session.variantId)
    if (!variant) return true

    return variant.config.interstitialOnDownload
  }

  // ============================================================
  // GET BANNER DENSITY
  // ============================================================

  getBannerDensity(userId: string): 'low' | 'medium' | 'high' | 'aggressive' {
    const session = this.sessions.get(userId)
    if (!session) return 'medium'

    const variant = this.variants.find(v => v.id === session.variantId)
    return variant?.config.bannerDensity || 'medium'
  }

  // ============================================================
  // SHOULD SHOW PREROLL?
  // ============================================================

  shouldShowPreroll(userId: string): boolean {
    const session = this.sessions.get(userId)
    if (!session) return false

    const variant = this.variants.find(v => v.id === session.variantId)
    if (!variant) return false

    if (!variant.config.prerollEnabled) return false

    session.downloads++
    return session.downloads % variant.config.prerollFrequency === 0
  }

  // ============================================================
  // TRACK IMPRESSION/CLICK/REVENUE
  // ============================================================

  trackImpression(userId: string, revenue = 0): void {
    const session = this.sessions.get(userId)
    if (session) {
      session.impressions++
      session.revenue += revenue
    }
  }

  trackClick(userId: string, revenue = 0): void {
    const session = this.sessions.get(userId)
    if (session) {
      session.clicks++
      session.revenue += revenue
    }
  }

  // ============================================================
  // GET A/B TEST RESULTS
  // ============================================================

  async getABTestResults(): Promise<ABTestResult[]> {
    const results: ABTestResult[] = []

    for (const variant of this.variants) {
      const control = this.variants.find(v => v.id === 'control')
      const controlRpm = control?.rpm || 0
      const lift = controlRpm > 0 ? ((variant.rpm - controlRpm) / controlRpm) * 100 : 0

      // Simple confidence calculation (in production, use proper stats)
      const confidence = variant.impressions > 1000 ? Math.min(0.95, variant.impressions / 10000) : 0

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        config: variant.config,
        confidence,
        lift,
        recommended: variant.id !== 'control' && lift > 5 && confidence > 0.8,
      })
    }

    return results.sort((a, b) => b.lift - a.lift)
  }

  // ============================================================
  // UPDATE VARIANT STATS
  // ============================================================

  async updateVariantStats(): Promise<void> {
    for (const variant of this.variants) {
      // Calculate RPM
      variant.rpm = variant.impressions > 0
        ? (variant.revenue / variant.impressions) * 1000
        : 0

      // Calculate CTR
      variant.ctr = variant.impressions > 0
        ? (variant.clicks / variant.impressions) * 100
        : 0

      // Persist to database
      await supabase
        .from('ad_variants')
        .update({
          impressions: variant.impressions,
          clicks: variant.clicks,
          revenue: variant.revenue,
          ctr: variant.ctr,
          rpm: variant.rpm,
        })
        .eq('id', variant.id)
        .then(() => {})
        .catch(() => {})
    }
  }

  private mapDbToVariant(db: any): AdVariant {
    return {
      id: db.id,
      name: db.name,
      config: db.config || AD_PRESETS.control,
      trafficPercent: db.traffic_percent || 33,
      impressions: db.impressions || 0,
      clicks: db.clicks || 0,
      revenue: db.revenue || 0,
      ctr: db.ctr || 0,
      rpm: db.rpm || 0,
      active: db.active !== false,
    }
  }
}

// Singleton
export const adBalancer = new AdLoadBalancer()
