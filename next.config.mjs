/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['crypto'],
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
