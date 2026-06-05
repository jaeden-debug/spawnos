import type { SpeciesData } from '@/types/species'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.app'

// ─── Author / E-E-A-T ────────────────────────────────────────────────────────
// Jaeden Doody — founder of Blackwater Aquatics Canada and author of SpawnOS content.
export const AUTHOR = {
  name: 'Jaeden Doody',
  id: `${SITE_URL}/#jaeden-doody`,
  jobTitle: 'Founder, Blackwater Aquatics Canada',
}

/** Person schema for the content author, referenced by Article schemas. */
export function authorSchema() {
  return {
    '@type': 'Person',
    '@id': AUTHOR.id,
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    description:
      'Aquarist, breeder, and founder of Blackwater Aquatics Canada. Writes the SpawnOS species, live-food, and breeding guides from hands-on fishkeeping and breeding experience.',
    worksFor: { '@id': 'https://blackwateraquatics.ca/#organization' },
    url: `${SITE_URL}/about`,
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SpawnOS',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description:
      'Aquarium science platform with species database, water parameter calculators, fish compatibility tools, and AI-powered tank blueprint generator.',
    url: SITE_URL,
    author: {
      '@type': 'Organization',
      name: 'Blackwater Aquatics Canada',
      url: 'https://blackwateraquatics.ca',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
    },
  }
}

/**
 * Brand/Organization graph emitted on every page. Declares SpawnOS as a
 * product/brand of the parent company, Blackwater Aquatics Canada, so search
 * engines understand the relationship sitewide.
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://blackwateraquatics.ca/#organization',
        name: 'Blackwater Aquatics Canada',
        url: 'https://blackwateraquatics.ca',
        description:
          'Canadian aquatics company specializing in breeder-grade live foods, fish, and aquarium intelligence. Parent company of SpawnOS.',
        logo: `${SITE_URL}/icon-512.png`,
        founder: { '@id': AUTHOR.id },
        sameAs: [
          'https://blackwateraquatics.ca',
          'https://www.tiktok.com/@blackwateraquaticscanada',
        ],
        brand: {
          '@type': 'Brand',
          name: 'SpawnOS',
          url: SITE_URL,
        },
      },
      authorSchema(),
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#spawnos`,
        name: 'SpawnOS',
        url: SITE_URL,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description:
          'SpawnOS is a Blackwater Aquatics Canada product — the aquarium operating system. Species intelligence, science-grade calculators, fish compatibility tools, and AI-powered tank blueprints.',
        publisher: { '@id': 'https://blackwateraquatics.ca/#organization' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
      },
    ],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SpawnOS',
    url: SITE_URL,
    description: 'The aquarium operating system — species database, calculators, and AI tank blueprints.',
    publisher: {
      '@type': 'Organization',
      name: 'Blackwater Aquatics Canada',
      url: 'https://blackwateraquatics.ca',
    },
  }
}

export function speciesPageSchema(species: SpeciesData) {
  const url = `${SITE_URL}/species/${species.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: species.seoTitle,
    description: species.seoDescription,
    url,
    dateModified: species.lastUpdated,
    author: {
      '@type': 'Organization',
      name: 'Blackwater Aquatics Canada',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SpawnOS',
      url: SITE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

export function speciesFaqSchema(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  }
}

export function speciesListSchema(speciesList: SpeciesData[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Aquarium Species Database',
    description: 'Comprehensive freshwater aquarium species with care guides and water parameters.',
    numberOfItems: speciesList.length,
    itemListElement: speciesList.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${s.commonName} (${s.scientificName})`,
      url: `${SITE_URL}/species/${s.slug}`,
    })),
  }
}

export function toolPageSchema(opts: {
  name: string
  description: string
  slug: string
}) {
  const url = `${SITE_URL}/tools/${opts.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
  }
}
