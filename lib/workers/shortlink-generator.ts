// ============================================================
// SHORTLINK GENERATOR
// Injects affiliate links before redirecting to file hosts
// ============================================================

import { supabase } from '../supabase'
import axios from 'axios'

// ============================================================
// TYPES
// ============================================================

interface ShortlinkResult {
  success: boolean
  shortUrl: string
  originalUrl: string
  affiliateUrl: string
  provider: string
  error?: string
}

interface AffiliateConfig {
  id: number
  name: string
  url: string
  network: string
  category: string
  commissionType: string
  commissionRate: number
  clicks: number
  conversions: number
  earnings: number
  active: boolean
}

// ============================================================
// AFFILIATE LINK MANAGER
// ============================================================

export async function getActiveAffiliates(category?: string): Promise<AffiliateConfig[]> {
  let query = supabase
    .from('affiliate_links')
    .select('*')
    .eq('active', true)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('clicks', { ascending: false })

  if (error) return []
  return data || []
}

export async function trackAffiliateClick(affiliateId: number): Promise<void> {
  await supabase.rpc('increment_affiliate_clicks', { affiliate_id: affiliateId })
}

export async function trackAffiliateConversion(affiliateId: number, earnings: number): Promise<void> {
  // Increment conversions and earnings via raw query since RPC isn't defined yet
  await supabase
    .from('affiliate_links')
    .select('conversions, earnings')
    .eq('id', affiliateId)
    .single()
    .then(async ({ data }) => {
      if (data) {
        await supabase
          .from('affiliate_links')
          .update({
            conversions: (data.conversions || 0) + 1,
            earnings: (data.earnings || 0) + earnings,
          })
          .eq('id', affiliateId)
      }
    })
}

// ============================================================
// LINK SHORTENING SERVICES
// ============================================================

const GP_LINKS_API = process.env.GP_LINKS_API_TOKEN || ''
const V2_LINKS_API = process.env.V2_LINKS_API_TOKEN || ''
const SHORTENER_API = process.env.SHORTENER_API_URL || ''

async function shortenWithGPLinks(url: string, alias?: string): Promise<ShortlinkResult> {
  if (!GP_LINKS_API) {
    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'gplinks', error: 'API not configured' }
  }

  try {
    const params = new URLSearchParams({
      api: GP_LINKS_API,
      url,
      format: 'json',
    })
    if (alias) params.append('alias', alias)

    const response = await axios.get(`https://api.gplinks.com/api?${params.toString()}`, { timeout: 10000 })
    const data = response.data

    if (data.status === 'success' && data.shortenedUrl) {
      return {
        success: true,
        shortUrl: data.shortenedUrl,
        originalUrl: url,
        affiliateUrl: data.shortenedUrl,
        provider: 'gplinks',
      }
    }

    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'gplinks', error: 'Invalid response' }
  } catch (error: any) {
    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'gplinks', error: error.message }
  }
}

async function shortenWithV2Links(url: string, alias?: string): Promise<ShortlinkResult> {
  if (!V2_LINKS_API) {
    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'v2links', error: 'API not configured' }
  }

  try {
    const params = new URLSearchParams({
      api: V2_LINKS_API,
      url,
      format: 'json',
    })
    if (alias) params.append('alias', alias)

    const response = await axios.get(`https://v2links.com/api?${params.toString()}`, { timeout: 10000 })
    const data = response.data

    if (data.status === 'success' && data.shortenedUrl) {
      return {
        success: true,
        shortUrl: data.shortenedUrl,
        originalUrl: url,
        affiliateUrl: data.shortenedUrl,
        provider: 'v2links',
      }
    }

    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'v2links', error: 'Invalid response' }
  } catch (error: any) {
    return { success: false, shortUrl: '', originalUrl: url, affiliateUrl: '', provider: 'v2links', error: error.message }
  }
}

// ============================================================
// AFFILIATE LINK INJECTION
// ============================================================

export async function injectAffiliateLink(
  url: string,
  gameId: number,
  mirrorId: number,
  geo?: string
): Promise<ShortlinkResult> {
  // Get relevant affiliates based on category
  const affiliates = await getActiveAffiliates('download')

  if (affiliates.length === 0) {
    // No affiliates configured, use shortener directly
    return await shortenWithShortener(url, gameId, mirrorId)
  }

  // Select affiliate based on geo and performance
  const selectedAffiliate = selectBestAffiliate(affiliates, geo)

  if (selectedAffiliate) {
    // Track click
    await trackAffiliateClick(selectedAffiliate.id)

    // Create redirect URL with affiliate
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/go/${Buffer.from(JSON.stringify({
      url,
      affiliate: selectedAffiliate.id,
      game: gameId,
      mirror: mirrorId,
    })).toString('base64')}`

    return {
      success: true,
      shortUrl: redirectUrl,
      originalUrl: url,
      affiliateUrl: selectedAffiliate.url,
      provider: 'affiliate',
    }
  }

  return await shortenWithShortener(url, gameId, mirrorId)
}

async function shortenWithShortener(
  url: string,
  gameId: number,
  mirrorId: number
): Promise<ShortlinkResult> {
  // Try GP Links first, then V2Links
  const alias = `game${gameId}_m${mirrorId}_${Date.now().toString(36)}`

  let result = await shortenWithGPLinks(url, alias)
  if (result.success) return result

  result = await shortenWithV2Links(url, alias)
  if (result.success) return result

  // Fallback: return original URL
  return {
    success: true,
    shortUrl: url,
    originalUrl: url,
    affiliateUrl: url,
    provider: 'direct',
  }
}

function selectBestAffiliate(affiliates: AffiliateConfig[], geo?: string): AffiliateConfig | null {
  if (affiliates.length === 0) return null

  // Score each affiliate
  const scored = affiliates.map(aff => {
    let score = 50 // Base score

    // Higher commission = higher score
    score += aff.commissionRate * 0.5

    // More clicks = more proven = higher score
    if (aff.clicks > 100) score += 20
    else if (aff.clicks > 50) score += 10

    // Higher conversion rate = higher score
    if (aff.clicks > 0) {
      const conversionRate = (aff.conversions / aff.clicks) * 100
      score += conversionRate * 2
    }

    return { affiliate: aff, score }
  })

  // Sort by score
  scored.sort((a, b) => b.score - a.score)

  return scored[0]?.affiliate || null
}

// ============================================================
// REDIRECT HANDLER (for /go/ routes)
// ============================================================

export async function handleRedirect(token: string): Promise<string | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    const { url, affiliate, game, mirror } = decoded

    // Validate
    if (!url) return null

    // Track the click
    if (affiliate) {
      await trackAffiliateClick(affiliate)
    }

    // Track mirror click
    if (mirror) {
      await supabase.rpc('increment_mirror_clicks', { mirror_id: mirror })
    }

    // Track download
    if (game) {
      await supabase.rpc('increment_downloads', { game_id: game })
    }

    // Get affiliate URL if available
    if (affiliate) {
      const { data: aff } = await supabase
        .from('affiliate_links')
        .select('url')
        .eq('id', affiliate)
        .single()

      if (aff?.url) {
        // Show affiliate page before redirect
        return `${process.env.NEXT_PUBLIC_SITE_URL}/download/interstitial?url=${encodeURIComponent(url)}&affiliate=${encodeURIComponent(aff.url)}`
      }
    }

    // Direct redirect
    return url
  } catch {
    return null
  }
}
