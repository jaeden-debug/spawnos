/**
 * Aquarium Problem Database — SpawnOS authority cluster content layer.
 *
 * Drop-in (server-only): add a page by dropping src/content/problems/<slug>.mdx
 * with frontmatter. Optional thumbnail at public/problems/<slug>/thumbnail.*.
 *
 * Frontmatter:
 *   ---
 *   title: What Is Planaria? Identification, Causes & How to Remove It
 *   shortName: Planaria
 *   excerpt: One-line summary.
 *   verdict: Usually harmless to fish; a risk to shrimp and eggs.
 *   harmful: Low                  # None | Low | Moderate | High
 *   remove: Optional              # Leave it | Optional | Recommended
 *   cause: Overfeeding & detritus buildup
 *   relatedMicrofauna: [detritus-worms]   # /microfauna/<slug> cross-links
 *   tags: [planaria, flatworm, pest]
 *   related: [what-are-detritus-worms]    # other /problems/<slug>
 *   date: 2026-06-04
 *   featured: true
 *   ---
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'problems')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'problems')
const FALLBACK_THUMB = '/spawnos-brand-card.png'
const WORDS_PER_MIN = 220

export type HarmLevel = 'None' | 'Low' | 'Moderate' | 'High'

export interface ProblemMeta {
  slug: string
  title: string
  shortName: string
  excerpt: string
  verdict: string
  harmful: HarmLevel
  remove: string
  cause: string
  relatedMicrofauna: string[]
  tags: string[]
  related: string[]
  date: string
  featured: boolean
  readingTime: number
  thumbnail: string
}

export interface ProblemFull extends ProblemMeta {
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
    if (fs.existsSync(path.join(PUBLIC_DIR, slug, `thumbnail.${ext}`))) return `/problems/${slug}/thumbnail.${ext}`
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

function toMeta(slug: string, raw: string): ProblemMeta {
  const { data, body } = parseFrontmatter(raw)
  return {
    slug,
    title: (data.title as string) ?? slug,
    shortName: (data.shortName as string) ?? (data.title as string) ?? slug,
    excerpt: (data.excerpt as string) ?? '',
    verdict: (data.verdict as string) ?? '',
    harmful: ((data.harmful as HarmLevel) ?? 'Low'),
    remove: (data.remove as string) ?? 'Optional',
    cause: (data.cause as string) ?? '',
    relatedMicrofauna: (data.relatedMicrofauna as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
    related: (data.related as string[]) ?? [],
    date: (data.date as string) ?? '1970-01-01',
    featured: (data.featured as boolean) ?? false,
    readingTime: readingTime(body),
    thumbnail: resolveThumbnail(slug),
  }
}

export function getAllProblems(): ProblemMeta[] {
  return getAllSlugs()
    .map((slug) => { const raw = loadRaw(slug); return raw ? toMeta(slug, raw) : null })
    .filter((p): p is ProblemMeta => p !== null)
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
}

export function getProblem(slug: string): ProblemFull | null {
  const raw = loadRaw(slug)
  if (!raw) return null
  const meta = toMeta(slug, raw)
  const { body } = parseFrontmatter(raw)
  return { ...meta, body, faq: extractFaq(body) }
}

export function getRelatedProblems(slug: string, limit = 3): ProblemMeta[] {
  const all = getAllProblems()
  const current = all.find((p) => p.slug === slug)
  if (!current) return all.filter((p) => p.slug !== slug).slice(0, limit)
  const scored = all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0
      if (current.related.includes(p.slug)) score += 100
      score += p.tags.filter((t) => current.tags.includes(t)).length
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.p)
}

export function getFeaturedProblems(limit = 3): ProblemMeta[] {
  const all = getAllProblems()
  const featured = all.filter((p) => p.featured)
  return (featured.length > 0 ? featured : all).slice(0, limit)
}

export function getAllProblemSlugs(): string[] {
  return getAllSlugs()
}
