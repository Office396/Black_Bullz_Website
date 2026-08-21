import { supabase } from '../supabase'
import type { Game, Mirror } from '../../types/game'

// ============================================================
// GAMES STORE - New schema for PC-only repack site
// ============================================================

export interface GameListItem {
  id: number
  title: string
  slug: string
  description: string
  developer: string
  publisher: string
  coverImage: string
  landscapeImage: string
  rating: number
  repackSize: string
  originalSize: string
  repackerName: string
  genres: string[]
  downloads: number
  views: number
  trending: boolean
  featured: boolean
  pinned: boolean
  repackDate: string
  createdAt: string
  mirrors: Mirror[]
  magnetLink: string
  languages: string
}

export async function getGames(limit?: number): Promise<GameListItem[]> {
  try {
    let query = supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching games:', error)
      return []
    }

    return (data || []).map(mapDbToGameListItem)
  } catch (error) {
    console.error('Error in getGames:', error)
    return []
  }
}

export async function getGameById(id: number): Promise<Game | null> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching game by id:', error)
      return null
    }

    // Fetch mirrors for this game
    const { data: mirrors } = await supabase
      .from('mirrors')
      .select('*')
      .eq('game_id', id)
      .order('priority', { ascending: false })

    const game = mapDbToGame(data)
    if (game) {
      game.mirrors = mirrors || []
    }

    return game
  } catch (error) {
    console.error('Error in getGameById:', error)
    return null
  }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null

    // Fetch mirrors for this game
    const { data: mirrors } = await supabase
      .from('mirrors')
      .select('*')
      .eq('game_id', data.id)
      .order('priority', { ascending: false })

    const game = mapDbToGame(data)
    if (game) {
      game.mirrors = mirrors || []
    }

    return game
  } catch {
    return null
  }
}

export async function getRelatedGames(genres: string[], excludeId: number, limit = 10): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .neq('id', excludeId)
      .overlaps('genres', genres)
      .order('downloads', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

export async function getGamesByRepacker(repackerName: string, limit = 50): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .eq('repacker_name', repackerName)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

export async function getGamesByGenre(genre: string, limit = 50): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .contains('genres', [genre])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

export async function getTrendingGames(limit = 20): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .eq('trending', true)
      .order('downloads', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

export async function getFeaturedGames(limit = 10): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

export async function searchGames(query: string, limit = 20): Promise<GameListItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,description,developer,publisher,cover_image,landscape_image,rating,repack_size,original_size,repacker_name,genres,downloads,views,trending,featured,pinned,repack_date,created_at,mirrors,magnet_link,languages')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,developer.ilike.%${query}%,publisher.ilike.%${query}%`)
      .order('downloads', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map(mapDbToGameListItem)
  } catch {
    return []
  }
}

// ============================================================
// ADMIN OPERATIONS
// ============================================================

export async function createGame(gameData: Partial<Game>): Promise<Game | null> {
  const now = new Date().toISOString()
  const slug = generateSlug(gameData.title || '')

  const dbGame = {
    title: gameData.title,
    slug,
    description: gameData.description || '',
    long_description: gameData.longDescription || '',
    developer: gameData.developer || '',
    publisher: gameData.publisher || '',
    release_date: gameData.releaseDate || null,
    repack_date: gameData.repackDate || now,
    cover_image: gameData.coverImage,
    landscape_image: gameData.landscapeImage || null,
    screenshots: gameData.screenshots || [],
    genres: gameData.genres || [],
    tags: gameData.tags || [],
    rating: gameData.rating || 0,
    original_size: gameData.originalSize || '',
    repack_size: gameData.repackSize || '',
    repacker_name: gameData.repackerName || 'Manual',
    system_requirements: gameData.systemRequirements || { minimum: {}, recommended: {} },
    languages: gameData.languages || 'English',
    mirrors: gameData.mirrors || [],
    magnet_link: gameData.magnetLink || null,
    installation_notes: gameData.installationNotes || '',
    rar_password: gameData.rarPassword || '',
    status: gameData.status || 'published',
    trending: gameData.trending || false,
    featured: gameData.featured || false,
    source: gameData.source || 'manual',
    source_url: gameData.sourceUrl || null,
    nfo_content: gameData.nfoContent || null,
    downloads: 0,
    views: 0,
    created_at: now,
    published_at: now,
  }

  const { data, error } = await supabase
    .from('games')
    .insert(dbGame)
    .select()
    .single()

  if (error) {
    console.error('Error creating game:', error)
    throw error
  }

  return mapDbToGame(data)
}

export async function updateGame(id: number, gameData: Partial<Game>): Promise<Game | null> {
  const dbUpdate: Record<string, any> = {}

  if (gameData.title !== undefined) dbUpdate.title = gameData.title
  if (gameData.description !== undefined) dbUpdate.description = gameData.description
  if (gameData.longDescription !== undefined) dbUpdate.long_description = gameData.longDescription
  if (gameData.developer !== undefined) dbUpdate.developer = gameData.developer
  if (gameData.publisher !== undefined) dbUpdate.publisher = gameData.publisher
  if (gameData.releaseDate !== undefined) dbUpdate.release_date = gameData.releaseDate
  if (gameData.coverImage !== undefined) dbUpdate.cover_image = gameData.coverImage
  if (gameData.landscapeImage !== undefined) dbUpdate.landscape_image = gameData.landscapeImage
  if (gameData.screenshots !== undefined) dbUpdate.screenshots = gameData.screenshots
  if (gameData.genres !== undefined) dbUpdate.genres = gameData.genres
  if (gameData.tags !== undefined) dbUpdate.tags = gameData.tags
  if (gameData.rating !== undefined) dbUpdate.rating = gameData.rating
  if (gameData.originalSize !== undefined) dbUpdate.original_size = gameData.originalSize
  if (gameData.repackSize !== undefined) dbUpdate.repack_size = gameData.repackSize
  if (gameData.repackerName !== undefined) dbUpdate.repacker_name = gameData.repackerName
  if (gameData.systemRequirements !== undefined) dbUpdate.system_requirements = gameData.systemRequirements
  if (gameData.languages !== undefined) dbUpdate.languages = gameData.languages
  if (gameData.mirrors !== undefined) dbUpdate.mirrors = gameData.mirrors
  if (gameData.magnetLink !== undefined) dbUpdate.magnet_link = gameData.magnetLink
  if (gameData.installationNotes !== undefined) dbUpdate.installation_notes = gameData.installationNotes
  if (gameData.rarPassword !== undefined) dbUpdate.rar_password = gameData.rarPassword
  if (gameData.status !== undefined) dbUpdate.status = gameData.status
  if (gameData.trending !== undefined) dbUpdate.trending = gameData.trending
  if (gameData.featured !== undefined) dbUpdate.featured = gameData.featured

  dbUpdate.updated_date = new Date().toISOString()

  const { data, error } = await supabase
    .from('games')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating game:', error)
    return null
  }

  return mapDbToGame(data)
}

export async function deleteGame(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) {
      console.error('Error deleting game:', error)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function incrementDownloads(id: number): Promise<void> {
  await supabase.rpc('increment_downloads', { game_id: id })
}

export async function incrementViews(id: number): Promise<void> {
  await supabase.rpc('increment_views', { game_id: id })
}

// ============================================================
// HELPERS
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

function mapDbToGameListItem(db: any): GameListItem {
  return {
    id: db.id,
    title: db.title,
    slug: db.slug,
    description: db.description,
    developer: db.developer,
    publisher: db.publisher,
    coverImage: db.cover_image,
    landscapeImage: db.landscape_image,
    rating: db.rating,
    repackSize: db.repack_size,
    originalSize: db.original_size,
    repackerName: db.repacker_name,
    genres: db.genres || [],
    downloads: db.downloads || 0,
    views: db.views || 0,
    trending: db.trending || false,
    featured: db.featured || false,
    pinned: db.pinned || false,
    repackDate: db.repack_date,
    createdAt: db.created_at,
    mirrors: db.mirrors || [],
    magnetLink: db.magnet_link || '',
    languages: db.languages || 'English',
  }
}

function mapDbToGame(db: any): Game {
  return {
    id: db.id,
    title: db.title,
    slug: db.slug,
    description: db.description,
    longDescription: db.long_description,
    developer: db.developer,
    publisher: db.publisher,
    releaseDate: db.release_date,
    repackDate: db.repack_date,
    updatedDate: db.updated_date,
    coverImage: db.cover_image,
    landscapeImage: db.landscape_image,
    screenshots: db.screenshots || [],
    genres: db.genres || [],
    tags: db.tags || [],
    rating: db.rating,
    originalSize: db.original_size,
    repackSize: db.repack_size,
    repackerName: db.repacker_name,
    repackerUrl: db.repacker_url || '',
    systemRequirements: db.system_requirements || { minimum: {}, recommended: {} },
    languages: db.languages,
    mirrors: db.mirrors || [],
    magnetLink: db.magnet_link || '',
    torrentSeeders: db.torrent_seeders || 0,
    torrentLeechers: db.torrent_leechers || 0,
    torrentInfoHash: db.torrent_info_hash || '',
    installationNotes: db.installation_notes || '',
    rarPassword: db.rar_password || '',
    metaTitle: db.meta_title || '',
    metaDescription: db.meta_description || '',
    canonicalUrl: db.canonical_url || '',
    downloads: db.downloads || 0,
    views: db.views || 0,
    likes: db.likes || 0,
    dislikes: db.dislikes || 0,
    status: db.status,
    trending: db.trending || false,
    featured: db.featured || false,
    pinned: db.pinned || false,
    source: db.source || 'manual',
    sourceUrl: db.source_url || '',
    sourceId: db.source_id || '',
    nfoContent: db.nfo_content || '',
    createdAt: db.created_at,
    publishedAt: db.published_at,
  }
}
