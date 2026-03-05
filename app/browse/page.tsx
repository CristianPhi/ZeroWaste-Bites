import { BottomNav } from "@/components/bottom-nav"
import { BrowseContent } from "@/components/browse-content"

export default function BrowsePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <BrowseContent />
      <BottomNav />
    </main>
  )
}
