// ============================================================
// BUG REPORT COMPONENT
// Users click "This game doesn't work" → auto-downgrade mirror
// ============================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle, CheckCircle, X, Send, Monitor,
  Cpu, HardDrive, Shield
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface BugReportProps {
  gameId: number
  gameTitle: string
  mirrorId?: number
  mirrorHost?: string
  onClose: () => void
}

type BugType = 'crash' | 'black_screen' | 'missing_files' | 'wrong_password' | 'corrupt' | 'virus_false_positive' | 'install_fail' | 'other'

// ============================================================
// BUG TYPE OPTIONS
// ============================================================

const BUG_TYPES: Array<{ value: BugType; label: string; icon: string }> = [
  { value: 'crash', label: 'Game crashes on startup', icon: '💥' },
  { value: 'black_screen', label: 'Black screen after launch', icon: '🖥️' },
  { value: 'missing_files', label: 'Missing DLL or files', icon: '📁' },
  { value: 'wrong_password', label: 'Wrong RAR password', icon: '🔑' },
  { value: 'corrupt', label: 'Corrupt download', icon: '❌' },
  { value: 'virus_false_positive', label: 'False positive virus alert', icon: '🛡️' },
  { value: 'install_fail', label: 'Installation failed', icon: '⚙️' },
  { value: 'other', label: 'Other issue', icon: '❓' },
]

// ============================================================
// BUG REPORT COMPONENT
// ============================================================

export function BugReportForm({ gameId, gameTitle, mirrorId, mirrorHost, onClose }: BugReportProps) {
  const [selectedType, setSelectedType] = useState<BugType | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ action: string; reason: string } | null>(null)

  const handleSubmit = async () => {
    if (!selectedType) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          mirrorId,
          bugType: selectedType,
          description,
          systemInfo: {
            os: navigator.userAgent,
            gpu: '',
            ram: '',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        setResult(data.result)
      }
    } catch (error) {
      console.error('Bug report error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="bg-[#120b22] border-[#2d1b54] max-w-md w-full">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-white text-xl font-bold mb-2">Report Submitted</h3>
          <p className="text-gray-400 mb-4">
            Thank you for reporting this issue. Our system has been notified.
          </p>
          {result && result.action !== 'none' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-sm">
                <strong>Auto-action taken:</strong> {result.reason}
              </p>
            </div>
          )}
          <Button onClick={onClose} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#120b22] border-[#2d1b54] max-w-md w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Report Issue
          </CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-gray-400 text-sm">
          {gameTitle}
          {mirrorHost && <span className="text-gray-500"> ({mirrorHost})</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bug Type Selection */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">What&apos;s the issue?</label>
          <div className="grid grid-cols-2 gap-2">
            {BUG_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-2 rounded-lg border text-left text-sm transition-all ${
                  selectedType === type.value
                    ? 'bg-[#9d4edd]/20 border-[#9d4edd] text-white'
                    : 'bg-[#1a103c] border-[#2d1b54] text-gray-400 hover:border-[#9d4edd]/50'
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Additional details (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            className="w-full h-20 px-3 py-2 bg-[#1a103c] border border-[#2d1b54] rounded-lg text-white text-sm resize-none focus:outline-none focus:border-[#9d4edd]"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedType || submitting}
          className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Submit Report
            </span>
          )}
        </Button>

        <p className="text-gray-500 text-xs text-center">
          Reports help us auto-hide broken mirrors and improve quality.
        </p>
      </CardContent>
    </Card>
  )
}
