import type { Metadata } from 'next'
import ToolLayout from '@/components/layout/ToolLayout'
import FeedingCalculator from '@/components/tools/FeedingCalculator'
import { getToolBySlug } from '@/data/tools'
import { toolPageSchema, breadcrumbSchema } from '@/lib/schema'

const tool = getToolBySlug('feeding-calculator')!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.seoDescription,
  alternates: { canonical: '/tools/feeding-calculator' },
}

export default function FeedingCalculatorPage() {
  const jsonLd = [
    toolPageSchema({ name: tool.title, description: tool.description, slug: tool.slug }),
    breadcrumbSchema([{ name: 'Home', href: '/' }, { name: 'Calculators', href: '/tools' }, { name: tool.shortTitle, href: `/tools/${tool.slug}` }]),
  ]
  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ToolLayout tool={tool}>
        <FeedingCalculator />
      </ToolLayout>
    </>
  )
}
