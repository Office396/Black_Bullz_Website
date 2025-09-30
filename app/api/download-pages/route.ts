import { NextResponse } from 'next/server'
import { createDownloadPage as createPage, getDownloadPage as getPage, cleanupExpiredPages } from '@/lib/server/download-pages-store'

// POST: Create download page
export async function POST(request: Request) {
  try {
    const { gameId, cloudIndex } = await request.json()

    const page = await createPage(gameId, cloudIndex)
    return NextResponse.json(page)
  } catch (error) {
    console.error('Create download page error:', error)
    return NextResponse.json({ error: 'Failed to create download page' }, { status: 500 })
  }
}

// GET: Get download page
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = parseInt(searchParams.get('gameId') || '0')
    const cloudIndex = searchParams.get('cloudIndex') ? parseInt(searchParams.get('cloudIndex')!) : undefined
    const token = searchParams.get('token') || undefined

    const page = await getPage(gameId, cloudIndex, token)
    if (page) {
      return NextResponse.json(page)
    } else {
      return NextResponse.json({ error: 'Download page not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Get download page error:', error)
    return NextResponse.json({ error: 'Failed to get download page' }, { status: 500 })
  }
}

// DELETE: Cleanup expired pages
export async function DELETE() {
  try {
    await cleanupExpiredPages()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
  }
}