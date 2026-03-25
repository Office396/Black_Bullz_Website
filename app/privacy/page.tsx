import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-7 h-7 text-[#9d4edd]" />
            <div>
              <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
              <p className="text-gray-500 text-sm mt-0.5">Last updated: March 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">
            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">1. Information We Collect</h2>
              <p>When you create an account on BullzGamez, we collect:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Your name, username, and email address</li>
                <li>A hashed (encrypted) version of your password — we never store plain-text passwords</li>
                <li>Your watch history and favourites (stored to personalise your experience)</li>
                <li>Subscription and payment status (we do not store card details)</li>
                <li>Notifications you receive from the platform</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>To provide and improve the BullzGamez service</li>
                <li>To personalise your experience (watch history, favourites)</li>
                <li>To send you notifications about game updates and your requests</li>
                <li>To verify subscription payments and grant creator access</li>
                <li>To respond to support requests</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">3. Data Retention</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Watch history is automatically deleted after 7 days</li>
                <li>Notifications are automatically cleared after 30 days</li>
                <li>Account data is retained until you delete your account</li>
                <li>You can delete your account at any time from Profile → Settings</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">4. Data Sharing</h2>
              <p className="text-gray-400">We do not sell, trade, or share your personal information with third parties. Your data is stored securely on Supabase infrastructure. We may share anonymised, aggregated statistics (e.g. total downloads) publicly.</p>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">5. Cookies & Local Storage</h2>
              <p className="text-gray-400">We use browser localStorage to store your session token and theme preference. No third-party tracking cookies are used. Vercel Analytics may collect anonymised page view data.</p>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Access your data via your profile page</li>
                <li>Update your information at any time in Settings</li>
                <li>Delete your account and all associated data from Settings</li>
                <li>Contact us to request a data export</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">7. Contact</h2>
              <p className="text-gray-400">For privacy-related questions, reach out via our <a href="https://www.patreon.com/c/BullzGamez" className="text-[#9d4edd] hover:underline">Patreon</a> or through the feedback form on the site.</p>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
