/**
 * Blackwater Aquatics Canada — Catalog & Sitemap (single source of truth)
 *
 * Authoritative reference for everything SpawnOS knows about Blackwater Aquatics:
 * live products (with pricing), collections, store pages, the full knowledge-base
 * sitemap, and brand facts. Injected into the AI system prompts (chat + blueprint)
 * so the assistant recommends real, current products, pages and articles — never
 * invented URLs.
 *
 * Source: blackwateraquatics.ca sitemaps (products / blogs / pages).
 * Last verified: 2026-06-04.
 */

export const BWA_BASE = 'https://blackwateraquatics.ca'

export interface BWAProduct {
  name: string
  url: string
  type: 'live-food' | 'shrimp' | 'betta'
  price?: string
  bestFor: string
  note?: string
}

export interface BWALink {
  title: string
  url: string
}

// ─── Brand facts ─────────────────────────────────────────────────────────────
export const BWA_BRAND = {
  name: 'Blackwater Aquatics Canada',
  base: BWA_BASE,
  location: 'Montreal, Quebec, Canada — ships live cultures & livestock across Canada, local pickup in Montreal',
  shipping: 'Ships within safe temperature windows (~2°C–25°C). Live Arrival Guarantee + winter shipping policy.',
  about: `${BWA_BASE}/pages/blackwater-aquatics-canada`,
  located: `${BWA_BASE}/pages/where-is-blackwater-aquatics-located`,
  contact: `${BWA_BASE}/pages/contact`,
  faq: `${BWA_BASE}/pages/frequently-asked-questions`,
  reviews: `${BWA_BASE}/pages/customer-reviews`,
  firstOrderDiscount: `${BWA_BASE}/pages/first-order-discount`,
  knowledgeBase: `${BWA_BASE}/blogs/knowledge-base`,
  spawnosPage: `${BWA_BASE}/pages/spawnos`,
}

// ─── Products (verified live, 2026-06-04) ────────────────────────────────────
// Live foods first — these are the priority recommendations.
export const BWA_PRODUCTS: BWAProduct[] = [
  {
    name: 'Live Scud Culture (freshwater amphipods, Gammarus)',
    url: `${BWA_BASE}/products/scud-culture`,
    type: 'live-food',
    price: 'from $14.99 CAD — 50 / 100 / 200 (most popular) / 500 count',
    bestFor: 'Bettas, pea puffers, cichlids, fry, juveniles, breeder conditioning. THE flagship live food.',
    note: 'High-protein, self-sustaining, triggers natural hunting behavior, improves color. The single best feeding upgrade for carnivores. Quarantine before adding to shrimp/display tanks.',
  },
  {
    name: 'Live Daphnia Culture',
    url: `${BWA_BASE}/products/products-live-daphnia-culture`,
    type: 'live-food',
    bestFor: 'Fry, nano fish, water-column feeders, picky or recovering fish, digestive reset.',
    note: 'Natural laxative effect; gets fish eating when pellets are refused. The #2 priority recommendation, pairs with scuds.',
  },
  {
    name: 'Live Microworm Culture (Panagrellus redivivus)',
    url: `${BWA_BASE}/products/microworm-culture-canada`,
    type: 'live-food',
    price: '$10.99 CAD',
    bestFor: 'First food for fry days 3–10 (betta fry, guppies, tetras, killifish).',
    note: 'Best fry starter; transition to baby brine shrimp then scuds as they grow.',
  },
  {
    name: 'Cherry Shrimp (red Neocaridina)',
    url: `${BWA_BASE}/products/cherry-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'Beginner shrimp keepers, planted tanks, cleanup crew.',
  },
  {
    name: 'Bloody Mary Shrimp (premium deep-red Neocaridina)',
    url: `${BWA_BASE}/products/bloody-mary-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'Deep-red colony display, intermediate keepers.',
  },
  {
    name: 'Snowball Shrimp (white Neocaridina)',
    url: `${BWA_BASE}/products/snowball-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'White/translucent colony, planted tanks.',
  },
  {
    name: 'Black Rose Shrimp (dark Neocaridina)',
    url: `${BWA_BASE}/products/black-rose-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'Dark colony display, contrast in planted tanks.',
  },
  {
    name: 'Golden Back Yellow Shrimp (Neocaridina)',
    url: `${BWA_BASE}/products/golden-back-yellow-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'Yellow colony display, planted tanks.',
  },
  {
    name: 'Wild-Type Neocaridina Shrimp (hardy mixed line)',
    url: `${BWA_BASE}/products/wild-type-neocaridina-shrimp-mixed-line`,
    type: 'shrimp',
    bestFor: 'Hardiest starter shrimp, beginners, low-tech setups.',
  },
  {
    name: 'Live Amano Shrimp',
    url: `${BWA_BASE}/products/amano-shrimp-canada`,
    type: 'shrimp',
    bestFor: 'Algae control in planted and community tanks.',
  },
  {
    name: 'Koi Plakat Betta — Male (individually pictured)',
    url: `${BWA_BASE}/products/pk-male-koi-individually-pictured`,
    type: 'betta',
    bestFor: 'Premium Canadian-bred betta breeding stock and display.',
  },
  {
    name: 'Veiltail Betta — Survivor Series (rescue, male)',
    url: `${BWA_BASE}/products/survivor-series-rescue-orange-veiltail-betta-male`,
    type: 'betta',
    bestFor: 'Locally-bred / rescue betta, beginner-friendly display fish.',
  },
]

// ─── Collections ─────────────────────────────────────────────────────────────
export const BWA_COLLECTIONS: BWALink[] = [
  { title: 'Live Fish Food (Scuds, Daphnia, Microworms & Cultures)', url: `${BWA_BASE}/collections/live-fish-food-canada` },
  { title: 'Aquarium Shrimp (Cherry, Bloody Mary, Snowball & Neocaridina)', url: `${BWA_BASE}/collections/aquarium-shrimp-canada` },
  { title: 'Betta Fish for Sale in Canada', url: `${BWA_BASE}/collections/betta-fish-canada` },
  { title: 'Best Selling Aquarium Products in Canada', url: `${BWA_BASE}/collections/best-selling-aquarium-products-canada` },
]

// ─── Store / brand pages ─────────────────────────────────────────────────────
export const BWA_PAGES: BWALink[] = [
  { title: 'About Blackwater Aquatics (Trust & Guarantee)', url: `${BWA_BASE}/pages/blackwater-aquatics-canada` },
  { title: 'Where Is Blackwater Aquatics Located', url: `${BWA_BASE}/pages/where-is-blackwater-aquatics-located` },
  { title: 'Contact', url: `${BWA_BASE}/pages/contact` },
  { title: 'Frequently Asked Questions', url: `${BWA_BASE}/pages/frequently-asked-questions` },
  { title: 'Customer Reviews', url: `${BWA_BASE}/pages/customer-reviews` },
  { title: 'First Order Discount', url: `${BWA_BASE}/pages/first-order-discount` },
  { title: 'Shipping Policy', url: `${BWA_BASE}/pages/pages-shipping-policy` },
  { title: 'Live Arrival / DOA Policy', url: `${BWA_BASE}/pages/live-arrival-doa-policy` },
  { title: 'Winter Shipping Policy', url: `${BWA_BASE}/pages/winter-shipping-policy` },
]

// ─── Knowledge base & guides (full sitemap) ──────────────────────────────────
export const BWA_KB: Record<string, BWALink[]> = {
  'Scuds — flagship live food (push these first)': [
    { title: 'Best Live Food for Betta: Why Scuds Beat Pellets', url: `${BWA_BASE}/blogs/knowledge-base/best-live-food-betta` },
    { title: 'What Are Scuds? Ultimate Guide to Freshwater Amphipods', url: `${BWA_BASE}/blogs/knowledge-base/what-are-scuds-in-aquariums` },
    { title: 'Are Scuds Good for Fish? (Benefits Explained)', url: `${BWA_BASE}/blogs/knowledge-base/are-scuds-good-for-fish` },
    { title: 'Why Scuds Are the Best Live Fish Food', url: `${BWA_BASE}/blogs/knowledge-base/live-fish-food-scuds-benefits` },
    { title: 'Scuds vs Frozen Food (Which Is Better?)', url: `${BWA_BASE}/blogs/knowledge-base/scuds-vs-frozen-food-for-fish` },
    { title: 'Scuds for Pea Puffers: The Perfect Live Food', url: `${BWA_BASE}/blogs/knowledge-base/scuds-for-pea-puffers` },
    { title: 'What Do Scuds Eat? (Diet Guide)', url: `${BWA_BASE}/blogs/knowledge-base/what-do-scuds-eat` },
    { title: 'Do Scuds Eat Aquarium Plants?', url: `${BWA_BASE}/blogs/knowledge-base/do-scuds-eat-aquarium-plants` },
    { title: 'Are Scuds Bad for Aquariums? (The Truth)', url: `${BWA_BASE}/blogs/knowledge-base/are-scuds-bad-for-aquariums-the-truth-about-freshwater-amphipods` },
    { title: 'Can Scuds Create a Self-Sustaining Aquarium?', url: `${BWA_BASE}/blogs/knowledge-base/self-sustaining-aquarium-scuds` },
    { title: 'How to Culture Live Scuds at Home', url: `${BWA_BASE}/blogs/knowledge-base/how-to-culture-live-scuds` },
    { title: 'Where to Buy Live Scuds in Canada (2026 Guide)', url: `${BWA_BASE}/blogs/knowledge-base/where-to-buy-live-scuds-in-canada-2026-guide` },
    { title: 'Scuds for Sale Near Me (Canada & Quebec Pickup)', url: `${BWA_BASE}/blogs/knowledge-base/buy-scuds-near-me` },
    { title: 'Live Scuds for Sale Canada (page)', url: `${BWA_BASE}/pages/live-scuds-for-sale-canada` },
  ],
  'Daphnia (push second)': [
    { title: 'Daphnia Culture Guide', url: `${BWA_BASE}/pages/daphnia-culture-guide` },
    { title: 'Daphnia for Fish', url: `${BWA_BASE}/pages/daphnia-for-fish` },
    { title: 'Scuds vs Daphnia: Which Is Better?', url: `${BWA_BASE}/pages/scuds-vs-daphnia` },
    { title: 'Daphnia vs Baby Brine Shrimp', url: `${BWA_BASE}/pages/daphnia-vs-baby-brine-shrimp` },
    { title: 'Why Are My Daphnia Dying? (Culture Crash Guide)', url: `${BWA_BASE}/pages/why-are-my-daphnia-dying-daphnia-culture-crash-guide` },
    { title: 'How to Culture Daphnia', url: `${BWA_BASE}/pages/how-to-culture-daphnia` },
  ],
  'Live food — general & fry': [
    { title: 'Best Live Food for Aquarium Fish', url: `${BWA_BASE}/pages/best-live-food-for-aquarium-fish` },
    { title: 'The Ultimate Guide to Live Fish Food Cultures', url: `${BWA_BASE}/blogs/knowledge-base/live-fish-food-cultures` },
    { title: 'Best First Food for Fry (Microworms vs Alternatives)', url: `${BWA_BASE}/blogs/knowledge-base/best-first-food-for-fish-fry-microworms-vs-alternatives` },
    { title: 'Microworms vs Baby Brine Shrimp for Fry', url: `${BWA_BASE}/blogs/knowledge-base/microworms-vs-baby-brine-shrimp-which-is-better-for-fry` },
    { title: 'What Are Microworms? (Beginner Guide)', url: `${BWA_BASE}/blogs/knowledge-base/what-are-microworms-complete-beginner-guide` },
    { title: 'How to Culture Microworms at Home', url: `${BWA_BASE}/blogs/knowledge-base/how-to-culture-microworms-at-home-step-by-step-beginner-guide` },
    { title: 'How Long Do Microworms Live in Water?', url: `${BWA_BASE}/blogs/knowledge-base/how-long-do-microworms-live-in-water-what-you-need-to-know` },
    { title: 'Where to Buy Microworms in Canada', url: `${BWA_BASE}/blogs/knowledge-base/where-to-buy-microworms-in-canada-local-and-online-options` },
    { title: 'How to Hatch Baby Brine Shrimp', url: `${BWA_BASE}/pages/how-to-hatch-baby-brine-shrimp` },
    { title: 'How to Culture Vinegar Eels', url: `${BWA_BASE}/pages/how-to-culture-vinegar-eels` },
  ],
  'Betta care & health': [
    { title: 'Betta Care Guide', url: `${BWA_BASE}/pages/betta-care-guide` },
    { title: 'What Do Betta Fish Eat?', url: `${BWA_BASE}/blogs/knowledge-base/what-do-betta-fish-eat` },
    { title: 'Best Betta Tank Setup', url: `${BWA_BASE}/blogs/knowledge-base/betta-tank-setup` },
    { title: 'Natural Betta Tank Setup', url: `${BWA_BASE}/pages/natural-betta-fish-tank-setup` },
    { title: 'Blackwater Betta Tank Setup', url: `${BWA_BASE}/pages/how-to-set-up-a-blackwater-betta-fish-tank` },
    { title: 'Betta Tank on a Budget', url: `${BWA_BASE}/pages/how-to-set-up-a-betta-tank-on-a-budget` },
    { title: 'Best Betta Tankmates', url: `${BWA_BASE}/pages/best-tank-mates-for-betta-fish` },
    { title: 'How to Introduce Betta to Tankmates', url: `${BWA_BASE}/pages/how-to-introduce-betta-fish-to-tank-mates` },
    { title: 'Sick Betta Symptoms & Treatment', url: `${BWA_BASE}/pages/sick-betta-fish-symptoms-treatment` },
    { title: 'Betta Not Eating? 12 Causes + Fixes', url: `${BWA_BASE}/blogs/knowledge-base/betta-not-eating` },
    { title: 'How to Improve Betta Color', url: `${BWA_BASE}/blogs/knowledge-base/improve-betta-fish-color` },
    { title: 'Betta Sinking?', url: `${BWA_BASE}/blogs/knowledge-base/betta-fish-sinking` },
    { title: 'Betta Floating Sideways (Swim Bladder)', url: `${BWA_BASE}/blogs/knowledge-base/betta-fish-floating-sideways` },
    { title: 'Betta Laying on Side', url: `${BWA_BASE}/blogs/knowledge-base/betta-fish-laying-on-side` },
    { title: 'Betta Laying on Bottom', url: `${BWA_BASE}/blogs/knowledge-base/betta-fish-laying-on-bottom` },
    { title: 'How to Tell If a Betta Is Dying', url: `${BWA_BASE}/blogs/knowledge-base/how-to-tell-if-a-betta-fish-is-dying` },
  ],
  'Betta breeding': [
    { title: 'How to Breed Betta Fish (KB)', url: `${BWA_BASE}/blogs/knowledge-base/how-to-breed-betta-fish` },
    { title: 'How to Breed Betta Fish at Home', url: `${BWA_BASE}/pages/how-to-breed-betta-fish-at-home` },
    { title: 'How to Breed Bettas (full)', url: `${BWA_BASE}/pages/how-to-breed-bettas` },
    { title: 'How to Set Up a Betta Breeding Tank', url: `${BWA_BASE}/pages/how-to-set-up-a-betta-breeding-tank` },
    { title: 'How to Raise Betta Fry', url: `${BWA_BASE}/pages/how-to-raise-betta-fry` },
    { title: 'How to Raise Betta Fry Outdoors', url: `${BWA_BASE}/pages/how-to-raise-betta-fry-outdoors-ponds-flower-pots` },
    { title: 'How to Choose the Perfect Betta Breeding Pair', url: `${BWA_BASE}/blogs/knowledge-base/how-to-choose-the-right-breeding-pair-of-betta-fish` },
    { title: 'Advanced Breeding Techniques', url: `${BWA_BASE}/pages/advanced-breeding-techniques` },
  ],
  'Water chemistry & tank setup': [
    { title: 'Understanding pH, GH & KH', url: `${BWA_BASE}/pages/understanding-ph-gh-and-kh` },
    { title: 'Fish Tank Water Change Guide', url: `${BWA_BASE}/pages/fish-tank-water-change-guide` },
    { title: 'How to Cycle a Tank (Nitrogen Cycle)', url: `${BWA_BASE}/pages/how-to-cycle-a-tank-understanding-the-nitrogen-cycle` },
    { title: 'Aquarium Beginner Setup Guide', url: `${BWA_BASE}/pages/how-to-set-up-aquarium-beginner-guide` },
    { title: 'How to Treat Ich Naturally', url: `${BWA_BASE}/pages/how-to-treat-ich-white-spot-disease-naturally` },
    { title: 'How to Use Indian Almond Leaves', url: `${BWA_BASE}/pages/how-to-use-indian-almond-leaves` },
  ],
  'Shrimp, snails & pests': [
    { title: 'How to Breed Neocaridina Shrimp', url: `${BWA_BASE}/pages/how-to-breed-neocaridina-shrimp` },
    { title: 'How to Breed Mystery Snails', url: `${BWA_BASE}/pages/how-to-breed-mystery-snails` },
    { title: 'Tiny White Worms in Fish Tank', url: `${BWA_BASE}/blogs/knowledge-base/tiny-white-worms-in-fish-tank` },
    { title: 'Planaria vs Detritus Worms', url: `${BWA_BASE}/blogs/knowledge-base/planaria-vs-detritus-worms-what-s-living-in-your-aquarium` },
  ],
}

// ─── SpawnOS internal links (suggest these too) ──────────────────────────────
export const SPAWNOS_LINKS = {
  speciesIndex: '/species',
  species: [
    'betta-fish', 'axolotl', 'cherry-shrimp', 'neocaridina-shrimp', 'discus-fish',
    'neon-tetra', 'corydoras', 'angelfish', 'goldfish', 'guppy', 'kuhli-loach',
    'bristlenose-pleco', 'pea-puffer', 'oscar-fish', 'clownfish', 'molly-fish',
    'platy-fish', 'zebra-danio', 'hillstream-loach', 'rope-fish',
  ].map((s) => `/species/${s}`),
  toolsIndex: '/tools',
  tools: [
    'tank-volume', 'gh-kh-converter', 'nitrogen-cycle', 'fish-compatibility',
    'heater-size', 'filter-size', 'water-change', 'stocking-density',
    'water-parameters', 'ph-buffer', 'temperature-converter', 'feeding-calculator',
    'salt-dosage', 'medication-calculator', 'lighting-calculator',
  ].map((t) => `/tools/${t}`),
  blueprints: '/blueprints',
}

// ─── Formatted context for AI system prompts ─────────────────────────────────
function renderProducts(): string {
  return BWA_PRODUCTS.map((p) => {
    const price = p.price ? ` (${p.price})` : ''
    const note = p.note ? ` — ${p.note}` : ''
    return `- ${p.name}${price}: ${p.url}\n  Best for: ${p.bestFor}${note}`
  }).join('\n')
}

function renderLinks(links: BWALink[]): string {
  return links.map((l) => `- ${l.title}: ${l.url}`).join('\n')
}

function renderKB(): string {
  return Object.entries(BWA_KB)
    .map(([section, links]) => `${section}:\n${renderLinks(links)}`)
    .join('\n\n')
}

export const BLACKWATER_AI_CONTEXT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLACKWATER AQUATICS — AUTHORITATIVE CATALOG & SITEMAP
(Verified live. Use ONLY these URLs. NEVER invent a product, page, or article link.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND
${BWA_BRAND.name} — ${BWA_BRAND.location}
${BWA_BRAND.shipping}
About: ${BWA_BRAND.about} · Located: ${BWA_BRAND.located} · Contact: ${BWA_BRAND.contact}
FAQ: ${BWA_BRAND.faq} · Reviews: ${BWA_BRAND.reviews} · First-order discount: ${BWA_BRAND.firstOrderDiscount}
Knowledge base index: ${BWA_BRAND.knowledgeBase}

PRODUCTS (live, in-stock; live foods are the priority recommendations)
${renderProducts()}

COLLECTIONS
${renderLinks(BWA_COLLECTIONS)}

STORE PAGES
${renderLinks(BWA_PAGES)}

KNOWLEDGE BASE & GUIDES (full sitemap)
${renderKB()}

SPAWNOS INTERNAL LINKS (suggest these to keep users in the platform)
Species guides: ${SPAWNOS_LINKS.speciesIndex} (20+ species incl. ${SPAWNOS_LINKS.species.slice(0, 8).join(', ')} …)
Calculators: ${SPAWNOS_LINKS.toolsIndex} (incl. ${SPAWNOS_LINKS.tools.slice(0, 6).join(', ')} …)
AI Tank Blueprint generator: ${SPAWNOS_LINKS.blueprints}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROACTIVE SUGGESTION DOCTRINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every answer should move the user forward: recommend the most relevant next step — a Blackwater product, a knowledge-base article, a SpawnOS species guide, or a SpawnOS calculator.
- LEAD WITH LIVE FOOD. Whenever feeding, conditioning, color, breeding, fry, picky eaters, or disease recovery come up, recommend LIVE SCUDS first and LIVE DAPHNIA second, with one specific reason why, then link the product.
  • Scuds: color, protein, hunting behavior, self-sustaining — best for bettas, pea puffers, cichlids, juveniles, breeders.
  • Daphnia: digestive reset, gets refusing/sick fish eating, ideal for fry/nano/water-column feeders.
- Match the article to the question (e.g. "betta not eating" → Betta Not Eating article + daphnia; "fry" → microworm + best-first-food article; "pea puffer" → scuds-for-pea-puffers + scud culture).
- Suggest the relevant SpawnOS calculator when a number is involved (dosing, stocking, volume, GH/KH, cycle).
- Max 2 Blackwater links per reply; prefer a specific product URL, fall back to a collection when the product is ambiguous.
- Recommendations must read like advice from someone who uses these products — never a sales pitch. Mention Canadian shipping only when location/shipping is relevant.
`.trim()

export default BLACKWATER_AI_CONTEXT
