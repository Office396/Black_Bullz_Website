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

export async function getSupabaseUsage(): Promise<{
  databaseSize: string
  bandwidthUsed: string
  tier: string
  limits: {
    databaseSize: string
    bandwidth: string
  }
}> {
  try {
    // Get actual database size by querying the items table
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')

    let databaseSizeBytes = 0
    if (!itemsError && itemsData) {
      // Estimate size based on number of items and average item size
      // Each item has multiple fields, estimate ~2KB per item
      databaseSizeBytes = itemsData.length * 2048

      // Add comments table size
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
      if (!commentsError && commentsData) {
        databaseSizeBytes += commentsData.length * 512 // ~512 bytes per comment
      }

      // Add download pages table size
      const { data: downloadPagesData, error: downloadPagesError } = await supabase
        .from('download_pages')
        .select('*')
      if (!downloadPagesError && downloadPagesData) {
        databaseSizeBytes += downloadPagesData.length * 1024 // ~1KB per download page
      }
    }

    // Convert bytes to MB
    const databaseSizeMB = Math.round(databaseSizeBytes / (1024 * 1024) * 100) / 100

    // For bandwidth, we can't get real data from Supabase API without authentication
    // This would require Supabase service role key and REST API access
    // For now, return estimated bandwidth based on Vercel analytics or static data
    const bandwidthUsed = '0 GB' // This would need to be tracked separately

    return {
      databaseSize: `${databaseSizeMB} MB`,
      bandwidthUsed: bandwidthUsed,
      tier: 'Free',
      limits: {
        databaseSize: '500 MB',
        bandwidth: '50 GB'
      }
    }
  } catch (error) {
    console.error('Error getting Supabase usage:', error)
    // Fallback to static data
    return {
      databaseSize: '0 MB',
      bandwidthUsed: '0 GB',
      tier: 'Free',
      limits: {
        databaseSize: '500 MB',
        bandwidth: '50 GB'
      }
    }
  }
}