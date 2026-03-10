import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <main className="min-h-screen w-full bg-background">
      <div className="px-4 pb-8 pt-6">
        <AdminDashboard />
      </div>
    </main>
  )
}
