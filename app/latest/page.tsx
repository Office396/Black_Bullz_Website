import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { LatestContent } from "@/components/latest-content"

export default function LatestPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <LatestContent />
      </div>
    </div>
  )
}
