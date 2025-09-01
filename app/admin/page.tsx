import { Sidebar } from "@/components/sidebar"
import { AdminPortal } from "@/components/admin-portal"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64">
          <div className="p-4 lg:p-8">
            <AdminPortal />
          </div>
        </main>
      </div>
    </div>
  )
}
