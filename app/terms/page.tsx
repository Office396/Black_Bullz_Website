import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090514]">
      <Header />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-7 h-7 text-[#9d4edd]" />
            <div>
              <h1 className="text-3xl font-black text-white">Terms of Service</h1>
              <p className="text-gray-500 text-sm mt-0.5">Last updated: March 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-400">By accessing or using BullzGamez ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">2. Use of the Service</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>You must be at least 13 years old to create an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You agree not to use the Service for any illegal or unauthorised purpose</li>
                <li>You agree not to attempt to gain unauthorised access to any part of the Service</li>
                <li>You agree not to upload malicious content or spam</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">3. Content & Copyright</h2>
              <p className="text-gray-400 mb-2">BullzGamez provides game files for personal, educational, and archival purposes. We respect intellectual property rights. If you are a rights holder and believe content infringes your copyright, contact us for removal.</p>
              <p className="text-gray-400">We encourage users to support developers by purchasing games on official platforms like Steam.</p>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">4. Subscriptions & Payments</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Subscription plans are billed monthly</li>
                <li>Payments are manually verified by the admin before benefits are granted</li>
                <li>If a payment is rejected, you will be notified with a reason</li>
                <li>Refunds are handled on a case-by-case basis — contact us within 7 days</li>
                <li>Creator access is granted only after payment verification</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">5. Creator Accounts</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Creator access requires an active Revolution Leader or Revolutionist subscription</li>
                <li>Creators are responsible for the content they upload</li>
                <li>Uploading illegal, harmful, or infringing content will result in account termination</li>
                <li>Creator portal credentials are personal and must not be shared</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">6. Termination</h2>
              <p className="text-gray-400">We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. You may delete your account at any time from your profile settings.</p>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">7. Disclaimer</h2>
              <p className="text-gray-400">The Service is provided "as is" without warranties of any kind. BullzGamez is not liable for any damages arising from use of the Service. We do not guarantee uninterrupted or error-free operation.</p>
            </div>

            <div className="rounded-2xl border border-[#2d1b54] p-6 bg-[#120b22]/60">
              <h2 className="text-white font-bold text-lg mb-3">8. Changes to Terms</h2>
              <p className="text-gray-400">We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
