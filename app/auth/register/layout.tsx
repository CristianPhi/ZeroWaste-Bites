import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create your ZeroWaste Bites account and start saving food while saving money.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/auth/register',
  },
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children
}