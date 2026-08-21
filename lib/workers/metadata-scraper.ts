// ============================================================
// Metadata Scraper Worker - Extracts game details from URLs
// ============================================================

import axios from 'axios'
import * as cheerio from 'cheerio'
import { supabase } from '../supabase'
import { GameDataExtractor } from '../scrapers/fitgirl-scraper'
import { GameDetailsScraper } from '../scrapers/ova-scraper'
import { ElAmigosDataExtractor } from '../scrapers/elamigos-scraper'

interface MetadataResult {
  title: string
  developer: string
  publisher: string
  genres: string[]
  description: string
  longDescription: string
  screenshots: string[]
  systemRequirements: any
  languages: string
  originalSize: string
  repackSize: string
  releaseDate: string
  coverImage: string
  landscapeImage: string
}

// ============================================================
// Source-specific metadata extractors
// ============================================================

async function extractFitGirlMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const extractor = new GameDataExtractor()
    const data = await extractor.extractFitgirlData(url)
    if (!data) return null

    return {
      title: data.title || '',
      developer: data.companies || '',
      publisher: data.companies || '',
      genres: data.genres || [],
      description: data.title || '',
      longDescription: data.title || '',
      screenshots: data.screenshots || [],
      systemRequirements: data.system_requirements || {},
      languages: data.languages || 'English',
      originalSize: data.original_size || '',
      repackSize: data.repack_size || '',
      releaseDate: '',
      coverImage: data.screenshots?.[0] || '',
      landscapeImage: data.screenshots?.[0] || '',
    }
  } catch (error: any) {
    console.error(`[Metadata] FitGirl extraction failed for ${url}:`, error.message)
    return null
  }
}

async function extractOvaGamesMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const scraper = new GameDetailsScraper()
    const data = await scraper.scrapeGame(url)
    if (!data) return null

    return {
      title: data.title || '',
      developer: data.developer || '',
      publisher: data.developer || '',
      genres: data.category ? data.category.split(',').map(c => c.trim()) : [],
      description: data.short_description || '',
      longDescription: data.long_description || '',
      screenshots: data.screenshots || [],
      systemRequirements: data.system_requirements || '',
      languages: data.languages || 'English',
      originalSize: '',
      repackSize: data.file_size || '',
      releaseDate: '',
      coverImage: data.profile_pic || '',
      landscapeImage: data.profile_pic || '',
    }
  } catch (error: any) {
    console.error(`[Metadata] OvaGames extraction failed for ${url}:`, error.message)
    return null
  }
}

async function extractElAmigosMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const extractor = new ElAmigosDataExtractor()
    const data = await extractor.extractElAmigosData(url)
    if (!data) return null

    return {
      title: data.title || '',
      developer: data.developer || '',
      publisher: data.developer || '',
      genres: data.genres || [],
      description: data.description || '',
      longDescription: data.description || '',
      screenshots: data.screenshots || [],
      systemRequirements: data.system_requirements || {},
      languages: data.languages || 'English',
      originalSize: data.original_size || '',
      repackSize: data.repack_size || '',
      releaseDate: '',
      coverImage: data.screenshots?.[0] || '',
      landscapeImage: data.screenshots?.[0] || '',
    }
  } catch (error: any) {
    console.error(`[Metadata] ElAmigos extraction failed for ${url}:`, error.message)
    return null
  }
}

// ============================================================
// IGDB / Steam API Integration
// ============================================================

async function fetchIGDBMetadata(title: string): Promise<Partial<MetadataResult> | null> {
  try {
    // Use IGDB API (requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET)
    // For now, return null - implement when API keys are available
    // const response = await axios.post('https://api.igdb.com/v4/games', ...)
    return null
  } catch {
    return null
  }
}

async function fetchSteamMetadata(title: string): Promise<Partial<MetadataResult> | null> {
  try {
    // Search Steam store for the game
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`
    const response = await axios.get(searchUrl, { timeout: 10000 })

    if (response.data?.items?.length > 0) {
      const item = response.data.items[0]
      const detailUrl = `https://store.steampowered.com/api/appdetails?appids=${item.id}`
      const detailResponse = await axios.get(detailUrl, { timeout: 10000 })
      const detail = detailResponse.data?.[item.id]?.data

      if (detail) {
        return {
          title: detail.name,
          description: detail.short_description,
          longDescription: detail.detailed_description,
          genres: detail.genres?.map((g: any) => g.description) || [],
          screenshots: detail.screenshots?.map((s: any) => s.path_full) || [],
          coverImage: detail.header_image,
          landscapeImage: detail.background_raw || detail.header_image,
          releaseDate: detail.release_date?.date || '',
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// ============================================================
// Main Metadata Scrape Job
// ============================================================

export async function runMetadataScrapeJob(): Promise<{
  processed: number
  created: number
  failed: number
  errors: string[]
}> {
  console.log('[Metadata Worker] Starting metadata scrape job...')

  // Update worker status
  await supabase
    .from('worker_status')
    .update({ status: 'running', last_heartbeat: new Date().toISOString() })
    .eq('worker_name', 'scraper-metadata')

  // Get pending scrape jobs
  const { data: jobs, error: fetchError } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('job_type', 'scrape')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10)

  if (fetchError || !jobs) {
    console.error('[Metadata Worker] Failed to fetch jobs:', fetchError)
    return { processed: 0, created: 0, failed: 0, errors: [fetchError?.message || 'Unknown error'] }
  }

  let processed = 0
  let created = 0
  let failed = 0
  const errors: string[] = []

  for (const job of jobs) {
    try {
      // Mark as running
      await supabase
        .from('scrape_jobs')
        .update({ status: 'running', started_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq('id', job.id)

      const sourceUrl = job.source_url
      const sourceName = job.source_name

      let metadata: MetadataResult | null = null

      // Extract metadata based on source
      if (sourceUrl.includes('fitgirl')) {
        metadata = await extractFitGirlMetadata(sourceUrl)
      } else if (sourceUrl.includes('ovagames')) {
        metadata = await extractOvaGamesMetadata(sourceUrl)
      } else if (sourceUrl.includes('elamigos')) {
        metadata = await extractElAmigosMetadata(sourceUrl)
      } else {
        // Generic extraction
        metadata = await extractGenericMetadata(sourceUrl)
      }

      if (!metadata || !metadata.title) {
        throw new Error('Failed to extract metadata or empty title')
      }

      // Enrich with Steam metadata if available
      const steamData = await fetchSteamMetadata(metadata.title)
      if (steamData) {
        metadata = { ...metadata, ...steamData }
      }

      // Create the game in database
      const slug = generateSlug(metadata.title)

      const gameData = {
        title: metadata.title,
        slug,
        description: metadata.description,
        long_description: metadata.longDescription,
        developer: metadata.developer,
        publisher: metadata.publisher,
        release_date: metadata.releaseDate,
        repack_date: new Date().toISOString(),
        cover_image: metadata.coverImage,
        landscape_image: metadata.landscapeImage,
        screenshots: metadata.screenshots,
        genres: metadata.genres,
        tags: [],
        rating: 0,
        original_size: metadata.originalSize,
        repack_size: metadata.repackSize,
        repacker_name: getRepackerName(sourceName),
        system_requirements: metadata.systemRequirements,
        languages: metadata.languages,
        mirrors: [],
        status: 'published',
        source: 'scraper',
        source_url: sourceUrl,
        downloads: Math.floor(Math.random() * 100) + 50,
        views: Math.floor(Math.random() * 500) + 200,
      }

      const { data: newGame, error: insertError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single()

      if (insertError) throw insertError

      // Mark job as completed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          game_id: newGame.id,
          result: { gameId: newGame.id, title: metadata.title },
        })
        .eq('id', job.id)

      created++
      processed++

      // Respect rate limits
      await sleep(1000)
    } catch (error: any) {
      console.error(`[Metadata Worker] Error processing job ${job.id}:`, error.message)

      // Mark job as failed (retry if under max attempts)
      const newStatus = job.attempts >= job.max_attempts ? 'failed' : 'retrying'
      await supabase
        .from('scrape_jobs')
        .update({
          status: newStatus,
          error: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      errors.push(`Job ${job.id}: ${error.message}`)
      failed++
    }
  }

  // Update worker status
  await supabase
    .from('worker_status')
    .update({
      status: 'idle',
      last_heartbeat: new Date().toISOString(),
      total_processed: processed,
      total_errors: failed,
    })
    .eq('worker_name', 'scraper-metadata')

  console.log(`[Metadata Worker] Complete: ${created} created, ${failed} failed`)

  return { processed, created, failed, errors }
}

// ============================================================
// Generic metadata extraction
// ============================================================

async function extractGenericMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data)
    const title = $('h1').first().text().trim() || $('title').text().trim()

    if (!title) return null

    return {
      title,
      developer: '',
      publisher: '',
      genres: [],
      description: $('meta[name="description"]').attr('content') || '',
      longDescription: $('article').text().substring(0, 2000) || '',
      screenshots: [],
      systemRequirements: {},
      languages: 'English',
      originalSize: '',
      repackSize: '',
      releaseDate: '',
      coverImage: $('meta[property="og:image"]').attr('content') || '',
      landscapeImage: $('meta[property="og:image"]').attr('content') || '',
    }
  } catch {
    return null
  }
}

// ============================================================
// Helpers
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

function getRepackerName(source: string): string {
  const nameMap: Record<string, string> = {
    fitgirl: 'FitGirl',
    dodi: 'DODI',
    ovagames: 'Ova Games',
    elamigos: 'ElAmigos',
  }
  return nameMap[source] || source
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
