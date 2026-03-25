import { supabase } from '../supabase'

export interface SystemStatus {
  supabase: {
    connected: boolean
    error?: string
    projectUrl?: string
  }
  database: {
    tablesExist: boolean
    itemCount: number
    commentCount: number
    downloadPageCount: number
  }
  vercel: {
    deploymentUrl?: string
    lastDeployment?: string
  }
}

export async function checkSystemStatus(): Promise<SystemStatus> {
  const status: SystemStatus = {
    supabase: { connected: false },
    database: { tablesExist: false, itemCount: 0, commentCount: 0, downloadPageCount: 0 },
    vercel: {}
  }

  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('items').select('count').limit(1)
    if (!error) {
      status.supabase.connected = true
      status.supabase.projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      status.supabase.error = error.message
    }

    // Check database tables and counts
    if (status.supabase.connected) {
      try {
        // Check items count
        const { count: itemCount, error: itemError } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
        if (!itemError) {
          status.database.itemCount = itemCount || 0
          status.database.tablesExist = true
        }

        // Check comments count
        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
        if (!commentError) {
          status.database.commentCount = commentCount || 0
        }

        // Check download pages count
        const { count: downloadCount, error: downloadError } = await supabase
          .from('download_pages')
          .select('*', { count: 'exact', head: true })
        if (!downloadError) {
          status.database.downloadPageCount = downloadCount || 0
        }
      } catch (dbError: any) {
        status.database.tablesExist = false
      }
    }

    // Vercel info (from environment)
    status.vercel.deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    status.vercel.lastDeployment = process.env.VERCEL_GIT_COMMIT_SHA ? 'Recent' : 'Unknown'

  } catch (error: any) {
    status.supabase.error = error.message
  }

  return status
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function getBucketSize(bucketName: string): Promise<number> {
  let totalBytes = 0
  const listFolder = async (prefix: string) => {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, { limit: 1000 })
    if (error || !data) return
    for (const item of data) {
      if (item.metadata?.size) {
        totalBytes += item.metadata.size
      } else if (!item.id) {
        // It's a folder — recurse
        await listFolder(prefix ? `${prefix}/${item.name}` : item.name)
      }
    }
  }
  await listFolder('')
  return totalBytes
}

export async function getSupabaseUsage(): Promise<{
  storageUsed: string
  storageBuckets: Array<{ name: string; size: string; sizeBytes: number }>
  storagePercent: number
  tier: string
  quotas: Array<{
    name: string
    limit: string
    used: string | null
    percent: number | null
    description: string
  }>
}> {
  const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB free tier

  let totalStorageBytes = 0
  const bucketStats: Array<{ name: string; size: string; sizeBytes: number }> = []

  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (!bucketsError && buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        const sizeBytes = await getBucketSize(bucket.name)
        totalStorageBytes += sizeBytes
        bucketStats.push({ name: bucket.name, size: formatBytes(sizeBytes), sizeBytes })
      }
    }
  } catch {}

  const storagePercent = Math.min(100, Math.round((totalStorageBytes / STORAGE_LIMIT_BYTES) * 1000) / 10)
  const storageUsed = formatBytes(totalStorageBytes)

  // Count users for Auth MAU estimate
  let userCount = 0
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
    userCount = count || 0
  } catch {}

  const authPercent = Math.min(100, Math.round((userCount / 50000) * 1000) / 10)

  // Get real database size via pg_database_size()
  let dbSizeStr = 'run add_get_db_size_fn.sql first'
  let dbPercent: number | null = null
  try {
    const { data: dbSize } = await supabase.rpc('get_db_size')
    if (dbSize) {
      const dbSizeBytes = Number(dbSize)
      dbSizeStr = formatBytes(dbSizeBytes)
      dbPercent = Math.min(100, Math.round((dbSizeBytes / (500 * 1024 * 1024)) * 1000) / 10)
    }
  } catch {}

  // Supabase free tier does NOT expose bandwidth/edge/realtime via any public API.
  // These metrics are only visible inside the Supabase dashboard (internal systems).
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? ''
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/reports`

  const quotas = [
    {
      name: 'Database',
      limit: '500 MB',
      used: dbSizeStr,
      percent: dbPercent,
      description: 'Full Postgres database storage for your tables and data.',
      dashboardUrl: null,
    },
    {
      name: 'File Storage',
      limit: '1 GB',
      used: storageUsed,
      percent: storagePercent,
      description: 'Dedicated space for images, videos, and documents.',
      dashboardUrl: null,
    },
    {
      name: 'Auth (Users)',
      limit: '50,000 MAU',
      used: `${userCount.toLocaleString()} registered`,
      percent: authPercent,
      description: 'Monthly Active Users who log in or refresh tokens.',
      dashboardUrl: null,
    },
    {
      name: 'Bandwidth',
      limit: '5 GB egress',
      used: null,
      percent: null,
      description: 'Total data transfer out of your project per month.',
      dashboardUrl,
    },
    {
      name: 'Edge Functions',
      limit: '500,000 invocations',
      used: null,
      percent: null,
      description: 'Total serverless function invocations per month.',
      dashboardUrl,
    },
    {
      name: 'Realtime',
      limit: '2 million messages',
      used: null,
      percent: null,
      description: 'Total messages sent via WebSockets per month.',
      dashboardUrl,
    },
  ]

  return { storageUsed, storageBuckets: bucketStats, storagePercent, tier: 'Free', quotas }
}