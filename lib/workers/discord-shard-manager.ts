// ============================================================
// DISCORD BOT SHARDING SYSTEM
// Multiple bots, queue system, crash recovery
// Prevents rate limiting when monitoring 50+ channels
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface BotShard {
  id: string
  token: string
  channelIds: string[]
  status: 'idle' | 'running' | 'rate_limited' | 'error' | 'crashed'
  lastActivity: string
  requestCount: number
  errorCount: number
  messagesProcessed: number
}

interface QueuedJob {
  id: string
  channelId: string
  messageId: string
  content: string
  author: string
  timestamp: string
  priority: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  retryCount: number
  maxRetries: number
  createdAt: string
  processedAt?: string
  error?: string
}

interface ShardConfig {
  maxChannelsPerShard: number
  requestsPerSecond: number
  maxRetries: number
  retryDelayMs: number
  queueProcessIntervalMs: number
  healthCheckIntervalMs: number
}

// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_CONFIG: ShardConfig = {
  maxChannelsPerShard: 15,       // Discord recommends max 50, we use 15 for safety
  requestsPerSecond: 25,         // Stay well under 100/sec limit
  maxRetries: 3,
  retryDelayMs: 5000,
  queueProcessIntervalMs: 2000,
  healthCheckIntervalMs: 60000,
}

// ============================================================
// SHARDED DISCORD MANAGER
// ============================================================

export class ShardedDiscordManager {
  private shards: BotShard[] = []
  private queue: QueuedJob[] = []
  private config: ShardConfig
  private processTimer: NodeJS.Timeout | null = null
  private healthTimer: NodeJS.Timeout | null = null
  private isProcessing = false

  constructor(config?: Partial<ShardConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    // Load shards from environment or database
    const shardTokens = this.getShardTokens()
    const allChannelIds = this.getChannelIds()

    // Distribute channels across shards
    const channelsPerShard = Math.ceil(allChannelIds.length / shardTokens.length) || this.config.maxChannelsPerShard

    for (let i = 0; i < shardTokens.length; i++) {
      const startIdx = i * channelsPerShard
      const endIdx = Math.min(startIdx + channelsPerShard, allChannelIds.length)
      const channels = allChannelIds.slice(startIdx, endIdx)

      this.shards.push({
        id: `shard_${i}`,
        token: shardTokens[i],
        channelIds: channels,
        status: 'idle',
        lastActivity: new Date().toISOString(),
        requestCount: 0,
        errorCount: 0,
        messagesProcessed: 0,
      })
    }

    // Load pending jobs from database (crash recovery)
    await this.recoverFromCrash()

    console.log(`[DiscordShard] Initialized ${this.shards.length} shards, ${allChannelIds.length} channels`)
    console.log(`[DiscordShard] Queue: ${this.queue.filter(j => j.status === 'pending').length} pending jobs`)

    // Start processing queue
    this.startQueueProcessor()

    // Start health checks
    this.startHealthChecks()
  }

  // ============================================================
  // LOAD CONFIGURATION
  // ============================================================

  private getShardTokens(): string[] {
    const tokens: string[] = []

    // Primary token
    if (process.env.DISCORD_BOT_TOKEN) {
      tokens.push(process.env.DISCORD_BOT_TOKEN)
    }

    // Additional shard tokens
    for (let i = 2; i <= 10; i++) {
      const token = process.env[`DISCORD_BOT_TOKEN_${i}`]
      if (token) tokens.push(token)
    }

    // Fallback: split primary token for multiple shards (not recommended for production)
    if (tokens.length === 0 && process.env.DISCORD_BOT_TOKEN) {
      tokens.push(process.env.DISCORD_BOT_TOKEN)
    }

    return tokens
  }

  private getChannelIds(): string[] {
    return (process.env.DISCORD_CHANNEL_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
  }

  // ============================================================
  // CRASH RECOVERY
  // ============================================================

  private async recoverFromCrash(): Promise<void> {
    try {
      // Load unprocessed jobs from database
      const { data: pendingJobs } = await supabase
        .from('discord_queue')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (pendingJobs) {
        for (const job of pendingJobs) {
          // Reset processing jobs to pending
          this.queue.push({
            ...job,
            status: 'pending',
            retryCount: job.retry_count || 0,
            maxRetries: job.max_retries || this.config.maxRetries,
          })
        }

        console.log(`[DiscordShard] Recovered ${pendingJobs.length} jobs from crash`)
      }
    } catch (error: any) {
      console.error('[DiscordShard] Crash recovery error:', error.message)
    }
  }

  // ============================================================
  // QUEUE PROCESSOR
  // ============================================================

  private startQueueProcessor(): void {
    this.processTimer = setInterval(
      () => this.processQueue(),
      this.config.queueProcessIntervalMs
    )
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // Get pending jobs sorted by priority
      const pendingJobs = this.queue
        .filter(j => j.status === 'pending')
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10) // Process 10 at a time

      for (const job of pendingJobs) {
        // Find best available shard
        const shard = this.getAvailableShard(job.channelId)
        if (!shard) {
          // All shards busy, wait
          break
        }

        // Mark as processing
        job.status = 'processing'
        job.processedAt = new Date().toISOString()

        // Update database
        await supabase
          .from('discord_queue')
          .update({ status: 'processing', processed_at: job.processedAt })
          .eq('id', job.id)
          .then(() => {})
          .catch(() => {})

        // Process the job (emit event for the monitor to handle)
        this.emit('job', { job, shard })

        // Rate limit: wait between requests
        await this.sleep(1000 / this.config.requestsPerSecond)

        shard.requestCount++
        shard.messagesProcessed++
        shard.lastActivity = new Date().toISOString()
      }
    } catch (error: any) {
      console.error('[DiscordShard] Queue processing error:', error.message)
    } finally {
      this.isProcessing = false
    }
  }

  private getAvailableShard(channelId: string): BotShard | null {
    // Find shard that owns this channel and isn't busy
    return this.shards.find(s =>
      s.channelIds.includes(channelId) &&
      s.status !== 'rate_limited' &&
      s.status !== 'crashed'
    ) || null
  }

  // ============================================================
  // ADD TO QUEUE
  // ============================================================

  async addToQueue(message: {
    channelId: string
    messageId: string
    content: string
    author: string
    timestamp: string
    priority?: number
  }): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const job: QueuedJob = {
      id: jobId,
      channelId: message.channelId,
      messageId: message.messageId,
      content: message.content,
      author: message.author,
      timestamp: message.timestamp,
      priority: message.priority || 50,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date().toISOString(),
    }

    this.queue.push(job)

    // Persist to database
    await supabase.from('discord_queue').insert({
      id: jobId,
      channel_id: message.channelId,
      message_id: message.messageId,
      content: message.content,
      author: message.author,
      timestamp: message.timestamp,
      priority: message.priority || 50,
      status: 'pending',
      retry_count: 0,
      max_retries: this.config.maxRetries,
    }).then(() => {}).catch(() => {})

    return jobId
  }

  // ============================================================
  // MARK JOB COMPLETE/FAILED
  // ============================================================

  async completeJob(jobId: string): Promise<void> {
    const job = this.queue.find(j => j.id === jobId)
    if (job) {
      job.status = 'completed'
    }

    await supabase
      .from('discord_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', jobId)
      .then(() => {})
      .catch(() => {})
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const job = this.queue.find(j => j.id === jobId)
    if (job) {
      job.retryCount++
      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed'
        job.error = error
      } else {
        // Retry after delay
        job.status = 'pending'
        await this.sleep(this.config.retryDelayMs)
      }
    }

    await supabase
      .from('discord_queue')
      .update({
        status: job?.status || 'failed',
        retry_count: job?.retryCount || 0,
        error,
      })
      .eq('id', jobId)
      .then(() => {})
      .catch(() => {})
  }

  // ============================================================
  // RATE LIMIT HANDLING
  // ============================================================

  async handleRateLimit(shardId: string, retryAfter: number): Promise<void> {
    const shard = this.shards.find(s => s.id === shardId)
    if (shard) {
      shard.status = 'rate_limited'
      console.warn(`[DiscordShard] Shard ${shardId} rate limited, pausing ${retryAfter}s`)

      // Auto-recover after retry-after
      setTimeout(() => {
        shard.status = 'idle'
        shard.requestCount = 0
        console.log(`[DiscordShard] Shard ${shardId} recovered`)
      }, retryAfter * 1000)
    }
  }

  // ============================================================
  // HEALTH CHECKS
  // ============================================================

  private startHealthChecks(): void {
    this.healthTimer = setInterval(
      () => this.runHealthChecks(),
      this.config.healthCheckIntervalMs
    )
  }

  private async runHealthChecks(): Promise<void> {
    for (const shard of this.shards) {
      // Check if shard is stuck (no activity for 5 minutes)
      const timeSinceActivity = Date.now() - new Date(shard.lastActivity).getTime()
      if (timeSinceActivity > 5 * 60 * 1000 && shard.status === 'running') {
        shard.status = 'crashed'
        shard.errorCount++
        console.error(`[DiscordShard] Shard ${shard.id} appears crashed, resetting`)

        // Reset after cooldown
        setTimeout(() => {
          shard.status = 'idle'
          shard.requestCount = 0
        }, 30000)
      }
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  getShardStatus(): BotShard[] {
    return this.shards.map(s => ({ ...s }))
  }

  getQueueStats(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      completed: this.queue.filter(j => j.status === 'completed').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
    }
  }

  async getStats(): Promise<{
    shards: number
    activeShards: number
    totalChannels: number
    queuePending: number
    messagesProcessed: number
  }> {
    return {
      shards: this.shards.length,
      activeShards: this.shards.filter(s => s.status === 'idle' || s.status === 'running').length,
      totalChannels: this.shards.reduce((sum, s) => sum + s.channelIds.length, 0),
      queuePending: this.queue.filter(j => j.status === 'pending').length,
      messagesProcessed: this.shards.reduce((sum, s) => sum + s.messagesProcessed, 0),
    }
  }

  stop(): void {
    if (this.processTimer) clearInterval(this.processTimer)
    if (this.healthTimer) clearInterval(this.healthTimer)
    console.log('[DiscordShard] Stopped')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Simple event emitter for job processing
  private listeners: Record<string, Function[]> = {}
  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(fn)
  }
  private emit(event: string, data: any) {
    (this.listeners[event] || []).forEach(fn => fn(data))
  }
}

// Singleton
export const discordShardManager = new ShardedDiscordManager()
