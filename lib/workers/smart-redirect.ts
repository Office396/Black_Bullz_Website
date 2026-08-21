// ============================================================
// SMART REDIRECT MIDDLEWARE
// GeoIP + Affiliate + Ad Injection + 302 Redirect
// This is THE revenue engine
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ============================================================
// TYPES
// ============================================================

interface RedirectConfig {
  mirrorId: number
  gameId: number
  gameSlug: string
  hostName: string
  downloadUrl: string
  monetizedUrl?: string
  affiliateId?: number
}

interface GeoData {
  country: string
  continent: string
  isVpn: boolean
  isBanned: boolean
}

interface AdInjection {
  popunder: boolean
  interstitial: boolean
  smartLink: boolean
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // GeoIP API
  GEO_API: 'http://ip-api.com/json',

  // Low-value countries (lower ad rates)
  LOW_VALUE_COUNTRIES: ['IN', 'BD', 'PK', 'NG', 'KE', 'PH', 'ID', 'VN', 'TH', 'EG'],

  // Banned countries (legal risk)
  BANNED_COUNTRIES: ['DE', 'JP', 'AU', 'NZ', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'],

  // Premium countries (higher ad rates)
  PREMIUM_COUNTRIES: ['US', 'UK', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'KR', 'SG'],

  // Ad injection thresholds
  AD_INJECTION: {
    minCountryScore: 30,
    popunderChance: 0.7, // 70% of clicks get popunder
    interstitialChance: 0.3, // 30% get interstitial
  },
}

// ============================================================
// GEOIP LOOKUP
// ============================================================

export async function getGeoFromRequest(request: NextRequest): Promise<GeoData> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'

  try {
    const response = await fetch(`${CONFIG.GEO_API}/${ip}?fields=status,country,countryCode,continentCode,proxy,hosting`, {
      next: { revalidate: 3600 },
    })
    const data = await response.json()

    if (data.status === 'success') {
      const countryCode = data.countryCode
      return {
        country: data.country,
        continent: data.continentCode,
        isVpn: data.proxy || data.hosting || false,
        isBanned: CONFIG.BANNED_COUNTRIES.includes(countryCode),
      }
    }
  } catch {}

  return { country: 'Unknown', continent: 'NA', isVpn: false, isBanned: false }
}

// ============================================================
// COUNTRY VALUE SCORE
// ============================================================

function getCountryValueScore(countryCode: string): number {
  if (CONFIG.PREMIUM_COUNTRIES.includes(countryCode)) return 100
  if (CONFIG.LOW_VALUE_COUNTRIES.includes(countryCode)) return 30
  return 60 // Default for other countries
}

// ============================================================
// AD INJECTION DECISION
// ============================================================

function shouldInjectAds(geo: GeoData, gameId: number): AdInjection {
  const countryScore = getCountryValueScore(geo.country)

  // Don't inject ads for banned countries (show direct link)
  if (geo.isBanned) {
    return { popunder: false, interstitial: false, smartLink: false }
  }

  // Lower ad injection for low-value countries
  const multiplier = countryScore / 100

  return {
    popunder: Math.random() < CONFIG.AD_INJECTION.popunderChance * multiplier,
    interstitial: Math.random() < CONFIG.AD_INJECTION.interstitialChance * multiplier,
    smartLink: Math.random() < 0.5 * multiplier,
  }
}

// ============================================================
// AFFILIATE LINK SELECTION
// ============================================================

async function selectAffiliate(gameId: number, geo: GeoData): Promise<any | null> {
  const { data: affiliates } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('active', true)
    .eq('category', 'download')
    .order('clicks', { ascending: false })

  if (!affiliates || affiliates.length === 0) return null

  // Score affiliates
  const scored = affiliates.map(aff => {
    let score = 50

    // Higher commission = higher score
    score += aff.commission_rate * 0.5

    // More clicks = proven = higher score
    if (aff.clicks > 100) score += 20

    return { affiliate: aff, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.affiliate || null
}

// ============================================================
// SMART REDIRECT HANDLER
// ============================================================

export async function handleSmartRedirect(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const gameId = parseInt(url.searchParams.get('gameId') || '0')
  const mirrorId = parseInt(url.searchParams.get('mirrorId') || '0')
  const action = url.searchParams.get('action') || 'download'

  if (!gameId || !mirrorId) {
    return NextResponse.json({ error: 'gameId and mirrorId required' }, { status: 400 })
  }

  // 1. Get GeoIP
  const geo = await getGeoFromRequest(request)

  // 2. Check if banned
  if (geo.isBanned) {
    return NextResponse.json({
      error: 'Download not available in your region',
      country: geo.country,
      reason: 'geo_blocked',
    }, { status: 403 })
  }

  // 3. Get mirror details
  const { data: mirror } = await supabase
    .from('mirrors')
    .select('*')
    .eq('id', mirrorId)
    .single()

  if (!mirror || mirror.status !== 'active') {
    return NextResponse.json({ error: 'Mirror not found or inactive' }, { status: 404 })
  }

  // 4. Get game details
  const { data: game } = await supabase
    .from('games')
    .select('id, title, slug, repack_size')
    .eq('id', gameId)
    .single()

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // 5. Decide on ad injection
  const adInjection = shouldInjectAds(geo, gameId)

  // 6. Select affiliate
  const affiliate = await selectAffiliate(gameId, geo)

  // 7. Build redirect URL
  let redirectUrl = mirror.download_url

  // If affiliate selected, create redirect through affiliate
  if (affiliate && adInjection.smartLink) {
    redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/go/${Buffer.from(JSON.stringify({
      url: mirror.download_url,
      affiliate: affiliate.id,
      game: gameId,
      mirror: mirrorId,
    })).toString('base64')}`
  }

  // 8. Track the click
  await supabase.rpc('increment_mirror_clicks', { mirror_id: mirrorId })
  await supabase.rpc('increment_downloads', { game_id: gameId })

  // 9. Log the click
  await supabase.from('click_logs').insert({
    game_id: gameId,
    mirror_id: mirrorId,
    host_name: mirror.host_name,
    country: geo.country,
    continent: geo.continent,
    is_vpn: geo.isVpn,
    affiliate_id: affiliate?.id || null,
    ad_injected: adInjection.popunder || adInjection.interstitial,
  }).then(() => {}).catch(() => {}) // Ignore errors

  // 10. Build response
  if (action === 'interstitial') {
    // Show interstitial page with ads before redirect
    return NextResponse.redirect(new URL(
      `/download/interstitial?gameId=${gameId}&mirrorId=${mirrorId}&url=${encodeURIComponent(redirectUrl)}&popunder=${adInjection.popunder}`,
      request.url
    ))
  }

  // Direct redirect with optional popunder
  const response = NextResponse.redirect(redirectUrl, 302)

  // Add popunder cookie if needed
  if (adInjection.popunder) {
    response.cookies.set('popunder', '1', {
      maxAge: 300, // 5 minutes
      path: '/',
    })
  }

  return response
}

// ============================================================
// DOWNLOAD PAGE INTERSTITIAL
// ============================================================

export function getInterstitialHTML(
  game: { title: string; cover_image: string; repack_size: string },
  redirectUrl: string,
  popunder: boolean
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Download ${game.title}</title>
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
    .game-info {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
      text-align: left;
    }
    .game-info img {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
    }
    .game-info h2 { font-size: 1.2rem; margin-bottom: 0.25rem; }
    .game-info p { color: #888; font-size: 0.9rem; }
    .timer {
      font-size: 3rem;
      font-weight: bold;
      color: #4ade80;
      margin: 1rem 0;
    }
    .progress-bar {
      width: 100%;
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin: 1rem 0;
      overflow: hidden;
    }
    .progress-bar .fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22c55e);
      width: 0%;
      transition: width 1s linear;
    }
    .btn {
      display: inline-block;
      padding: 1rem 3rem;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1.1rem;
      margin-top: 1rem;
      cursor: pointer;
      border: none;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    .btn:disabled { 
      background: #333; 
      cursor: not-allowed; 
      transform: none;
    }
    .note {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #888;
    }
    .note strong { color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="game-info">
      <img src="${game.cover_image || '/placeholder.svg'}" alt="${game.title}">
      <div>
        <h2>${game.title}</h2>
        <p>${game.repack_size || 'Unknown size'}</p>
      </div>
    </div>
    
    <p>Your download is being prepared...</p>
    <div class="timer" id="timer">5</div>
    <div class="progress-bar"><div class="fill" id="progress"></div></div>
    
    <button class="btn" id="downloadBtn" disabled>
      Preparing Download...
    </button>
    
    <div class="note">
      <strong>Note:</strong> Your download will start automatically. 
      If it doesn't, click the button above.
    </div>
  </div>

  <script>
    let seconds = 5;
    const timerEl = document.getElementById('timer');
    const progressEl = document.getElementById('progress');
    const btn = document.getElementById('downloadBtn');
    
    const interval = setInterval(() => {
      seconds--;
      timerEl.textContent = seconds;
      progressEl.style.width = ((5 - seconds) / 5 * 100) + '%';
      
      if (seconds <= 0) {
        clearInterval(interval);
        timerEl.textContent = '✓';
        timerEl.style.color = '#4ade80';
        btn.disabled = false;
        btn.textContent = 'Download Now';
        btn.onclick = () => {
          ${popunder ? `window.open('about:blank', '_blank');` : ''}
          window.location.href = '${redirectUrl}';
        };
      }
    }, 1000);
  </script>
</body>
</html>`
}
