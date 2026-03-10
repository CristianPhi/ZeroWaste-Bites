import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Saved Deals',
  description: 'Review your saved food deals on ZeroWaste Bites.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/saved-deals',
  },
}

export default function SavedDealsLayout({ children }: { children: ReactNode }) {
  return children
}