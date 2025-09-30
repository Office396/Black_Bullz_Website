import { NextResponse } from 'next/server'
import { getItems, addItem, updateItem, deleteItem, type Item } from '@/lib/server/items-store'

export async function GET() {
  try {
    const items = await getItems()
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to get items:', error)
    return NextResponse.json({ success: false, error: 'Failed to retrieve items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const itemData = await request.json()

    // Validate required fields
    if (!itemData.title || !itemData.category || !itemData.description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const newItem = await addItem(itemData)
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