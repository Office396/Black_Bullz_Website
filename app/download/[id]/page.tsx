// ============================================================
// DOWNLOAD PAGE
// Fetches game + mirrors from new games table
// Uses DownloadPageContent component for the money page
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import DownloadPageContent from '@/components/download-page-content'

export default function DownloadPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mirrorParam = searchParams.get('mirror')

  const [game, setGame] = useState<any>(null)
  const [mirrors, setMirrors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadGame = async () => {
      const gameId = Number.parseInt(params.id as string)
      if (isNaN(gameId)) {
        setError('Invalid game ID')
        setLoading(false)
        return
      }

      try {
        // Fetch game from new games table
        const response = await fetch(`/api/games?id=${gameId}`)
        const result = await response.json()

        if (result.success && result.data) {
          setGame(result.data)
          setMirrors(result.data.mirrors || [])
        } else {
          // Fallback: try the items API for backward compatibility
          const fallbackResponse = await fetch(`/api/items?id=${gameId}`)
          const fallbackResult = await fallbackResponse.json()
          if (fallbackResult.success && fallbackResult.data) {
            setGame(fallbackResult.data)
            setMirrors(fallbackResult.data.cloudDownloads || [])
          } else {
            setError('Game not found')
          }
        }
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <Card className="bg-[#120b22] border-[#2d1b54] max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-12 h-12 text-[#9d4edd] mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading download page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <Card className="bg-[#120b22] border-red-500/30 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-white text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-400 mb-4">{error || 'Game not found'}</p>
            <Button onClick={() => router.push('/')} className="bg-[#9d4edd] hover:bg-[#7b2cbf]">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <DownloadPageContent game={game} mirrors={mirrors} />
}
