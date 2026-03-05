import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <div className="px-4 pb-8 pt-6">
        <AdminDashboard />
      </div>
    </main>
  )
}
