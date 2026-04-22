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
  let itemData
  try {
    const text = await request.text()
    console.log('POST /api/items raw:', { length: text.length, first200: text.slice(0, 200) })
    itemData = JSON.parse(text)
    console.log('POST /api/items parsed:', { hasData: !!itemData, keys: Object.keys(itemData), title: itemData.title, category: itemData.category })
  } catch (e) {
    console.error('POST /api/items: Failed to parse JSON:', e)
    return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 })
  }

  try {
    // Validate incoming data
    if (!itemData || typeof itemData !== 'object') {
      console.error('POST /api/items: No data provided')
      return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 })
    }

    const title = itemData.title
    const category = itemData.category
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      console.error('POST /api/items: Missing or invalid title', { title })
      return NextResponse.json({ success: false, error: 'Title is required and must be a non-empty string' }, { status: 400 })
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      console.error('POST /api/items: Missing or invalid category', { category })
      return NextResponse.json({ success: false, error: 'Category is required and must be a non-empty string' }, { status: 400 })
    }

    // Use validated and trimmed values
    const cleanItemData = {
      ...itemData,
      title: title.trim(),
      category: category.trim(),
      description: itemData.description || itemData.longDescription || 'No description available'
    }

    const newItem = await addItem(cleanItemData)

    if (!newItem) {
      console.error('POST /api/items: Failed to add item')
      return NextResponse.json({ success: false, error: 'Failed to add item to database' }, { status: 500 })
    }

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
    } catch (e) { console.error('Auto review error:', e) }

    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    console.error('Failed to add item:', error)
    return NextResponse.json({ success: false, error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  return handleUpdate(request)
}

export async function PATCH(request: Request) {
  return handleUpdate(request)
}

async function handleUpdate(request: Request) {
  console.log('🔥🔥🔥 PUT/PATCH /api/items CALLED! 🔥🔥🔥')
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    console.log('UPDATE /api/items:', { id, idType: typeof id, hasBody: !!body, keys: Object.keys(body).slice(0, 5) })

    if (!id) {
      console.error('PUT /api/items: No ID provided')
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 })
    }

    // Try to normalize ID to number if it's a string
    const numericId = typeof id === 'string' ? parseInt(id, 10) : (typeof id === 'number' ? Math.floor(id) : null)
    if (!numericId || isNaN(numericId)) {
      console.error('PUT /api/items: Invalid ID:', { id, numericId })
      return NextResponse.json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const updatedItem = await updateItem(numericId, updateData)
    if (!updatedItem) {
      console.error('PUT /api/items: Item not found, id=', numericId)
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