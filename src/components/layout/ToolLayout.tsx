import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import type { ToolMeta } from '@/data/tools'

interface Props {
  tool: ToolMeta
  children: React.ReactNode
  articleContent?: React.ReactNode
}

export default function ToolLayout({ tool, children, articleContent }: Props) {
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

        {/* Calculator interactive zone */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            {children}
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

        {/* Footer CTA */}
        <section className="py-12 px-4 border-t border-spawn-border/30 bg-spawn-surface/20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-spawn-muted-text mb-4">
              Ready to design a complete tank setup based on these parameters?
            </p>
            <Link
              href="/blueprints"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              Generate AI Tank Blueprint
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
