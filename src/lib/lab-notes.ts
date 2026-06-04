/**
 * Lab Notes — SpawnOS knowledge engine content layer.
 *
 * Drop-in by design (server-only, build-time):
 *   • Add an article  → drop one .mdx file in src/content/lab-notes/<slug>.mdx
 *     with frontmatter. It auto-appears in the hub, recommendations & sitemap.
 *   • Add a thumbnail → drop an image at public/lab-notes/<slug>/thumbnail.(jpg|png|webp).
 *     Picked up automatically; falls back to the brand card if absent.
 *
 * Frontmatter format (simple, controlled):
 *   ---
 *   title: Best Live Food for Betta Fry
 *   excerpt: One-line summary used on cards and recommendations.
 *   category: Live Food
 *   tags: [betta, fry, scuds, daphnia]
 *   date: 2026-06-04
 *   featured: true
 *   related: [betta-fry-feeding-schedule, best-live-food-for-axolotls]
 *   ---
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'lab-notes')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'lab-notes')
const FALLBACK_THUMB = '/spawnos-brand-card.png'
const WORDS_PER_MIN = 220

export type LabNoteCategory =
  | 'Live Food'
  | 'Species Care'
  | 'Breeding'
  | 'Compatibility'
  | 'Water Parameters'
  | 'Guides'

export interface LabNoteMeta {
  slug: string
  title: string
  excerpt: string
  category: LabNoteCategory
  tags: string[]
  date: string // ISO date
  featured: boolean
  related: string[]
  readingTime: number // minutes
  thumbnail: string // public URL
}

export interface LabNoteFull extends LabNoteMeta {
  body: string
  faq: { q: string; a: string }[]
}

// ─── Frontmatter parsing (dependency-free, controlled format) ────────────────
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw }

  const data: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (!key) continue

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else {
      value = value.replace(/^["']|["']$/g, '')
      data[key] = value
    }
  }
  return { data, body: match[2] }
}

// ─── FAQ extraction for schema (from the article body) ───────────────────────
function extractFaq(body: string): { q: string; a: string }[] {
  // Find a "## Frequently Asked Questions" section, then pull "### Q" + answer.
  const section = body.split(/^##\s+Frequently Asked Questions\s*$/im)[1]
  if (!section) return []
  const stop = section.search(/^##\s+/m)
  const scope = stop === -1 ? section : section.slice(0, stop)
  const faq: { q: string; a: string }[] = []
  const re = /^###\s+(.+?)\s*$\n+([\s\S]*?)(?=\n###\s|\n##\s|$)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(scope)) !== null) {
    const q = m[1].trim()
    const a = m[2].replace(/\n+/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').trim()
    if (q && a) faq.push({ q, a })
  }
  return faq
}

function resolveThumbnail(slug: string): string {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    if (fs.existsSync(path.join(PUBLIC_DIR, slug, `thumbnail.${ext}`))) {
      return `/lab-notes/${slug}/thumbnail.${ext}`
    }
  }
  return FALLBACK_THUMB
}

function readingTime(body: string): number {
  const words = body.replace(/[#>*`_\-|]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MIN))
}

function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''))
}

function loadRaw(slug: string): string | null {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(file)) return null
  return fs.readFileSync(file, 'utf8')
}

function toMeta(slug: string, raw: string): LabNoteMeta {
  const { data, body } = parseFrontmatter(raw)
  return {
    slug,
    title: (data.title as string) ?? slug,
    excerpt: (data.excerpt as string) ?? '',
    category: ((data.category as LabNoteCategory) ?? 'Guides'),
    tags: (data.tags as string[]) ?? [],
    date: (data.date as string) ?? '1970-01-01',
    featured: (data.featured as boolean) ?? false,
    related: (data.related as string[]) ?? [],
    readingTime: readingTime(body),
    thumbnail: resolveThumbnail(slug),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function getAllLabNotes(): LabNoteMeta[] {
  return getAllSlugs()
    .map((slug) => {
      const raw = loadRaw(slug)
      return raw ? toMeta(slug, raw) : null
    })
    .filter((n): n is LabNoteMeta => n !== null)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

export function getLabNote(slug: string): LabNoteFull | null {
  const raw = loadRaw(slug)
  if (!raw) return null
  const meta = toMeta(slug, raw)
  const { body } = parseFrontmatter(raw)
  return { ...meta, body, faq: extractFaq(body) }
}

export function getFeaturedLabNotes(limit = 3): LabNoteMeta[] {
  const all = getAllLabNotes()
  const featured = all.filter((n) => n.featured)
  return (featured.length > 0 ? featured : all).slice(0, limit)
}

export function getRecentLabNotes(limit = 6): LabNoteMeta[] {
  return getAllLabNotes().slice(0, limit)
}

export function getRelatedLabNotes(slug: string, limit = 3): LabNoteMeta[] {
  const all = getAllLabNotes()
  const current = all.find((n) => n.slug === slug)
  if (!current) return all.filter((n) => n.slug !== slug).slice(0, limit)

  // Explicit `related` first, then same-category, then shared tags, then recent.
  const scored = all
    .filter((n) => n.slug !== slug)
    .map((n) => {
      let score = 0
      if (current.related.includes(n.slug)) score += 100
      if (n.category === current.category) score += 10
      score += n.tags.filter((t) => current.tags.includes(t)).length
      return { n, score }
    })
    .sort((a, b) => b.score - a.score || +new Date(b.n.date) - +new Date(a.n.date))

  return scored.slice(0, limit).map((s) => s.n)
}

export function getLabNoteCategories(): { category: LabNoteCategory; count: number }[] {
  const counts = new Map<LabNoteCategory, number>()
  for (const n of getAllLabNotes()) counts.set(n.category, (counts.get(n.category) ?? 0) + 1)
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }))
}

export function getAllLabNoteSlugs(): string[] {
  return getAllSlugs()
}
