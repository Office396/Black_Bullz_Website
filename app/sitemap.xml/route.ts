// ============================================================
// SITEMAP.XML - Dynamic sitemap generation
// ============================================================

import { supabase } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export async function GET(): Promise<Response> {
  const games: any[] = []
  let offset = 0
  const batchSize = 1000
  let hasMore = true

  // Fetch all published games
  while (hasMore) {
    const { data, error } = await supabase
      .from('games')
      .select('slug, created_at, updated_date, repack_date')
      .eq('status', 'published')
      .range(offset, offset + batchSize - 1)

    if (error || !data || data.length === 0) {
      hasMore = false
      break
    }

    games.push(...data)
    offset += batchSize
    hasMore = data.length === batchSize
  }

  // Get repackers for repacker pages
  const { data: repackers } = await supabase
    .from('repackers')
    .select('slug')
    .eq('active', true)

  // Get genres
  const { data: genres } = await supabase
    .from('genres')
    .select('slug')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Pages -->
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/games</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/latest</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/trending</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/top</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/genres</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/publishers</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Game Pages -->
  ${games.map(game => `
  <url>
    <loc>${SITE_URL}/game/${game.slug}</loc>
    <lastmod>${game.repack_date || game.updated_date || game.created_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Repacker Pages -->
  ${(repackers || []).map(r => `
  <url>
    <loc>${SITE_URL}/publishers/${r.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

  <!-- Genre Pages -->
  ${(genres || []).map(g => `
  <url>
    <loc>${SITE_URL}/genres/${g.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
