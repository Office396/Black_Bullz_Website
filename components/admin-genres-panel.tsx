'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

export default function AdminGenresPanel() {
  const [genres, setGenres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/genres')
    const data = await res.json()
    if (data.genres) setGenres(data.genres)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!newName.trim()) return
    setAdding(true)
    await fetch('/api/genres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) })
    setNewName('')
    setAdding(false)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Delete this genre? It will no longer appear in the genre selector.')) return
    await fetch(`/api/genres?id=${id}`, { method: 'DELETE' })
    load()
  }

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return
    setSaving(true)
    await fetch('/api/genres', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: editName.trim() }) })
    setSaving(false)
    setEditingId(null)
    load()
  }

  return (
    <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#2d1b54] flex items-center justify-between">
        <h3 className="text-white font-bold">Genres ({genres.length})</h3>
        <Button size="sm" variant="outline" onClick={load} className="border-[#2d1b54] text-gray-400">Refresh</Button>
      </div>

      {/* Add new */}
      <div className="p-4 border-b border-[#2d1b54] flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New genre name..."
          className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1"
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <Button onClick={add} disabled={adding || !newName.trim()} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : genres.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No genres yet</div>
      ) : (
        <div className="divide-y divide-[#2d1b54]/50">
          {genres.map(g => (
            <div key={g.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
              {editingId === g.id ? (
                <>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-[#1a103c] border-[#2d1b54] text-white text-sm flex-1 h-8"
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditingId(null) }} autoFocus />
                  <button onClick={() => saveEdit(g.id)} disabled={saving} className="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded text-gray-500 hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-white text-sm font-medium">{g.name}</span>
                  <span className="text-gray-600 text-xs font-mono">{g.slug}</span>
                  <button onClick={() => { setEditingId(g.id); setEditName(g.name) }} className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(g.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
