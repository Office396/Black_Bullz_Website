"use client"

import Link from "next/link"
import { Github, Twitter, MessageCircle } from "lucide-react"

export function SiteFooter() {
    const currentYear = new Date().getFullYear()
    
    return (
        <footer className="bg-[#060e1a] border-t border-[#1e3050] mt-12">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2.5 mb-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#00bcd4]/30">
                                <img src="/bull-logo.png" alt="BlackBullz Logo" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <span className="text-white font-bold text-xl">
                                <span className="text-[#00bcd4]">Black</span>Bullz
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-sm">
                            Free download pre-installed PC games. No registration required. Fastest downloads with multiple cloud providers.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://discord.gg/blackbullz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a
                                href="https://reddit.com/r/blackbullz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-[#FF4500]/10 hover:bg-[#FF4500]/20 flex items-center justify-center text-[#FF4500] transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com/blackbullz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Browse</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/games" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">All Games</Link></li>
                            <li><Link href="/top" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Top Games</Link></li>
                            <li><Link href="/trending" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Trending</Link></li>
                            <li><Link href="/updates" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Recent Updates</Link></li>
                            <li><Link href="/collections" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Collections</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Community</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/request" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Request Games</Link></li>
                            <li><Link href="/leaderboard" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Leaderboard</Link></li>
                            <li><Link href="/publishers" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Publishers</Link></li>
                            <li><Link href="/donate" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Donate</Link></li>
                            <li><Link href="/blog" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Support</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/about" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">About Us</Link></li>
                            <li><Link href="/faq" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">FAQ</Link></li>
                            <li><Link href="/contact" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Contact</Link></li>
                            <li><Link href="/privacy" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/dmca" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">DMCA</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#1e3050] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 text-xs">
                        © {currentYear} BlackBullz. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                        <Link href="/privacy" className="text-gray-500 hover:text-[#00bcd4] transition-colors">Privacy</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/terms" className="text-gray-500 hover:text-[#00bcd4] transition-colors">Terms</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/dmca" className="text-gray-500 hover:text-[#00bcd4] transition-colors">DMCA</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/status" className="text-gray-500 hover:text-[#00bcd4] transition-colors">Status</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}