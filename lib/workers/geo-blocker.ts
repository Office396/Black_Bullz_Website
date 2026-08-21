// ============================================================
// BANNED IP/REGION BLOCKER
// Geo-block countries with low ad payouts or legal risk
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// CONFIGURATION
// ============================================================

const BLOCKED_CONFIG = {
  // Countries with high legal risk (DMCA/copyright enforcement)
  highRisk: ['DE', 'JP', 'AU', 'NZ', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'AT', 'CH', 'BE'],

  // Countries with very low ad payouts (not worth serving)
  lowValue: ['IN', 'BD', 'PK', 'NG', 'KE', 'PH', 'ID', 'VN', 'TH', 'EG', 'GH', 'TZ', 'UG', 'ET'],

  // VPN/Proxy detection - optional stricter blocking
  blockVpn: false,

  // Custom blocked IPs (for abuse)
  blockedIps: [] as string[],

  // Whitelist (always allow)
  whitelistedIps: ['127.0.0.1', '::1'],
}

// ============================================================
// GEOIP LOOKUP
// ============================================================

async function getGeoFromIP(ip: string): Promise<{
  country: string
  countryCode: string
  isVpn: boolean
  isHosting: boolean
} | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,proxy,hosting`, {
      next: { revalidate: 3600 },
    })
    const data = await response.json()

    if (data.status === 'success') {
      return {
        country: data.country,
        countryCode: data.countryCode,
        isVpn: data.proxy || false,
        isHosting: data.hosting || false,
      }
    }
  } catch {}
  return null
}

// ============================================================
// CHECK IF REQUEST SHOULD BE BLOCKED
// ============================================================

export async function checkGeoBlock(request: NextRequest): Promise<{
  blocked: boolean
  reason: string
  countryCode?: string
  country?: string
}> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'

  // Whitelist check
  if (BLOCKED_CONFIG.whitelistedIps.includes(ip)) {
    return { blocked: false, reason: '' }
  }

  // IP blacklist check
  if (BLOCKED_CONFIG.blockedIps.includes(ip)) {
    return { blocked: true, reason: 'IP blocked', countryCode: 'XX' }
  }

  // GeoIP lookup
  const geo = await getGeoFromIP(ip)

  if (!geo) {
    // Can't determine location - allow but log
    return { blocked: false, reason: '' }
  }

  // High-risk country check
  if (BLOCKED_CONFIG.highRisk.includes(geo.countryCode)) {
    return {
      blocked: true,
      reason: `Service not available in ${geo.country} due to regional restrictions`,
      countryCode: geo.countryCode,
      country: geo.country,
    }
  }

  // Low-value country check (optional - can redirect to ads-only version)
  if (BLOCKED_CONFIG.lowValue.includes(geo.countryCode)) {
    // Instead of blocking, serve ads-only version
    return {
      blocked: false,
      reason: 'low_value_country',
      countryCode: geo.countryCode,
      country: geo.country,
    }
  }

  // VPN check
  if (BLOCKED_CONFIG.blockVpn && (geo.isVpn || geo.isHosting)) {
    return {
      blocked: true,
      reason: 'VPN/Proxy detected. Please disable VPN and try again.',
      countryCode: geo.countryCode,
    }
  }

  return { blocked: false, reason: '' }
}

// ============================================================
// GEO-BLOCK MIDDLEWARE RESPONSE
// ============================================================

export function createGeoBlockResponse(blockResult: { reason: string; country?: string }): NextResponse {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Access Restricted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a; 
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 500px;
      width: 90%;
      text-align: center;
      padding: 2rem;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; margin-bottom: 1.5rem; }
    .btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #333;
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .btn:hover { background: #444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Access Restricted</h1>
    <p>${blockResult.reason}</p>
    <p style="font-size: 0.85rem; color: #666;">
      If you believe this is an error, please contact support.
    </p>
    <a href="/" class="btn">Return Home</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html' },
  })
}
