import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CategoriesContent } from "@/components/categories-content"

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <CategoriesContent />
      </div>
    </div>
  )
}
