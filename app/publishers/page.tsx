import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default async function PublishersPage() {
  const items = await getItems()

  // Build publisher map from real game data
  const publisherMap: Record<string, number> = {}
  for (const item of items) {
    const pub = (item as any).publisher?.trim()
    if (pub) {
      publisherMap[pub] = (publisherMap[pub] || 0) + 1
    }
  }

  const publishers = Object.entries(publisherMap)
    .map(([name, count]) => ({ name, count, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
    .sort((a, b) => b.count - a.count)

  // Group by first letter
  const byLetter: Record<string, typeof publishers> = {}
  for (const p of publishers) {
    const letter = p.name[0].toUpperCase()
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(p)
  }
  const letters = Object.keys(byLetter).sort()

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6 text-[#9d4edd]" />
              <h1 className="text-3xl font-black text-white">Publishers</h1>
            </div>
            <p className="text-gray-400">Browse games by publisher — {publishers.length} publishers, {items.length} total games</p>
          </div>

          {publishers.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No publishers yet</p>
              <p className="text-gray-600 text-sm">Publishers will appear here once games are added with a publisher name.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {letters.map(letter => (
                <div key={letter}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #9d4edd, #c77dff)" }}>{letter}</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(157,78,221,0.2)" }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {byLetter[letter].map(pub => (
                      <Link key={pub.name} href={`/publishers/${pub.slug}?name=${encodeURIComponent(pub.name)}`}
                        className="flex items-center justify-between p-4 rounded-xl border transition-all hover:border-[#9d4edd]/50 hover:bg-[#9d4edd]/5 group"
                        style={{ background: "rgba(18,11,34,0.6)", borderColor: "rgba(45,27,84,0.8)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ background: "rgba(157,78,221,0.15)", color: "#9d4edd" }}>
                            {pub.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium truncate">{pub.name}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2" style={{ background: "rgba(157,78,221,0.15)", color: "#c77dff" }}>
                          {pub.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
