"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Heart, DollarSign, Users, Target, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const topDonors = [
  { name: "GameMaster", amount: 500, rank: 1 },
  { name: "StealthPlayer", amount: 350, rank: 2 },
  { name: "NightOwl", amount: 280, rank: 3 },
  { name: "ProGamer99", amount: 200, rank: 4 },
  { name: "TheRealOne", amount: 150, rank: 5 },
  { name: "CyberWolf", amount: 120, rank: 6 },
  { name: "DragonSlayer", amount: 100, rank: 7 },
  { name: "ShadowKnight", amount: 85, rank: 8 },
  { name: "EliteGamer", amount: 75, rank: 9 },
  { name: "RetroPlayer", amount: 60, rank: 10 },
]

const faqItems = [
  { q: "Is this site free to use?", a: "Yes! BlackBullz is completely free. We rely on donations and ads to keep the servers running." },
  { q: "Why should I donate?", a: "Your donations help us maintain servers, improve download speeds, and add new features. We're passionate about providing free games everyone." },
  { q: "What payment methods do you accept?", a: "We accept cryptocurrency (Bitcoin, Ethereum, USDT), PayPal, and major credit cards." },
  { q: "Do I get any benefits for donating?", a: "Yes! Donors get priority support, ad-free browsing, and special recognition on our leaderboard." },
  { q: "How is my donation used?", a: "We publicly share fund allocation: Server costs (50%), Infrastructure improvements (30%), and Miscellaneous expenses (20%)." },
]

export default function DonatePage() {
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const presetAmounts = [10, 25, 50, 100, 200]
  const monthlyGoal = 1000
  const currentAmount = 680
  const goalPercentage = (currentAmount / monthlyGoal) * 100

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Support Free Gaming</h1>
              <p className="text-gray-400 text-lg">Help us fight against restrictive DRM and corporate monopolies.</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a2a44] to-[#0f1d32] border border-[#1e3050] rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-gray-400 text-sm">Monthly Goal</span>
                  </div>
                  <p className="text-2xl font-bold text-white">${monthlyGoal}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-[#00bcd4]" />
                    <span className="text-gray-400 text-sm">Raised So Far</span>
                  </div>
                  <p className="text-2xl font-bold text-white">${currentAmount}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-400 text-sm">Supporters</span>
                  </div>
                  <p className="text-2xl font-bold text-white">247</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Progress</span>
                  <span className="text-[#00bcd4] text-sm font-medium">{goalPercentage.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00bcd4] to-[#00e5ff] rounded-full transition-all duration-500"
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
              </div>

              <h3 className="text-white font-semibold mb-4">Select Donation Amount</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {presetAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={cn(
                      "px-6 py-3 rounded-lg font-medium transition-all",
                      amount === a
                        ? "bg-[#00bcd4] text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    ${a}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white placeholder-gray-500 focus:border-[#00bcd4] focus:outline-none"
                  />
                </div>
              </div>

              <h3 className="text-white font-semibold mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-colors">
                  <span className="text-white text-sm font-medium">PayPal</span>
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-colors">
                  <span className="text-white text-sm font-medium">Bitcoin</span>
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-colors">
                  <span className="text-white text-sm font-medium">Ethereum</span>
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-colors">
                  <span className="text-white text-sm font-medium">Card</span>
                </button>
              </div>

              <button
                disabled={!amount && !customAmount}
                className="w-full py-4 bg-[#00bcd4] hover:bg-[#0097a7] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {amount || customAmount ? `Donate $${amount || customAmount}` : "Select an amount to donate"}
              </button>
            </div>

            <div className="bg-[#0f1d32] border border-[#1e3050] rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-500" />
                Champions of Freedom
              </h3>
              <div className="space-y-3">
                {topDonors.slice(0, 5).map((donor) => (
                  <div key={donor.rank} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                      donor.rank === 1 ? "bg-yellow-500 text-black" :
                      donor.rank === 2 ? "bg-gray-400 text-black" :
                      donor.rank === 3 ? "bg-amber-700 text-white" :
                      "bg-white/10 text-gray-300"
                    )}>
                      {donor.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{donor.name}</p>
                    </div>
                    <p className="text-[#00bcd4] font-semibold">${donor.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f1d32] border border-[#1e3050] rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00bcd4]" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-white font-medium">{item.q}</span>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-400">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}