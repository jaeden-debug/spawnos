'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'
import { getToolBySlug } from '@/data/tools'

/**
 * Contextual next-tool links, shown under a tool's result.
 *
 * Curated per tool rather than rendering all 15 links under every calculator:
 * someone who just sized a heater wants tank volume and water parameters, not
 * a medication dosing table. The map below is the whole conversion
 * architecture — edit it here, not per page.
 *
 * Each entry names why the next tool follows, because a bare grid of links
 * gets ignored.
 */
const NEXT_TOOLS: Record<string, Array<{ slug: string; why: string }>> = {
  'fish-compatibility': [
    { slug: 'stocking-density', why: 'Check whether the tank can actually hold them' },
    { slug: 'water-parameters', why: 'Confirm their parameter ranges overlap' },
    { slug: 'tank-volume', why: 'Get your true volume before stocking' },
  ],
  'stocking-density': [
    { slug: 'fish-compatibility', why: 'Check the species get along first' },
    { slug: 'filter-size', why: 'Size filtration for that bioload' },
    { slug: 'tank-volume', why: 'Start from a real volume, not the label' },
  ],
  'tank-volume': [
    { slug: 'stocking-density', why: 'Turn that volume into a stocking plan' },
    { slug: 'water-change', why: 'Work out your change volumes' },
    { slug: 'heater-size', why: 'Size the heater for it' },
  ],
  'water-parameters': [
    { slug: 'gh-kh-converter', why: 'Convert your hardness readings' },
    { slug: 'ph-buffer', why: 'Adjust pH safely' },
    { slug: 'fish-compatibility', why: 'Find species suited to these parameters' },
  ],
  'nitrogen-cycle': [
    { slug: 'water-change', why: 'Plan changes while cycling' },
    { slug: 'stocking-density', why: 'Stock at a rate the cycle can carry' },
    { slug: 'water-parameters', why: 'Know your targets' },
  ],
  'gh-kh-converter': [
    { slug: 'water-parameters', why: 'See what your species need' },
    { slug: 'ph-buffer', why: 'KH drives pH stability' },
  ],
  'ph-buffer': [
    { slug: 'gh-kh-converter', why: 'Check the KH holding your pH up' },
    { slug: 'water-parameters', why: 'Match the target to your species' },
  ],
  'heater-size': [
    { slug: 'tank-volume', why: 'Size from real volume' },
    { slug: 'water-parameters', why: 'Set the right target temperature' },
  ],
  'filter-size': [
    { slug: 'stocking-density', why: 'Match filtration to bioload' },
    { slug: 'tank-volume', why: 'Turnover starts from volume' },
  ],
  'water-change': [
    { slug: 'tank-volume', why: 'Change volumes need a real tank volume' },
    { slug: 'nitrogen-cycle', why: 'Time changes around the cycle' },
  ],
  'feeding-calculator': [
    { slug: 'stocking-density', why: 'Feeding load follows stocking' },
    { slug: 'water-change', why: 'More food means more waste to export' },
  ],
  'salt-dosage': [
    { slug: 'medication-calculator', why: 'Dose treatments accurately' },
    { slug: 'tank-volume', why: 'Dosing is only as good as your volume' },
  ],
  'medication-calculator': [
    { slug: 'tank-volume', why: 'Dose against true water volume' },
    { slug: 'water-parameters', why: 'Check parameters before treating' },
  ],
  'lighting-calculator': [
    { slug: 'tank-volume', why: 'Depth and footprint drive lighting' },
    { slug: 'water-parameters', why: 'Light and plant growth shift parameters' },
  ],
  'temperature-converter': [
    { slug: 'heater-size', why: 'Size a heater for that temperature' },
    { slug: 'water-parameters', why: 'Check species temperature ranges' },
  ],
}

export default function RelatedTools({ slug }: { slug: string }) {
  const next = (NEXT_TOOLS[slug] ?? [])
    .map((n) => ({ ...n, tool: getToolBySlug(n.slug) }))
    .filter((n) => n.tool)

  if (next.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-widest text-spawn-muted-text mb-4">
        Next useful step
      </h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {next.map((n) => (
          <Link
            key={n.slug}
            href={`/tools/${n.slug}`}
            onClick={() => track('tool_to_tool_click', { source: slug, target: n.slug })}
            className="block p-4 rounded-xl border border-spawn-border/40 bg-spawn-surface/30 hover:border-spawn-cyan/40 hover:bg-spawn-surface/50 transition-all"
          >
            <p className="text-sm font-bold text-spawn-text mb-1">{n.tool!.shortTitle}</p>
            <p className="text-xs text-spawn-muted-text leading-relaxed">{n.why}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
