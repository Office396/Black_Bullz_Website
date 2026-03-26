import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FAKE_USERNAMES, BADGES } from '@/lib/usernames'

export async function POST() {
  // Get all games
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, title')

  if (itemsError || !items) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }

  // Get all game_ids that already have an auto review
  const { data: existing } = await supabase
    .from('game_reviews')
    .select('game_id')
    .like('user_id', 'auto_%')

  const existingIds = new Set((existing || []).map((r: any) => r.game_id))

  // Filter games that need a review
  const needsReview = items.filter(item => !existingIds.has(item.id))

  if (needsReview.length === 0) {
    return NextResponse.json({ success: true, message: 'All games already have auto reviews', count: 0 })
  }

  // Insert reviews for each
  const reviews = needsReview.map(item => {
    const randomName = FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)]
    const randomBadge = BADGES[Math.floor(Math.random() * BADGES.length)]
    const randomRating = Math.random() < 0.5 ? 4 : 5
    return {
      game_id: item.id,
      game_title: item.title,
      user_id: `auto_${item.id}`,
      user_name: randomName,
      user_badge: randomBadge.label,
      user_badge_color: randomBadge.color,
      rating: randomRating,
      content: null,
      status: 'approved',
    }
  })

  const { error: insertError } = await supabase.from('game_reviews').insert(reviews)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: `Added auto reviews to ${reviews.length} games`, count: reviews.length })
}
