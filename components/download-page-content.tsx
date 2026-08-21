// ============================================================
// DOWNLOAD PAGE COMPONENT
// The money page - where revenue is generated
// Features: Mirror selection, installation notes, file structure,
//           live status badges, download counter
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download, ExternalLink, Clock, Shield, AlertTriangle,
  CheckCircle, XCircle, HardDrive, Cpu, Monitor, Copy,
  ChevronDown, ChevronUp, Eye, Zap, Server, Globe
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ============================================================
// TYPES
// ============================================================

interface Mirror {
  id: number
  host_name: string
  download_url: string
  file_name: string
  file_size: string
  part_number: number
  total_parts: number
  status: 'active' | 'dead' | 'checking'
  last_alive: string
  clicks: number
  priority: number
  score?: number
}

interface GameData {
  id: number
  title: string
  slug: string
  cover_image: string
  repack_size: string
  original_size: string
  repacker_name: string
  installation_notes: string
  rar_password: string
  languages: string
  system_requirements: any
  mirrors: Mirror[]
  magnet_link: string
  downloads: number
  torrent_seeders: number
  torrent_leechers: number
}

// ============================================================
// HOST ICONS & COLORS
// ============================================================

const HOST_CONFIG: Record<string, { color: string; icon: string; speed: string }> = {
  '1fichier': { color: '#ff6b6b', icon: '📁', speed: 'Fast' },
  'mega.nz': { color: '#d9274e', icon: '☁️', speed: 'Fast' },
  'gofile': { color: '#4ade80', icon: '💾', speed: 'Medium' },
  'pixeldrain': { color: '#60a5fa', icon: '🖊️', speed: 'Medium' },
  'mediafire': { color: '#8b5cf6', icon: '🔥', speed: 'Medium' },
  'google drive': { color: '#fbbf24', icon: '📀', speed: 'Fast' },
  'onedrive': { color: '#0078d4', icon: '☁️', speed: 'Fast' },
  'buzzheavier': { color: '#f97316', icon: '⚡', speed: 'Slow' },
}

// ============================================================
// MIRROR STATUS BADGE
// ============================================================

function MirrorStatusBadge({ mirror }: { mirror: Mirror }) {
  const getStatusInfo = () => {
    if (mirror.status === 'dead') return { label: 'Dead', color: 'bg-red-500', icon: <XCircle className="w-3 h-3" /> }
    if (mirror.status === 'checking') return { label: 'Checking', color: 'bg-yellow-500', icon: <Clock className="w-3 h-3" /> }

    // Check last alive time
    if (mirror.last_alive) {
      const hoursSinceAlive = (Date.now() - new Date(mirror.last_alive).getTime()) / (1000 * 60 * 60)
      if (hoursSinceAlive < 24) return { label: 'Online', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> }
      if (hoursSinceAlive < 72) return { label: 'Stable', color: 'bg-blue-500', icon: <CheckCircle className="w-3 h-3" /> }
      if (hoursSinceAlive < 168) return { label: 'Aging', color: 'bg-yellow-500', icon: <Clock className="w-3 h-3" /> }
    }

    return { label: 'Unknown', color: 'bg-gray-500', icon: <AlertTriangle className="w-3 h-3" /> }
  }

  const status = getStatusInfo()
  const hostConfig = HOST_CONFIG[mirror.host_name?.toLowerCase()] || { color: '#888', speed: 'Unknown' }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${status.color} text-white text-xs`}>
        {status.icon} {status.label}
      </Badge>
      <Badge variant="outline" className="text-xs" style={{ borderColor: hostConfig.color }}>
        {hostConfig.speed}
      </Badge>
    </div>
  )
}

// ============================================================
// MIRROR ROW COMPONENT
// ============================================================

function MirrorRow({ mirror, gameId, onSelect }: { mirror: Mirror; gameId: number; onSelect: (m: Mirror) => void }) {
  const hostConfig = HOST_CONFIG[mirror.host_name?.toLowerCase()] || { color: '#888', icon: '📁', speed: 'Unknown' }

  return (
    <div className="flex items-center justify-between p-3 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg hover:border-[#9d4edd]/50 transition-all">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{hostConfig.icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{mirror.host_name}</span>
            <MirrorStatusBadge mirror={mirror} />
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {mirror.file_size && <span>{mirror.file_size}</span>}
            {mirror.total_parts > 1 && <span> • Part {mirror.part_number}/{mirror.total_parts}</span>}
            {mirror.clicks > 0 && <span> • {mirror.clicks.toLocaleString()} downloads</span>}
          </div>
        </div>
      </div>
      <Button
        onClick={() => onSelect(mirror)}
        className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-bold px-6"
      >
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  )
}

// ============================================================
// INSTALLATION NOTES COMPONENT
// ============================================================

function InstallationNotes({ notes, password }: { notes: string; password: string }) {
  const [expanded, setExpanded] = useState(false)

  if (!notes && !password) return null

  return (
    <Card className="bg-[#120b22] border-yellow-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Installation Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {password && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <Shield className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-medium">RAR Password:</span>
            <code className="text-white bg-[#1a103c] px-2 py-1 rounded text-sm font-mono">{password}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(password)}
              className="text-yellow-500 hover:text-yellow-400"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}

        {notes && (
          <>
            <div className={`text-gray-300 text-sm whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}>
              {notes}
            </div>
            {notes.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-[#9d4edd] hover:text-[#7b2cbf]"
              >
                {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {expanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// FILE STRUCTURE PREVIEW
// ============================================================

function FileStructurePreview({ mirrors, repackSize }: { mirrors: Mirror[]; repackSize: string }) {
  const [showStructure, setShowStructure] = useState(false)

  // Generate likely file structure based on repack type
  const getFileStructure = () => {
    const hasInstaller = mirrors.some(m => m.host_name?.toLowerCase().includes('elamigos'))
    const hasParts = mirrors.some(m => m.total_parts > 1)

    if (hasInstaller) {
      return [
        { name: 'Setup.exe', type: 'file', size: '~50 MB' },
        { name: 'Autorun.inf', type: 'file', size: '1 KB' },
        { name: 'Redist/', type: 'folder', children: [
          { name: 'DirectX/', type: 'folder' },
          { name: 'VCRedist/', type: 'folder' },
        ]},
        { name: 'Game/', type: 'folder', children: [
          { name: '[GameName]/', type: 'folder' },
        ]},
      ]
    }

    // FitGirl-style structure
    return [
      { name: 'setup.exe', type: 'file', size: '~5 MB' },
      { name: 'Verify BIN files.bat', type: 'file', size: '1 KB' },
      { name: 'MD5 checksum', type: 'file', size: '1 KB' },
      { name: '[GameName]/', type: 'folder', children: [
        { name: 'data.bin', type: 'file', size: repackSize || '~10 GB' },
      ]},
    ]
  }

  const structure = getFileStructure()

  const renderTree = (items: any[], indent = 0) => {
    return items.map((item, i) => (
      <div key={i} style={{ paddingLeft: indent * 16 }} className="flex items-center gap-2 py-0.5">
        {item.type === 'folder' ? (
          <span className="text-yellow-500">📁</span>
        ) : (
          <span className="text-blue-400">📄</span>
        )}
        <span className="text-gray-300 text-sm font-mono">{item.name}</span>
        {item.size && <span className="text-gray-500 text-xs">({item.size})</span>}
        {item.children && renderTree(item.children, indent + 1)}
      </div>
    ))
  }

  return (
    <Card className="bg-[#120b22] border-[#2d1b54]">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-white text-sm flex items-center gap-2 cursor-pointer"
          onClick={() => setShowStructure(!showStructure)}
        >
          <HardDrive className="w-4 h-4 text-blue-400" />
          File Structure Preview
          {showStructure ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </CardTitle>
      </CardHeader>
      {showStructure && (
        <CardContent>
          <div className="bg-[#0a0515] rounded-lg p-3 font-mono text-sm">
            {renderTree(structure)}
          </div>
          <p className="text-gray-500 text-xs mt-2">
            * File structure may vary slightly depending on the repacker
          </p>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================
// DOWNLOAD COUNTER WIDGET
// ============================================================

function DownloadCounter({ downloads, className = '' }: { downloads: number; className?: string }) {
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    // Animate the counter
    const target = downloads
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayCount(target)
        clearInterval(timer)
      } else {
        setDisplayCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [downloads])

  return (
    <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
      <Download className="w-4 h-4" />
      <span className="text-sm">
        <span className="text-white font-bold">{displayCount.toLocaleString()}</span> downloads
      </span>
    </div>
  )
}

// ============================================================
// MAIN DOWNLOAD PAGE COMPONENT
// ============================================================

export default function DownloadPageContent({ game }: { game: GameData }) {
  const [selectedMirror, setSelectedMirror] = useState<Mirror | null>(null)
  const [showAllMirrors, setShowAllMirrors] = useState(false)

  // Separate mirrors by type
  const directMirrors = game.mirrors.filter(m =>
    !m.host_name?.toLowerCase().includes('torrent') &&
    m.status !== 'dead'
  )
  const hasMagnet = !!game.magnet_link

  const displayedMirrors = showAllMirrors ? directMirrors : directMirrors.slice(0, 5)

  const handleMirrorSelect = (mirror: Mirror) => {
    setSelectedMirror(mirror)
    // Trigger download through smart redirect
    window.location.href = `/api/download?gameId=${game.id}&mirrorId=${mirror.id}&format=redirect`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="flex gap-4 items-start">
        <Image
          src={game.cover_image || '/placeholder.svg'}
          alt={game.title}
          width={120}
          height={120}
          className="rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{game.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span>by <span className="text-[#9d4edd]">{game.repacker_name}</span></span>
            <span>•</span>
            <span>{game.repack_size || 'Unknown size'}</span>
            {game.original_size && (
              <>
                <span>•</span>
                <span>Original: {game.original_size}</span>
              </>
            )}
          </div>
          <DownloadCounter downloads={game.downloads} className="mt-3" />
        </div>
      </div>

      {/* Installation Notes */}
      <InstallationNotes notes={game.installation_notes} password={game.rar_password} />

      {/* File Structure Preview */}
      <FileStructurePreview mirrors={game.mirrors} repackSize={game.repack_size} />

      {/* Direct Download Section */}
      <Card className="bg-[#120b22] border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Direct Download
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Choose a file host to download from. We recommend 1fichier for fastest speeds.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedMirrors.map(mirror => (
            <MirrorRow
              key={mirror.id}
              mirror={mirror}
              gameId={game.id}
              onSelect={handleMirrorSelect}
            />
          ))}

          {directMirrors.length > 5 && (
            <Button
              variant="ghost"
              onClick={() => setShowAllMirrors(!showAllMirrors)}
              className="text-[#9d4edd] hover:text-[#7b2cbf] w-full"
            >
              {showAllMirrors ? 'Show Less' : `Show All ${directMirrors.length} Mirrors`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Torrent Section */}
      {hasMagnet && (
        <Card className="bg-[#120b22] border-[#2d1b54]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Torrent Download
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-[#1a103c]/50 border border-[#2d1b54] rounded-lg">
              <div>
                <p className="text-white font-medium">Magnet Link</p>
                <p className="text-gray-400 text-sm">
                  Seeders: <span className="text-green-400">{game.torrent_seeders || 0}</span>
                  {' • '}
                  Leechers: <span className="text-red-400">{game.torrent_leechers || 0}</span>
                </p>
              </div>
              <Button
                onClick={() => window.location.href = game.magnet_link}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Magnet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
        <div className="text-sm">
          <p className="text-yellow-500 font-medium">Important Notes:</p>
          <ul className="text-gray-400 mt-1 space-y-1">
            <li>• Always run setup.exe as Administrator</li>
            <li>• Temporarily disable antivirus during installation</li>
            <li>• Extract all parts before running setup</li>
            <li>• Use the provided RAR password if prompted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
