import type { Metadata, Viewport } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const _dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zerowastebites-rust.vercel.app'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ZeroWaste Bites',
  url: siteUrl,
  logo: `${siteUrl}/images/Logo.png`,
  description: 'ZeroWaste Bites helps people save money by buying discounted surplus food from nearby stores.',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ZeroWaste Bites | Save Food, Save Money',
    template: '%s | ZeroWaste Bites',
  },
  description: 'ZeroWaste Bites helps you find discounted surplus food from nearby stores, reduce food waste, and save money every day.',
  applicationName: 'ZeroWaste Bites',
  keywords: [
    'ZeroWaste Bites',
    'save food',
    'food waste',
    'discounted food',
    'surplus food',
    'food deals',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ZeroWaste Bites',
    title: 'ZeroWaste Bites | Save Food, Save Money',
    description: 'Find discounted surplus meals near you and help reduce food waste.',
    images: [
      {
        url: '/images/Logo.png',
        width: 512,
        height: 512,
        alt: 'ZeroWaste Bites logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZeroWaste Bites | Save Food, Save Money',
    description: 'Find discounted surplus meals near you and help reduce food waste.',
    images: ['/images/Logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
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
