import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

/**
 * Robots.txt configuration
 * Allows crawling of all public pages
 * 
 * Requirements: 2.4
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
