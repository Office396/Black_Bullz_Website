import { NextResponse } from 'next/server'
import { getItems } from '@/lib/server/items-store'

const FILECRYPT_API_KEY = 'd0c653c65bbab234eec8bbeab78b78bbc50652f3'
const FILECRYPT_API_URL = 'https://www.filecrypt.cc/api.php'

export async function POST(request: Request) {
  try {
    const { gameId, cloudIndex, sectionType } = await request.json()

    if (!gameId || cloudIndex === undefined) {
      return NextResponse.json({ error: 'gameId and cloudIndex are required' }, { status: 400 })
    }

    const items = await getItems()
    const game = items.find(item => item.id === gameId)

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    let cloud
    if (sectionType === 'installable') {
      cloud = game.installableDownloads?.[cloudIndex]
    } else {
      cloud = game.cloudDownloads?.[cloudIndex]
    }

    if (!cloud) {
      return NextResponse.json({ error: 'Cloud provider not found' }, { status: 404 })
    }

    const links = (cloud.actualDownloadLinks || []).filter(l => l.url)
    if (links.length === 0) {
      return NextResponse.json({ error: 'No valid download links found' }, { status: 400 })
    }

    const mirrorLinks = links.map(l => l.url)

    const folderName = `${game.title} - ${cloud.cloudName || 'Download'}${(cloud as any).version ? ` v${(cloud as any).version}` : ''}`.substring(0, 255)

    // FileCrypt expects mirror_1 as array of arrays: mirror_1[0][0], mirror_1[0][1], etc.
    const bodyParts = [
      `fn=containerV2`,
      `sub=createV2`,
      `api_key=${encodeURIComponent(FILECRYPT_API_KEY)}`,
      `name=${encodeURIComponent(folderName)}`,
      `captcha=0`,
      `allow_cnl=1`,
      `allow_dlc=1`,
      `allow_links=1`,
    ]
    mirrorLinks.forEach((link, i) => {
      bodyParts.push(`mirror_1[0][${i}]=${encodeURIComponent(link)}`)
    })
    const body = bodyParts.join('&')

    const response = await fetch(FILECRYPT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const result = await response.json()

    if (result.state === 1 && result.container?.link) {
      return NextResponse.json({
        success: true,
        link: result.container.link,
        name: result.container.name,
        status: result.container.status,
      })
    } else {
      console.error('FileCrypt API error:', result)
      return NextResponse.json(
        { error: result.error || 'Failed to create FileCrypt container' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('FileCrypt route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
