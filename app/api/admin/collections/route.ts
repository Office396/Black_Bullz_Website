import { NextResponse } from 'next/server'
import { getPageModifierData, updateCollections, type Collection } from '@/lib/server/page-modifier-store'
import { sendBroadcastNotification } from '@/lib/server/user-store'

export async function GET() {
  try {
    const data = await getPageModifierData()
    return NextResponse.json({ collections: data.collections })
  } catch (error) {
    console.error('Failed to get collections:', error)
    return NextResponse.json({ collections: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { collections } = await request.json() as { collections: Collection[] }
    
    const success = await updateCollections(collections)
    
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update collections' }, { status: 500 })
    }

    if (collections.length > 0) {
      const names = collections.map(c => c.title).filter(Boolean)
      if (names.length > 0) {
        const preview = names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} more`
        await sendBroadcastNotification('Collections Updated', `New collections available — explore ${preview}`, 'info')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update collections:', error)
    return NextResponse.json({ success: false, error: 'Failed to update collections' }, { status: 500 })
  }
}
