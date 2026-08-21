// ============================================================
// REAL-TIME ACTIVITY FEED
// Live uploads, comments, donations on homepage/admin
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface ActivityItem {
  id: number
  type: 'upload' | 'comment' | 'download' | 'donation' | 'review' | 'takedown'
  title: string
  description: string
  image: string
  url: string
  user: string
  timestamp: string
  metadata?: Record<string, any>
}

// ============================================================
// GET RECENT ACTIVITY
// ============================================================

export async function getRecentActivity(limit: number = 20): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  // 1. Recent uploads (last 24h)
  const { data: recentGames } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, repacker_name, created_at')
    .eq('status', 'published')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (recentGames) {
    for (const game of recentGames) {
      activities.push({
        id: game.id,
        type: 'upload',
        title: game.title,
        description: `New repack by ${game.repacker_name || 'Unknown'}`,
        image: game.cover_image,
        url: `/game/${game.slug}`,
        user: game.repacker_name || 'Unknown',
        timestamp: game.created_at,
      })
    }
  }

  // 2. Recent comments (last 24h)
  const { data: recentComments } = await supabase
    .from('comments')
    .select('id, game_id, author, content, created_at, games!inner(title, slug)')
    .in('status', ['approved', 'new'])
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (recentComments) {
    for (const comment of recentComments) {
      const game = comment.games as any
      activities.push({
        id: comment.id + 100000, // Offset to avoid ID collision
        type: 'comment',
        title: `Comment on ${game?.title || 'Unknown'}`,
        description: comment.content.substring(0, 100),
        image: '',
        url: `/game/${game?.slug || ''}#comments`,
        user: comment.author,
        timestamp: comment.created_at,
      })
    }
  }

  // 3. Recent reviews (last 24h)
  const { data: recentReviews } = await supabase
    .from('game_ratings')
    .select('id, game_id, user_id, rating, review, created_at, games!inner(title, slug)')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentReviews) {
    for (const review of recentReviews) {
      const game = review.games as any
      activities.push({
        id: review.id + 200000,
        type: 'review',
        title: `${review.rating}★ Review for ${game?.title || 'Unknown'}`,
        description: review.review?.substring(0, 100) || 'No comment',
        image: '',
        url: `/game/${game?.slug || ''}#reviews`,
        user: review.user_id,
        timestamp: review.created_at,
        metadata: { rating: review.rating },
      })
    }
  }

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activities.slice(0, limit)
}

// ============================================================
// GET ACTIVITY STATS (for admin dashboard)
// ============================================================

export async function getActivityStats(): Promise<{
  uploadsToday: number
  commentsToday: number
  reviewsToday: number
  downloadsToday: number
  activeUsers: number
}> {
  const today = new Date().toISOString().split('T')[0]

  const [uploadsResult, commentsResult, reviewsResult] = await Promise.all([
    supabase.from('games').select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase.from('comments').select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase.from('game_ratings').select('id', { count: 'exact', head: true })
      .gte('created_at', today),
  ])

  return {
    uploadsToday: uploadsResult.count || 0,
    commentsToday: commentsResult.count || 0,
    reviewsToday: reviewsResult.count || 0,
    downloadsToday: 0, // Would need download tracking table
    activeUsers: 0, // Would need session tracking
  }
}

// ============================================================
// SUBSCRIBE TO REAL-TIME UPDATES (Server-Sent Events)
// ============================================================

// This would be implemented as an API route for SSE
// For now, we poll every 30 seconds on the client side
