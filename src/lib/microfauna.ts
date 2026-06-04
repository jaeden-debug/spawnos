/**
 * Microfauna Database — SpawnOS authority cluster content layer.
 *
 * Drop-in (server-only, build-time): add an entry by dropping one .mdx file in
 * src/content/microfauna/<slug>.mdx with frontmatter. Optional thumbnail at
 * public/microfauna/<slug>/thumbnail.(jpg|png|webp), else the brand card.
 *
 * Frontmatter:
 *   ---
 *   name: Scuds (Freshwater Amphipods)
 *   scientificName: Gammarus & Hyalella spp.
 *   group: Crustacean            # Crustacean | Worm | Protozoa | Other
 *   excerpt: One-line summary for cards and the directory.
 *   size: 5–20 mm
 *   pest: false                  # true if commonly treated as a pest
 *   cultureable: true
 *   eatenBy: [Bettas, Pea Puffers, Cichlids]
 *   blackwater: https://blackwateraquatics.ca/products/scud-culture   # optional
 *   tags: [scuds, amphipods, live food]
 *   related: [daphnia, microworms]
 *   date: 2026-06-04
 *   featured: true
 *   ---
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'microfauna')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'microfauna')
const FALLBACK_THUMB = '/spawnos-brand-card.png'
const WORDS_PER_MIN = 220

export type MicrofaunaGroup = 'Crustacean' | 'Worm' | 'Protozoa' | 'Other'

export const GROUP_ORDER: MicrofaunaGroup[] = ['Crustacean', 'Worm', 'Protozoa', 'Other']

export interface MicrofaunaMeta {
  slug: string
  name: string
  scientificName: string
  group: MicrofaunaGroup
  excerpt: string
  size: string
  pest: boolean
  cultureable: boolean
  eatenBy: string[]
  blackwater?: string
  tags: string[]
  related: string[]
  date: string
  featured: boolean
  readingTime: number
  thumbnail: string
}

export interface MicrofaunaFull extends MicrofaunaMeta {
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
    if (fs.existsSync(path.join(PUBLIC_DIR, slug, `thumbnail.${ext}`))) return `/microfauna/${slug}/thumbnail.${ext}`
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

function toMeta(slug: string, raw: string): MicrofaunaMeta {
  const { data, body } = parseFrontmatter(raw)
  return {
    slug,
    name: (data.name as string) ?? slug,
    scientificName: (data.scientificName as string) ?? '',
    group: ((data.group as MicrofaunaGroup) ?? 'Other'),
    excerpt: (data.excerpt as string) ?? '',
    size: (data.size as string) ?? '—',
    pest: (data.pest as boolean) ?? false,
    cultureable: (data.cultureable as boolean) ?? false,
    eatenBy: (data.eatenBy as string[]) ?? [],
    blackwater: (data.blackwater as string) || undefined,
    tags: (data.tags as string[]) ?? [],
    related: (data.related as string[]) ?? [],
    date: (data.date as string) ?? '1970-01-01',
    featured: (data.featured as boolean) ?? false,
    readingTime: readingTime(body),
    thumbnail: resolveThumbnail(slug),
  }
}

export function getAllMicrofauna(): MicrofaunaMeta[] {
  return getAllSlugs()
    .map((slug) => { const raw = loadRaw(slug); return raw ? toMeta(slug, raw) : null })
    .filter((m): m is MicrofaunaMeta => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getMicrofauna(slug: string): MicrofaunaFull | null {
  const raw = loadRaw(slug)
  if (!raw) return null
  const meta = toMeta(slug, raw)
  const { body } = parseFrontmatter(raw)
  return { ...meta, body, faq: extractFaq(body) }
}

export function getMicrofaunaByGroup(): { group: MicrofaunaGroup; items: MicrofaunaMeta[] }[] {
  const all = getAllMicrofauna()
  return GROUP_ORDER
    .map((group) => ({ group, items: all.filter((m) => m.group === group) }))
    .filter((g) => g.items.length > 0)
}

export function getRelatedMicrofauna(slug: string, limit = 4): MicrofaunaMeta[] {
  const all = getAllMicrofauna()
  const current = all.find((m) => m.slug === slug)
  if (!current) return all.filter((m) => m.slug !== slug).slice(0, limit)
  const scored = all
    .filter((m) => m.slug !== slug)
    .map((m) => {
      let score = 0
      if (current.related.includes(m.slug)) score += 100
      if (m.group === current.group) score += 5
      score += m.tags.filter((t) => current.tags.includes(t)).length
      return { m, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.m)
}

export function getFeaturedMicrofauna(limit = 3): MicrofaunaMeta[] {
  const all = getAllMicrofauna()
  const featured = all.filter((m) => m.featured)
  return (featured.length > 0 ? featured : all).slice(0, limit)
}

export function getAllMicrofaunaSlugs(): string[] {
  return getAllSlugs()
}
