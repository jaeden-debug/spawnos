/**
 * Tools Database — SpawnOS authority cluster for the calculator suite.
 *
 * Server-only content layer. Each tool gets a long-form SEO pillar at
 * /tools-database/<slug>, backed by src/content/tools/<slug>.mdx and the
 * shared metadata in src/data/tools.ts (icon, category, calculator link).
 *
 * Frontmatter:
 *   ---
 *   seoTitle: How to Calculate Aquarium Stocking — The Complete Guide
 *   seoDescription: One-line meta description.
 *   h1: How many fish can your tank really hold?
 *   intro: One-paragraph hero standfirst.
 *   related: [nitrogen-cycle, filter-size, fish-compatibility]
 *   ---
 */

import fs from 'fs'
import path from 'path'
import { TOOLS_DATA, getToolBySlug, type ToolMeta } from '@/data/tools'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'tools')
const WORDS_PER_MIN = 220

export interface ToolArticleMeta {
  slug: string
  tool: ToolMeta
  seoTitle: string
  seoDescription: string
  h1: string
  intro: string
  related: string[]
  readingTime: number
}

export interface ToolArticleFull extends ToolArticleMeta {
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

function readingTime(body: string): number {
  const words = body.replace(/[#>*`_\-|]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MIN))
}

function loadRaw(slug: string): string | null {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

export function getAllToolArticleSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
    .filter((slug) => !!getToolBySlug(slug))
}

function toMeta(slug: string, raw: string): ToolArticleMeta | null {
  const tool = getToolBySlug(slug)
  if (!tool) return null
  const { data, body } = parseFrontmatter(raw)
  return {
    slug,
    tool,
    seoTitle: (data.seoTitle as string) ?? tool.seoTitle,
    seoDescription: (data.seoDescription as string) ?? tool.seoDescription,
    h1: (data.h1 as string) ?? tool.title,
    intro: (data.intro as string) ?? tool.description,
    related: (data.related as string[]) ?? [],
    readingTime: readingTime(body),
  }
}

export function getAllToolArticles(): ToolArticleMeta[] {
  return getAllToolArticleSlugs()
    .map((slug) => { const raw = loadRaw(slug); return raw ? toMeta(slug, raw) : null })
    .filter((a): a is ToolArticleMeta => a !== null)
    .sort((a, b) => TOOLS_DATA.findIndex((t) => t.slug === a.slug) - TOOLS_DATA.findIndex((t) => t.slug === b.slug))
}

export function getToolArticle(slug: string): ToolArticleFull | null {
  const raw = loadRaw(slug)
  if (!raw) return null
  const meta = toMeta(slug, raw)
  if (!meta) return null
  const { body } = parseFrontmatter(raw)
  return { ...meta, body, faq: extractFaq(body) }
}
