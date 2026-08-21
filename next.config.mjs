/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn2.steamgriddb.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
  },
  async headers() {
    return [
      {
        source: '/api/download/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
          { key: 'CDN-Cache-Control', value: 'max-age=300' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'max-age=300' },
        ],
      },
      {
        source: '/api/games/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60' },
          { key: 'CDN-Cache-Control', value: 'max-age=60' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/portal',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
