// ============================================================
// RELATED GAMES ENGINE
// Tag-based recommendations: "Users who downloaded this also..."
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface RelatedGame {
  id: number
  title: string
  slug: string
  coverImage: string
  rating: number
  repackSize: string
  downloads: number
  reason: string
  score: number
}

// ============================================================
// GET RELATED GAMES (Multi-signal)
// ============================================================

export async function getRelatedGames(
  gameId: number,
  limit: number = 10
): Promise<RelatedGame[]> {
  // Get current game
  const { data: game } = await supabase
    .from('games')
    .select('id, title, genres, tags, developer, publisher, repacker_name')
    .eq('id', gameId)
    .single()

  if (!game) return []

  // Get all published games (excluding current)
  const { data: allGames } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, rating, repack_size, downloads, genres, tags, developer, publisher, repacker_name')
    .eq('status', 'published')
    .neq('id', gameId)
    .limit(500)

  if (!allGames) return []

  // Score each game
  const scoredGames = allGames.map(otherGame => {
    let score = 0
    const reasons: string[] = []

    // Genre overlap (highest weight)
    const genreOverlap = (game.genres || []).filter(g => (otherGame.genres || []).includes(g))
    if (genreOverlap.length > 0) {
      score += genreOverlap.length * 30
      reasons.push(`Same genres: ${genreOverlap.join(', ')}`)
    }

    // Tag overlap
    const tagOverlap = (game.tags || []).filter(t => (otherGame.tags || []).includes(t))
    if (tagOverlap.length > 0) {
      score += tagOverlap.length * 20
      reasons.push(`Similar tags`)
    }

    // Same developer
    if (game.developer && otherGame.developer && game.developer === otherGame.developer) {
      score += 25
      reasons.push(`Same developer`)
    }

    // Same publisher
    if (game.publisher && otherGame.publisher && game.publisher === otherGame.publisher) {
      score += 15
      reasons.push(`Same publisher`)
    }

    // Same repacker (users often prefer specific repackers)
    if (game.repacker_name && otherGame.repacker_name && game.repacker_name === otherGame.repacker_name) {
      score += 10
      reasons.push(`Same repacker`)
    }

    // Popularity bonus (more downloads = more likely to be good)
    if (otherGame.downloads > 1000) score += 5
    if (otherGame.downloads > 5000) score += 5

    // Rating bonus
    if (otherGame.rating >= 4.5) score += 10
    else if (otherGame.rating >= 4.0) score += 5

    return {
      id: otherGame.id,
      title: otherGame.title,
      slug: otherGame.slug,
      coverImage: otherGame.cover_image,
      rating: otherGame.rating,
      repackSize: otherGame.repack_size,
      downloads: otherGame.downloads,
      reason: reasons[0] || 'Similar game',
      score,
    }
  })

  // Sort by score and return top N
  scoredGames.sort((a, b) => b.score - a.score)

  return scoredGames.slice(0, limit)
}

// ============================================================
// GET "USERS ALSO DOWNLOADED" (Based on download patterns)
// ============================================================

export async function getAlsoDownloaded(
  gameId: number,
  limit: number = 10
): Promise<RelatedGame[]> {
  // This requires download history tracking
  // For now, fallback to genre-based
  return getRelatedGames(gameId, limit)
}

// ============================================================
// GET SIMILAR GAMES BY GENRE
// ============================================================

export async function getGamesByGenre(
  genre: string,
  excludeId: number,
  limit: number = 10
): Promise<RelatedGame[]> {
  const { data: games } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, rating, repack_size, downloads')
    .eq('status', 'published')
    .contains('genres', [genre])
    .neq('id', excludeId)
    .order('downloads', { ascending: false })
    .limit(limit)

  if (!games) return []

  return games.map(g => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    coverImage: g.cover_image,
    rating: g.rating,
    repackSize: g.repack_size,
    downloads: g.downloads,
    reason: `Similar ${genre} game`,
    score: g.downloads,
  }))
}

// ============================================================
// GET TRENDING IN GENRE
// ============================================================

export async function getTrendingInGenre(
  genre: string,
  limit: number = 10
): Promise<RelatedGame[]> {
  const { data: games } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, rating, repack_size, downloads')
    .eq('status', 'published')
    .contains('genres', [genre])
    .eq('trending', true)
    .order('downloads', { ascending: false })
    .limit(limit)

  if (!games) return []

  return games.map(g => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    coverImage: g.cover_image,
    rating: g.rating,
    repackSize: g.repack_size,
    downloads: g.downloads,
    reason: `Trending in ${genre}`,
    score: g.downloads,
  }))
}
