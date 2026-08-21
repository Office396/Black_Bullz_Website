// ============================================================
// PRE-ROLL VIDEO AD SYSTEM
// "Watch 15s Video to Skip All Ads" - Higher RPM than banners
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface VideoAdConfig {
  id: number
  name: string
  videoUrl: string
  duration: number // seconds
  clickThroughUrl: string
  impressions: number
  completions: number
  revenue: number
  active: boolean
  priority: number
  targetCountries: string[] // Empty = all countries
  minSessionDuration: number // Minimum seconds on site before showing
}

interface PrerollResult {
  showPreroll: boolean
  ad?: VideoAdConfig
  skipAfter: number // seconds before skip button appears
  reward?: {
    adFreeMinutes: number
    bonusDownloads: number
  }
}

interface PrerollStats {
  totalImpressions: number
  totalCompletions: number
  completionRate: number
  totalRevenue: number
  avgRevenuePerImpression: number
  topPerformingAds: VideoAdConfig[]
}

// ============================================================
// CONFIGURATION
// ============================================================

const PREROLL_CONFIG = {
  // Show preroll after X page views in session
  showAfterPageViews: 2,

  // Minimum session duration before showing (seconds)
  minSessionDuration: 10,

  // Skip button appears after X seconds
  skipAfterSeconds: 5,

  // Total video duration
  videoDuration: 15,

  // Reward for watching full video
  reward: {
    adFreeMinutes: 30, // 30 minutes ad-free browsing
    bonusDownloads: 0,
  },

  // Max prerolls per session
  maxPerSession: 3,

  // Cooldown between prerolls (seconds)
  cooldownSeconds: 600, // 10 minutes

  // High-value countries (show more ads)
  highValueCountries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'],

  // Low-value countries (show fewer ads)
  lowValueCountries: ['IN', 'BD', 'PK', 'NG', 'PH'],
}

// ============================================================
// VIDEO AD MANAGER
// ============================================================

export class PrerollVideoManager {
  private sessionPageViews = 0
  private sessionStart = Date.now()
  private lastPrerollTime = 0
  private prerollsShown = 0
  private userCountry = ''

  constructor(country?: string) {
    this.userCountry = country || ''
  }

  // ============================================================
  // SHOULD SHOW PREROLL?
  // ============================================================

  shouldShowPreroll(): PrerollResult {
    // Check session limits
    if (this.prerollsShown >= PREROLL_CONFIG.maxPerSession) {
      return { showPreroll: false }
    }

    // Check cooldown
    const timeSinceLastPreroll = (Date.now() - this.lastPrerollTime) / 1000
    if (this.lastPrerollTime > 0 && timeSinceLastPreroll < PREROLL_CONFIG.cooldownSeconds) {
      return { showPreroll: false }
    }

    // Check minimum session duration
    const sessionDuration = (Date.now() - this.sessionStart) / 1000
    if (sessionDuration < PREROLL_CONFIG.minSessionDuration) {
      return { showPreroll: false }
    }

    // Check page view threshold
    this.sessionPageViews++
    if (this.sessionPageViews < PREROLL_CONFIG.showAfterPageViews) {
      return { showPreroll: false }
    }

    // Check if user has ad-free reward active
    if (this.hasAdFreeReward()) {
      return { showPreroll: false }
    }

    // Determine if we should show based on country
    const shouldShow = this.shouldShowForCountry()
    if (!shouldShow) {
      return { showPreroll: false }
    }

    // Pick the best ad
    return {
      showPreroll: true,
      skipAfter: PREROLL_CONFIG.skipAfterSeconds,
      reward: PREROLL_CONFIG.reward,
    }
  }

  // ============================================================
  // COUNTRY-BASED DECISION
  // ============================================================

  private shouldShowForCountry(): boolean {
    if (!this.userCountry) return true // Unknown = show

    // Always show in high-value countries
    if (PREROLL_CONFIG.highValueCountries.includes(this.userCountry)) {
      return true
    }

    // Show less in low-value countries (every 3rd page view instead of every 2nd)
    if (PREROLL_CONFIG.lowValueCountries.includes(this.userCountry)) {
      return this.sessionPageViews % 3 === 0
    }

    return true
  }

  // ============================================================
  // AD-FREE REWARD
  // ============================================================

  private hasAdFreeReward(): boolean {
    if (typeof window === 'undefined') return false
    const rewardExpiry = localStorage.getItem('ad_free_reward_expiry')
    if (!rewardExpiry) return false
    return Date.now() < parseInt(rewardExpiry)
  }

  activateAdFreeReward(minutes: number): void {
    if (typeof window === 'undefined') return
    const expiry = Date.now() + minutes * 60 * 1000
    localStorage.setItem('ad_free_reward_expiry', expiry.toString())
  }

  // ============================================================
  // TRACK IMPRESSION
  // ============================================================

  async trackImpression(adId: number): Promise<void> {
    this.lastPrerollTime = Date.now()
    this.prerollsShown++

    await supabase
      .from('video_ad_impressions')
      .insert({
        ad_id: adId,
        country: this.userCountry,
        session_duration: (Date.now() - this.sessionStart) / 1000,
        page_views: this.sessionPageViews,
      })
      .then(() => {})
      .catch(() => {})
  }

  // ============================================================
  // TRACK COMPLETION (watched full video)
  // ============================================================

  async trackCompletion(adId: number): Promise<void> {
    // Activate ad-free reward
    this.activateAdFreeReward(PREROLL_CONFIG.reward.adFreeMinutes)

    await supabase
      .from('video_ad_completions')
      .insert({
        ad_id: adId,
        country: this.userCountry,
        reward_minutes: PREROLL_CONFIG.reward.adFreeMinutes,
      })
      .then(() => {})
      .catch(() => {})
  }

  // ============================================================
  // TRACK SKIP
  // ============================================================

  async trackSkip(adId: number, watchedSeconds: number): Promise<void> {
    await supabase
      .from('video_ad_skips')
      .insert({
        ad_id: adId,
        watched_seconds: watchedSeconds,
        country: this.userCountry,
      })
      .then(() => {})
      .catch(() => {})
  }
}

// ============================================================
// GET AVAILABLE PREROLL ADS
// ============================================================

export async function getAvailablePrerollAds(country?: string): Promise<VideoAdConfig[]> {
  let query = supabase
    .from('video_ads')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false })

  const { data, error } = await query

  if (error) return []

  // Filter by country targeting
  return (data || []).filter(ad => {
    if (!ad.target_countries || ad.target_countries.length === 0) return true
    if (!country) return true
    return ad.target_countries.includes(country)
  })
}

// ============================================================
// GET PREROLL STATS
// ============================================================

export async function getPrerollStats(): Promise<PrerollStats> {
  const { data: impressions } = await supabase
    .from('video_ad_impressions')
    .select('id, ad_id, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())

  const { data: completions } = await supabase
    .from('video_ad_completions')
    .select('id, ad_id, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())

  const { data: ads } = await supabase
    .from('video_ads')
    .select('*')
    .eq('active', true)

  const totalImpressions = impressions?.length || 0
  const totalCompletions = completions?.length || 0
  const completionRate = totalImpressions > 0 ? (totalCompletions / totalImpressions) * 100 : 0

  // Calculate revenue (estimate: $0.01-0.05 per completion)
  const totalRevenue = totalCompletions * 0.03 // Average $0.03 per completion
  const avgRevenuePerImpression = totalImpressions > 0 ? totalRevenue / totalImpressions : 0

  return {
    totalImpressions,
    totalCompletions,
    completionRate,
    totalRevenue,
    avgRevenuePerImpression,
    topPerformingAds: (ads || []).slice(0, 5),
  }
}
