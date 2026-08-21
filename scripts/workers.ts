// ============================================================
// WORKER BOOTSTRAP
// Standalone process to run background workers
// Run: npm run workers
// ============================================================

import { config } from 'dotenv'
import { resolve } from 'path'
import { startScheduler, stopScheduler } from '../lib/workers/orchestrator'
import { discordMonitor } from '../lib/workers/discord-monitor'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

console.log('============================================')
console.log('  WORKER PROCESS STARTING')
console.log('  Time:', new Date().toISOString())
console.log('============================================')

// Start the orchestrator scheduler
startScheduler()

// Start Discord monitor if enabled
if (process.env.DISCORD_MONITOR_ENABLED === 'true') {
  discordMonitor.start().catch((err: any) => {
    console.error('[Workers] Discord monitor failed to start:', err.message)
  })
}

console.log('[Workers] All workers started. Press Ctrl+C to stop.')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Workers] Shutting down...')
  stopScheduler()
  discordMonitor.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n[Workers] Received SIGTERM, shutting down...')
  stopScheduler()
  discordMonitor.stop()
  process.exit(0)
})

// Keep process alive
setInterval(() => {
  // Heartbeat every 60 seconds
}, 60000)
