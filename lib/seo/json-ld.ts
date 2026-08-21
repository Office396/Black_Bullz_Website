// ============================================================
// SEO JSON-LD SCHEMA
// Adds DownloadAction schema for Google rich results
// Helps Google show "Download" buttons in search results
// ============================================================

// ============================================================
// TYPES
// ============================================================

interface GameSchema {
  name: string
  description: string
  url: string
  imageUrl: string
  datePublished: string
  dateModified?: string
  author?: string
  publisher?: string
  genre?: string[]
  applicationCategory?: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    ratingValue: number
    ratingCount: number
    bestRating: number
    worstRating: number
  }
  downloadUrl?: string
  fileSize?: string
  softwareVersion?: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface FAQItem {
  question: string
  answer: string
}

// ============================================================
// GAME SCHEMA GENERATOR
// ============================================================

export function generateGameSchema(game: {
  title: string
  description: string
  slug: string
  coverImage: string
  releaseDate: string
  updatedDate?: string
  developer?: string
  publisher?: string
  genres?: string[]
  rating?: number
  ratingCount?: number
  repackSize?: string
  version?: string
  mirrors?: Array<{ download_url: string }>
}): GameSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  return {
    name: game.title,
    description: game.description,
    url: `${baseUrl}/game/${game.slug}`,
    imageUrl: game.coverImage,
    datePublished: game.releaseDate,
    dateModified: game.updatedDate,
    author: game.developer,
    publisher: game.publisher,
    genre: game.genres,
    applicationCategory: 'Game',
    operatingSystem: 'Windows',
    offers: {
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: game.rating ? {
      ratingValue: game.rating,
      ratingCount: game.ratingCount || 100,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    downloadUrl: game.mirrors?.[0]?.download_url,
    fileSize: game.repackSize,
    softwareVersion: game.version,
  }
}

// ============================================================
// JSON-LD SCRIPT TAG
// ============================================================

export function generateJsonLd(schema: any): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    ...schema,
  })
}

// ============================================================
// BREADCRUMB SCHEMA
// ============================================================

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  })
}

// ============================================================
// FAQ SCHEMA (for game pages)
// ============================================================

export function generateFAQSchema(items: FAQItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  })
}

// ============================================================
// WEBSITE SCHEMA (for homepage)
// ============================================================

export function generateWebsiteSchema(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'PC Games Repack'

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  })
}

// ============================================================
// ORGANIZATION SCHEMA (for footer)
// ============================================================

export function generateOrganizationSchema(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'PC Games Repack'

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
  })
}

// ============================================================
// DOWNLOAD PAGE SCHEMA (with DownloadAction)
// ============================================================

export function generateDownloadPageSchema(game: {
  title: string
  slug: string
  description: string
  coverImage: string
  repackSize?: string
  version?: string
  repackerName?: string
  mirrors?: Array<{
    host_name: string
    download_url: string
    file_size: string
    status: string
  }>
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${game.title} - Download`,
    description: game.description,
    url: `${baseUrl}/game/${game.slug}`,
    image: game.coverImage,
    mainEntity: {
      '@type': 'VideoGame',
      name: game.title,
      description: game.description,
      image: game.coverImage,
      applicationCategory: 'Game',
      operatingSystem: 'Windows',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  }

  // Add DownloadAction for each active mirror
  if (game.mirrors && game.mirrors.length > 0) {
    schema.potentialAction = game.mirrors
      .filter(m => m.status === 'active')
      .map(m => ({
        '@type': 'DownloadAction',
        name: `Download from ${m.host_name}`,
        target: m.download_url,
        fileSize: m.file_size,
      }))
  }

  return JSON.stringify(schema)
}

// ============================================================
// GAME PAGE JSON-LD COMPONENT (React)
// ============================================================

export function JsonLdScript({ schema }: { schema: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schema }}
    />
  )
}
