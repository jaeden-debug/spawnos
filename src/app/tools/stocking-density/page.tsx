import type { Metadata } from 'next'
import ToolLayout from '@/components/layout/ToolLayout'
import StockingCalculator from '@/components/tools/StockingCalculator'
import { getToolBySlug } from '@/data/tools'
import { toolPageSchema, breadcrumbSchema } from '@/lib/schema'

const tool = getToolBySlug('stocking-density')!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.seoDescription,
  alternates: { canonical: '/tools/stocking-density' },
}

export default function StockingDensityPage() {
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
      <ToolLayout tool={tool}>
        <StockingCalculator />
      </ToolLayout>
    </>
  )
}
