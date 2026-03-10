import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to ZeroWaste Bites to access your account, saved deals, and orders.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/auth/login',
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}