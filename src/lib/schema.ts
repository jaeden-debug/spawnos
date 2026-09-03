import type { SpeciesData } from '@/types/species'
import {
  APP_STORE_URL,
  APP_STORE_URL_CA,
  APP_VERSION,
  PLATFORM,
  RELEASE_DATE,
} from '@/lib/app-store'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.ca'

// ─── Stable entity IDs ───────────────────────────────────────────────────────
// Three entities, three permanent @ids, referenced by { '@id': … } everywhere
// else. Never inline a second copy of one of these nodes — duplicating an
// entity under a different (or missing) @id is how a knowledge graph ends up
// with two SpawnOS products that it cannot reconcile.
/**
 * The one contact address SpawnOS publishes.
 *
 * It lives on blackwateraquatics.ca because that domain has working MX records
 * (Google Workspace). spawnos.ca and spawnos.app have NO MX records, so the
 * previously published support@spawnos.app and privacy@spawnos.app could not
 * receive mail — a dead address in a privacy policy is both a compliance
 * problem and an App Review failure, since Apple tests the support URL.
 */
export const SUPPORT_EMAIL = 'spawnos@blackwateraquatics.ca'

export const ORG_ID = 'https://blackwateraquatics.ca/#organization'
export const SPAWNOS_ID = `${SITE_URL}/#spawnos`

// ─── Author / E-E-A-T ────────────────────────────────────────────────────────
// Jaeden Doody — founder of Blackwater Aquatics Canada and author of SpawnOS content.
export const AUTHOR = {
  name: 'Jaeden Doody',
  id: `${SITE_URL}/#jaeden-doody`,
  jobTitle: 'Founder, Blackwater Aquatics Canada',
}

/**
 * Person schema for the founder/author, referenced by Article schemas.
 *
 * `sameAs` points at the Blackwater founder page, which is the other public
 * profile describing this same person. Without it the two pages read as two
 * unrelated people, which is precisely the signal E-E-A-T depends on.
 */
export function authorSchema() {
  return {
    '@type': 'Person',
    '@id': AUTHOR.id,
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    description:
      'Aquarist, breeder, and founder of Blackwater Aquatics Canada. Writes the SpawnOS species, live-food, and breeding guides from hands-on fishkeeping and breeding experience.',
    worksFor: { '@id': ORG_ID },
    url: `${SITE_URL}/about`,
    sameAs: ['https://blackwateraquatics.ca/pages/jaeden-doody'],
    knowsAbout: [
      'Aquarium fish breeding',
      'Betta splendens breeding',
      'Live food culturing',
      'Freshwater shrimp keeping',
      'Aquarium water chemistry',
    ],
  }
}

/**
 * SpawnOS the product — ONE node, one @id, referenced everywhere.
 *
 * This previously existed twice on the homepage: a `WebApplication` inside the
 * organization graph and a separate `SoftwareApplication` with no @id, carrying
 * a different description and different offers (CAD 0 vs USD 0/7). Two nodes
 * describing one product is entity fragmentation — search engines have no way
 * to know they are the same thing. There is now a single definition.
 *
 * Offers match what /api/stripe/checkout actually charges: Stripe lookup keys
 * spawnos_pro_monthly = 7.00 USD and spawnos_pro_annual = 79.00 USD. Currency
 * is USD because that is what Stripe bills in, regardless of the Canadian
 * publisher.
 *
 * No aggregateRating, reviewCount or downloads is emitted — the live listing
 * reports userRatingCount 0, and inventing ratings risks a manual action. See
 * HAS_PUBLIC_RATINGS in `@/lib/app-store`.
 *
 * iOS 1.0 went public on 2026-09-01, so this node is now multi-typed as
 * SoftwareApplication + MobileApplication and carries the real installUrl.
 * It deliberately stays ONE node under ONE @id: emitting a separate
 * MobileApplication beside this one would recreate exactly the entity
 * fragmentation this file was written to remove. SpawnOS is one product with an
 * iPhone app and a web surface, so it is described once.
 */
export function spawnosProductNode() {
  return {
    '@type': ['SoftwareApplication', 'MobileApplication'],
    '@id': SPAWNOS_ID,
    name: 'SpawnOS',
    alternateName: 'SpawnOS for iPhone',
    url: SITE_URL,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Aquarium breeding records',
    // Both surfaces are real: the iPhone app is the product; the site carries
    // the species library and calculators that need no install.
    operatingSystem: `${PLATFORM}, Web`,
    softwareVersion: APP_VERSION,
    datePublished: RELEASE_DATE,
    downloadUrl: APP_STORE_URL,
    installUrl: APP_STORE_URL,
    // The App Store listing is the other authoritative public profile of this
    // same product — this is the link that lets a crawler reconcile the website
    // entity with the store entity.
    sameAs: [APP_STORE_URL_CA],
    description:
      'Breeding records for aquarium fish: register your animals, build breeding pairs, log spawns, and follow a species-aware timeline of milestones. Free on the App Store for iPhone, with a free species library, fish compatibility checker and 15 aquarium calculators on the web.',
    featureList: [
      'Animal registry with photos, species, sex and visible traits',
      'Breeding pair management with species and sex checks',
      'Spawn records with species-aware milestone timelines',
      'Adaptive timelines that re-anchor when a milestone is confirmed',
      'Lineage tracking with relatedness warnings',
      'Trait observations from recorded parent traits, labelled preliminary',
      'Preparation checklists and local reminders',
      'Ask SpawnOS breeding assistant',
    ],
    publisher: { '@id': ORG_ID },
    author: { '@id': AUTHOR.id },
    offers: [
      {
        '@type': 'Offer',
        name: 'SpawnOS Free',
        description:
          'One active breeding project, the full species library and all 15 calculators.',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'SpawnOS Pro',
        description: 'Unlimited active breeding projects.',
        price: '7.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      },
    ],
  }
}

/**
 * Declares that a given page is *about* the SpawnOS product, without emitting a
 * second copy of the product node.
 *
 * The product itself ships once, sitewide, inside organizationSchema(). Pages
 * that lead with the product (/app, /pricing) reference it by @id through
 * `mainEntity` — that is what tells a search engine "this page is the page for
 * that entity" while keeping exactly one definition of it.
 */
export function productPageSchema(path: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': SPAWNOS_ID },
    mainEntity: { '@id': SPAWNOS_ID },
    publisher: { '@id': ORG_ID },
  }
}

/** Standalone product graph for pages that lead with the product (/, /app, /pricing). */
export function softwareApplicationSchema() {
  return { '@context': 'https://schema.org', ...spawnosProductNode() }
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
        '@id': ORG_ID,
        name: 'Blackwater Aquatics Canada',
        url: 'https://blackwateraquatics.ca',
        description:
          'Canadian aquatics company specializing in breeder-grade live foods, fish, and aquarium intelligence. Parent company of SpawnOS.',
        // Blackwater's logo must be hosted on Blackwater's own domain — pointing
        // the parent company's logo at spawnos.ca associated the asset with the
        // wrong entity.
        logo: {
          '@type': 'ImageObject',
          url: 'https://blackwateraquatics.ca/cdn/shop/files/blackwater-aquatics-canada-app-logo.png',
        },
        founder: { '@id': AUTHOR.id },
        foundingLocation: { '@type': 'Country', name: 'Canada' },
        // Self-reference removed — sameAs exists to connect an entity to its
        // other verifiable profiles, not to repeat its own url.
        sameAs: [
          'https://www.tiktok.com/@blackwateraquaticscanada',
        ],
        brand: { '@id': SPAWNOS_ID },
        owns: { '@id': SPAWNOS_ID },
      },
      authorSchema(),
      spawnosProductNode(),
    ],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'SpawnOS',
    url: SITE_URL,
    description:
      'Breeding records and spawn timelines for aquarium fish, plus a free species library, fish compatibility checker and 15 aquarium calculators.',
    inLanguage: 'en-CA',
    publisher: { '@id': ORG_ID },
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
    author: { '@id': AUTHOR.id },
    publisher: { '@id': ORG_ID },
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

/** FAQPage schema for any page with a real, visible Q&A list. */
export function faqPageSchema(faq: { q: string; a: string }[]) {
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
