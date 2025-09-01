import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ContactContent } from "@/components/contact-content"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <ContactContent />
      </div>
    </div>
  )
}
