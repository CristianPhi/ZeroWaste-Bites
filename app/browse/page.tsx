import type { Metadata } from 'next'
import { BottomNav } from "@/components/bottom-nav"
import { BrowseContent } from "@/components/browse-content"

export const metadata: Metadata = {
  title: 'Browse Deals',
  description: 'Browse discounted surplus food near you with ZeroWaste Bites.',
  alternates: {
    canonical: '/browse',
  },
}

export default function BrowsePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <BrowseContent />
      <BottomNav />
    </main>
  )
}
