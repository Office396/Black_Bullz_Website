// ============================================================
// DOWNLOAD INTERSTITIAL PAGE
// Shows ads/affiliate before redirecting to file host
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Clock, ExternalLink, Shield, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

function InterstitialContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')
  const mirrorId = searchParams.get('mirrorId')
  const url = searchParams.get('url')
  const popunder = searchParams.get('popunder') === '1'

  const [countdown, setCountdown] = useState(5)
  const [ready, setReady] = useState(false)
  const [game, setGame] = useState<any>(null)

  // Fetch game info
  useEffect(() => {
    if (gameId) {
      fetch(`/api/games?id=${gameId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            setGame(data.data)
          }
        })
        .catch(() => {})
    }
  }, [gameId])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setReady(true)
    }
  }, [countdown])

  // Handle download
  const handleDownload = () => {
    // Open popunder ad if enabled
    if (popunder) {
      window.open('about:blank', '_blank')
    }

    // Redirect to actual download
    if (url) {
      window.location.href = url
    }
  }

  if (!url) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <Card className="bg-[#120b22] border-red-500/30 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Invalid Download</h2>
            <p className="text-gray-400 mb-4">No download URL provided.</p>
            <Link href="/">
              <Button className="bg-[#9d4edd] hover:bg-[#7b2cbf]">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] flex items-center justify-center p-4">
      <Card className="bg-[#120b22] border-[#2d1b54] max-w-lg w-full">
        <CardContent className="p-6 space-y-6">
          {/* Game Info */}
          {game && (
            <div className="flex gap-4 items-center">
              <Image
                src={game.image || '/placeholder.svg'}
                alt={game.title}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <div>
                <h2 className="text-white font-bold text-lg">{game.title}</h2>
                <p className="text-gray-400 text-sm">{game.size || 'Unknown size'}</p>
                <p className="text-gray-500 text-xs mt-1">{game.repacker_name || 'Unknown repacker'}</p>
              </div>
            </div>
          )}

          {/* Timer Section */}
          <div className="text-center space-y-4">
            {!ready ? (
              <>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span>Your download is being prepared...</span>
                </div>
                <div className="text-5xl font-bold text-[#4ade80]">{countdown}</div>
                <div className="w-full h-2 bg-[#1a103c] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span>Download ready!</span>
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-bold py-6 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-400 space-y-2">
            <p><strong className="text-white">How to download:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Download Now" when the timer finishes</li>
              <li>Complete any verification if prompted</li>
              <li>Your download will start automatically</li>
            </ol>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href={gameId ? `/game/${gameId}` : '/'}
              className="text-[#9d4edd] hover:text-[#7b2cbf] text-sm"
            >
              ← Back to game page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InterstitialPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090514] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <InterstitialContent />
    </Suspense>
  )
}
