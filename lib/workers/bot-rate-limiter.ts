// ============================================================
// BOT TRAFFIC RATE LIMITER
// Strict limits for non-browser user agents
// Prevents scraping and bandwidth abuse
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// CONFIGURATION
// ============================================================

const BOT_CONFIG = {
  // Rate limits per IP per minute
  limits: {
    browser: 120,    // Normal browsers
    bot: 5,          // Known bots (Googlebot, Bingbot)
    scraper: 0,      // Known scrapers - BLOCKED
    unknown: 20,     // Unknown user agents
  },

  // Known bot patterns (allow some access for SEO)
  allowedBots: [
    { pattern: /googlebot/i, limit: 30 },
    { pattern: /bingbot/i, limit: 20 },
    { pattern: /slurp/i, limit: 20 }, // Yahoo
    { pattern: /duckduckbot/i, limit: 15 },
    { pattern: /baiduspider/i, limit: 10 },
    { pattern: /yandexbot/i, limit: 10 },
  ],

  // Blocked patterns (scrapers, harvesters)
  blockedPatterns: [
    /scrapy/i,
    /httrack/i,
    /wget/i,
    /curl(?!\.haxx)/i, // Allow curl.haxx
    /python-requests/i,
    /go-http-client/i,
    /java\//i,
    /perl/i,
    /ruby/i,
    /php\//i,
    /node\.js/i,
    /fetcher/i,
    /harvest/i,
    /spider(?!\.)/i, // Allow Bing spider
    /crawl(?!bot)/i, // Allow crawlbot
  ],

  // Whitelist (bypass all limits)
  whitelistedIps: ['127.0.0.1', '::1'],

  // Enable/disable
  enabled: process.env.BOT_RATE_LIMIT_ENABLED !== 'false',
}

// ============================================================
// RATE LIMIT STORE (in-memory, per-server)
// ============================================================

interface RateLimitEntry {
  count: number
  resetAt: number
  category: 'browser' | 'bot' | 'scraper' | 'unknown'
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

// ============================================================
// USER AGENT CLASSIFICATION
// ============================================================

function classifyUserAgent(ua: string): 'browser' | 'bot' | 'scraper' | 'unknown' {
  if (!ua) return 'unknown'

  // Check blocked patterns first
  for (const pattern of BOT_CONFIG.blockedPatterns) {
    if (pattern.test(ua)) return 'scraper'
  }

  // Check allowed bots
  for (const bot of BOT_CONFIG.allowedBots) {
    if (bot.pattern.test(ua)) return 'bot'
  }

  // Check for browser patterns
  const browserPatterns = [
    /chrome/i, /firefox/i, /safari/i, /edge/i, /opera/i,
    /msie/i, /trident/i, /applewebkit/i,
  ]

  for (const pattern of browserPatterns) {
    if (pattern.test(ua)) return 'browser'
  }

  return 'unknown'
}

// ============================================================
// GET RATE LIMIT FOR USER AGENT
// ============================================================

function getLimitForCategory(category: 'browser' | 'bot' | 'scraper' | 'unknown'): number {
  return BOT_CONFIG.limits[category]
}

// ============================================================
// CHECK RATE LIMIT
// ============================================================

export function checkBotRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  resetAt: number
  category: string
} {
  if (!BOT_CONFIG.enabled) {
    return { allowed: true, remaining: 999, resetAt: 0, category: 'disabled' }
  }

  const ip = getClientIP(request)
  const ua = request.headers.get('user-agent') || ''

  // Whitelist check
  if (BOT_CONFIG.whitelistedIps.includes(ip)) {
    return { allowed: true, remaining: 999, resetAt: 0, category: 'whitelisted' }
  }

  const category = classifyUserAgent(ua)
  const limit = getLimitForCategory(category)

  // Scrapers are blocked entirely
  if (category === 'scraper') {
    return { allowed: false, remaining: 0, resetAt: Date.now() + 3600000, category }
  }

  // No limit set = blocked
  if (limit === 0) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + 3600000, category }
  }

  const key = `ratelimit:${ip}:${category}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    entry = { count: 1, resetAt: now + windowMs, category }
    rateLimitStore.set(key, entry)
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt, category }
  }

  // Increment count
  entry.count++

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, category }
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt, category }
}

// ============================================================
// CREATE RATE LIMIT RESPONSE
// ============================================================

export function createRateLimitResponse(result: { resetAt: number; category: string }): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)

  if (result.category === 'scraper') {
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '3600',
        },
      }
    )
  }

  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter,
      category: result.category,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Category': result.category,
      },
    }
  )
}

// ============================================================
// HELPER
// ============================================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'
}

// ============================================================
// GET STATS
// ============================================================

export function getRateLimitStats(): {
  totalTracked: number
  byCategory: Record<string, number>
  blockedRequests: number
} {
  const byCategory: Record<string, number> = {}
  let blockedRequests = 0

  for (const [, entry] of rateLimitStore) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + entry.count
    if (entry.category === 'scraper') {
      blockedRequests += entry.count
    }
  }

  return {
    totalTracked: rateLimitStore.size,
    byCategory,
    blockedRequests,
  }
}
