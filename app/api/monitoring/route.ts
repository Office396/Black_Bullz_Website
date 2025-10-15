import { NextResponse } from 'next/server'
import { checkSystemStatus, getSupabaseUsage } from '@/lib/server/monitoring'

export async function GET() {
  try {
    const [status, usage] = await Promise.all([
      checkSystemStatus(),
      getSupabaseUsage()
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        usage
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}