"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { MessageSquarePlus, ArrowRight, Shield, Clock, Users, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />

      <div className="pt-16">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#9d4edd]/20 mb-4">
              <MessageSquarePlus className="w-8 h-8 text-[#9d4edd]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Request PC Games</h1>
            <p className="text-gray-400 text-lg mb-8">
              Community voting system - your voice matters!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-500">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Submit Game</h3>
                <p className="text-gray-500 text-sm">Request your favorite game</p>
              </div>
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-500">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Get Votes</h3>
                <p className="text-gray-500 text-sm">Needs 20 votes to process</p>
              </div>
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-yellow-500">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Fast Processing</h3>
                <p className="text-gray-500 text-sm">Within 24 hours</p>
              </div>
            </div>

            <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-8 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#9d4edd]" />
                <h2 className="text-xl font-bold text-white">Members Only</h2>
              </div>
              <p className="text-gray-400 mb-6">
                The request board is available exclusively to registered members.
                Sign in to submit requests and vote for your favorite games.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button className="w-full bg-[#9d4edd] hover:bg-[#7b2cbf] text-white">
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-[#9d4edd]" />
                  <span className="text-gray-400 text-sm">Active Requests</span>
                </div>
                <p className="text-2xl font-bold text-white">156</p>
              </div>
              <div className="bg-[#120b22] border border-[#2d1b54] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <span className="text-gray-400 text-sm">Fulfilled This Week</span>
                </div>
                <p className="text-2xl font-bold text-white">24</p>
              </div>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}