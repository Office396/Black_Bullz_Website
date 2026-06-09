import { NextResponse } from 'next/server'
import { getPageModifierData, updateCarousel, type CarouselItem } from '@/lib/server/page-modifier-store'
import { sendBroadcastNotification } from '@/lib/server/user-store'

export async function GET() {
  try {
    const data = await getPageModifierData()
    return NextResponse.json({ items: data.carousel })
  } catch (error) {
    console.error('Failed to get carousel items:', error)
    // Return empty array with error info for debugging
    return NextResponse.json({ 
      items: [], 
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: 'Check if page_modifiers table exists in Supabase'
    })
  }
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json() as { items: CarouselItem[] }
    
    console.log('=== CAROUSEL API POST ===')
    console.log('Received items:', items?.length || 0)
    console.log('Items data:', JSON.stringify(items, null, 2))
    
    const success = await updateCarousel(items)
    
    console.log('Update result:', success)
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update carousel - check server logs for details'
      }, { status: 500 })
    }

    const gameNames = items.map(i => i.title).filter(Boolean)
    if (gameNames.length > 0) {
      const preview = gameNames.length === 1 ? gameNames[0] : `${gameNames[0]} and ${gameNames.length - 1} more`
      await sendBroadcastNotification('Hero Carousel Updated', `Featured games updated — now showcasing: ${preview}`, 'info')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update carousel:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      hint: 'Make sure page_modifiers table exists in Supabase'
    }, { status: 500 })
  }
}
