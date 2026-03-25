import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { supabase } from "@/lib/supabase"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"
import { Building2, Globe, Calendar, MapPin, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"

export default async function PublisherPage({ params }: { params: { slug: string } }) {
  const [{ data: publisher }, items] = await Promise.all([
    supabase.from('publishers').select('*').eq('slug', params.slug).single(),
    getItems(),
  ])

  if (!publisher) notFound()

  const pubGames = items.filter(g => g.publisher?.toLowerCase() === publisher.name.toLowerCase())

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        {/* Banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          {publisher.banner_url ? (
            <img src={publisher.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1a103c, #2d1b54, #9d4edd)" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#090514]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 -mt-16 relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
            {publisher.logo_url ? (
              <img src={publisher.logo_url} alt={publisher.name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#090514] flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#9d4edd]/20 flex items-center justify-center text-[#9d4edd] text-4xl font-black ring-4 ring-[#090514] flex-shrink-0">
                {publisher.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-black text-white">{publisher.name}</h1>
              {publisher.known_for && <p className="text-[#9d4edd] text-sm mt-1">Known for: {publisher.known_for}</p>}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                {publisher.gender && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{publisher.gender}</span>}
                {publisher.birth_place && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{publisher.birth_place}</span>}
                {publisher.birthday && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{publisher.birthday}</span>}
                {publisher.website && (
                  <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#9d4edd] hover:underline">
                    <Globe className="w-3 h-3" />{publisher.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Left: Bio + Details */}
            <div className="lg:col-span-1 space-y-5">
              {publisher.overview && (
                <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-5">
                  <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">Overview</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{publisher.overview}</p>
                </div>
              )}
              {publisher.biography && (
                <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-5">
                  <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">Biography</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{publisher.biography}</p>
                </div>
              )}
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-5 space-y-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Details</h3>
                {[
                  { label: 'Known For', value: publisher.known_for },
                  { label: 'Gender', value: publisher.gender },
                  { label: 'Birth Place', value: publisher.birth_place },
                  { label: 'Birthday', value: publisher.birthday },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{d.label}</span>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Games */}
            <div className="lg:col-span-2">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#9d4edd] rounded-full" />
                Games by {publisher.name}
                <span className="text-gray-500 font-normal text-sm">({pubGames.length})</span>
              </h2>
              {pubGames.length === 0 ? (
                <p className="text-gray-500 text-sm">No games found for this publisher.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {pubGames.map(g => (
                    <Link key={g.id} href={`/game/${g.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a103c]">
                        <img src={g.image || '/placeholder.svg'} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium line-clamp-2">{g.title}</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5 line-clamp-1 group-hover:text-[#9d4edd] transition-colors">{g.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
