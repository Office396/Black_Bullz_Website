import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { supabase } from "@/lib/supabase"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default async function PublishersPage() {
  const [{ data: publishers }, items] = await Promise.all([
    supabase.from('publishers').select('*').order('name'),
    getItems(),
  ])

  const pubList = publishers || []

  // Also collect publishers from items that aren't in the publishers table
  const registeredNames = new Set((pubList).map((p: any) => p.name.toLowerCase()))
  const itemPublishers = Array.from(
    new Set(items.filter(g => g.publisher?.trim()).map(g => g.publisher!.trim()))
  ).filter(name => !registeredNames.has(name.toLowerCase()))
    .map(name => ({ id: `item-${name}`, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), fromItems: true }))

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-8 h-8 text-[#9d4edd]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Publishers</h1>
              <p className="text-gray-400 text-sm">{pubList.length} publishers</p>
            </div>
          </div>

          {pubList.length === 0 && itemPublishers.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No publishers added yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...pubList, ...itemPublishers].map((pub: any) => {
                const pubGames = items.filter(g => g.publisher?.toLowerCase() === pub.name.toLowerCase())
                return (
                  <Link key={pub.id} href={`/publishers/${pub.slug}`}
                    className="group bg-[#120b22] border border-[#2d1b54] hover:border-[#9d4edd]/50 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(157,78,221,0.15)]">
                    {pub.banner_url && (
                      <div className="h-24 overflow-hidden relative">
                        <img src={pub.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#120b22]" />
                      </div>
                    )}
                    <div className="p-5 flex items-start gap-4">
                      {pub.logo_url ? (
                        <img src={pub.logo_url} alt={pub.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-[#2d1b54]" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 text-[#9d4edd] text-2xl font-black">
                          {pub.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-white font-bold group-hover:text-[#c77dff] transition-colors">{pub.name}</h2>
                        {pub.known_for && <p className="text-[#9d4edd] text-xs mt-0.5">{pub.known_for}</p>}
                        {pub.overview && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{pub.overview}</p>}
                        <p className="text-gray-600 text-xs mt-2">{pubGames.length} game{pubGames.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
