import type { Metadata } from 'next'
import Link from 'next/link'
import ToolLayout from '@/components/layout/ToolLayout'
import CompatibilityChecker from '@/components/tools/CompatibilityChecker'
import { getToolBySlug } from '@/data/tools'
import { toolPageSchema, breadcrumbSchema } from '@/lib/schema'

const tool = getToolBySlug('fish-compatibility')!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.seoDescription,
  alternates: { canonical: '/tools/fish-compatibility' },
}

export default function CompatibilityPage() {
  const jsonLd = [
    toolPageSchema({ name: tool.title, description: tool.description, slug: tool.slug }),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Calculators', href: '/tools' },
      { name: tool.shortTitle, href: `/tools/${tool.slug}` },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ToolLayout tool={tool} articleContent={<CompatibilityArticle />}>
        <CompatibilityChecker />
      </ToolLayout>
    </>
  )
}

function CompatibilityArticle() {
  return (
    <>
      <h2>Understanding Fish Compatibility</h2>
      <p>
        Fish compatibility is one of the most misunderstood topics in aquarium keeping, partly because so many sources
        reduce it to a binary "yes/no" answer that ignores the nuance of tank size, individual fish temperament,
        setup design, and water parameter overlap. For the full framework behind this checker, read the{' '}
        <Link href="/compatibility/fish-compatibility-guide" className="text-spawn-cyan font-semibold underline decoration-spawn-cyan/30 underline-offset-2 hover:decoration-spawn-cyan">
          complete fish compatibility guide
        </Link>.
      </p>

      <h3>The Four Pillars of Compatibility</h3>
      <p>
        True compatibility assessment should cover four factors. <strong>Water parameter overlap</strong> — can both
        species survive and thrive in the same water chemistry? <strong>Temperament compatibility</strong> — will their
        behavioural tendencies create stress, aggression, or predation? <strong>Size disparity</strong> — if one species
        can fit the other in its mouth, it eventually will. <strong>Competition</strong> — do they occupy the same niche
        in ways that create resource conflict?
      </p>

      <h3>Water Parameters First</h3>
      <p>
        Parameter compatibility is non-negotiable. Two fish whose natural water chemistry requirements do not overlap
        cannot both thrive in the same tank — one will be at the wrong end of its tolerance range, experiencing chronic
        osmoregulatory stress that suppresses immune function and shortens lifespan. This is one of the most common
        causes of "mystery" deaths in community tanks: fish technically survive in suboptimal parameters for months
        before succumbing to opportunistic disease.
      </p>
      <p>
        A classic example is mixing neon tetras (pH 5.8–7.0, soft water) with swordtails (pH 7.0–8.0, hard water).
        They can coexist at a compromise pH of 7.0–7.2, but one or both species will not be at optimal chemistry.
        For long-term success and breeding, matching parameters precisely is always better than compromise.
      </p>

      <h3>Behavioural Compatibility</h3>
      <p>
        Temperament is individual as much as it is species-wide. A "peaceful" species like a pearl gourami can be
        aggressive in a small tank or when defending a breeding territory. A "semi-aggressive" species like a tiger barb
        can be manageable in a large school in a well-designed tank. Species generalizations are starting points,
        not guarantees.
      </p>
      <p>
        Key behavioural risk factors: fin-nipping species (tiger barbs, serpae tetras, Buenos Aires tetras) are
        incompatible with long-finned fish regardless of parameter overlap; male bettas will attack any fish they
        perceive as a rival; territorial cichlids need defined space and visual barriers; predatory fish (oscar,
        pike cichlid, large catfish) will eat anything that fits in their mouth.
      </p>

      <h3>Tank Design Reduces Risk</h3>
      <p>
        Many borderline-compatible combinations succeed in well-designed tanks. Dense planting creates visual barriers
        that reduce territorial aggression. Multiple hiding spots allow subordinate fish to escape dominant individuals.
        Adequate tank size dilutes aggression. Bottom, mid-water, and top-water species that occupy different levels
        naturally have less direct competition.
      </p>
      <p>
        The "one inch per gallon" rule for stocking is a significant oversimplification — a 10-inch oscar and
        10 one-inch neon tetras do not present equal bioload or behaviour. Use our stocking density calculator
        alongside the compatibility checker for a complete picture.
      </p>
    </>
  )
}
