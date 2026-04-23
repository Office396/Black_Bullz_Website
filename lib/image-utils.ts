/**
 * Domains protected by Cloudflare or similar services that block
 * server-side requests. Images from these domains must be loaded
 * directly in the browser (not through Next.js image optimizer).
 */
const DIRECT_LOAD_DOMAINS = [
  'ankergames.net',
  'bp.blogspot.com',
  'blogger.googleusercontent.com',
  'riotpixels.net',
  'fastpic.ru',
  'imageban.ru',
]

/**
 * Check if a URL belongs to a domain that requires direct browser loading
 * (i.e. cannot be proxied through Next.js image optimizer).
 */
export function needsDirectLoad(url: string): boolean {
  if (!url || url.startsWith('/')) return false
  try {
    const hostname = new URL(url).hostname
    return DIRECT_LOAD_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch {
    return false
  }
}
