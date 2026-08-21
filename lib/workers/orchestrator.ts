// ============================================================
// WORKER ORCHESTRATOR
// Coordinates all background workers, handles scheduling
// ============================================================

import { supabase } from '../supabase'
import { runRSSScrapeJob } from './rss-scraper'
import { runMetadataScrapeJob } from './metadata-scraper'
import { runLinkHealthCheck } from './link-health-checker'
import { resolveAllConflicts } from './conflict-resolver'
import { batchUpdateSystemRequirements } from './sysreq-extractor'
import { scanCommentsForModeration, scanMirrorsForModeration } from './moderation'
import { aggregateDailyStats } from './analytics'
import { discordMonitor } from './discord-monitor'
import { adBalancer } from './ad-balancer'
import { proxyPool } from './proxy-pool'

// ============================================================
// TYPES
// ============================================================

interface WorkerConfig {
  name: string
  enabled: boolean
  intervalMs: number
  lastRun: string
  status: 'idle' | 'running' | 'error'
}

// ============================================================
// WORKER REGISTRY
// ============================================================

const workers: Record<string, WorkerConfig> = {
  'rss-scraper': { name: 'RSS Scraper', enabled: true, intervalMs: 5 * 60 * 1000, lastRun: '', status: 'idle' },
  'metadata-scraper': { name: 'Metadata Scraper', enabled: true, intervalMs: 2 * 60 * 1000, lastRun: '', status: 'idle' },
  'link-health': { name: 'Link Health Check', enabled: true, intervalMs: 2 * 60 * 60 * 1000, lastRun: '', status: 'idle' },
  'conflict-resolver': { name: 'Conflict Resolver', enabled: true, intervalMs: 30 * 60 * 1000, lastRun: '', status: 'idle' },
  'sysreq-extractor': { name: 'SysReq Extractor', enabled: true, intervalMs: 60 * 60 * 1000, lastRun: '', status: 'idle' },
  'comment-moderation': { name: 'Comment Moderation', enabled: true, intervalMs: 15 * 60 * 1000, lastRun: '', status: 'idle' },
  'mirror-moderation': { name: 'Mirror Moderation', enabled: true, intervalMs: 30 * 60 * 1000, lastRun: '', status: 'idle' },
  'daily-stats': { name: 'Daily Stats', enabled: true, intervalMs: 24 * 60 * 60 * 1000, lastRun: '', status: 'idle' },
  'discord-monitor': { name: 'Discord Monitor', enabled: true, intervalMs: 60 * 1000, lastRun: '', status: 'idle' },
  'ad-balancer': { name: 'Ad Balancer', enabled: true, intervalMs: 5 * 60 * 1000, lastRun: '', status: 'idle' },
  'proxy-health': { name: 'Proxy Health', enabled: true, intervalMs: 5 * 60 * 1000, lastRun: '', status: 'idle' },
}

// ============================================================
// WORKER FUNCTIONS
// ============================================================

async function runWorker(name: string): Promise<any> {
  const worker = workers[name]
  if (!worker || !worker.enabled) return null

  // Check if already running
  if (worker.status === 'running') {
    console.log(`[Orchestrator] ${worker.name} already running, skipping...`)
    return null
  }

  worker.status = 'running'
  console.log(`[Orchestrator] Starting ${worker.name}...`)

  try {
    let result: any

    switch (name) {
      case 'rss-scraper':
        result = await runRSSScrapeJob()
        break
      case 'metadata-scraper':
        result = await runMetadataScrapeJob()
        break
      case 'link-health':
        result = await runLinkHealthCheck()
        break
      case 'conflict-resolver':
        result = await resolveAllConflicts()
        break
      case 'sysreq-extractor':
        result = await batchUpdateSystemRequirements()
        break
      case 'comment-moderation':
        const flaggedComments = await scanCommentsForModeration()
        result = { flagged: flaggedComments }
        break
      case 'mirror-moderation':
        const flaggedMirrors = await scanMirrorsForModeration()
        result = { flagged: flaggedMirrors }
        break
      case 'daily-stats':
        await aggregateDailyStats()
        result = { success: true }
        break
      case 'discord-monitor':
        // Discord monitor runs continuously, just check status
        const signals = discordMonitor.getRecentSignals()
        result = { signals: signals.length }
        break
      case 'ad-balancer':
        await adBalancer.updateVariantStats()
        const abResults = await adBalancer.getABTestResults()
        result = { variants: abResults.length }
        break
      case 'proxy-health':
        // Proxy health checks run in background
        result = proxyPool.getPoolStats()
        break
    }

    worker.status = 'idle'
    worker.lastRun = new Date().toISOString()
    console.log(`[Orchestrator] ${worker.name} completed:`, result)

    // Update database
    await supabase
      .from('worker_status')
      .update({
        status: 'idle',
        last_heartbeat: new Date().toISOString(),
        total_processed: result?.total || result?.processed || result?.checked || 0,
      })
      .eq('worker_name', name)

    return result
  } catch (error: any) {
    worker.status = 'error'
    console.error(`[Orchestrator] ${worker.name} error:`, error.message)

    await supabase
      .from('worker_status')
      .update({
        status: 'error',
        last_heartbeat: new Date().toISOString(),
        last_error: error.message,
      })
      .eq('worker_name', name)

    return null
  }
}

// ============================================================
// SCHEDULER
// ============================================================

const intervals: NodeJS.Timeout[] = []

export function startScheduler(): void {
  console.log('[Orchestrator] Starting scheduler...')

  // Clear any existing intervals
  stopScheduler()

  // Schedule each worker
  for (const [name, config] of Object.entries(workers)) {
    if (!config.enabled) continue

    const interval = setInterval(async () => {
      await runWorker(name)
    }, config.intervalMs)

    intervals.push(interval)
    console.log(`[Orchestrator] Scheduled ${config.name} every ${config.intervalMs / 1000}s`)
  }
}

export function stopScheduler(): void {
  for (const interval of intervals) {
    clearInterval(interval)
  }
  intervals.length = 0
  console.log('[Orchestrator] Scheduler stopped')
}

// ============================================================
// MANUAL TRIGGER
// ============================================================

export async function triggerWorker(name: string): Promise<any> {
  console.log(`[Orchestrator] Manual trigger: ${name}`)
  return await runWorker(name)
}

export async function triggerAllWorkers(): Promise<void> {
  console.log('[Orchestrator] Triggering all workers...')

  for (const name of Object.keys(workers)) {
    if (workers[name].enabled) {
      await runWorker(name)
    }
  }
}

// ============================================================
// STATUS
// ============================================================

export function getWorkerStatus(): Record<string, WorkerConfig> {
  return { ...workers }
}

export async function getWorkerStatusFromDB(): Promise<any[]> {
  const { data } = await supabase
    .from('worker_status')
    .select('*')
    .order('worker_name')

  return data || []
}
