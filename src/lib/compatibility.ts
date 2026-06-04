/**
 * Fish Compatibility Database — SpawnOS authority cluster content layer.
 *
 * Drop-in (server-only): add a pairing by dropping src/content/compatibility/<slug>.mdx
 * (slug form: species-a-and-species-b) with frontmatter. Optional thumbnail at
 * public/compatibility/<slug>/thumbnail.*.
 *
 * Frontmatter:
 *   ---
 *   title: Betta and Shrimp — Can They Live Together?
 *   speciesA: Betta
 *   speciesB: Cherry Shrimp
 *   score: 55                     # 0–100 compatibility score
 *   verdict: One-line summary.
 *   tankSize: 10+ gal (38L+)
 *   tempOverlap: 74–80°F
 *   relatedSpecies: [betta-fish, cherry-shrimp]   # /species cross-links
 *   blackwater: https://blackwateraquatics.ca/products/cherry-shrimp-canada
 *   tags: [betta, shrimp]
 *   related: [betta-and-corydoras]                # other pairing slugs
 *   date: 2026-06-04
 *   featured: true
 *   ---
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'compatibility')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'compatibility')
const FALLBACK_THUMB = '/spawnos-brand-card.png'
const WORDS_PER_MIN = 220

export interface CompatRating {
  label: string
  color: string // tailwind text color class
  bar: string // tailwind bg color class
}

export function rateScore(score: number): CompatRating {
  if (score >= 75) return { label: 'Great match', color: 'text-green-400', bar: 'bg-green-400' }
  if (score >= 55) return { label: 'Workable with care', color: 'text-spawn-cyan', bar: 'bg-spawn-cyan' }
  if (score >= 35) return { label: 'Risky', color: 'text-spawn-amber', bar: 'bg-spawn-amber' }
  return { label: 'Not recommended', color: 'text-spawn-rose', bar: 'bg-spawn-rose' }
}

export interface CompatMeta {
  slug: string
  title: string
  speciesA: string
  speciesB: string
  score: number
  verdict: string
  tankSize: string
  tempOverlap: string
  relatedSpecies: string[]
  blackwater?: string
  tags: string[]
  related: string[]
  date: string
  featured: boolean
  readingTime: number
  thumbnail: string
}

export interface CompatFull extends CompatMeta {
  body: string
  faq: { q: string; a: string }[]
}

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
      data[key] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      data[key] = Number(value)
    } else {
      data[key] = value.replace(/^["']|["']$/g, '')
    }
  }
  return { data, body: match[2] }
}

function extractFaq(body: string): { q: string; a: string }[] {
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
    if (fs.existsSync(path.join(PUBLIC_DIR, slug, `thumbnail.${ext}`))) return `/compatibility/${slug}/thumbnail.${ext}`
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
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

function toMeta(slug: string, raw: string): CompatMeta {
  const { data, body } = parseFrontmatter(raw)
  return {
    slug,
    title: (data.title as string) ?? slug,
    speciesA: (data.speciesA as string) ?? '',
    speciesB: (data.speciesB as string) ?? '',
    score: typeof data.score === 'number' ? (data.score as number) : 50,
    verdict: (data.verdict as string) ?? '',
    tankSize: (data.tankSize as string) ?? '—',
    tempOverlap: (data.tempOverlap as string) ?? '—',
    relatedSpecies: (data.relatedSpecies as string[]) ?? [],
    blackwater: (data.blackwater as string) || undefined,
    tags: (data.tags as string[]) ?? [],
    related: (data.related as string[]) ?? [],
    date: (data.date as string) ?? '1970-01-01',
    featured: (data.featured as boolean) ?? false,
    readingTime: readingTime(body),
    thumbnail: resolveThumbnail(slug),
  }
}

export function getAllCompat(): CompatMeta[] {
  return getAllSlugs()
    .map((slug) => { const raw = loadRaw(slug); return raw ? toMeta(slug, raw) : null })
    .filter((c): c is CompatMeta => c !== null)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function getCompat(slug: string): CompatFull | null {
  const raw = loadRaw(slug)
  if (!raw) return null
  const meta = toMeta(slug, raw)
  const { body } = parseFrontmatter(raw)
  return { ...meta, body, faq: extractFaq(body) }
}

export function getRelatedCompat(slug: string, limit = 3): CompatMeta[] {
  const all = getAllCompat()
  const current = all.find((c) => c.slug === slug)
  if (!current) return all.filter((c) => c.slug !== slug).slice(0, limit)
  const scored = all
    .filter((c) => c.slug !== slug)
    .map((c) => {
      let score = 0
      if (current.related.includes(c.slug)) score += 100
      score += c.tags.filter((t) => current.tags.includes(t)).length
      return { c, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.c)
}

export function getFeaturedCompat(limit = 3): CompatMeta[] {
  const all = getAllCompat()
  const featured = all.filter((c) => c.featured)
  return (featured.length > 0 ? featured : all).slice(0, limit)
}

export function getAllCompatSlugs(): string[] {
  return getAllSlugs()
}
