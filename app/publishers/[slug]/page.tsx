import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { supabase } from "@/lib/supabase"
import { getItems } from "@/lib/server/items-store"
import Link from "next/link"
import { Building2, Globe, Calendar, MapPin, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"
import { SafeImage } from "@/components/safe-image"

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
        {/* Ambient Blur Backdrop instead of sharp banner */}
        <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none -z-10 bg-[#090514]">
          {publisher.banner_url ? (
            <SafeImage src={publisher.banner_url} alt="" fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover blur-[80px] opacity-30 scale-125" />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#2d1b54]/20 to-[#090514]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090514]/60 to-[#090514]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-12 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-12 text-center sm:text-left">
            {publisher.logo_url ? (
              <div className="p-2 sm:p-3 bg-[#120b22]/80 backdrop-blur-md rounded-3xl border border-[#2d1b54]/50 shadow-2xl shrink-0">
                <SafeImage src={publisher.logo_url} alt={publisher.name} width={300} height={300} className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-contain bg-[#090514]" />
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-[#120b22]/80 backdrop-blur-md border border-[#2d1b54]/50 shadow-2xl flex items-center justify-center text-[#9d4edd] text-6xl font-black shrink-0">
                {publisher.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">{publisher.name}</h1>
              {publisher.known_for && (
                <div className="inline-block px-4 py-1.5 bg-[#9d4edd]/10 border border-[#9d4edd]/20 rounded-full mb-5">
                  <p className="text-[#c77dff] text-sm font-semibold">Known for: {publisher.known_for}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-400 font-medium">
                {publisher.gender && <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Building2 className="w-4 h-4 text-gray-500" />{publisher.gender}</span>}
                {publisher.birth_place && <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><MapPin className="w-4 h-4 text-gray-500" />{publisher.birth_place}</span>}
                {publisher.birthday && <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Calendar className="w-4 h-4 text-gray-500" />{publisher.birthday}</span>}
              </div>
              {publisher.website && (
                <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors text-sm font-bold shadow-sm">
                  <Globe className="w-4 h-4 text-[#9d4edd]" /> Visit Official Website <ExternalLink className="w-3.5 h-3.5 text-gray-500 ml-1" />
                </a>
              )}
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
                        <SafeImage src={g.image || '/placeholder.svg'} alt={g.title} fill sizes="(max-width: 768px) 100vw, 300px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
