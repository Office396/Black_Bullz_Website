// ============================================================
// CAPTCHA BYPASS LOGIC
// Auto-whitelist reputable users, serve captcha to bots
// ============================================================

import { NextRequest } from 'next/server'
import { supabase } from '../supabase'

// ============================================================
// CONFIGURATION
// ============================================================

const CAPTCHA_CONFIG = {
  // Enable/disable captcha
  enabled: true,

  // Thresholds
  requestsPerMinute: 30, // Show captcha after this many requests
  requestsPerHour: 200,

  // Whitelist conditions
  autoWhitelist: {
    minAccountAge: 7, // days
    minDownloads: 5,
    hasPremium: true,
  },

  // Known bot user agents
  botPatterns: [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
  ],
}

// ============================================================
// CHECK IF CAPTCHA IS NEEDED
// ============================================================

export async function needsCaptcha(request: NextRequest): Promise<{
  needed: boolean
  reason: string
  turnstileSiteKey?: string
}> {
  if (!CAPTCHA_CONFIG.enabled) {
    return { needed: false, reason: '' }
  }

  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''

  // Check if bot
  if (isBot(userAgent)) {
    return { needed: true, reason: 'bot_detected' }
  }

  // Check if whitelisted
  if (await isWhitelisted(ip, request)) {
    return { needed: false, reason: 'whitelisted' }
  }

  // Check rate limits
  const rateLimitResult = await checkRateLimit(ip)
  if (rateLimitResult.exceeded) {
    return {
      needed: true,
      reason: `Rate limit exceeded: ${rateLimitResult.count} requests in ${rateLimitResult.window}`,
    }
  }

  return { needed: false, reason: '' }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'
}

function isBot(userAgent: string): boolean {
  return CAPTCHA_CONFIG.botPatterns.some(pattern => pattern.test(userAgent))
}

async function isWhitelisted(ip: string, request: NextRequest): Promise<boolean> {
  // Check if user has premium account
  const userId = request.cookies.get('user_id')?.value
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('is_premium, created_at, total_downloads')
      .eq('id', parseInt(userId))
      .single()

    if (user) {
      // Premium users are whitelisted
      if (user.is_premium) return true

      // Check account age
      const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (accountAge >= CAPTCHA_CONFIG.autoWhitelist.minAccountAge) return true

      // Check download count
      if (user.total_downloads >= CAPTCHA_CONFIG.autoWhitelist.minDownloads) return true
    }
  }

  // Check IP whitelist in database
  const { data: whitelist } = await supabase
    .from('ip_whitelist')
    .select('ip')
    .eq('ip', ip)
    .single()

  return !!whitelist
}

async function checkRateLimit(ip: string): Promise<{
  exceeded: boolean
  count: number
  window: string
}> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Check requests in last minute
  const { count: minuteCount } = await supabase
    .from('request_logs')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', oneMinuteAgo)

  if ((minuteCount || 0) >= CAPTCHA_CONFIG.requestsPerMinute) {
    return { exceeded: true, count: minuteCount || 0, window: 'minute' }
  }

  // Check requests in last hour
  const { count: hourCount } = await supabase
    .from('request_logs')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', oneHourAgo)

  if ((hourCount || 0) >= CAPTCHA_CONFIG.requestsPerHour) {
    return { exceeded: true, count: hourCount || 0, window: 'hour' }
  }

  return { exceeded: false, count: 0, window: '' }
}

// ============================================================
// LOG REQUEST (for rate limiting)
// ============================================================

export async function logRequest(ip: string, path: string): Promise<void> {
  await supabase.from('request_logs').insert({
    ip,
    path,
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {}) // Ignore errors
}

// ============================================================
// VERIFY TURNSTILE CAPTCHA
// ============================================================

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) return true // Skip verification if not configured

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}&remoteip=${ip}`,
    })

    const data = await response.json()
    return data.success === true
  } catch {
    return false
  }
}

// ============================================================
// CLEAN OLD REQUEST LOGS (Run periodically)
// ============================================================

export async function cleanOldLogs(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('request_logs')
    .delete()
    .lt('created_at', oneDayAgo)

  return count || 0
}
