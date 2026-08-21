'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Server, Globe, AlertTriangle, CheckCircle, XCircle, Trash2, Download, Upload } from 'lucide-react'

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
  const [showNukeConfirm, setShowNukeConfirm] = useState(false)
  const [nukeLoading, setNukeLoading] = useState(false)
  const [nukeResult, setNukeResult] = useState<string | null>(null)
  const [nukeStep, setNukeStep] = useState(0)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importMeta, setImportMeta] = useState<any>(null)

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

  const handleNuke = async () => {
    setNukeLoading(true)
    setNukeResult(null)
    setNukeStep(1)
    try {
      const response = await fetch('/api/admin/nuke', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        setNukeResult(`Successfully deleted ${result.totalDeleted} total records from all tables.`)
        fetchStatus()
      } else {
        const errors = Object.entries(result.results || {})
          .filter(([_, r]: [string, any]) => !r.success)
          .map(([table, r]: [string, any]) => `${table}: ${r.error}`)
          .join(', ')
        setNukeResult(`Partial success. Errors: ${errors}`)
        fetchStatus()
      }
    } catch (err: any) {
      setNukeResult(`Error: ${err.message}`)
    } finally {
      setNukeLoading(false)
      setNukeStep(0)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportResult(null)
    setImportMeta(null)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup._meta || !backup._meta.version) {
        setImportResult('Error: Invalid backup file format')
        return
      }

      setImportMeta(backup._meta)

      const response = await fetch('/api/admin/import-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup }),
      })

      const result = await response.json()

      if (result.success) {
        setImportResult(`Successfully restored ${result.totalInserted} records from backup`)
        fetchStatus()
      } else {
        const errors = Object.entries(result.results || {})
          .filter(([_, r]: [string, any]) => !r.success)
          .map(([table, r]: [string, any]) => `${table}: ${r.error}`)
          .join(', ')
        setImportResult(`Partial restore. Errors: ${errors}`)
      }
    } catch (err: any) {
      setImportResult(`Error: ${err.message}`)
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

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
              <div className="text-sm text-gray-600">Games</div>
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

          <div className="pt-4 border-t mt-4">
            <div className="flex flex-col gap-3">
              <span className="text-sm text-gray-400">Backup & Restore your entire database</span>
              <div className="flex gap-3">
                <Button onClick={() => window.open('/api/export-games', '_blank')} className="bg-[#9d4edd] hover:bg-[#7b2cbf] text-white flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Backup (JSON)
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    disabled={importLoading}
                  />
                  <Button
                    asChild
                    className={`w-full cursor-pointer ${importLoading ? 'bg-yellow-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    disabled={importLoading}
                  >
                    <span>
                      {importLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {importLoading ? 'Restoring...' : 'Import Backup (JSON)'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {importMeta && (
              <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-300 text-xs font-semibold mb-1">Backup Info:</p>
                <p className="text-blue-200/70 text-xs">
                  {importMeta.totalTables} tables, {importMeta.totalRows} rows, exported {new Date(importMeta.exportedAt).toLocaleString()}
                </p>
              </div>
            )}

            {importResult && (
              <Alert className={`mt-3 ${importResult.includes('Error') ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                <AlertDescription className={importResult.includes('Error') ? 'text-red-300' : 'text-green-300'}>
                  {importResult}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="pt-4 border-t mt-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-red-400 font-semibold">Danger Zone</span>
              <p className="text-xs text-gray-500 mt-0.5">Permanently delete ALL data from the database</p>
            </div>
            <Button onClick={() => { setShowNukeConfirm(true); setNukeResult(null) }} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Data
            </Button>
          </div>

          {nukeResult && (
            <Alert className={`mt-3 ${nukeResult.includes('Error') || nukeResult.includes('Partial') ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
              <AlertDescription className={nukeResult.includes('Error') || nukeResult.includes('Partial') ? 'text-red-300' : 'text-green-300'}>
                {nukeResult}
              </AlertDescription>
            </Alert>
          )}
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

      {/* Nuke Confirmation Modal */}
      {showNukeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !nukeLoading && setShowNukeConfirm(false)}>
          <div className="bg-[#120b22] border border-red-500/40 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/10" onClick={e => e.stopPropagation()}>
            {!nukeLoading ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Delete All Data?</h3>
                    <p className="text-gray-400 text-sm">This cannot be undone</p>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                  <p className="text-red-300 text-sm font-semibold mb-2">This will permanently delete:</p>
                  <ul className="text-red-200/70 text-xs space-y-1">
                    <li>• All games & mirrors</li>
                    <li>• All repackers & genres</li>
                    <li>• All comments & reactions</li>
                    <li>• All reviews & ratings</li>
                    <li>• All bug reports & moderation queue</li>
                    <li>• All analytics & click logs</li>
                    <li>• All worker status & sticky sessions</li>
                    <li>• All users, favourites & history</li>
                    <li>• All notifications & contact messages</li>
                    <li>• All old items data</li>
                  </ul>
                  <p className="text-yellow-300/70 text-xs mt-2">⚠ Export a backup first if you want to keep your data</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowNukeConfirm(false)} variant="outline" className="flex-1 border-[#2d1b54] text-gray-400 hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button onClick={handleNuke} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Yes, Delete Everything
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <Trash2 className="w-6 h-6 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white font-semibold">Deleting all data...</p>
                <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}