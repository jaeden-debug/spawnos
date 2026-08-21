import { productPageSchema, breadcrumbSchema } from '@/lib/schema'

/**
 * Structured data for /pricing.
 *
 * The page that actually lists the prices previously carried no product or
 * offer markup at all — only the sitewide organization graph. This declares the
 * page as the SpawnOS product's page by @id reference, so the offers attach to
 * the one canonical product node instead of duplicating it.
 *
 * `/pricing` is a client component because of `useSearchParams`, so the markup
 * lives here in a server component rather than being injected from the client.
 */
export default function PricingSchema() {
  const jsonLd = [
    productPageSchema('/pricing', 'SpawnOS Pricing'),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Pricing', href: '/pricing' },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
