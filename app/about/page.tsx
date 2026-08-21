import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Gift, Globe, Heart, Users, Gamepad2, Download, Star, Zap, Award, Monitor, Smartphone, Layers, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us - BullzGamez | Free PC Games Download",
  description: "Learn about BullzGamez - your ultimate destination for free PC games. We curate the best free games from across the internet and share them with our community at no cost.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090514] to-[#0d0619]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#7b2cbf] mb-6">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-[#9d4edd]">BullzGamez</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your ultimate destination for free PC games. We believe gaming should be accessible to everyone, everywhere.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              At <strong className="text-[#9d4edd]">BullzGamez</strong>, our mission is simple: to make gaming accessible to everyone, everywhere, completely <strong className="text-[#9d4edd]">FREE of cost</strong>. We believe that financial barriers should never stop anyone from experiencing the joy and excitement of video games.
            </p>
            <p>
              We are a community-driven platform that scours the internet to find and curate the best free-to-play games, freeware classics, and freely available PC games. Our team works tirelessly to gather these hidden gems and present them to you in one convenient location.
            </p>
            <p>
              Whether you're looking for action-packed adventures, mind-bending puzzles, immersive RPGs, or quick casual games, we've got you covered. Our collection is constantly growing as we discover new free games to share with our community.
            </p>
          </div>
        </div>

        {/* What We Provide */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">What We Provide</h2>
          </div>
          <p className="text-gray-300 mb-6">
            We curate and provide a wide variety of free games to ensure every gamer finds something they love. Here's what you can find on BullzGamez:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* PC Games */}
            <div className="bg-[#0d0820]/50 border border-[#2d1b54]/40 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#9d4edd]/20 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-[#9d4edd]" />
                </div>
                <h3 className="text-white font-semibold text-lg">Free PC Games</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                We provide a vast collection of free PC games that you can download and play on your computer. Our collection includes free-to-play games, freeware classics that are no longer sold, open-source games, indie gems, and much more. These games are collected from various legitimate free sources across the internet and shared with our community at no cost.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Free-to-Play</span>
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Freeware</span>
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Open Source</span>
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full"> Indies</span>
              </div>
            </div>

            {/* Enhanced PC Games */}
            <div className="bg-[#0d0820]/50 border border-[#2d1b54]/40 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#9d4edd]/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#9d4edd]" />
                </div>
                <h3 className="text-white font-semibold text-lg">Enhanced PC Games</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                We also provide enhanced versions of popular games with additional features unlocked. These versions may include bonus content, unlocked expansion packs, unlimited resources, or other enhancements that give you the full gaming experience without any restrictions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Bonus Content</span>
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Unlocked DLC</span>
                <span className="px-3 py-1 bg-[#9d4edd]/20 text-[#c77dff] text-xs rounded-full">Full Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* What We Do */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">What We Do</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">We Search the Internet</h3>
                  <p className="text-gray-400 text-sm">
                    Our team actively searches across the internet to find free PC games from various sources, including freeware releases, demo versions, and freely available titles.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">We Verify & Test</h3>
                  <p className="text-gray-400 text-sm">
                    Every game is tested to ensure it's safe, functional, and worth playing. We only share games that meet our quality standards.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">We Organize for You</h3>
                  <p className="text-gray-400 text-sm">
                    We categorize and describe each game so you can easily find what you're looking for. Browse by genre, platform, or popularity.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">We Give for Free</h3>
                  <p className="text-gray-400 text-sm">
                    Everything on BullzGamez is completely free. No hidden fees, no subscriptions, no payments. Just free gaming for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Free */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">Why We Offer Games for Free</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Gaming is more than just entertainment – it's a form of art, storytelling, and connection that brings people together. We believe everyone deserves access to this experience regardless of their financial situation.
            </p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">To support gamers who can't afford expensive games</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">To preserve classic games that might otherwise be lost</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">To build a passionate community of gaming enthusiasts</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#9d4edd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">To share indie games and hidden gems with the world</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Community */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">Join Our Community</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              BullzGamez is more than a website – we're a thriving community of gamers from around the world. Our community members share game recommendations, write reviews, help each other find games, and contribute to making BullzGamez an even better resource for everyone.
            </p>
            <p>
              We welcome everyone to join our community absolutely free. Create an account to comment on games, share your thoughts, write reviews, and connect with fellow gamers. Together, we're building something special.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold transition-all hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Join Free
              </Link>
              <Link
                href="/games"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#9d4edd] text-[#9d4edd] hover:bg-[#9d4edd]/10 font-semibold transition-all"
              >
                <Gamepad2 className="w-5 h-5" />
                Browse Games
              </Link>
            </div>
          </div>
        </div>

        {/* Support Us */}
        <div className="bg-[#110d24]/80 border border-[#2d1b54]/60 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-[#9d4edd]" />
            <h2 className="text-2xl font-bold text-white">Support Our Mission</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              While everything on BullzGamez is free, maintaining a platform costs money. Server costs, domain fees, and development time all add up. If you'd like to support our mission, we appreciate any contribution.
            </p>
            <p>
              Your support helps us keep the lights on and continue adding new games to our collection. Every bit helps, and even small donations make a big difference.
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-semibold transition-all hover:scale-105"
            >
              <Heart className="w-5 h-5" />
              Donate
            </Link>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-semibold mb-2">Important Note</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                All games on BullzGamez are either freeware, legally free-to-play, or freely available on other platforms. We do not host or distribute copyrighted material illegally. Our role is to curate and organize these freely available games in one convenient location for our community to discover and enjoy. If you believe any game shouldn't be listed here, please contact us and we'll review it immediately.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}