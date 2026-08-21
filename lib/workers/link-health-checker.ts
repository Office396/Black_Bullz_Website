// ============================================================
// LINK HEALTH CHECK WORKER
// Pings all active download mirrors, flags dead links,
// auto-failovers to healthy mirrors, sends Discord alerts
// ============================================================

import axios, { AxiosInstance } from 'axios'
import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface HealthCheckResult {
  mirrorId: number
  gameId: number
  gameTitle: string
  url: string
  host: string
  status: 'alive' | 'dead' | 'slow' | 'timeout' | 'error'
  responseTime: number
  statusCode: number
  checkedAt: string
  error?: string
}

interface DiscordWebhookPayload {
  embeds: Array<{
    title: string
    description: string
    color: number
    fields: Array<{ name: string; value: string; inline?: boolean }>
    timestamp: string
  }>
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  TIMEOUT_MS: 15000,
  SLOW_THRESHOLD_MS: 8000,
  BATCH_SIZE: 50,
  CHECK_INTERVAL_MS: 2 * 60 * 60 * 1000, // 2 hours
  DEAD_LINK_THRESHOLD: 3, // Mark as dead after 3 consecutive failures
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  PROXY_URL: process.env.PROXY_URL || '',
}

// ============================================================
// HTTP CLIENT with optional proxy
// ============================================================

function createHttpClient(): AxiosInstance {
  const config: any = {
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    maxRedirects: 5,
  }

  if (CONFIG.PROXY_URL) {
    const proxyUrl = new URL(CONFIG.PROXY_URL)
    config.proxy = {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port),
      protocol: proxyUrl.protocol,
    }
  }

  return axios.create(config)
}

// ============================================================
// HOST-SPECIFIC HEALTH CHECKERS
// ============================================================

async function check1fichier(url: string, client: AxiosInstance): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    const response = await client.get(url, { maxRedirects: 0, validateStatus: () => true })
    const responseTime = Date.now() - startTime

    // 1fichier returns 200 with download page, or 403/404 for dead links
    if (response.status === 200 && response.data?.includes('download')) {
      return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: '1fichier', status: 'alive', responseTime, statusCode: response.status, checkedAt: new Date().toISOString() }
    }
    if (response.status === 403 || response.status === 404 || response.status === 410) {
      return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: '1fichier', status: 'dead', responseTime, statusCode: response.status, checkedAt: new Date().toISOString() }
    }
    if (responseTime > CONFIG.SLOW_THRESHOLD_MS) {
      return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: '1fichier', status: 'slow', responseTime, statusCode: response.status, checkedAt: new Date().toISOString() }
    }
    return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: '1fichier', status: 'alive', responseTime, statusCode: response.status, checkedAt: new Date().toISOString() }
  } catch (error: any) {
    return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: '1fichier', status: 'error', responseTime: Date.now() - startTime, statusCode: 0, checkedAt: new Date().toISOString(), error: error.message }
  }
}

async function checkGoFile(url: string, client: AxiosInstance): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    // GoFile pages return 200 with content
    const response = await client.get(url)
    const responseTime = Date.now() - startTime
    const isDead = response.data?.includes('not found') || response.data?.includes('deleted') || response.status === 404

    return {
      mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'GoFile',
      status: isDead ? 'dead' : responseTime > CONFIG.SLOW_THRESHOLD_MS ? 'slow' : 'alive',
      responseTime, statusCode: response.status, checkedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'GoFile', status: 'error', responseTime: Date.now() - startTime, statusCode: 0, checkedAt: new Date().toISOString(), error: error.message }
  }
}

async function checkPixeldrain(url: string, client: AxiosInstance): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    // Extract file ID from URL
    const match = url.match(/\/u\/([a-zA-Z0-9]+)/)
    if (!match) {
      return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'Pixeldrain', status: 'error', responseTime: 0, statusCode: 0, checkedAt: new Date().toISOString(), error: 'Invalid URL format' }
    }

    const fileId = match[1]
    const apiResponse = await client.head(`https://pixeldrain.com/api/file/${fileId}`)
    const responseTime = Date.now() - startTime

    return {
      mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'Pixeldrain',
      status: responseTime > CONFIG.SLOW_THRESHOLD_MS ? 'slow' : 'alive',
      responseTime, statusCode: apiResponse.status, checkedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    const status = error.response?.status === 404 ? 'dead' : 'error'
    return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'Pixeldrain', status, responseTime: Date.now() - startTime, statusCode: error.response?.status || 0, checkedAt: new Date().toISOString(), error: error.message }
  }
}

async function checkGenericUrl(url: string, client: AxiosInstance): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    const response = await client.head(url, { maxRedirects: 3 })
    const responseTime = Date.now() - startTime

    return {
      mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'generic',
      status: responseTime > CONFIG.SLOW_THRESHOLD_MS ? 'slow' : 'alive',
      responseTime, statusCode: response.status, checkedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    return { mirrorId: 0, gameId: 0, gameTitle: '', url, host: 'generic', status: 'error', responseTime: Date.now() - startTime, statusCode: error.response?.status || 0, checkedAt: new Date().toISOString(), error: error.message }
  }
}

// ============================================================
// MAIN HEALTH CHECK FUNCTION
// ============================================================

async function checkMirrorHealth(url: string, hostName: string, client: AxiosInstance): Promise<HealthCheckResult> {
  const lowerHost = hostName.toLowerCase()

  if (lowerHost.includes('1fichier')) return check1fichier(url, client)
  if (lowerHost.includes('gofile')) return checkGoFile(url, client)
  if (lowerHost.includes('pixeldrain')) return checkPixeldrain(url, client)

  return checkGenericUrl(url, client)
}

// ============================================================
// BATCH PROCESSOR
// ============================================================

async function processBatch(mirrors: any[], client: AxiosInstance): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = []

  // Process in parallel with concurrency limit
  const batchSize = 5
  for (let i = 0; i < mirrors.length; i += batchSize) {
    const batch = mirrors.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (mirror) => {
        const result = await checkMirrorHealth(mirror.download_url, mirror.host_name, client)
        result.mirrorId = mirror.id
        result.gameId = mirror.game_id
        result.gameTitle = mirror.game_title || 'Unknown'
        return result
      })
    )
    results.push(...batchResults)

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < mirrors.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results
}

// ============================================================
// DISCORD ALERT SYSTEM
// ============================================================

async function sendDiscordAlert(results: HealthCheckResult[]): Promise<void> {
  if (!CONFIG.DISCORD_WEBHOOK_URL) return

  const deadLinks = results.filter(r => r.status === 'dead')
  if (deadLinks.length === 0) return

  const embeds = deadLinks.slice(0, 10).map(result => ({
    title: 'Dead Link Detected',
    description: `Mirror link is no longer accessible`,
    color: 0xff0000, // Red
    fields: [
      { name: 'Game', value: result.gameTitle, inline: true },
      { name: 'Host', value: result.host, inline: true },
      { name: 'Status Code', value: String(result.statusCode), inline: true },
      { name: 'URL', value: result.url.substring(0, 100) },
    ],
    timestamp: result.checkedAt,
  }))

  try {
    await axios.post(CONFIG.DISCORD_WEBHOOK_URL, { embeds } satisfies DiscordWebhookPayload)
    console.log(`[Link Health] Discord alert sent for ${deadLinks.length} dead links`)
  } catch (error: any) {
    console.error('[Link Health] Discord alert failed:', error.message)
  }
}

// ============================================================
// AUTO-FAILOVER: Switch to next healthy mirror
// ============================================================

async function autoFailover(gameId: number, deadMirrorId: number): Promise<void> {
  try {
    // Get all mirrors for this game
    const { data: mirrors } = await supabase
      .from('mirrors')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'active')
      .order('priority', { ascending: true })

    if (!mirrors || mirrors.length <= 1) return

    // Find the dead mirror and the next healthy one
    const deadIndex = mirrors.findIndex(m => m.id === deadMirrorId)
    if (deadIndex === -1) return

    // Promote the next mirror's priority
    const nextMirror = mirrors.find((m, i) => i !== deadIndex && m.status === 'active')
    if (nextMirror) {
      await supabase
        .from('mirrors')
        .update({ priority: mirrors[deadIndex].priority - 1 })
        .eq('id', nextMirror.id)

      console.log(`[Link Health] Auto-failover: promoted mirror ${nextMirror.id} for game ${gameId}`)
    }
  } catch (error: any) {
    console.error('[Link Health] Auto-failover error:', error.message)
  }
}

// ============================================================
// MAIN WORKER FUNCTION
// ============================================================

export async function runLinkHealthCheck(): Promise<{
  checked: number
  alive: number
  dead: number
  slow: number
  errors: number
}> {
  console.log('[Link Health Worker] Starting health check...')

  // Update worker status
  await supabase
    .from('worker_status')
    .update({ status: 'running', last_heartbeat: new Date().toISOString() })
    .eq('worker_name', 'mirror-checker')

  const client = createHttpClient()
  let totalChecked = 0
  let totalAlive = 0
  let totalDead = 0
  let totalSlow = 0
  let totalErrors = 0

  // Get all active mirrors in batches
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: mirrors, error } = await supabase
      .from('mirrors')
      .select(`
        id, game_id, host_name, download_url, status,
        games!inner(title)
      `)
      .eq('status', 'active')
      .range(offset, offset + CONFIG.BATCH_SIZE - 1)

    if (error || !mirrors || mirrors.length === 0) {
      hasMore = false
      break
    }

    // Add game_title to each mirror
    const mirrorsWithTitle = mirrors.map((m: any) => ({
      ...m,
      game_title: m.games?.title || 'Unknown',
    }))

    const results = await processBatch(mirrorsWithTitle, client)

    // Update database with results
    for (const result of results) {
      const updateData: any = {
        last_checked: result.checkedAt,
      }

      if (result.status === 'dead') {
        updateData.status = 'dead'
        totalDead++
        // Auto-failover
        await autoFailover(result.gameId, result.mirrorId)
      } else if (result.status === 'slow') {
        totalSlow++
      } else if (result.status === 'alive') {
        updateData.last_alive = result.checkedAt
        totalAlive++
      } else {
        totalErrors++
      }

      await supabase
        .from('mirrors')
        .update(updateData)
        .eq('id', result.mirrorId)

      totalChecked++
    }

    // Send Discord alerts for dead links
    await sendDiscordAlert(results)

    offset += CONFIG.BATCH_SIZE
    hasMore = mirrors.length === CONFIG.BATCH_SIZE
  }

  // Update worker status
  await supabase
    .from('worker_status')
    .update({
      status: 'idle',
      last_heartbeat: new Date().toISOString(),
      total_processed: totalChecked,
      total_errors: totalDead + totalErrors,
    })
    .eq('worker_name', 'mirror-checker')

  console.log(`[Link Health Worker] Complete: ${totalChecked} checked, ${totalAlive} alive, ${totalDead} dead, ${totalSlow} slow, ${totalErrors} errors`)

  return {
    checked: totalChecked,
    alive: totalAlive,
    dead: totalDead,
    slow: totalSlow,
    errors: totalErrors,
  }
}

// ============================================================
// SCHEDULER: Run health check every 2 hours
// ============================================================

export async function scheduleHealthCheck(): Promise<void> {
  console.log('[Scheduler] Scheduling link health check...')

  const { data: worker } = await supabase
    .from('worker_status')
    .select('status')
    .eq('worker_name', 'mirror-checker')
    .single()

  if (worker?.status === 'running') {
    console.log('[Scheduler] Health check already running, skipping...')
    return
  }

  await runLinkHealthCheck()
}
