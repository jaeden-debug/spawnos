/**
 * SpawnOS Content Reader
 * Reads MDX files from src/content/species/ at build time.
 * Returns raw MDX source string for next-mdx-remote rendering.
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'species')

export function getSpeciesMDX(slug: string): string | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

export function getAllSpeciesContentSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''))
}
