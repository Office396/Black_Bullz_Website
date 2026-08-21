// ============================================================
// DEEP LINK HEALTH CHECKER
// Beyond basic 200 OK: Content-Length, MIME type, instant dead detection
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface DeepHealthCheckResult {
  mirrorId: number
  url: string
  host: string
  alive: boolean
  statusCode: number
  contentLength: number
  contentType: string
  responseTime: number
  checkedAt: string
  issue?: string
  severity: 'none' | 'warning' | 'critical'
}

interface HealthCheckConfig {
  // Minimum acceptable file size in bytes (1MB default)
  minFileSize: number

  // Valid MIME types for game files
  validMimeTypes: string[]

  // Timeout for HEAD request
  headTimeoutMs: number

  // Timeout for partial GET (deep scan)
  deepScanTimeoutMs: number

  // Bytes to download for deep scan (1MB)
  deepScanBytes: number

  // Instant dead detection: reports needed
  instantDeadThreshold: number

  // Time window for instant dead detection (ms)
  instantDeadWindowMs: number
}

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG: HealthCheckConfig = {
  minFileSize: 1024 * 1024, // 1MB
  validMimeTypes: [
    'application/x-torrent',
    'application/octet-stream',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'video/mp4',
    'application/x-bittorrent',
    'text/html', // Some file hosts return HTML for redirects
  ],
  headTimeoutMs: 10000,
  deepScanTimeoutMs: 30000,
  deepScanBytes: 1024 * 1024, // 1MB
  instantDeadThreshold: 3,
  instantDeadWindowMs: 60 * 60 * 1000, // 1 hour
}

// ============================================================
// FILE HOST RESPONSE PATTERNS (dead link indicators)
// ============================================================

const DEAD_LINK_PATTERNS = [
  // Generic file not found patterns
  /file\s+not\s+found/i,
  /404\s+error/i,
  /does\s+not\s+exist/i,
  /has\s+been\s+deleted/i,
  /has\s+been\s+removed/i,
  /no\s+longer\s+available/i,
  /expired/i,
  /removed?\s+by/i,
  /takedown/i,
  /copyright/i,
  /invalid\s+link/i,
  /link\s+not\s+found/i,
  /download\s+not\s+found/i,

  // 1fichier specific
  /this\s+file\s+does\s+not\s+exist/i,
  /ce\s+fichier\s+n'existe\s+pas/i,

  // GoFile specific
  /file\s+not\s+found/i,
  /error\s+404/i,

  // Pixeldrain specific
  /file\s+not\s+found/i,
  /invalid\s+file/i,

  // MediaFire specific
  /file\s+not\s+found/i,
  /removed\s+for/i,
  /invalid\s+or\s+deleted/i,
]

// ============================================================
// DEEP HEALTH CHECKER
// ============================================================

export class DeepLinkHealthChecker {
  private checkQueue: number[] = []
  private isChecking = false

  // ============================================================
  // CHECK SINGLE MIRROR (HEAD request + content validation)
  // ============================================================

  async checkMirror(mirrorId: number): Promise<DeepHealthCheckResult> {
    const { data: mirror } = await supabase
      .from('mirrors')
      .select('*')
      .eq('id', mirrorId)
      .single()

    if (!mirror) {
      return {
        mirrorId,
        url: '',
        host: '',
        alive: false,
        statusCode: 0,
        contentLength: 0,
        contentType: '',
        responseTime: 0,
        checkedAt: new Date().toISOString(),
        issue: 'Mirror not found',
        severity: 'critical',
      }
    }

    return this.checkUrl(mirror.download_url, mirrorId, mirror.host_name)
  }

  // ============================================================
  // CHECK URL (HEAD + validation)
  // ============================================================

  async checkUrl(
    url: string,
    mirrorId: number,
    host: string
  ): Promise<DeepHealthCheckResult> {
    const startTime = Date.now()

    try {
      // Step 1: HEAD request to get metadata
      const headResponse = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(CONFIG.headTimeoutMs),
        redirect: 'follow',
      })

      const statusCode = headResponse.status
      const contentLength = parseInt(headResponse.headers.get('content-length') || '0')
      const contentType = headResponse.headers.get('content-type') || ''
      const responseTime = Date.now() - startTime

      // Step 2: Check status code
      if (statusCode === 404 || statusCode === 410) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, 'File not found (404/410)', 'critical')
      }

      if (statusCode === 403 || statusCode === 451) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, 'Access forbidden (403/451)', 'critical')
      }

      if (statusCode >= 500) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, `Server error (${statusCode})`, 'warning')
      }

      // Step 3: Check content length
      if (contentLength === 0) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, 'Empty file (0 bytes)', 'critical')
      }

      if (contentLength < CONFIG.minFileSize && contentLength > 0) {
        // Small file might be an error page, do deep scan
        const deepResult = await this.deepScan(url, mirrorId, host)
        if (!deepResult.alive) {
          return deepResult
        }
      }

      // Step 4: Validate MIME type (if available)
      if (contentType && !this.isValidMime(contentType)) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, `Invalid content type: ${contentType}`, 'warning')
      }

      // Step 5: Check for dead link patterns in response headers
      const serverHeader = headResponse.headers.get('server') || ''
      if (this.isDeadPattern(serverHeader)) {
        return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, 'Dead link pattern detected in server header', 'critical')
      }

      // All checks passed
      return this.createResult(mirrorId, url, host, true, statusCode, contentLength, contentType, responseTime)

    } catch (error: any) {
      const responseTime = Date.now() - startTime

      if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
        return this.createResult(mirrorId, url, host, false, 0, 0, '', responseTime, 'Timeout', 'warning')
      }

      return this.createResult(mirrorId, url, host, false, 0, 0, '', responseTime, `Connection error: ${error.message}`, 'warning')
    }
  }

  // ============================================================
  // DEEP SCAN (download 1MB and check content)
  // ============================================================

  private async deepScan(
    url: string,
    mirrorId: number,
    host: string
  ): Promise<DeepHealthCheckResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Range': `bytes=0-${CONFIG.deepScanBytes - 1}`,
        },
        signal: AbortSignal.timeout(CONFIG.deepScanTimeoutMs),
        redirect: 'follow',
      })

      const statusCode = response.status
      const contentType = response.headers.get('content-type') || ''
      const contentRange = response.headers.get('content-range') || ''
      const responseTime = Date.now() - startTime

      // Get actual content length from range response
      let contentLength = 0
      const rangeMatch = contentRange.match(/\/(\d+)$/)
      if (rangeMatch) {
        contentLength = parseInt(rangeMatch[1])
      }

      // Read first chunk to check for error pages
      const reader = response.body?.getReader()
      if (reader) {
        const { value, done } = await reader.read()
        reader.cancel()

        if (value) {
          const text = new TextDecoder().decode(value.slice(0, 4096)) // Check first 4KB

          // Check for dead link patterns in HTML content
          for (const pattern of DEAD_LINK_PATTERNS) {
            if (pattern.test(text)) {
              return this.createResult(
                mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime,
                `Dead link pattern found: ${pattern.source}`,
                'critical'
              )
            }
          }
        }
      }

      // If we got a partial content (206) or OK (200), it's alive
      if (statusCode === 200 || statusCode === 206) {
        return this.createResult(mirrorId, url, host, true, statusCode, contentLength, contentType, responseTime)
      }

      return this.createResult(mirrorId, url, host, false, statusCode, contentLength, contentType, responseTime, `Unexpected status: ${statusCode}`, 'warning')

    } catch (error: any) {
      const responseTime = Date.now() - startTime
      return this.createResult(mirrorId, url, host, false, 0, 0, '', responseTime, `Deep scan error: ${error.message}`, 'warning')
    }
  }

  // ============================================================
  // INSTANT DEAD DETECTION (from user reports)
  // ============================================================

  async checkInstantDead(mirrorId: number): Promise<{
    shouldDisable: boolean
    reportCount: number
    timeWindow: string
  }> {
    const windowStart = new Date(Date.now() - CONFIG.instantDeadWindowMs).toISOString()

    const { count } = await supabase
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .eq('mirror_id', mirrorId)
      .in('bug_type', ['missing_files', 'corrupt', 'crash', 'wrong_password'])
      .gte('created_at', windowStart)

    const reportCount = count || 0

    return {
      shouldDisable: reportCount >= CONFIG.instantDeadThreshold,
      reportCount,
      timeWindow: `${CONFIG.instantDeadWindowMs / 60000} minutes`,
    }
  }

  // ============================================================
  // BATCH HEALTH CHECK
  // ============================================================

  async runBatchCheck(limit = 50): Promise<{
    checked: number
    alive: number
    dead: number
    warnings: number
  }> {
    // Get mirrors that haven't been checked recently
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: mirrors } = await supabase
      .from('mirrors')
      .select('id, download_url, host_name, last_alive')
      .eq('status', 'active')
      .or(`last_alive.is.null,last_alive.lt.${oneDayAgo}`)
      .order('last_alive', { ascending: true })
      .limit(limit)

    if (!mirrors || mirrors.length === 0) {
      return { checked: 0, alive: 0, dead: 0, warnings: 0 }
    }

    let alive = 0, dead = 0, warnings = 0

    // Check in batches of 5 with delay
    for (let i = 0; i < mirrors.length; i += 5) {
      const batch = mirrors.slice(i, i + 5)
      const results = await Promise.all(
        batch.map(m => this.checkUrl(m.download_url, m.id, m.host_name))
      )

      for (const result of results) {
        if (result.alive) {
          alive++
          // Update mirror status
          await supabase
            .from('mirrors')
            .update({
              status: 'active',
              last_alive: new Date().toISOString(),
              score: Math.min(100, (await this.getMirrorScore(result.mirrorId)) + 5),
            })
            .eq('id', result.mirrorId)
            .then(() => {})
            .catch(() => {})
        } else {
          if (result.severity === 'critical') {
            dead++
            await supabase
              .from('mirrors')
              .update({ status: 'dead', score: 0 })
              .eq('id', result.mirrorId)
              .then(() => {})
              .catch(() => {})
          } else {
            warnings++
          }
        }
      }

      // Delay between batches
      if (i + 5 < mirrors.length) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    return { checked: mirrors.length, alive, dead, warnings }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private isValidMime(contentType: string): boolean {
    const mime = contentType.split(';')[0].trim().toLowerCase()
    return CONFIG.validMimeTypes.some(valid => mime.includes(valid))
  }

  private isDeadPattern(text: string): boolean {
    return DEAD_LINK_PATTERNS.some(pattern => pattern.test(text))
  }

  private async getMirrorScore(mirrorId: number): Promise<number> {
    const { data } = await supabase
      .from('mirrors')
      .select('score')
      .eq('id', mirrorId)
      .single()
    return data?.score || 50
  }

  private createResult(
    mirrorId: number,
    url: string,
    host: string,
    alive: boolean,
    statusCode: number,
    contentLength: number,
    contentType: string,
    responseTime: number,
    issue?: string,
    severity: 'none' | 'warning' | 'critical' = 'none'
  ): DeepHealthCheckResult {
    return {
      mirrorId,
      url,
      host,
      alive,
      statusCode,
      contentLength,
      contentType,
      responseTime,
      checkedAt: new Date().toISOString(),
      issue,
      severity,
    }
  }
}

// Singleton
export const deepHealthChecker = new DeepLinkHealthChecker()
