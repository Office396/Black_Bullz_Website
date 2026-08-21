# PC Games Repack Site

A professional PC games repack download site built with Next.js, featuring automated scraping, mirror management, and monetization infrastructure.

## Features

### Core Functionality
- **Automated Scraping**: RSS feeds from FitGirl, DODI, OvaGames, ElAmigos with metadata enrichment
- **Mirror Management**: Multi-host uploads (1fichier, GoFile, Pixeldrain, MediaFire, qBittorrent)
- **Smart Link Rotation**: GeoIP-based mirror ranking with health checks and auto-failover
- **Monetization Engine**: Pop-under ads, shortlink generators, affiliate links
- **Content Moderation**: Auto-flagging, spam detection, admin approval queue
- **Analytics**: Privacy-friendly tracking with Plausible/notrack.ai integration

### Admin Dashboard
- **Worker Monitoring**: Real-time status of all background workers
- **Earnings Tracking**: Revenue from ads, affiliates, and donations
- **Link Health**: Monitor mirror uptime and auto-failover
- **Moderation Queue**: Review flagged content, comments, and reports
- **Audit Logs**: Track all admin actions

### Download Page (Revenue Engine)
- **Mirror Selection**: Ranked by health, speed, and GeoIP proximity
- **Installation Notes**: Step-by-step guide with RAR password
- **File Structure Preview**: Part count and file sizes
- **Live Status Badges**: Active/dead/checking indicators
- **Download Counter**: Social proof for downloads

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with dark theme
- **Scraping**: Cheerio for HTML parsing
- **Uploads**: Axios for file host APIs
- **Analytics**: Plausible/notrack.ai (privacy-friendly)

## File Structure

### Core Components
- `components/game-details.tsx` - Game page with repacker profiles, ratings, comments
- `components/download-page-content.tsx` - Revenue-optimized download page
- `components/comments.tsx` - Threaded comment system

### Backend Services
- `lib/server/games-store.ts` - Game CRUD operations
- `lib/server/repacker-store.ts` - Repacker profile management
- `lib/server/comment-store.ts` - Threaded comments with spam detection
- `lib/server/rating-store.ts` - Rating system with auto-flagging

### Workers
- `lib/workers/rss-scraper.ts` - RSS feed scraper
- `lib/workers/upload-workers.ts` - File host upload APIs
- `lib/workers/link-health-checker.ts` - Mirror health monitoring
- `lib/workers/orchestrator.ts` - Worker scheduling system
- `lib/workers/mirror-rotation.ts` - GeoIP-based mirror ranking
- `lib/workers/shortlink-generator.ts` - Affiliate link injection
- `lib/workers/smart-redirect.ts` - Revenue engine middleware
- `lib/workers/geo-blocker.ts` - Country-based access control
- `lib/workers/captcha-bypass.ts` - Rate limiting with Turnstile

### Database
- `database/repack-site-schema.sql` - Main production schema
- `database/migrate-items-to-games.sql` - Migration from old items table
- `database/indexes-and-optimization.sql` - Performance indexes
- `database/audit-and-ratings-tables.sql` - Audit logs and ratings
- `database/click-logs-table.sql` - Click tracking for analytics

## Setup

1. Install dependencies: `npm install`
2. Set up Supabase project and run schema SQL files
3. Configure environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# File Host APIs
ONEFICHIER_API_TOKEN=your_1fichier_token
GOFILE_ACCOUNT_ID=your_gofile_account

# Shortlink APIs
GP_LINKS_API_TOKEN=your_gplinks_token
V2_LINKS_API_TOKEN=your_v2links_token

# Analytics
PLAUSIBLE_API_KEY=your_plausible_key
PLAUSIBLE_SITE_ID=your_site_id

# Ads
MONETAG_ZONE_ID=your_monetag_zone
PROPELLERADS_ZONE_ID=your_propellerads_zone
```

## License

Private - All rights reserved.
