/**
 * SpawnOS Content Reader
 * Reads MDX files from src/content/species/ at build time.
 * Returns the MDX BODY (frontmatter stripped) for next-mdx-remote rendering.
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'species')

/**
 * Remove a leading YAML frontmatter block.
 *
 * 101 of the 103 species files open with one, and next-mdx-remote does NOT
 * parse frontmatter — it renders whatever it is handed as markdown. Markdown
 * then reads the block as a *setext heading*: the opening `---` is a thematic
 * break, the YAML lines form a paragraph, and the CLOSING `---` promotes that
 * paragraph to an <h2>. So every one of those pages shipped its own build
 * metadata as a styled heading directly under the table of contents, where it
 * was also picked up as a real section by extractors.
 *
 * Only the two files that happen to have no frontmatter (axolotl, betta-fish)
 * rendered correctly, which is why this looked like a content problem rather
 * than a reader problem.
 *
 * Stripping is safe: species metadata is served from Supabase via
 * `getSpeciesRecord`, not from these files. The frontmatter here is a leftover
 * of the authoring format and is read by nothing.
 *
 * Regex matches the frontmatter handling already used by lab-notes, tools,
 * problems, microfauna and compatibility readers.
 */
function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  return match ? match[2] : raw
}

export function getSpeciesMDX(slug: string): string | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return stripFrontmatter(fs.readFileSync(filePath, 'utf8'))
}

export function getAllSpeciesContentSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''))
}
