'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400',
  reviewing: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
}

export default function AdminReportsPanel() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/reports')
    const data = await res.json()
    if (data.reports) setReports(data.reports)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Delete this report?')) return
    await fetch(`/api/reports?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#2d1b54] flex items-center justify-between">
        <h3 className="text-white font-bold">Game Reports ({reports.length})</h3>
        <Button size="sm" variant="outline" onClick={load} className="border-[#2d1b54] text-gray-400">Refresh</Button>
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No reports yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d1b54] text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Game</th>
                <th className="text-left px-4 py-3">Reported By</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-[#2d1b54]/50 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/game/${r.game_id}`} target="_blank" className="text-[#9d4edd] hover:underline flex items-center gap-1 text-sm">
                      {r.game_title || `Game #${r.game_id}`}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{r.user_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-[#9d4edd]/20 text-[#c77dff] capitalize">{r.report_type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px]">
                    <p className="line-clamp-2 text-xs">{r.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                        className="bg-[#1a103c] border border-[#2d1b54] text-white rounded px-2 py-1 text-xs">
                        {['open', 'reviewing', 'resolved', 'dismissed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => del(r.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
