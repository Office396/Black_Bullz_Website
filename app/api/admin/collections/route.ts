import { NextResponse } from 'next/server'
import { getPageModifierData, updateCollections, type Collection } from '@/lib/server/page-modifier-store'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update collections:', error)
    return NextResponse.json({ success: false, error: 'Failed to update collections' }, { status: 500 })
  }
}
