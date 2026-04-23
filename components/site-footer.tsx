"use client"

import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
    const currentYear = new Date().getFullYear()
    
    return (
        <footer className="bg-[#060e1a] border-t border-[#2d1b54] mt-12">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2.5 mb-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#9d4edd]/30">
                                <Image src="/bull-logo.png" alt="BullzGamez Logo" width={60} height={60} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <span className="text-white font-bold text-xl">
                                <span className="text-[#9d4edd]">Black</span>Bullz
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-sm">
                            Free download pre-installed PC games, installable games, and Android mod APKs. No registration required. Fastest downloads with multiple cloud providers.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://discord.gg/bullzgamez"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.11 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.11c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            </a>
                            <a
                                href="https://t.me/bullzgamez"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc] transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.863-.44-.752-.244-1.349-.374-1.297-.788.028-.215.325-.436.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.627z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Categories</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/games" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">All Games</Link></li>
                            <li><Link href="/games?category=pre-installed" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Pre-installed PC Games</Link></li>
                            <li><Link href="/games?category=installable" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Installable PC Games</Link></li>
                            <li><Link href="/games?category=android-mod" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Android Mod APKs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Browse</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/top" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Top Games</Link></li>
                            <li><Link href="/trending" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Trending</Link></li>
                            <li><Link href="/updates" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Recent Updates</Link></li>
                            <li><Link href="/collections" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Collections</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Community</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/request" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Request Games</Link></li>
                            <li><Link href="/leaderboard" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Leaderboard</Link></li>
                            <li><Link href="/donate" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Donate</Link></li>
                            <li><Link href="/contact" className="text-gray-400 hover:text-[#9d4edd] text-sm transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#2d1b54] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-gray-600 text-xs">
                        © {currentYear} BullzGamez. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                        <Link href="/privacy" className="text-gray-500 hover:text-[#9d4edd] transition-colors">Privacy</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/terms" className="text-gray-500 hover:text-[#9d4edd] transition-colors">Terms</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/dmca" className="text-gray-500 hover:text-[#9d4edd] transition-colors">DMCA</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}