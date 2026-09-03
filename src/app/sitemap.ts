import type { MetadataRoute } from 'next'
import { SPECIES_DATA } from '@/data/species'
import { TOOLS_DATA } from '@/data/tools'
import { getAllLabNotes } from '@/lib/lab-notes'
import { getAllMicrofauna } from '@/lib/microfauna'
import { getAllProblems } from '@/lib/problems'
import { getAllCompat } from '@/lib/compatibility'
import { getAllToolArticleSlugs } from '@/lib/tools-content'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.ca').replace(/\/$/, '')

/**
 * Date the species TEMPLATE last changed the rendered page.
 *
 * `lastModified` must reflect when a page last significantly changed, and for a
 * templated page that includes changes made by the template, not just the
 * content row. On 2026-09-03 the species reader stopped emitting each file's YAML
 * frontmatter as a visible heading — a defect that affected 101 of 103 species
 * pages and put build metadata directly under the table of contents. Every one of
 * those pages therefore changed materially that day, while `species.lastUpdated`
 * still reports when the COPY was last edited, in May and June.
 *
 * Reporting the copy date alone tells Google nothing changed, so the pages it
 * already crawled in their defective state would not be re-crawled on any useful
 * horizon. Taking the later of the two dates is the accurate answer, not an
 * inflated one — invented lastmod values get the whole sitemap discounted.
 *
 * Bump this ONLY when a change alters what species pages actually render.
 */
const SPECIES_TEMPLATE_REVISED = new Date('2026-09-03T00:00:00Z')

/** The later of two dates — a page changed if EITHER its copy or its template did. */
function latest(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b
}

// Public, indexable routes. Auth-gated (/dashboard), conversion (/login, /signup),
// and API routes are intentionally excluded.
const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  // The app is the product — /app is the destination every "get SpawnOS" CTA
  // routes to, so it ranks second only to the homepage.
  { path: '/app', priority: 0.9, changeFrequency: 'weekly' },
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

  { path: '/pricing', priority: 0.7, changeFrequency: 'monthly' },

  { path: '/knowledge', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  // NOTE: '/terms' was listed here but the route has never existed — it 404s in
  // production. Listing a 404 in the sitemap is a Search Console error, so it is
  // removed. A real Terms of Service page is still needed before App Store
  // submission with subscriptions; add the route, then restore this entry.
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
    lastModified: latest(
      s.lastUpdated ? new Date(s.lastUpdated) : now,
      SPECIES_TEMPLATE_REVISED,
    ),
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
