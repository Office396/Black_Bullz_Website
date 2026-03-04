"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Trophy, Star, MessageSquare, Download, Clock, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

const ranks = [
  { name: "Rookie", minPoints: 0, maxPoints: 100, color: "text-gray-400", bgColor: "bg-gray-500/20" },
  { name: "Challenger", minPoints: 101, maxPoints: 500, color: "text-green-400", bgColor: "bg-green-500/20" },
  { name: "Veteran", minPoints: 501, maxPoints: 1000, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  { name: "Elite", minPoints: 1001, maxPoints: 2500, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  { name: "Legend", minPoints: 2501, maxPoints: 5000, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  { name: "Immortal", minPoints: 5001, maxPoints: Infinity, color: "text-red-400", bgColor: "bg-red-500/20" },
]

const leaderboard = [
  { rank: 1, name: "Carzed", points: 8542, requests: 45, revisions: 128, reviews: 89, rankName: "Immortal" },
  { rank: 2, name: "StealthPlayer", points: 6234, requests: 32, revisions: 98, reviews: 67, rankName: "Legend" },
  { rank: 3, name: "NightOwl", points: 4876, requests: 28, revisions: 87, reviews: 54, rankName: "Legend" },
  { rank: 4, name: "ProGamer99", points: 3521, requests: 19, revisions: 65, reviews: 42, rankName: "Elite" },
  { rank: 5, name: "TheRealOne", points: 2890, requests: 15, revisions: 52, reviews: 38, rankName: "Elite" },
  { rank: 6, name: "GameMaster", points: 2456, requests: 12, revisions: 45, reviews: 31, rankName: "Elite" },
  { rank: 7, name: "DragonSlayer", points: 1987, requests: 10, revisions: 38, reviews: 26, rankName: "Veteran" },
  { rank: 8, name: "ShadowKnight", points: 1543, requests: 8, revisions: 32, reviews: 21, rankName: "Veteran" },
  { rank: 9, name: "EliteHunter", points: 1234, requests: 6, revisions: 28, reviews: 17, rankName: "Veteran" },
  { rank: 10, name: "CyberWolf", points: 987, requests: 5, revisions: 21, reviews: 14, rankName: "Challenger" },
]

const getRankInfo = (rankName: string) => {
  return ranks.find(r => r.name === rankName) || ranks[0]
}

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            </div>
            <p className="text-gray-400">
              Top contributors ranked by points from requests, revisions, and reviews
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {ranks.slice(0, 4).map((rank) => (
              <div key={rank.name} className={cn("rounded-xl p-4", rank.bgColor)}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", rank.bgColor.replace('/20', ''))} />
                  <span className={cn("font-semibold", rank.color)}>{rank.name}</span>
                </div>
                <p className="text-gray-400 text-xs">
                  {rank.maxPoints === Infinity ? `${rank.minPoints}+ pts` : `${rank.minPoints}-${rank.maxPoints} pts`}
                </p>
              </div>
            ))}
          </div>

          {leaderboard[0] && (
            <div className="bg-gradient-to-br from-yellow-500/20 to-[#0f1d32] border border-yellow-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-bold text-white">Current Champion</h2>
                  <p className="text-gray-400 text-sm">Top contributor this month</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-black text-3xl font-bold">
                    #{leaderboard[0].rank}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0a1628] border-2 border-yellow-500 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">{leaderboard[0].name}</h3>
                  <div className={cn("inline-block px-3 py-1 rounded-full text-sm font-medium mb-3", getRankInfo(leaderboard[0].rankName).bgColor, getRankInfo(leaderboard[0].rankName).color)}>
                    {leaderboard[0].rankName}
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-white font-semibold">{leaderboard[0].points}</span>
                      <span className="text-gray-500 text-sm">points</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-white">{leaderboard[0].requests}</span>
                      <span className="text-gray-500 text-sm">requests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-green-500" />
                      <span className="text-white">{leaderboard[0].revisions}</span>
                      <span className="text-gray-500 text-sm">revisions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-white">{leaderboard[0].reviews}</span>
                      <span className="text-gray-500 text-sm">reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0f1d32] border border-[#1e3050] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1e3050]">
              <h3 className="text-lg font-bold text-white">Top Contributors</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e3050]">
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Rank</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">User</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Points</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm hidden md:table-cell">Rank Name</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm hidden sm:table-cell">Requests</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm hidden md:table-cell">Revisions</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user) => {
                    const rankInfo = getRankInfo(user.rankName)
                    return (
                      <tr key={user.rank} className="border-b border-[#1e3050] hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                            user.rank === 1 ? "bg-yellow-500 text-black" :
                            user.rank === 2 ? "bg-gray-400 text-black" :
                            user.rank === 3 ? "bg-amber-700 text-white" :
                            "bg-white/10 text-gray-300"
                          )}>
                            {user.rank}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-medium">{user.name}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-semibold">{user.points}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", rankInfo.bgColor, rankInfo.color)}>
                            {user.rankName}
                          </span>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <span className="text-gray-300">{user.requests}</span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-gray-300">{user.revisions}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-gray-300">{user.reviews}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}