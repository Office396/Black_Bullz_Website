'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

const EMPTY_PUB = { name: '', biography: '', overview: '', known_for: '', birth_place: '', birthday: '', logo_url: '', banner_url: '', website: '' }

export default function AdminPublishersPanel() {
  const [publishers, setPublishers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_PUB)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    // Load from publishers table
    const res = await fetch('/api/publishers')
    const data = await res.json()
    const registered: any[] = data.publishers || []

    // Also load publishers from items that aren't in the publishers table
    try {
      const itemsRes = await fetch('/api/items')
      const itemsData = await itemsRes.json()
      const items: any[] = itemsData.data || []
      const registeredNames = new Set(registered.map((p: any) => p.name.toLowerCase()))
      const itemPubNames = Array.from(new Set(
        items.filter((g: any) => g.publisher?.trim()).map((g: any) => g.publisher!.trim())
      )).filter(name => !registeredNames.has(name.toLowerCase()))

      const itemPubs = itemPubNames.map(name => ({
        id: `item-${name}`, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        fromItems: true, biography: null, overview: null, known_for: null,
      }))
      setPublishers([...registered, ...itemPubs])
    } catch {
      setPublishers(registered)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    if (editing) {
      await fetch('/api/publishers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: editing.id, ...form }) })
    } else {
      await fetch('/api/publishers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setEditing(null)
    setCreating(false)
    setForm(EMPTY_PUB)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Delete this publisher?')) return
    await fetch('/api/publishers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    load()
  }

  const startEdit = (pub: any) => {
    setEditing(pub)
    setCreating(false)
    setForm({ name: pub.name || '', biography: pub.biography || '', overview: pub.overview || '', known_for: pub.known_for || '', birth_place: pub.birth_place || '', birthday: pub.birthday || '', logo_url: pub.logo_url || '', banner_url: pub.banner_url || '', website: pub.website || '' })
  }

  const cancel = () => { setEditing(null); setCreating(false); setForm(EMPTY_PUB) }

  const fields = [
    { key: 'name', label: 'Name *', type: 'input' },
    { key: 'overview', label: 'Overview', type: 'textarea' },
    { key: 'biography', label: 'Biography', type: 'textarea' },
    { key: 'known_for', label: 'Known For', type: 'input' },
    { key: 'birth_place', label: 'Birth Place', type: 'input' },
    { key: 'birthday', label: 'Birthday', type: 'input', placeholder: '01 Jan, 1983' },
    { key: 'logo_url', label: 'Logo URL', type: 'input' },
    { key: 'banner_url', label: 'Banner URL', type: 'input' },
    { key: 'website', label: 'Website', type: 'input' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Publishers ({publishers.length})</h3>
        {!creating && !editing && (
          <Button onClick={() => { setCreating(true); setEditing(null); setForm(EMPTY_PUB) }} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
            <Plus className="w-4 h-4 mr-2" /> Add Publisher
          </Button>
        )}
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="bg-[#120b22] border border-[#9d4edd]/30 rounded-xl p-5 space-y-4">
          <h4 className="text-white font-bold">{editing ? 'Edit Publisher' : 'New Publisher'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="text-gray-400 text-xs mb-1 block">{f.label}</label>
                {f.type === 'textarea' ? (
                  <Textarea value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="bg-[#1a103c] border-[#2d1b54] text-white text-sm min-h-[80px]" placeholder={f.placeholder} />
                ) : (
                  <Input value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="bg-[#1a103c] border-[#2d1b54] text-white text-sm" placeholder={f.placeholder} />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name?.trim()} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={cancel} variant="outline" className="border-[#2d1b54] text-gray-400">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : publishers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No publishers yet</div>
      ) : (
        <div className="space-y-3">
          {publishers.map(pub => (
            <div key={pub.id} className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4 flex items-start gap-4">
              {pub.logo_url && (
                <img src={pub.logo_url} alt={pub.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold">{pub.name}</p>
                  {pub.fromItems && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">from items</span>}
                </div>
                {pub.known_for && <p className="text-[#9d4edd] text-xs mt-0.5">Known for: {pub.known_for}</p>}
                {pub.overview && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{pub.overview}</p>}
                {pub.fromItems && <p className="text-gray-600 text-xs mt-1">Add full profile by clicking Edit</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {pub.birth_place && <span>From: {pub.birth_place}</span>}
                  {pub.birthday && <span>Born: {pub.birthday}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => {
                  if (pub.fromItems) {
                    // Pre-fill name, allow creating full profile
                    setCreating(true); setEditing(null)
                    setForm({ ...EMPTY_PUB, name: pub.name })
                  } else {
                    startEdit(pub)
                  }
                }} className="border-[#2d1b54] text-gray-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {!pub.fromItems && (
                  <Button size="sm" variant="outline" onClick={() => del(pub.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
