// ============================================================
// ADMIN OPERATIONS DASHBOARD
// Worker monitoring, earnings, link health, moderation queue
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RefreshCw, Activity, DollarSign, Link, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, Server, Globe,
  TrendingUp, Download, Eye, BarChart3, Shield
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface WorkerStatus {
  worker_name: string
  status: string
  last_heartbeat: string
  last_result: any
  config: any
}

interface EarningsSummary {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  bySource: Record<string, number>
}

interface LinkHealth {
  total: number
  active: number
  dead: number
  checking: number
  healthScore: number
}

interface ModerationItem {
  id: number
  item_type: string
  item_id: number
  reason: string
  severity: string
  status: string
  auto_flagged: boolean
  created_at: string
}

interface DailyStats {
  date: string
  page_views: number
  unique_visitors: number
  downloads: number
  revenue: number
}

// ============================================================
// OPERATIONS DASHBOARD COMPONENT
// ============================================================

export default function AdminOperationsDashboard() {
  const [workers, setWorkers] = useState<WorkerStatus[]>([])
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [linkHealth, setLinkHealth] = useState<LinkHealth | null>(null)
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([])
  const [recentStats, setRecentStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAllData = async () => {
    try {
      setRefreshing(true)

      // Fetch worker status
      const workersRes = await fetch('/api/workers?action=status')
      const workersData = await workersRes.json()
      if (workersData.success) {
        setWorkers(workersData.workers || [])
      }

      // Fetch earnings
      const earningsRes = await fetch('/api/analytics?type=earnings')
      const earningsData = await earningsRes.json()
      if (earningsData.success) {
        setEarnings(earningsData.data)
      }

      // Fetch link health
      const healthRes = await fetch('/api/workers?action=link-health')
      const healthData = await healthRes.json()
      if (healthData.success) {
        setLinkHealth(healthData.data)
      }

      // Fetch moderation queue
      const modRes = await fetch('/api/moderation?status=pending')
      const modData = await modRes.json()
      if (modData.success) {
        setModerationQueue(modData.data || [])
      }

      // Fetch recent stats
      const statsRes = await fetch('/api/analytics?type=daily-stats&days=7')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setRecentStats(statsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [])

  const triggerWorker = async (workerName: string) => {
    try {
      await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker: workerName, action: 'trigger' }),
      })
      setTimeout(fetchAllData, 2000)
    } catch (error) {
      console.error('Error triggering worker:', error)
    }
  }

  const triggerAllWorkers = async () => {
    try {
      await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger-all' }),
      })
      setTimeout(fetchAllData, 2000)
    } catch (error) {
      console.error('Error triggering all workers:', error)
    }
  }

  const handleModeration = async (id: number, action: 'approve' | 'reject') => {
    try {
      await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setModerationQueue(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error handling moderation:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-[#9d4edd] animate-spin" />
        <span className="ml-2 text-gray-400">Loading operations data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#9d4edd]" />
          Operations Dashboard
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchAllData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-[#2d1b54] text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={triggerAllWorkers}
            size="sm"
            className="bg-[#9d4edd] hover:bg-[#7b2cbf]"
          >
            <Zap className="w-4 h-4 mr-2" />
            Run All Workers
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Earnings Card */}
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today&apos;s Earnings</p>
                <p className="text-2xl font-bold text-green-400">
                  ${earnings?.today?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This month: ${earnings?.thisMonth?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        {/* Link Health Card */}
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Link Health</p>
                <p className="text-2xl font-bold text-[#4ade80]">
                  {linkHealth?.healthScore || 0}%
                </p>
              </div>
              <Link className="w-8 h-8 text-[#4ade80] opacity-50" />
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-400">{linkHealth?.active || 0} active</span>
              <span className="text-red-400">{linkHealth?.dead || 0} dead</span>
            </div>
          </CardContent>
        </Card>

        {/* Workers Card */}
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Workers</p>
                <p className="text-2xl font-bold text-[#9d4edd]">
                  {workers.filter(w => w.status === 'running').length}/{workers.length}
                </p>
              </div>
              <Server className="w-8 h-8 text-[#9d4edd] opacity-50" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {workers.filter(w => w.status === 'idle').length} idle
            </p>
          </CardContent>
        </Card>

        {/* Moderation Card */}
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Moderation</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {moderationQueue.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {moderationQueue.filter(m => m.severity === 'high').length} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Worker Status Grid */}
      <Card className="bg-[#120b22] border-[#2d1b54]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-[#9d4edd]" />
            Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workers.map((worker) => (
              <div
                key={worker.worker_name}
                className="flex items-center justify-between p-3 bg-[#1a103c] rounded-lg border border-[#2d1b54]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    worker.status === 'running' ? 'bg-green-400 animate-pulse' :
                    worker.status === 'idle' ? 'bg-gray-400' :
                    worker.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <div>
                    <p className="text-white text-sm font-medium">{worker.worker_name}</p>
                    <p className="text-gray-500 text-xs">
                      {worker.last_heartbeat ? new Date(worker.last_heartbeat).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    worker.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    worker.status === 'idle' ? 'bg-gray-500/20 text-gray-400' :
                    worker.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }>
                    {worker.status}
                  </Badge>
                  <Button
                    onClick={() => triggerWorker(worker.worker_name)}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 border-[#2d1b54] text-gray-400 hover:text-white"
                  >
                    <Zap className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      {moderationQueue.length > 0 && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Moderation Queue ({moderationQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moderationQueue.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-[#1a103c] rounded-lg border border-[#2d1b54]"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={
                      item.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      item.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      item.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }>
                      {item.severity}
                    </Badge>
                    <div>
                      <p className="text-white text-sm">{item.item_type} #{item.item_id}</p>
                      <p className="text-gray-500 text-xs">{item.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleModeration(item.id, 'approve')}
                      size="sm"
                      className="h-7 px-3 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleModeration(item.id, 'reject')}
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Source */}
      {earnings?.bySource && Object.keys(earnings.bySource).length > 0 && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#9d4edd]" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(earnings.bySource).map(([source, amount]) => (
                <div key={source} className="p-3 bg-[#1a103c] rounded-lg border border-[#2d1b54]">
                  <p className="text-gray-400 text-sm capitalize">{source}</p>
                  <p className="text-xl font-bold text-white">${(amount as number).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
