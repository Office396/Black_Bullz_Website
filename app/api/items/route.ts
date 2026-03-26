import { NextResponse } from 'next/server'
import { getItems, addItem, updateItem, deleteItem, type Item } from '@/lib/server/items-store'
import { supabase } from '@/lib/supabase'
import { FAKE_USERNAMES, BADGES } from '@/lib/usernames'

export async function GET() {
  try {
    const items = await getItems()
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to get items:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const itemData = await request.json()

    if (!itemData.title || !itemData.category) {
      return NextResponse.json({ success: false, error: 'Title and category are required' }, { status: 400 })
    }

    if (!itemData.description) {
      itemData.description = itemData.longDescription || 'No description available'
    }

    const newItem = await addItem(itemData)

    // Auto-create a 4-5 star approved review with a random username
    try {
      const randomName = FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)]
      const randomBadge = BADGES[Math.floor(Math.random() * BADGES.length)]
      const randomRating = Math.random() < 0.5 ? 4 : 5  // randomly 4 or 5
      await supabase.from('game_reviews').insert({
        game_id: newItem.id,
        game_title: newItem.title,
        user_id: `auto_${newItem.id}`,
        user_name: randomName,
        user_badge: randomBadge.label,
        user_badge_color: randomBadge.color,
        rating: randomRating,
        content: null,
        status: 'approved',
      })
    } catch {}

    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    console.error('Failed to add item:', error)
    return NextResponse.json({ success: false, error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 })
    }

    const updatedItem = await updateItem(id, updateData)
    if (!updatedItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Failed to update item:', error)
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 })
    }

    const deleted = await deleteItem(id)
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 })
  }
}