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
    databaseSize: string
    bandwidthUsed: string
    tier: string
    limits: {
      databaseSize: string
      bandwidth: string
    }
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
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>Current usage vs limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Tier:</span>
            <Badge variant="outline">{status.usage.tier}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Database Size:</span>
              <span>{status.usage.databaseSize} / {status.usage.limits.databaseSize}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bandwidth:</span>
              <span>{status.usage.bandwidthUsed} / {status.usage.limits.bandwidth}</span>
            </div>
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