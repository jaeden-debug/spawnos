# SpawnOS — SEO Strategy

## Target Keywords

### Primary (high intent, moderate competition)

| Keyword | Page |
|---------|------|
| aquarium water parameter calculator | /tools/water-parameters |
| betta fish water parameters | /species/betta-splendens |
| fish compatibility checker | /tools/fish-compatibility |
| nitrogen cycle calculator aquarium | /tools/nitrogen-cycle |
| aquarium stocking calculator | /tools/stocking-density |
| aquarium tank volume calculator | /tools/tank-volume |
| guppy care guide water parameters | /species/poecilia-reticulata |
| neon tetra care guide | /species/paracheirodon-innesi |
| AI aquarium setup planner | /blueprints |

### Long-tail (lower competition, higher conversion)

- "what pH do betta fish need"
- "can neon tetras live with bettas"
- "how many fish can I put in a 29 gallon tank"
- "how to raise aquarium pH safely"
- "is my aquarium cycled"
- "German Blue Ram water temperature"

---

## Schema Markup Implementation

Every public page includes structured data:

| Schema Type | Pages |
|-------------|-------|
| `SoftwareApplication` | Homepage |
| `WebSite` | Homepage |
| `Article` | Species detail pages |
| `FAQPage` | Species detail pages (per FAQ section) |
| `BreadcrumbList` | All pages |
| `ItemList` | Species hub (/species) |
| `WebApplication` | Tool pages |

All schemas are implemented in `src/lib/schema.ts` and injected via `<script type="application/ld+json">` in each page's server component.

---

## On-Page SEO

### Metadata
- Every page exports a `Metadata` object via Next.js `generateMetadata` or static `metadata`
- `title` follows `[Page Topic] — SpawnOS` pattern
- `description` is unique per page, 140–160 characters, includes primary keyword
- `alternates.canonical` set on every public page
- OpenGraph and Twitter card metadata on all pages
- `robots: { index: false }` on auth pages (login, signup)

### Content
- Species pages: 500–800 word long description + habitat section + FAQ
- Tool pages: 600–1200 word SEO article below each calculator
- All content is original, accurate, and targeted at hobbyist search intent

### Internal Linking
- Species pages link to: compatibility checker, water parameter tool, blueprint generator
- Tool pages link to: species database, blueprint generator
- Homepage links to all major sections
- Footer provides site-wide navigation to all key pages

---

## Performance (Core Web Vitals)

- Next.js 15 App Router with server components for all static content
- Client components only where interactivity is required (calculators, blueprint form)
- `next/image` with proper `sizes` attributes on hero images
- No third-party scripts on public pages
- Google Fonts loaded via CSS `@import` (consider moving to `next/font` for better LCP)

---

## Content Expansion Roadmap (V2)

Priority pages to add for SEO growth:

1. **Individual calculator deep-dives** — long-form articles currently embedded in tool pages could become standalone articles targeting specific questions
2. **"X fish with Y fish" compatibility articles** — auto-generated from species database for top 50 combinations
3. **Species comparison pages** — "Betta vs Guppy: Tank Requirements Compared"
4. **Blackwater aquarium guide** — high-intent, low-competition keyword cluster
5. **Beginner's guide to freshwater aquariums** — hub page targeting top-funnel traffic
