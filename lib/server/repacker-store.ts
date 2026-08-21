// ============================================================
// REPACKER PROFILE MANAGEMENT
// Logo, Banner, Bio, Priority, Custom Installer Icons
// ============================================================

import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface RepackerProfile {
  id: number
  name: string
  slug: string
  url: string
  logoUrl: string
  bannerUrl: string
  bio: string
  description: string
  priority: number
  color: string
  iconUrl: string
  installerIconUrl: string
  totalGames: number
  totalDownloads: number
  active: boolean
  verified: boolean
  socialLinks: {
    website?: string
    telegram?: string
    discord?: string
    twitter?: string
  }
  stats: {
    avgRating: number
    totalReviews: number
    healthScore: number
  }
  createdAt: string
}

// ============================================================
// REPACKER PRIORITY TABLE
// ============================================================

const REPACKER_PRIORITY: Record<string, number> = {
  'fitgirl': 100,
  'fitgirl-repacks': 100,
  'dodi': 90,
  'dodi-repacks': 90,
  'elamigos': 80,
  'elamigos-games': 80,
  'ovagames': 75,
  'ova-games': 75,
  'kaos': 70,
  'kaoskrew': 70,
  'cpy': 65,
  'plaza': 60,
  'codex': 55,
  'ali213': 50,
  'empress': 45,
}

const REPACKER_COLORS: Record<string, string> = {
  'fitgirl': '#ff6b6b',
  'dodi': '#4ecdc4',
  'elamigos': '#45b7d1',
  'ovagames': '#96ceb4',
  'kaos': '#ffeaa7',
  'cpy': '#dda0dd',
  'plaza': '#98d8c8',
  'codex': '#f7dc6f',
  'ali213': '#82e0aa',
  'empress': '#f8c291',
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

export async function getRepackerProfiles(): Promise<RepackerProfile[]> {
  const { data, error } = await supabase
    .from('repackers')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false })

  if (error) return []
  return (data || []).map(mapDbToProfile)
}

export async function getRepackerBySlug(slug: string): Promise<RepackerProfile | null> {
  const { data, error } = await supabase
    .from('repackers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return mapDbToProfile(data)
}

export async function getRepackerById(id: number): Promise<RepackerProfile | null> {
  const { data, error } = await supabase
    .from('repackers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return mapDbToProfile(data)
}

export async function createRepackerProfile(profile: Partial<RepackerProfile>): Promise<RepackerProfile | null> {
  const slug = profile.name?.toLowerCase().replace(/\s+/g, '-') || ''
  const priority = REPACKER_PRIORITY[slug] || 30
  const color = REPACKER_COLORS[slug] || '#888888'

  const { data, error } = await supabase
    .from('repackers')
    .insert({
      name: profile.name,
      slug,
      url: profile.url || '',
      logo_url: profile.logoUrl || '',
      banner_url: profile.bannerUrl || '',
      bio: profile.bio || '',
      description: profile.description || '',
      priority,
      color,
      icon_url: profile.iconUrl || '',
      installer_icon_url: profile.installerIconUrl || '',
      active: true,
      verified: false,
      social_links: profile.socialLinks || {},
    })
    .select()
    .single()

  if (error) {
    console.error('[Repacker] Create error:', error)
    return null
  }

  return mapDbToProfile(data)
}

export async function updateRepackerProfile(id: number, updates: Partial<RepackerProfile>): Promise<RepackerProfile | null> {
  const dbUpdates: any = {}
  if (updates.name) dbUpdates.name = updates.name
  if (updates.url) dbUpdates.url = updates.url
  if (updates.logoUrl) dbUpdates.logo_url = updates.logoUrl
  if (updates.bannerUrl) dbUpdates.banner_url = updates.bannerUrl
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.color) dbUpdates.color = updates.color
  if (updates.iconUrl) dbUpdates.icon_url = updates.iconUrl
  if (updates.installerIconUrl) dbUpdates.installer_icon_url = updates.installerIconUrl
  if (updates.verified !== undefined) dbUpdates.verified = updates.verified
  if (updates.socialLinks) dbUpdates.social_links = updates.socialLinks

  const { data, error } = await supabase
    .from('repackers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return mapDbToProfile(data)
}

// ============================================================
// GET REPACKER GAMES
// ============================================================

export async function getRepackerGames(repackerSlug: string, limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('games')
    .select('id, title, slug, cover_image, repack_size, rating, downloads, views, created_at, repack_date')
    .eq('status', 'published')
    .ilike('repacker_name', `%${repackerSlug}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

// ============================================================
// GET REPACKER STATS
// ============================================================

export async function getRepackerStats(repackerSlug: string): Promise<{
  totalGames: number
  totalDownloads: number
  avgRating: number
  healthScore: number
}> {
  const games = await getRepackerGames(repackerSlug, 1000)

  const totalGames = games.length
  const totalDownloads = games.reduce((sum, g) => sum + (g.downloads || 0), 0)
  const avgRating = games.length > 0
    ? games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length
    : 0

  // Health score based on activity and game count
  const healthScore = Math.min(100, Math.round(
    (totalGames * 2) +
    (totalDownloads / 1000) +
    (avgRating * 10)
  ))

  return { totalGames, totalDownloads, avgRating, healthScore }
}

// ============================================================
// HELPERS
// ============================================================

function mapDbToProfile(db: any): RepackerProfile {
  return {
    id: db.id,
    name: db.name,
    slug: db.slug,
    url: db.url || '',
    logoUrl: db.logo_url || '',
    bannerUrl: db.banner_url || '',
    bio: db.bio || '',
    description: db.description || '',
    priority: db.priority || 30,
    color: db.color || '#888888',
    iconUrl: db.icon_url || '',
    installerIconUrl: db.installer_icon_url || '',
    totalGames: db.total_games || 0,
    totalDownloads: db.total_downloads || 0,
    active: db.active !== false,
    verified: db.verified || false,
    socialLinks: db.social_links || {},
    stats: {
      avgRating: 0,
      totalReviews: 0,
      healthScore: 0,
    },
    createdAt: db.created_at,
  }
}
