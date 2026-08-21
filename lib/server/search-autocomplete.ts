// ============================================================
// SEARCH AUTOCOMPLETE
// Real-time search suggestions as users type
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface SearchSuggestion {
  type: 'game' | 'genre' | 'repacker' | 'developer'
  id: number
  title: string
  slug: string
  subtitle: string
  image: string
  url: string
}

interface AutocompleteResult {
  suggestions: SearchSuggestion[]
  totalCount: number
}

// ============================================================
// AUTOCOMPLETE FUNCTION
// ============================================================

export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 8
): Promise<AutocompleteResult> {
  if (!query || query.length < 2) {
    return { suggestions: [], totalCount: 0 }
  }

  const searchTerm = query.toLowerCase().trim()
  const suggestions: SearchSuggestion[] = []

  // 1. Search games (highest priority)
  const { data: games } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, developer')
    .eq('status', 'published')
    .or(`title.ilike.%${searchTerm}%,developer.ilike.%${searchTerm}%`)
    .order('downloads', { ascending: false })
    .limit(5)

  if (games) {
    for (const game of games) {
      suggestions.push({
        type: 'game',
        id: game.id,
        title: game.title,
        slug: game.slug,
        subtitle: game.developer || 'PC Game',
        image: game.cover_image,
        url: `/game/${game.slug}`,
      })
    }
  }

  // 2. Search genres
  if (suggestions.length < limit) {
    const { data: genres } = await supabase
      .from('genres')
      .select('id, name, slug, game_count')
      .ilike('name', `%${searchTerm}%`)
      .order('game_count', { ascending: false })
      .limit(3)

    if (genres) {
      for (const genre of genres) {
        suggestions.push({
          type: 'genre',
          id: genre.id,
          title: genre.name,
          slug: genre.slug,
          subtitle: `${genre.game_count || 0} games`,
          image: '',
          url: `/genres/${genre.slug}`,
        })
      }
    }
  }

  // 3. Search repackers
  if (suggestions.length < limit) {
    const { data: repackers } = await supabase
      .from('repackers')
      .select('id, name, slug, total_games')
      .ilike('name', `%${searchTerm}%`)
      .eq('active', true)
      .limit(3)

    if (repackers) {
      for (const repacker of repackers) {
        suggestions.push({
          type: 'repacker',
          id: repacker.id,
          title: repacker.name,
          slug: repacker.slug,
          subtitle: `${repacker.total_games || 0} repacks`,
          image: '',
          url: `/publishers/${repacker.slug}`,
        })
      }
    }
  }

  // 4. Search developers
  if (suggestions.length < limit) {
    const { data: developers } = await supabase
      .from('games')
      .select('developer')
      .eq('status', 'published')
      .ilike('developer', `%${searchTerm}%`)
      .limit(5)

    if (developers) {
      const uniqueDevs = [...new Set(developers.map(d => d.developer).filter(Boolean))].slice(0, 3)
      for (const dev of uniqueDevs) {
        suggestions.push({
          type: 'developer',
          id: 0,
          title: dev,
          slug: dev.toLowerCase().replace(/\s+/g, '-'),
          subtitle: 'Developer',
          image: '',
          url: `/search?q=${encodeURIComponent(dev)}`,
        })
      }
    }
  }

  return {
    suggestions: suggestions.slice(0, limit),
    totalCount: suggestions.length,
  }
}

// ============================================================
// SEARCH GAMES (Full search with filters)
// ============================================================

export async function searchGames(
  query: string,
  options: {
    genre?: string
    repacker?: string
    sort?: 'relevance' | 'downloads' | 'rating' | 'date'
    limit?: number
    offset?: number
  } = {}
): Promise<{
  games: any[]
  total: number
  took: number
}> {
  const startTime = Date.now()
  const { genre, repacker, sort = 'relevance', limit = 24, offset = 0 } = options

  let queryBuilder = supabase
    .from('games')
    .select('id, title, slug, description, cover_image, rating, repack_size, downloads, views, genres, repacker_name, created_at', { count: 'exact' })
    .eq('status', 'published')

  // Text search
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,developer.ilike.%${query}%,publisher.ilike.%${query}%`
    )
  }

  // Genre filter
  if (genre) {
    queryBuilder = queryBuilder.contains('genres', [genre])
  }

  // Repacker filter
  if (repacker) {
    queryBuilder = queryBuilder.ilike('repacker_name', `%${repacker}%`)
  }

  // Sorting
  switch (sort) {
    case 'downloads':
      queryBuilder = queryBuilder.order('downloads', { ascending: false })
      break
    case 'rating':
      queryBuilder = queryBuilder.order('rating', { ascending: false })
      break
    case 'date':
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
      break
    default: // relevance
      queryBuilder = queryBuilder.order('downloads', { ascending: false })
  }

  // Pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1)

  const { data, count, error } = await queryBuilder

  const took = Date.now() - startTime

  if (error) {
    console.error('[Search] Error:', error)
    return { games: [], total: 0, took }
  }

  return {
    games: data || [],
    total: count || 0,
    took,
  }
}

// ============================================================
// TRENDING SEARCHES (for empty search state)
// ============================================================

export async function getTrendingSearches(): Promise<string[]> {
  const { data: games } = await supabase
    .from('games')
    .select('title')
    .eq('status', 'published')
    .eq('trending', true)
    .order('downloads', { ascending: false })
    .limit(10)

  if (!games) return []
  return games.map(g => g.title)
}

// ============================================================
// SEARCH HISTORY (per user, stored in localStorage client-side)
// ============================================================

// Client-side functions (to be used in components)
export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem('search_history')
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === 'undefined') return
  try {
    const history = getSearchHistory()
    const filtered = history.filter(h => h !== query)
    filtered.unshift(query)
    localStorage.setItem('search_history', JSON.stringify(filtered.slice(0, 10)))
  } catch {}
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('search_history')
}
