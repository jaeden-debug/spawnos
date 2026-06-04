import type { MetadataRoute } from 'next'
import { SPECIES_DATA } from '@/data/species'
import { TOOLS_DATA } from '@/data/tools'
import { getAllLabNotes } from '@/lib/lab-notes'
import { getAllMicrofauna } from '@/lib/microfauna'
import { getAllProblems } from '@/lib/problems'
import { getAllCompat } from '@/lib/compatibility'
import { getAllToolArticleSlugs } from '@/lib/tools-content'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.app').replace(/\/$/, '')

// Public, indexable routes. Auth-gated (/dashboard), conversion (/login, /signup),
// and API routes are intentionally excluded.
const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/species', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/lab-notes', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/library', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/microfauna', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/problems', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/compatibility', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/compatibility/fish-compatibility-guide', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/spawnos-by-blackwater-aquatics', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/tools-database', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/live-foods', priority: 0.9, changeFrequency: 'monthly' },
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

  const labNoteEntries: MetadataRoute.Sitemap = getAllLabNotes().map((n) => ({
    url: `${BASE}/lab-notes/${n.slug}`,
    lastModified: n.date ? new Date(n.date) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const microfaunaEntries: MetadataRoute.Sitemap = getAllMicrofauna().map((m) => ({
    url: `${BASE}/microfauna/${m.slug}`,
    lastModified: m.date ? new Date(m.date) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const problemEntries: MetadataRoute.Sitemap = getAllProblems().map((p) => ({
    url: `${BASE}/problems/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const compatEntries: MetadataRoute.Sitemap = getAllCompat().map((c) => ({
    url: `${BASE}/compatibility/${c.slug}`,
    lastModified: c.date ? new Date(c.date) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const toolArticleEntries: MetadataRoute.Sitemap = getAllToolArticleSlugs().map((slug) => ({
    url: `${BASE}/tools-database/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticEntries, ...speciesEntries, ...toolEntries, ...labNoteEntries, ...microfaunaEntries, ...problemEntries, ...compatEntries, ...toolArticleEntries]
}
