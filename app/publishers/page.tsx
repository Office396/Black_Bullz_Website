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
                    className="group relative bg-[#120b22] border border-[#2d1b54] hover:border-[#9d4edd]/50 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(157,78,221,0.15)] flex flex-col h-full">
                    
                    {/* Ambient Blurred Background from Banner */}
                    {pub.banner_url && (
                      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity overflow-hidden">
                        <img src={pub.banner_url} alt="" className="w-full h-full object-cover blur-[40px] scale-125" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#120b22] via-[#120b22]/80 to-transparent" />
                      </div>
                    )}
                    
                    <div className="p-5 flex flex-col gap-4 flex-1 relative z-10">
                      <div className="flex items-center gap-4">
                        {pub.logo_url ? (
                          <div className="bg-[#090514] p-1.5 rounded-xl shrink-0 border border-white/5 ring-1 ring-black/50 overflow-hidden shadow-lg">
                            <img src={pub.logo_url} alt={pub.name} className="w-12 h-12 rounded-lg object-contain" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#9d4edd]/10 border border-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 text-[#9d4edd] text-2xl font-black shadow-lg">
                            {pub.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg text-white font-black group-hover:text-[#c77dff] transition-colors truncate">{pub.name}</h2>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#9d4edd]/10 border border-[#9d4edd]/20 mt-1">
                            <span className="text-[#c77dff] text-[10px] font-bold uppercase tracking-wider">{pubGames.length} Game{pubGames.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 mt-1">
                        {pub.known_for && <p className="text-[#e0aaff] text-xs font-semibold mb-2 line-clamp-2 leading-relaxed">Known for: {pub.known_for}</p>}
                        {pub.overview && <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{pub.overview}</p>}
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
