import type { MetadataRoute } from 'next'

const BASE = 'https://matthy.netlify.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/game`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]
}
