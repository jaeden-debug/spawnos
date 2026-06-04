import type { MetadataRoute } from 'next'
import { SPECIES_DATA } from '@/data/species'
import { TOOLS_DATA } from '@/data/tools'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.app').replace(/\/$/, '')

// Public, indexable routes. Auth-gated (/dashboard), conversion (/login, /signup),
// and API routes are intentionally excluded.
const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/species', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/blueprints', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/breeders', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/knowledge', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const speciesEntries: MetadataRoute.Sitemap = SPECIES_DATA.map((s) => ({
    url: `${BASE}/species/${s.slug}`,
    lastModified: s.lastUpdated ? new Date(s.lastUpdated) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const toolEntries: MetadataRoute.Sitemap = TOOLS_DATA.map((t) => ({
    url: `${BASE}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticEntries, ...speciesEntries, ...toolEntries]
}
