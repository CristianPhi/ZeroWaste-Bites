import type { Metadata, Viewport } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const _dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'ZeroWaste Bites - Save Food, Save Money',
  description: 'Get heavily discounted food from stores near you before they close. Reduce food waste while saving money.',
  generator: 'v0.app',
  icons: {
    icon: '/images/Logo.png',
    apple: '/images/Logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#3a8f47',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="iQeHmy6MRpf3qM1i2zxrCmGKQuTFXoAMWibhRxC43Bs" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
