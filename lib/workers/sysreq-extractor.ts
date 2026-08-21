// ============================================================
// SYSTEM REQUIREMENTS AUTO-EXTRACTION
// Extracts structured CPU/RAM/GPU/Storage from game pages
// Normalizes into consistent DB fields
// ============================================================

import axios from 'axios'
import * as cheerio from 'cheerio'
import { supabase } from '../supabase'

// ============================================================
// TYPES
// ============================================================

interface SystemRequirements {
  minimum: RequirementSpec
  recommended: RequirementSpec
}

interface RequirementSpec {
  os: string
  processor: string
  memory: string
  graphics: string
  storage: string
  directx: string
  soundCard: string
  network: string
}

interface ExtractedRequirements {
  raw: string
  parsed: SystemRequirements
  confidence: number
}

// ============================================================
// PARSING PATTERNS
// ============================================================

const PATTERNS = {
  os: [
    /(?:OS|Operating System)[:\s]*([^\n,]+)/i,
    /(?:Windows|Linux|Mac)\s*(?:\d+\s*)?(?:SP\d+)?(?:\s*(?:64|32)\s*[- ]?bit)?/i,
  ],
  processor: [
    /(?:CPU|Processor|Intel|AMD|Ryzen|Core)[^:\n]*?[:\s]*([^\n,]+)/i,
    /(?:Intel|AMD|Ryzen)\s+(?:Core\s+)?(?:i[3579]|i[3579]-\d{4,5}|R[357]\s*\d{4}X?)/i,
  ],
  memory: [
    /(?:RAM|Memory)[:\s]*(\d+\s*(?:GB|MB))/i,
    /(\d+\s*(?:GB|MB)\s*(?:RAM)?)/i,
  ],
  graphics: [
    /(?:GPU|Graphics|Video Card|NVIDIA|GeForce|AMD|Radeon|Intel)[:\s]*([^\n,]+)/i,
    /(?:NVIDIA|GeForce|AMD|Radeon)\s+(?:GTX|RTX|RX)\s*\d{3,5}(?:\s*(?:Ti|Super))?/i,
  ],
  storage: [
    /(?:Storage|HDD|SSD|Disk Space|Available Space)[:\s]*(\d+\s*(?:GB|MB|TB))/i,
    /(\d+\s*(?:GB|MB|TB)\s*(?:available\s*)?(?:space)?)/i,
  ],
  directx: [
    /(?:DirectX)[:\s]*(?:Version\s*)?(\d+(?:\.\d+)?)/i,
    /DirectX\s*(\d{2})/i,
  ],
}

// ============================================================
// STEAM API EXTRACTION
// ============================================================

export async function extractFromSteam(storeUrl: string): Promise<ExtractedRequirements | null> {
  try {
    // Extract app ID from URL
    const appIdMatch = storeUrl.match(/\/app\/(\d+)/)
    if (!appIdMatch) return null

    const appId = appIdMatch[1]
    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=english`,
      { timeout: 10000 }
    )

    const appData = response.data?.[appId]?.data
    if (!appData) return null

    const pcReqs = appData?.requirements?.pc
    if (!pcReqs) return null

    const minimum = pcReqs.minimum || ''
    const recommended = pcReqs.recommended || ''

    return {
      raw: `MINIMUM:\n${minimum}\n\nRECOMMENDED:\n${recommended}`,
      parsed: {
        minimum: parseRequirementsText(minimum),
        recommended: parseRequirementsText(recommended),
      },
      confidence: 85,
    }
  } catch (error: any) {
    console.error('[SysReq] Steam extraction failed:', error.message)
    return null
  }
}

// ============================================================
// IGDB API EXTRACTION
// ============================================================

export async function extractFromIGDB(gameTitle: string): Promise<ExtractedRequirements | null> {
  try {
    // IGDB requires Twitch OAuth token
    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    if (!clientId || !clientSecret) return null

    // Get OAuth token
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
    })

    const accessToken = tokenResponse.data?.access_token
    if (!accessToken) return null

    // Search for game
    const searchResponse = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${gameTitle}"; fields name,platforms,genres,release_dates,game_modes; limit 1;`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
      }
    )

    const game = searchResponse.data?.[0]
    if (!game) return null

    // IGDB doesn't directly provide system requirements
    // But we can get platforms and use that to infer
    return null
  } catch (error: any) {
    console.error('[SysReq] IGDB extraction failed:', error.message)
    return null
  }
}

// ============================================================
// GENERIC PAGE EXTRACTION
// ============================================================

export async function extractFromPage(url: string): Promise<ExtractedRequirements | null> {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data)
    const pageText = $.text()

    // Look for system requirements sections
    const sysReqPatterns = [
      /(?:System Requirements|Minimum|Recommended|Requirements)[:\s]*([\s\S]*?)(?:(?:Additional|Notes|Features|Download)|$)/i,
      /(?:MINIMUM|RECOMMENDED)[:\s]*([\s\S]*?)(?:(?:RECOMMENDED|MINIMUM|Additional|Notes)|$)/i,
    ]

    let rawText = ''
    for (const pattern of sysReqPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        rawText = match[0]
        break
      }
    }

    if (!rawText) return null

    // Split into minimum and recommended
    let minimumText = ''
    let recommendedText = ''

    if (rawText.includes('MINIMUM') && rawText.includes('RECOMMENDED')) {
      const parts = rawText.split(/RECOMMENDED/i)
      minimumText = parts[0]?.replace(/MINIMUM/i, '') || ''
      recommendedText = parts[1] || ''
    } else {
      minimumText = rawText
    }

    return {
      raw: rawText,
      parsed: {
        minimum: parseRequirementsText(minimumText),
        recommended: parseRequirementsText(recommendedText || minimumText),
      },
      confidence: 70,
    }
  } catch (error: any) {
    console.error('[SysReq] Page extraction failed:', error.message)
    return null
  }
}

// ============================================================
// TEXT PARSER (Core logic)
// ============================================================

function parseRequirementsText(text: string): RequirementSpec {
  const spec: RequirementSpec = {
    os: '',
    processor: '',
    memory: '',
    graphics: '',
    storage: '',
    directx: '',
    soundCard: '',
    network: '',
  }

  if (!text) return spec

  // Extract each field using patterns
  for (const [field, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const value = match[1]?.trim() || match[0]?.trim()
        if (value && value.length > 2) {
          spec[field as keyof RequirementSpec] = value
          break
        }
      }
    }
  }

  // Fallback: extract from line-by-line parsing
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  for (const line of lines) {
    const lower = line.toLowerCase()

    if (!spec.os && (lower.includes('windows') || lower.includes('linux') || lower.includes('mac'))) {
      spec.os = line.replace(/^[-•*]\s*/, '')
    }

    if (!spec.processor && (lower.includes('intel') || lower.includes('amd') || lower.includes('ryzen') || lower.includes('core i'))) {
      spec.processor = line.replace(/^[-•*]\s*/, '')
    }

    if (!spec.memory && (lower.includes('ram') || lower.includes('memory') || /\d+\s*gb/i.test(line))) {
      spec.memory = line.replace(/^[-•*]\s*/, '')
    }

    if (!spec.graphics && (lower.includes('nvidia') || lower.includes('geforce') || lower.includes('radeon') || lower.includes('gtx') || lower.includes('rtx'))) {
      spec.graphics = line.replace(/^[-•*]\s*/, '')
    }

    if (!spec.storage && (lower.includes('storage') || lower.includes('hdd') || lower.includes('ssd') || lower.includes('disk space'))) {
      spec.storage = line.replace(/^[-•*]\s*/, '')
    }

    if (!spec.directx && lower.includes('directx')) {
      spec.directx = line.replace(/^[-•*]\s*/, '')
    }
  }

  return spec
}

// ============================================================
// NORMALIZE REQUIREMENTS (Standardize format)
// ============================================================

export function normalizeRequirements(req: RequirementSpec): RequirementSpec {
  return {
    os: normalizeOS(req.os),
    processor: normalizeProcessor(req.processor),
    memory: normalizeMemory(req.memory),
    graphics: normalizeGraphics(req.graphics),
    storage: normalizeStorage(req.storage),
    directx: normalizeDirectX(req.directx),
    soundCard: req.soundCard,
    network: req.network,
  }
}

function normalizeOS(os: string): string {
  if (!os) return ''
  // Standardize Windows versions
  if (/windows\s*11/i.test(os)) return 'Windows 11 64-bit'
  if (/windows\s*10/i.test(os)) return 'Windows 10 64-bit'
  if (/windows\s*7/i.test(os)) return 'Windows 7 64-bit'
  return os
}

function normalizeProcessor(cpu: string): string {
  if (!cpu) return ''
  // Standardize Intel
  cpu = cpu.replace(/Intel\s+Core\s+/i, 'Intel Core ')
  cpu = cpu.replace(/i(\d)\s*-(\d{4,5})/i, 'i$1-$2')
  // Standardize AMD
  cpu = cpu.replace(/Ryzen\s+/i, 'AMD Ryzen ')
  return cpu
}

function normalizeMemory(ram: string): string {
  if (!ram) return ''
  const match = ram.match(/(\d+)\s*(GB|MB)/i)
  if (match) {
    return `${match[1]} ${match[2].toUpperCase()} RAM`
  }
  return ram
}

function normalizeGraphics(gpu: string): string {
  if (!gpu) return ''
  // Standardize NVIDIA
  gpu = gpu.replace(/NVIDIA\s+GeForce\s+/i, 'NVIDIA GeForce ')
  gpu = gpu.replace(/GeForce\s+/i, 'NVIDIA GeForce ')
  // Standardize AMD
  gpu = gpu.replace(/AMD\s+Radeon\s+/i, 'AMD Radeon ')
  return gpu
}

function normalizeStorage(storage: string): string {
  if (!storage) return ''
  const match = storage.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i)
  if (match) {
    return `${match[1]} ${match[2].toUpperCase()} available space`
  }
  return storage
}

function normalizeDirectX(dx: string): string {
  if (!dx) return ''
  const match = dx.match(/(\d+)/)
  if (match) {
    return `Version ${match[1]}`
  }
  return dx
}

// ============================================================
// AUTO-EXTRACT FOR GAME
// ============================================================

export async function autoExtractSystemRequirements(
  gameTitle: string,
  steamUrl?: string,
  sourceUrl?: string
): Promise<SystemRequirements | null> {
  console.log(`[SysReq] Auto-extracting for: ${gameTitle}`)

  // Try Steam first
  if (steamUrl) {
    const steamResult = await extractFromSteam(steamUrl)
    if (steamResult) {
      console.log(`[SysReq] Steam extraction success (confidence: ${steamResult.confidence}%)`)
      return {
        minimum: normalizeRequirements(steamResult.parsed.minimum),
        recommended: normalizeRequirements(steamResult.parsed.recommended),
      }
    }
  }

  // Try source page
  if (sourceUrl) {
    const pageResult = await extractFromPage(sourceUrl)
    if (pageResult) {
      console.log(`[SysReq] Page extraction success (confidence: ${pageResult.confidence}%)`)
      return {
        minimum: normalizeRequirements(pageResult.parsed.minimum),
        recommended: normalizeRequirements(pageResult.parsed.recommended),
      }
    }
  }

  console.log(`[SysReq] No system requirements found for: ${gameTitle}`)
  return null
}

// ============================================================
// BATCH UPDATE SYSTEM REQUIREMENTS
// ============================================================

export async function batchUpdateSystemRequirements(): Promise<{
  updated: number
  failed: number
  skipped: number
}> {
  console.log('[SysReq] Starting batch system requirements update...')

  // Get games without system requirements
  const { data: games } = await supabase
    .from('games')
    .select('id, title, source_url')
    .eq('status', 'published')
    .is('system_requirements', null)
    .limit(50)

  if (!games) return { updated: 0, failed: 0, skipped: 0 }

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const game of games) {
    try {
      const requirements = await autoExtractSystemRequirements(game.title, undefined, game.source_url)

      if (requirements) {
        await supabase
          .from('games')
          .update({ system_requirements: requirements })
          .eq('id', game.id)

        updated++
        console.log(`[SysReq] Updated requirements for: ${game.title}`)
      } else {
        skipped++
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 1000))
    } catch (error: any) {
      console.error(`[SysReq] Failed for ${game.title}:`, error.message)
      failed++
    }
  }

  console.log(`[SysReq] Complete: ${updated} updated, ${failed} failed, ${skipped} skipped`)
  return { updated, failed, skipped }
}
