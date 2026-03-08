"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function AdminSetupChecker() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<{
    database: 'checking' | 'success' | 'error'
    message: string
  }>({
    database: 'checking',
    message: 'Checking database setup...'
  })

  const checkSetup = async () => {
    setChecking(true)
    setStatus({ database: 'checking', message: 'Checking database setup...' })

    try {
      // Check if table exists
      const tableCheck = await fetch('/api/admin/check-table')
      const tableData = await tableCheck.json()

      console.log('Table check result:', tableData)

      if (!tableData.exists) {
        setStatus({
          database: 'error',
          message: `❌ Database table not found.\n\nError: ${tableData.error || 'Unknown'}\n\nPlease run the migration SQL script.`
        })
        return
      }

      // Try to fetch carousel data
      const response = await fetch('/api/admin/carousel')
      const data = await response.json()

      console.log('Carousel fetch result:', data)

      if (response.ok && !data.error) {
        setStatus({
          database: 'success',
          message: '✅ Database is set up correctly! You can start using the modifier.'
        })
      } else {
        setStatus({
          database: 'error',
          message: `❌ Database error: ${data.error || 'Unknown error'}\n\n${data.debug || ''}`
        })
      }
    } catch (error) {
      console.error('Setup check error:', error)
      setStatus({
        database: 'error',
        message: '❌ Error connecting to database. Check your Supabase configuration.'
      })
    }

    setChecking(false)
  }

  useEffect(() => {
    checkSetup()
  }, [])

  return (
    <Card className="bg-[#120b22] border-[#2d1b54] mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {status.database === 'checking' && <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />}
          {status.database === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status.database === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          Setup Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`text-sm whitespace-pre-line ${
          status.database === 'success' ? 'text-green-400' : 
          status.database === 'error' ? 'text-red-400' : 
          'text-yellow-400'
        }`}>
          {status.message}
        </p>

        {status.database === 'error' && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-3">
            <p className="text-white font-semibold">Setup Required:</p>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Open your Supabase dashboard</li>
              <li>Go to SQL Editor</li>
              <li>Copy contents of <code className="bg-black/30 px-2 py-1 rounded">database/page_modifiers_table.sql</code></li>
              <li>Paste and click "Run"</li>
              <li>Click the "Check Again" button below</li>
            </ol>
          </div>
        )}

        <Button
          onClick={checkSetup}
          disabled={checking}
          variant="outline"
          className="w-full border-[#2d1b54] text-white hover:bg-[#9d4edd]/20"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Check Again
        </Button>
      </CardContent>
    </Card>
  )
}
