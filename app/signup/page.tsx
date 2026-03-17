"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useUser } from "@/lib/user-context"

export default function SignUpPage() {
  const router = useRouter()
  const { signup } = useUser()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError("Please accept the terms to continue"); return }
    setError("")
    setIsLoading(true)
    const result = await signup(name, username, email, password)
    setIsLoading(false)
    if (result.error) { setError(result.error); return }
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16 min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#120b22] border border-[#2d1b54] rounded-2xl p-8 shadow-2xl shadow-[#9d4edd]/10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#9d4edd]/20 mb-4 ring-2 ring-[#9d4edd]/30">
                <UserPlus className="w-8 h-8 text-[#9d4edd]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
              <p className="text-gray-400 text-sm">Join the BullzGamez community</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
                      className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl py-3 pl-9 pr-3 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} required placeholder="username"
                      className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl py-3 pl-7 pr-3 text-white placeholder-gray-500 outline-none transition-colors text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters"
                    className="w-full bg-[#1a103c] border border-[#2d1b54] focus:border-[#9d4edd] rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 outline-none transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#9d4edd]" />
                <span className="text-gray-400 text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#9d4edd] hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#9d4edd] hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #9d4edd, #7b2cbf)" }}>
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#9d4edd] hover:text-[#c77dff] font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
