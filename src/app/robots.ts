import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.app').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private/app surfaces and API routes should not be crawled or indexed.
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
