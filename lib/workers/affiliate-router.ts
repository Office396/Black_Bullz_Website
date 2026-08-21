// ============================================================
// AFFILIATE LINK ROUTER
// Region-aware dynamic affiliate selection
// Show the highest-paying affiliate per user's country
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface AffiliateLink {
  id: number
  name: string
  url: string
  network: string
  category: string
  commissionType: string
  commissionRate: number
  active: boolean
  priority: number
}

interface RegionConfig {
  country: string
  preferredNetworks: string[]
  fallbackNetworks: string[]
  currency: string
  paymentMethods: string[]
}

interface SmartAffiliateResult {
  url: string
  name: string
  network: string
  commission: number
  reason: string
}

// ============================================================
// REGION CONFIGURATIONS
// ============================================================

const REGION_CONFIGS: Record<string, RegionConfig> = {
  // North America
  US: { country: 'US', preferredNetworks: ['amazon_us', 'newegg', 'bestbuy'], fallbackNetworks: ['clickbank', 'cj'], currency: 'USD', paymentMethods: ['credit_card', 'paypal'] },
  CA: { country: 'CA', preferredNetworks: ['amazon_ca', 'newegg_ca'], fallbackNetworks: ['clickbank'], currency: 'CAD', paymentMethods: ['credit_card', 'paypal'] },
  MX: { country: 'MX', preferredNetworks: ['amazon_mx', 'mercadolibre'], fallbackNetworks: ['clickbank'], currency: 'MXN', paymentMethods: ['credit_card', 'oxxo'] },

  // Europe
  GB: { country: 'GB', preferredNetworks: ['amazon_uk', 'scan_co_uk', 'overclockers_uk'], fallbackNetworks: ['clickbank', 'cj'], currency: 'GBP', paymentMethods: ['credit_card', 'paypal'] },
  DE: { country: 'DE', preferredNetworks: ['amazon_de', 'alternate_de', 'mindfactory'], fallbackNetworks: ['cj'], currency: 'EUR', paymentMethods: ['credit_card', 'paypal', 'sofort'] },
  FR: { country: 'FR', preferredNetworks: ['amazon_fr', 'ldlc', 'cdiscount'], fallbackNetworks: ['cj'], currency: 'EUR', paymentMethods: ['credit_card', 'paypal'] },
  IT: { country: 'IT', preferredNetworks: ['amazon_it', 'unieuro'], fallbackNetworks: ['cj'], currency: 'EUR', paymentMethods: ['credit_card', 'paypal'] },
  ES: { country: 'ES', preferredNetworks: ['amazon_es', 'pccomponentes'], fallbackNetworks: ['cj'], currency: 'EUR', paymentMethods: ['credit_card', 'paypal'] },
  NL: { country: 'NL', preferredNetworks: ['amazon_nl', 'coolblue'], fallbackNetworks: ['cj'], currency: 'EUR', paymentMethods: ['credit_card', 'paypal', 'ideal'] },
  PL: { country: 'PL', preferredNetworks: ['amazon_pl', 'morele', 'komputronik'], fallbackNetworks: ['cj'], currency: 'PLN', paymentMethods: ['credit_card', 'blik'] },
  SE: { country: 'SE', preferredNetworks: ['amazon_se', 'inet'], fallbackNetworks: ['cj'], currency: 'SEK', paymentMethods: ['credit_card', 'klarna'] },

  // Asia Pacific
  JP: { country: 'JP', preferredNetworks: ['amazon_jp', 'rakuten', 'yodobashi'], fallbackNetworks: ['cj'], currency: 'JPY', paymentMethods: ['credit_card', 'konbini'] },
  KR: { country: 'KR', preferredNetworks: ['coupang', '11st', 'gmarket'], fallbackNetworks: ['cj'], currency: 'KRW', paymentMethods: ['credit_card', 'kakao_pay'] },
  IN: { country: 'IN', preferredNetworks: ['amazon_in', 'flipkart', 'croma'], fallbackNetworks: ['vcommission', 'instamojo'], currency: 'INR', paymentMethods: ['upi', 'paytm', 'credit_card'] },
  AU: { country: 'AU', preferredNetworks: ['amazon_au', 'pccasegear', 'umart'], fallbackNetworks: ['clickbank', 'cj'], currency: 'AUD', paymentMethods: ['credit_card', 'paypal'] },
  SG: { country: 'SG', preferredNetworks: ['amazon_sg', 'lazada', 'shopee'], fallbackNetworks: ['cj'], currency: 'SGD', paymentMethods: ['credit_card', 'grab_pay'] },

  // South America
  BR: { country: 'BR', preferredNetworks: ['amazon_br', 'mercadolivre', 'kabum'], fallbackNetworks: ['hotmart', 'monetizze'], currency: 'BRL', paymentMethods: ['pix', 'boleto', 'credit_card'] },
  AR: { country: 'AR', preferredNetworks: ['mercadolibre_ar', 'compugarden'], fallbackNetworks: ['hotmart'], currency: 'ARS', paymentMethods: ['credit_card', 'rapipago'] },

  // Africa
  NG: { country: 'NG', preferredNetworks: ['jumia', 'konga'], fallbackNetworks: ['paystack', 'flutterwave'], currency: 'NGN', paymentMethods: ['mobile_money', 'bank_transfer'] },
  ZA: { country: 'ZA', preferredNetworks: ['takealot', 'amazon_za'], fallbackNetworks: ['paygate'], currency: 'ZAR', paymentMethods: ['credit_card', 'eft'] },

  // Middle East
  AE: { country: 'AE', preferredNetworks: ['amazon_ae', 'noon', 'jumbo'], fallbackNetworks: ['cj'], currency: 'AED', paymentMethods: ['credit_card', 'cash_on_delivery'] },
  SA: { country: 'SA', preferredNetworks: ['amazon_sa', 'noon_sa', 'extra'], fallbackNetworks: ['cj'], currency: 'SAR', paymentMethods: ['credit_card', 'mada'] },
}

// ============================================================
// AFFILIATE ROUTER
// ============================================================

export class AffiliateRouter {
  private linkCache: Map<string, AffiliateLink[]> = new Map()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private lastCacheUpdate = 0

  // ============================================================
  // GET BEST AFFILIATE FOR USER
  // ============================================================

  async getBestAffiliate(
    category: string,
    userCountry: string,
    userCity?: string
  ): Promise<SmartAffiliateResult> {
    // Get region config
    const regionConfig = REGION_CONFIGS[userCountry] || {
      country: userCountry || 'US',
      preferredNetworks: ['amazon', 'clickbank'],
      fallbackNetworks: ['cj'],
      currency: 'USD',
      paymentMethods: ['credit_card'],
    }

    // Get all active affiliate links for this category
    const links = await this.getAffiliateLinks(category)

    if (links.length === 0) {
      return {
        url: '#',
        name: 'No affiliate available',
        network: 'none',
        commission: 0,
        reason: 'No active affiliate links for this category',
      }
    }

    // Score each link
    const scoredLinks = links.map(link => {
      let score = 0
      let reason = ''

      // Network preference (highest weight)
      if (regionConfig.preferredNetworks.some(n => link.network.toLowerCase().includes(n))) {
        score += 100
        reason = 'Preferred network for region'
      } else if (regionConfig.fallbackNetworks.some(n => link.network.toLowerCase().includes(n))) {
        score += 50
        reason = 'Fallback network for region'
      } else {
        score += 10
        reason = 'Generic network'
      }

      // Commission rate
      score += link.commissionRate * 2

      // Priority
      score += link.priority

      return { link, score, reason }
    })

    // Sort by score
    scoredLinks.sort((a, b) => b.score - a.score)

    const best = scoredLinks[0]

    return {
      url: best.link.url,
      name: best.link.name,
      network: best.link.network,
      commission: best.link.commissionRate,
      reason: best.reason,
    }
  }

  // ============================================================
  // GET BEST AFFILIATE URL (simple version)
  // ============================================================

  async getBestAffiliateUrl(category: string, country: string): Promise<string> {
    const result = await this.getBestAffiliate(category, country)
    return result.url
  }

  // ============================================================
  // GET AFFILIATE LINKS (with cache)
  // ============================================================

  private async getAffiliateLinks(category: string): Promise<AffiliateLink[]> {
    const cacheKey = `affiliate_${category}`

    // Check cache
    if (this.linkCache.has(cacheKey) && Date.now() - this.lastCacheUpdate < this.cacheExpiry) {
      return this.linkCache.get(cacheKey)!
    }

    // Fetch from database
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('active', true)
      .eq('category', category)
      .order('priority', { ascending: false })

    const links = (data || []) as AffiliateLink[]

    // Cache
    this.linkCache.set(cacheKey, links)
    this.lastCacheUpdate = Date.now()

    return links
  }

  // ============================================================
  // ROTATE AFFILIATE LINKS
  // A/B test different affiliates
  // ============================================================

  async rotateAffiliate(
    category: string,
    country: string,
    sessionId: string
  ): Promise<SmartAffiliateResult> {
    const links = await this.getAffiliateLinks(category)
    if (links.length === 0) {
      return {
        url: '#',
        name: 'No affiliate available',
        network: 'none',
        commission: 0,
        reason: 'No active links',
      }
    }

    // Hash session ID for consistent assignment
    let hash = 0
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash) + sessionId.charCodeAt(i)
      hash |= 0
    }
    const index = Math.abs(hash) % links.length

    const selected = links[index]

    return {
      url: selected.url,
      name: selected.name,
      network: selected.network,
      commission: selected.commissionRate,
      reason: `Rotated selection (session ${sessionId.slice(-4)})`,
    }
  }

  // ============================================================
  // TRACK AFFILIATE CLICK
  // ============================================================

  async trackClick(affiliateId: number, country: string, revenue = 0): Promise<void> {
    await supabase
      .from('affiliate_links')
      .select('clicks, earnings')
      .eq('id', affiliateId)
      .single()
      .then(async ({ data }) => {
        if (data) {
          await supabase
            .from('affiliate_links')
            .update({
              clicks: (data.clicks || 0) + 1,
              earnings: (data.earnings || 0) + revenue,
            })
            .eq('id', affiliateId)
        }
      })
      .catch(() => {})

    // Log for analytics
    await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliateId,
        country,
        revenue,
        created_at: new Date().toISOString(),
      })
      .then(() => {})
      .catch(() => {})
  }

  // ============================================================
  // GET AFFILIATE STATS
  // ============================================================

  async getAffiliateStats(): Promise<{
    totalLinks: number
    activeLinks: number
    totalClicks: number
    totalRevenue: number
    topPerformers: Array<{ name: string; network: string; clicks: number; revenue: number }>
    byCountry: Record<string, number>
  }> {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('*')

    const allLinks = links || []
    const totalClicks = allLinks.reduce((sum, l) => sum + (l.clicks || 0), 0)
    const totalRevenue = allLinks.reduce((sum, l) => sum + (l.earnings || 0), 0)

    const topPerformers = allLinks
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10)
      .map(l => ({
        name: l.name,
        network: l.network,
        clicks: l.clicks || 0,
        revenue: l.earnings || 0,
      }))

    // Get clicks by country
    const { data: clicks } = await supabase
      .from('affiliate_clicks')
      .select('country')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())

    const byCountry: Record<string, number> = {}
    for (const c of clicks || []) {
      byCountry[c.country] = (byCountry[c.country] || 0) + 1
    }

    return {
      totalLinks: allLinks.length,
      activeLinks: allLinks.filter(l => l.active).length,
      totalClicks,
      totalRevenue,
      topPerformers,
      byCountry,
    }
  }

  // ============================================================
  // GET REGION INFO
  // ============================================================

  getRegionConfig(country: string): RegionConfig {
    return REGION_CONFIGS[country] || {
      country,
      preferredNetworks: ['amazon'],
      fallbackNetworks: ['clickbank', 'cj'],
      currency: 'USD',
      paymentMethods: ['credit_card'],
    }
  }

  // ============================================================
  // CLEAR CACHE
  // ============================================================

  clearCache(): void {
    this.linkCache.clear()
    this.lastCacheUpdate = 0
  }
}

// Singleton
export const affiliateRouter = new AffiliateRouter()
