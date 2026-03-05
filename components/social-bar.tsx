"use client"

import { MessageCircle, Mail, Heart } from "lucide-react"

export function SocialBar() {
    return (
        <div className="flex flex-wrap justify-center gap-3 py-6">
            <a
                href="https://t.me/bullzgamez"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#0088cc] hover:bg-[#006da4] text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(0,136,204,0.6)] hover:shadow-[0_0_25px_rgba(0,136,204,0.9)] text-sm"
            >
                <MessageCircle className="w-4 h-4" />
                <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-normal opacity-80">Join us on</span>
                    <span>Telegram</span>
                </div>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </a>

            <a
                href="/contact"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#43a047] hover:bg-[#388e3c] text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(67,160,71,0.6)] hover:shadow-[0_0_25px_rgba(67,160,71,0.9)] text-sm"
            >
                <Mail className="w-4 h-4" />
                <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-normal opacity-80">Get in</span>
                    <span>Contact</span>
                </div>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </a>

            <a
                href="/contact"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#e65100] hover:bg-[#bf360c] text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(230,81,0,0.6)] hover:shadow-[0_0_25px_rgba(230,81,0,0.9)] text-sm"
            >
                <Heart className="w-4 h-4" />
                <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-normal opacity-80">Support us with</span>
                    <span>Donations</span>
                </div>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </a>
        </div>
    )
}
