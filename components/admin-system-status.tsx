'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Server, Globe, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface SystemStatus {
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
  usage: {
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
      dashboardUrl?: string | null
    }>
  }
}

export default function AdminSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/monitoring')
      const result = await response.json()

      if (result.success) {
        setStatus(result.data)
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>Checking system health...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            System Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to check system status: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchStatus} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  return (
    <div className="space-y-6">
      {/* Supabase Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Database
            {status.supabase.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>Database connection and health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <Badge variant={status.supabase.connected ? "default" : "destructive"}>
              {status.supabase.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {status.supabase.projectUrl && (
            <div className="flex items-center justify-between">
              <span>Project URL:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {status.supabase.projectUrl}
              </code>
            </div>
          )}

          {status.supabase.error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {status.supabase.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{status.database.itemCount}</div>
              <div className="text-sm text-gray-600">Games/Software</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.database.commentCount}</div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.database.downloadPageCount}</div>
              <div className="text-sm text-gray-600">Active Downloads</div>
            </div>
          </div>

          <div className="pt-4 border-t mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-400">Export your entire game library database</span>
            <Button onClick={() => window.open('/api/export-games', '_blank')} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white">
              <Database className="w-4 h-4 mr-2" />
              Export All Games Details to Text File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Free Tier Quotas
          </CardTitle>
          <CardDescription>Supabase free plan limits — storage is measured in real-time, others require the Supabase dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="divide-y divide-[#2d1b54]/50">
            {status.usage.quotas.map(q => (
              <div key={q.name} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{q.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#9d4edd]/20 text-[#c77dff] font-mono">{q.limit}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{q.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {q.used ? (
                      <span className="text-sm font-semibold text-white">{q.used}</span>
                    ) : q.dashboardUrl ? (
                      <a
                        href={q.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#9d4edd] hover:text-[#c77dff] underline underline-offset-2 transition-colors"
                      >
                        View in Dashboard →
                      </a>
                    ) : (
                      <span className="text-xs text-gray-600 italic">unavailable</span>
                    )}
                  </div>
                </div>
                {q.percent !== null && (
                  <div className="mt-2">
                    <div className="w-full bg-[#1a103c] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${q.percent > 80 ? 'bg-red-500' : q.percent > 50 ? 'bg-yellow-500' : 'bg-[#9d4edd]'}`}
                        style={{ width: `${Math.max(q.percent, 0.5)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{q.percent}% used</p>
                  </div>
                )}
                {/* Storage bucket breakdown */}
                {q.name === 'File Storage' && status.usage.storageBuckets.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {status.usage.storageBuckets.map(b => (
                      <div key={b.name} className="flex justify-between text-xs text-gray-500 pl-2 border-l border-[#2d1b54]">
                        <span className="font-mono">{b.name}</span>
                        <span>{b.size}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.name === 'File Storage' && status.usage.storageBuckets.length === 0 && (
                  <p className="text-xs text-gray-600 mt-1 pl-2">No storage buckets found</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vercel Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Vercel Deployment
          </CardTitle>
          <CardDescription>Hosting platform status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.vercel.deploymentUrl && (
            <div className="flex items-center justify-between">
              <span>Live URL:</span>
              <a
                href={status.vercel.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {status.vercel.deploymentUrl}
              </a>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Last Deployment:</span>
            <Badge variant="outline">{status.vercel.lastDeployment || 'Unknown'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  )
}