import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your ZeroWaste Bites profile and account preferences.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/profile',
  },
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children
}