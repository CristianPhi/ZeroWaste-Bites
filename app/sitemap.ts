import { MetadataRoute } from 'next'
import { dealPosts, stores } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zerowastebites-rust.vercel.app'
  const now = new Date()
  const dealUrls: MetadataRoute.Sitemap = dealPosts.map((deal) => ({
    url: `${baseUrl}/deal/${encodeURIComponent(deal.id)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }))
  const storeUrls: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${baseUrl}/store/${encodeURIComponent(store.id)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...dealUrls,
    ...storeUrls,
  ]
}