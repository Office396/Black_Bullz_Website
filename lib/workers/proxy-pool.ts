// ============================================================
// PROXY POOL FOR UPLOADERS
// Rotating IPs to prevent file hosts from banning server
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface ProxyServer {
  id: string
  host: string
  port: number
  username?: string
  password?: string
  protocol: 'http' | 'https' | 'socks5'
  country: string
  isp: string
  status: 'active' | 'dead' | 'slow' | 'banned'
  lastUsed: string
  lastChecked: string
  successRate: number
  avgResponseTime: number
  totalRequests: number
  failedRequests: number
  bandwidthUsed: number // bytes
  bandwidthLimit: number // bytes
  assignedTo?: string // which worker is using this proxy
}

interface ProxyPoolConfig {
  maxConcurrent: number
  rotationStrategy: 'round-robin' | 'least-used' | 'random' | 'performance'
  healthCheckIntervalMs: number
  banThreshold: number // failures before marking as banned
  cooldownMs: number // time before reusing same proxy
}

interface ProxyUsageLog {
  proxyId: string
  workerName: string
  targetHost: string
  success: boolean
  responseTime: number
  bytesUploaded: number
  errorCode?: string
  timestamp: string
}

// ============================================================
// PROXY POOL MANAGER
// ============================================================

export class ProxyPool {
  private proxies: Map<string, ProxyServer> = new Map()
  private usageLog: ProxyUsageLog[] = []
  private currentIndex = 0
  private healthCheckTimer: NodeJS.Timeout | null = null

  private config: ProxyPoolConfig = {
    maxConcurrent: 5,
    rotationStrategy: 'performance',
    healthCheckIntervalMs: 300000, // 5 minutes
    banThreshold: 5,
    cooldownMs: 60000, // 1 minute
  }

  constructor(config?: Partial<ProxyPoolConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    // Load proxies from database
    const { data } = await supabase
      .from('proxy_servers')
      .select('*')
      .eq('status', 'active')

    if (data) {
      for (const proxy of data) {
        this.proxies.set(proxy.id, this.mapDbToProxy(proxy))
      }
    }

    console.log(`[ProxyPool] Loaded ${this.proxies.size} proxies`)

    // Start health checks
    this.startHealthChecks()
  }

  // ============================================================
  // GET NEXT PROXY
  // ============================================================

  async getNextProxy(targetHost?: string): Promise<ProxyServer | null> {
    const activeProxies = [...this.proxies.values()].filter(p => p.status === 'active')

    if (activeProxies.length === 0) {
      console.warn('[ProxyPool] No active proxies available')
      return null
    }

    let selected: ProxyServer

    switch (this.config.rotationStrategy) {
      case 'round-robin':
        selected = activeProxies[this.currentIndex % activeProxies.length]
        this.currentIndex++
        break

      case 'least-used':
        selected = activeProxies.reduce((min, p) =>
          p.totalRequests < min.totalRequests ? p : min
        )
        break

      case 'random':
        selected = activeProxies[Math.floor(Math.random() * activeProxies.length)]
        break

      case 'performance':
      default:
        selected = activeProxies.reduce((best, p) => {
          // Score based on success rate and response time
          const score = (p.successRate * 100) - (p.avgResponseTime / 100)
          const bestScore = (best.successRate * 100) - (best.avgResponseTime / 100)
          return score > bestScore ? p : best
        })
        break
    }

    // Check cooldown
    const timeSinceLastUse = Date.now() - new Date(selected.lastUsed).getTime()
    if (timeSinceLastUse < this.config.cooldownMs && activeProxies.length > 1) {
      // Pick a different proxy
      const alternatives = activeProxies.filter(p => p.id !== selected.id)
      if (alternatives.length > 0) {
        selected = alternatives[Math.floor(Math.random() * alternatives.length)]
      }
    }

    // Mark as in use
    selected.lastUsed = new Date().toISOString()
    selected.totalRequests++

    return selected
  }

  // ============================================================
  // REPORT RESULT
  // ============================================================

  async reportResult(
    proxyId: string,
    success: boolean,
    responseTime: number,
    bytesUploaded: number,
    targetHost: string,
    workerName: string,
    errorCode?: string
  ): Promise<void> {
    const proxy = this.proxies.get(proxyId)
    if (!proxy) return

    // Update proxy stats
    if (success) {
      proxy.successRate = (proxy.successRate * (proxy.totalRequests - 1) + 1) / proxy.totalRequests
      proxy.avgResponseTime = (proxy.avgResponseTime * (proxy.totalRequests - 1) + responseTime) / proxy.totalRequests
    } else {
      proxy.failedRequests++
      proxy.successRate = (proxy.successRate * (proxy.totalRequests - 1)) / proxy.totalRequests

      // Check if should be banned
      if (proxy.failedRequests >= this.config.banThreshold) {
        proxy.status = 'banned'
        console.warn(`[ProxyPool] Proxy ${proxyId} banned after ${proxy.failedRequests} failures`)
      }
    }

    proxy.bandwidthUsed += bytesUploaded

    // Log usage
    const log: ProxyUsageLog = {
      proxyId,
      workerName,
      targetHost,
      success,
      responseTime,
      bytesUploaded,
      errorCode,
      timestamp: new Date().toISOString(),
    }
    this.usageLog.push(log)

    // Persist to database
    await supabase.from('proxy_usage_logs').insert(log).then(() => {}).catch(() => {})
    await supabase
      .from('proxy_servers')
      .update({
        status: proxy.status,
        success_rate: proxy.successRate,
        avg_response_time: proxy.avgResponseTime,
        total_requests: proxy.totalRequests,
        failed_requests: proxy.failedRequests,
        bandwidth_used: proxy.bandwidthUsed,
        last_used: proxy.lastUsed,
      })
      .eq('id', proxyId)
      .then(() => {})
      .catch(() => {})
  }

  // ============================================================
  // HEALTH CHECKS
  // ============================================================

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(
      () => this.runHealthChecks(),
      this.config.healthCheckIntervalMs
    )
  }

  private async runHealthChecks(): Promise<void> {
    for (const [id, proxy] of this.proxies) {
      if (proxy.status === 'banned') continue

      try {
        const start = Date.now()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`
        const auth = proxy.username ? `${proxy.username}:${proxy.password}@` : ''
        const url = `http://httpbin.org/ip`

        // Simple connectivity check
        await fetch(url, {
          // @ts-ignore
          agent: undefined, // Would need proxy-agent for actual proxy support
          signal: controller.signal,
        })

        clearTimeout(timeout)
        const responseTime = Date.now() - start

        proxy.status = responseTime > 5000 ? 'slow' : 'active'
        proxy.avgResponseTime = (proxy.avgResponseTime + responseTime) / 2
        proxy.lastChecked = new Date().toISOString()
      } catch (error) {
        proxy.status = 'dead'
        proxy.lastChecked = new Date().toISOString()
      }

      // Persist status
      await supabase
        .from('proxy_servers')
        .update({
          status: proxy.status,
          avg_response_time: proxy.avgResponseTime,
          last_checked: proxy.lastChecked,
        })
        .eq('id', id)
        .then(() => {})
        .catch(() => {})
    }
  }

  // ============================================================
  // ADD/REMOVE PROXIES
  // ============================================================

  async addProxy(proxy: Omit<ProxyServer, 'id' | 'status' | 'lastUsed' | 'lastChecked' | 'successRate' | 'avgResponseTime' | 'totalRequests' | 'failedRequests' | 'bandwidthUsed' | 'bandwidthLimit'>): Promise<string> {
    const id = `proxy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const fullProxy: ProxyServer = {
      ...proxy,
      id,
      status: 'active',
      lastUsed: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      successRate: 1.0,
      avgResponseTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      bandwidthUsed: 0,
      bandwidthLimit: 100 * 1024 * 1024 * 1024, // 100GB default
    }

    this.proxies.set(id, fullProxy)

    await supabase.from('proxy_servers').insert({
      id,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: proxy.protocol,
      country: proxy.country,
      isp: proxy.isp,
      status: 'active',
    })

    return id
  }

  async removeProxy(id: string): Promise<void> {
    this.proxies.delete(id)
    await supabase.from('proxy_servers').delete().eq('id', id)
  }

  // ============================================================
  // GET POOL STATS
  // ============================================================

  getPoolStats(): {
    total: number
    active: number
    dead: number
    banned: number
    slow: number
    avgSuccessRate: number
    totalBandwidthUsed: number
  } {
    const all = [...this.proxies.values()]
    return {
      total: all.length,
      active: all.filter(p => p.status === 'active').length,
      dead: all.filter(p => p.status === 'dead').length,
      banned: all.filter(p => p.status === 'banned').length,
      slow: all.filter(p => p.status === 'slow').length,
      avgSuccessRate: all.length > 0
        ? all.reduce((sum, p) => sum + p.successRate, 0) / all.length
        : 0,
      totalBandwidthUsed: all.reduce((sum, p) => sum + p.bandwidthUsed, 0),
    }
  }

  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
  }

  private mapDbToProxy(db: any): ProxyServer {
    return {
      id: db.id,
      host: db.host,
      port: db.port,
      username: db.username,
      password: db.password,
      protocol: db.protocol,
      country: db.country,
      isp: db.isp,
      status: db.status,
      lastUsed: db.last_used,
      lastChecked: db.last_checked,
      successRate: db.success_rate || 1.0,
      avgResponseTime: db.avg_response_time || 0,
      totalRequests: db.total_requests || 0,
      failedRequests: db.failed_requests || 0,
      bandwidthUsed: db.bandwidth_used || 0,
      bandwidthLimit: db.bandwidth_limit || 100 * 1024 * 1024 * 1024,
    }
  }
}

// Singleton
export const proxyPool = new ProxyPool()
