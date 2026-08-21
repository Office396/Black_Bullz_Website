// ============================================================
// RATING SYSTEM
// 1-5 stars, auto-flag low quality repacks
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface Rating {
  id: number
  gameId: number
  userId: string
  rating: number
  review: string
  helpful: number
  verified: boolean
  createdAt: string
}

interface RatingStats {
  average: number
  total: number
  distribution: Record<number, number>
  fiveStarPct: number
  oneStarPct: number
}

// ============================================================
// GET RATINGS FOR GAME
// ============================================================

export async function getGameRatings(gameId: number): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('game_ratings')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getGameRatingStats(gameId: number): Promise<RatingStats> {
  const ratings = await getGameRatings(gameId)

  const total = ratings.length
  if (total === 0) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, fiveStarPct: 0, oneStarPct: 0 }
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  const average = sum / total

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of ratings) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
  }

  return {
    average: Math.round(average * 10) / 10,
    total,
    distribution,
    fiveStarPct: Math.round((distribution[5] / total) * 100),
    oneStarPct: Math.round((distribution[1] / total) * 100),
  }
}

// ============================================================
// ADD / UPDATE RATING
// ============================================================

export async function addOrUpdateRating(
  gameId: number,
  userId: string,
  rating: number,
  review: string = ''
): Promise<Rating | null> {
  // Validate rating
  if (rating < 1 || rating > 5) return null

  // Check if user already rated
  const { data: existing } = await supabase
    .from('game_ratings')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('game_ratings')
      .update({ rating, review })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return null
    return data
  }

  // Add new rating
  const { data, error } = await supabase
    .from('game_ratings')
    .insert({
      game_id: gameId,
      user_id: userId,
      rating,
      review,
      helpful: 0,
      verified: false,
    })
    .select()
    .single()

  if (error) return null

  // Update game's average rating
  await updateGameAverageRating(gameId)

  // Auto-flag if low rating
  if (rating <= 2) {
    await flagLowRatingGame(gameId, rating, review)
  }

  return data
}

// ============================================================
// DELETE RATING
// ============================================================

export async function deleteRating(gameId: number, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('game_ratings')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)

  if (!error) {
    await updateGameAverageRating(gameId)
  }

  return !error
}

// ============================================================
// MARK HELPFUL
// ============================================================

export async function markRatingHelpful(ratingId: number): Promise<boolean> {
  await supabase.rpc('increment_rating_helpful', { rating_id: ratingId })
  return true
}

// ============================================================
// UPDATE GAME AVERAGE RATING
// ============================================================

async function updateGameAverageRating(gameId: number): Promise<void> {
  const stats = await getGameRatingStats(gameId)

  await supabase
    .from('games')
    .update({ rating: stats.average })
    .eq('id', gameId)
}

// ============================================================
// AUTO-FLAG LOW QUALITY REPACKS
// ============================================================

async function flagLowRatingGame(gameId: number, rating: number, review: string): Promise<void> {
  // Get rating stats
  const stats = await getGameRatingStats(gameId)

  // Flag if:
  // - Average rating drops below 2.5 with 5+ ratings
  // - More than 50% are 1-star ratings
  // - Review contains specific complaints
  const shouldFlag =
    (stats.average < 2.5 && stats.total >= 5) ||
    (stats.oneStarPct > 50 && stats.total >= 3) ||
    review.toLowerCase().includes('virus') ||
    review.toLowerCase().includes('malware') ||
    review.toLowerCase().includes('broken') ||
    review.toLowerCase().includes('doesnt work')

  if (shouldFlag) {
    await supabase.from('moderation_queue').insert({
      item_type: 'game',
      item_id: gameId,
      reason: `Low rating: ${stats.average}/5 (${stats.total} ratings). Recent review: "${review.substring(0, 100)}"`,
      severity: stats.average < 2 ? 'high' : 'medium',
      auto_flagged: true,
    })

    console.log(`[Ratings] Flagged game ${gameId} for low quality (avg: ${stats.average})`)
  }
}

// ============================================================
// GET TOP RATED GAMES
// ============================================================

export async function getTopRatedGames(limit = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, rating, downloads')
    .eq('status', 'published')
    .gte('rating', 4.0)
    .order('rating', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

// ============================================================
// GET USER'S RATINGS
// ============================================================

export async function getUserRatings(userId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('game_ratings')
    .select('*, games!inner(title, slug, cover_image)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}
