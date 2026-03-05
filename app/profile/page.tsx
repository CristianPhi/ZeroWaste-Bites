import { BottomNav } from "@/components/bottom-nav"
import { ProfileContent } from "@/components/profile-content"

export default function ProfilePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <div className="px-4 pb-24 pt-6">
        <ProfileContent />
      </div>
      <BottomNav />
    </main>
  )
}
