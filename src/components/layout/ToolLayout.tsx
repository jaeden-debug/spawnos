import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import RelatedTools from '@/components/spawnos/RelatedTools'
import type { ToolMeta } from '@/data/tools'

interface Props {
  tool: ToolMeta
  children: React.ReactNode
  articleContent?: React.ReactNode
  /**
   * Optional module rendered directly beneath the calculator result — used by
   * the tools with genuine breeding intent to offer SpawnOS as a next step.
   * Left undefined where breeding is irrelevant, so the prompt never becomes
   * site-wide wallpaper.
   */
  resultPrompt?: React.ReactNode
}

/**
 * Where each tool sends someone once they already have their answer.
 *
 * Previously all 15 calculators ended with the identical "Generate AI Tank
 * Blueprint" button, so the CTA carried no information about the page it sat
 * on. These match the intent that brought the visitor to that specific tool.
 */
const FOOTER_CTA: Record<string, { text: string; label: string; href: string }> = {
  'fish-compatibility': {
    text: 'Planning to breed a pair rather than house them together?',
    label: 'See how SpawnOS tracks a pair',
    href: '/app',
  },
  'stocking-density': {
    text: 'Not sure which species suit your water and tank size?',
    label: 'Browse the species library',
    href: '/species',
  },
  'water-parameters': {
    text: 'Looking for species that match these parameters?',
    label: 'Browse the species library',
    href: '/species',
  },
  'nitrogen-cycle': {
    text: 'Stuck mid-cycle and unsure what the readings mean?',
    label: 'Ask the SpawnOS assistant',
    href: '/blueprints',
  },
  'medication-calculator': {
    text: 'Still working out what you are actually treating?',
    label: 'Ask the SpawnOS assistant',
    href: '/blueprints',
  },
  'salt-dosage': {
    text: 'Still working out what you are actually treating?',
    label: 'Ask the SpawnOS assistant',
    href: '/blueprints',
  },
  'feeding-calculator': {
    text: 'Raising fry and wondering when first foods are due?',
    label: 'See how SpawnOS builds a fry timeline',
    href: '/app',
  },
}

const DEFAULT_CTA = {
  text: 'Want a complete setup plan built around these numbers?',
  label: 'Ask the SpawnOS assistant',
  href: '/blueprints',
}

export default function ToolLayout({ tool, children, articleContent, resultPrompt }: Props) {
  const cta = FOOTER_CTA[tool.slug] ?? DEFAULT_CTA

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 px-4 border-b border-spawn-border/50 bg-spawn-surface/20">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-spawn-muted-text mb-5">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/tools" className="hover:text-spawn-cyan transition-colors">Calculators</Link>
              <span>/</span>
              <span className="text-spawn-text">{tool.shortTitle}</span>
            </nav>
            <div className="flex items-start gap-4">
              <div className="text-4xl shrink-0">{tool.icon}</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">{tool.title}</h1>
                <p className="text-spawn-muted-text leading-relaxed max-w-2xl">{tool.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator zone — the answer comes first and stays free, with
            nothing gated in front of it. Next steps sit below the result. */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            {children}
            {resultPrompt && <div className="mt-8 max-w-3xl">{resultPrompt}</div>}
            <RelatedTools slug={tool.slug} />
          </div>
        </section>

        {/* Article / SEO content */}
        {articleContent && (
          <section className="py-10 px-4 border-t border-spawn-border/30 bg-spawn-surface/10">
            <div className="max-w-3xl mx-auto prose-aqua">
              {articleContent}
            </div>
          </section>
        )}

        {/* Footer CTA — intent-matched per tool, see FOOTER_CTA above. */}
        <section className="py-12 px-4 border-t border-spawn-border/30 bg-spawn-surface/20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-spawn-muted-text mb-4">{cta.text}</p>
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              {cta.label}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
