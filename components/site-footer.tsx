"use client"

import Link from "next/link"

export function SiteFooter() {
    return (
        <footer className="bg-[#060e1a] border-t border-[#1e3050] mt-12">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-10">
                <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                    {/* Brand */}
                    <div className="max-w-sm">
                        <Link href="/" className="flex items-center space-x-2 mb-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#00bcd4]/30">
                                <img src="/bull-logo.png" alt="BlackBullz Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-bold text-lg">
                                <span className="text-[#00bcd4]">Black</span>Bullz
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Free download PC games, Android apps & software. Fastest downloads with no registration required.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-x-12 gap-y-4">
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Browse</h4>
                            <ul className="space-y-2">
                                <li><Link href="/?tab=pc-games" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">PC Games</Link></li>
                                <li><Link href="/?tab=android-games" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Android Apps</Link></li>
                                <li><Link href="/?tab=software" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Software</Link></li>
                                <li><Link href="/latest" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Latest</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Support</h4>
                            <ul className="space-y-2">
                                <li><Link href="/contact" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Contact</Link></li>
                                <li><Link href="/categories" className="text-gray-400 hover:text-[#00bcd4] text-sm transition-colors">Categories</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-[#1e3050] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-gray-600 text-xs">
                        © {new Date().getFullYear()} BlackBullz. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/contact" className="text-gray-500 hover:text-[#00bcd4] text-xs transition-colors">Contact</Link>
                        <span className="text-gray-700">·</span>
                        <Link href="/categories" className="text-gray-500 hover:text-[#00bcd4] text-xs transition-colors">Categories</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
