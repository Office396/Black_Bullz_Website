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
  // This is a simplified version - in real Supabase you'd use their REST API
  // For now, we'll return static free tier info
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