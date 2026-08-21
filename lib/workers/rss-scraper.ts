// ============================================================
// RSS Scraper Worker - Fetches new releases from RSS feeds
// ============================================================

import axios from 'axios'
import * as cheerio from 'cheerio'
import { supabase } from '../supabase'

interface RSSItem {
  title: string
  link: string
  pubDate: string
  description: string
  categories: string[]
}

interface ScrapeResult {
  success: boolean
  items: RSSItem[]
  errors: string[]
}

// ============================================================
// Feed Scrapers per Source
// ============================================================

export async function scrapeFitGirlRSS(): Promise<ScrapeResult> {
  const items: RSSItem[] = []
  const errors: string[] = []

  try {
    const response = await axios.get('https://fitgirl-repacks.site/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data, { xmlMode: true })

    $('item').each((_, el) => {
      const title = $(el).find('title').text().trim()
      const link = $(el).find('link').text().trim()
      const pubDate = $(el).find('pubDate').text().trim()
      const description = $(el).find('description').text().trim()
      const categories: string[] = []
      $(el).find('category').each((_, cat) => {
        categories.push($(cat).text().trim())
      })

      if (title && link) {
        items.push({ title, link, pubDate, description, categories })
      }
    })

    console.log(`[FitGirl RSS] Scraped ${items.length} items`)
  } catch (error: any) {
    errors.push(`FitGirl RSS error: ${error.message}`)
    console.error('[FitGirl RSS] Error:', error.message)
  }

  return { success: errors.length === 0, items, errors }
}

export async function scrapeDODIRSS(): Promise<ScrapeResult> {
  const items: RSSItem[] = []
  const errors: string[] = []

  try {
    const response = await axios.get('https://dodi-repacks.site/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data, { xmlMode: true })

    $('item').each((_, el) => {
      const title = $(el).find('title').text().trim()
      const link = $(el).find('link').text().trim()
      const pubDate = $(el).find('pubDate').text().trim()
      const description = $(el).find('description').text().trim()
      const categories: string[] = []
      $(el).find('category').each((_, cat) => {
        categories.push($(cat).text().trim())
      })

      if (title && link) {
        items.push({ title, link, pubDate, description, categories })
      }
    })

    console.log(`[DODI RSS] Scraped ${items.length} items`)
  } catch (error: any) {
    errors.push(`DODI RSS error: ${error.message}`)
    console.error('[DODI RSS] Error:', error.message)
  }

  return { success: errors.length === 0, items, errors }
}

export async function scrapeOvaGamesRSS(): Promise<ScrapeResult> {
  const items: RSSItem[] = []
  const errors: string[] = []

  try {
    const response = await axios.get('https://ovagames.com/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data, { xmlMode: true })

    $('item').each((_, el) => {
      const title = $(el).find('title').text().trim()
      const link = $(el).find('link').text().trim()
      const pubDate = $(el).find('pubDate').text().trim()
      const description = $(el).find('description').text().trim()
      const categories: string[] = []
      $(el).find('category').each((_, cat) => {
        categories.push($(cat).text().trim())
      })

      if (title && link) {
        items.push({ title, link, pubDate, description, categories })
      }
    })

    console.log(`[OvaGames RSS] Scraped ${items.length} items`)
  } catch (error: any) {
    errors.push(`OvaGames RSS error: ${error.message}`)
    console.error('[OvaGames RSS] Error:', error.message)
  }

  return { success: errors.length === 0, items, errors }
}

// ============================================================
// Check if game already exists in database
// ============================================================

async function gameExists(sourceUrl: string): Promise<boolean> {
  const { data } = await supabase
    .from('games')
    .select('id')
    .eq('source_url', sourceUrl)
    .limit(1)

  return (data && data.length > 0)
}

// ============================================================
// Main RSS Scrape Job
// ============================================================

export async function runRSSScrapeJob(): Promise<{
  total: number
  new: number
  skipped: number
  errors: string[]
}> {
  console.log('[RSS Worker] Starting RSS scrape job...')

  // Update worker status
  await supabase
    .from('worker_status')
    .update({ status: 'running', last_heartbeat: new Date().toISOString() })
    .eq('worker_name', 'scraper-rss')

  const allItems: Array<RSSItem & { source: string }> = []
  const allErrors: string[] = []

  // Scrape all RSS feeds in parallel
  const [fitgirl, dodi, ovagames] = await Promise.all([
    scrapeFitGirlRSS(),
    scrapeDODIRSS(),
    scrapeOvaGamesRSS(),
  ])

  fitgirl.items.forEach(item => allItems.push({ ...item, source: 'fitgirl' }))
  dodi.items.forEach(item => allItems.push({ ...item, source: 'dodi' }))
  ovagames.items.forEach(item => allItems.push({ ...item, source: 'ovagames' }))
  allErrors.push(...fitgirl.errors, ...dodi.errors, ...ovagames.errors)

  let newCount = 0
  let skippedCount = 0

  // Process each item
  for (const item of allItems) {
    try {
      // Check if already scraped
      const exists = await gameExists(item.link)
      if (exists) {
        skippedCount++
        continue
      }

      // Create scrape job for metadata extraction
      await supabase.from('scrape_jobs').insert({
        job_type: 'scrape',
        status: 'pending',
        source_url: item.link,
        source_name: item.source,
        result: { title: item.title, pubDate: item.pubDate, categories: item.categories },
      })

      newCount++
    } catch (error: any) {
      allErrors.push(`Error processing ${item.link}: ${error.message}`)
    }
  }

  // Update worker status
  await supabase
    .from('worker_status')
    .update({
      status: 'idle',
      last_heartbeat: new Date().toISOString(),
      total_processed: newCount,
    })
    .eq('worker_name', 'scraper-rss')

  console.log(`[RSS Worker] Complete: ${newCount} new, ${skippedCount} skipped, ${allErrors.length} errors`)

  return {
    total: allItems.length,
    new: newCount,
    skipped: skippedCount,
    errors: allErrors,
  }
}

// ============================================================
// Schedule RSS scrape (called by cron)
// ============================================================

export async function scheduleRSSScrape(): Promise<void> {
  console.log('[Scheduler] Scheduling RSS scrape...')

  // Check if a job is already running
  const { data: existingJob } = await supabase
    .from('worker_status')
    .select('status')
    .eq('worker_name', 'scraper-rss')
    .single()

  if (existingJob?.status === 'running') {
    console.log('[Scheduler] RSS scraper already running, skipping...')
    return
  }

  await runRSSScrapeJob()
}
