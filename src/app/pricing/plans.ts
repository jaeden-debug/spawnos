/**
 * Pricing data, shared by the server-rendered page and the interactive plan
 * island. Kept out of the client component so the comparison table and FAQ can
 * be rendered on the server.
 *
 * Prices MUST match the live Stripe prices resolved by lookup key in
 * /api/stripe/checkout (spawnos_pro_monthly = $7, spawnos_pro_annual = $79).
 * If you change one, change the other in the same commit.
 */
//
// SpawnOS sells two plans. The Breeder tier was retired from public pricing:
// the capabilities that justified it (public breeder profile, API access, PDF
// lineage export) either lived on the web dashboard nobody used or were never
// built. Existing Breeder subscribers keep everything Pro grants — see
// `tierAtLeast` in src/lib/subscription.ts — and /api/stripe/checkout still
// accepts the plan so those subscriptions renew untouched.
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Your first breeding project — start to finish.',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Get the App',
    ctaHref: '/app',
    ctaStyle: 'border',
    featured: false,
    features: [
      { text: 'One active breeding project', included: true },
      { text: 'Register your animals — photos, traits, notes', included: true },
      { text: 'Species-aware spawn timeline & milestone windows', included: true },
      { text: 'Preparation checklists and reminders', included: true },
      { text: 'Lineage and relatedness warnings', included: true },
      { text: 'Ask SpawnOS — 10 questions/day', included: true },
      { text: 'Full species library & all 15 calculators', included: true },
      { text: 'Several breeding projects at once', included: false },
      { text: 'Higher daily Ask SpawnOS allowance', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For breeders running more than one line.',
    monthlyPrice: 7,
    annualPrice: 79,
    cta: 'Start Pro — Free 14 days',
    ctaHref: '/signup?plan=pro',
    ctaStyle: 'cyan',
    featured: true,
    badge: 'For active breeders',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited active breeding projects', included: true },
      { text: 'Run multiple spawns side by side', included: true },
      { text: 'Full breeding history across every project', included: true },
      { text: 'Higher daily Ask SpawnOS allowance', included: true },
      { text: 'Deeper lineage across your whole collection', included: true },
      { text: 'Records sync and restore on every device', included: true },
      { text: '14-day free trial, cancel anytime', included: true },
    ],
  },
]

export const FAQ = [
  {
    q: 'Is SpawnOS free?',
    a: "The app is free to download and your first breeding project is free — register your animals, create a pair, record the spawn, and follow the whole timeline through to grow-out without paying. The species library and all 15 calculators on this site are free with no account at all.",
  },
  {
    q: 'What actually triggers the upgrade?',
    a: "One thing: running a second breeding project at the same time. Free covers one active pair. When you want to run another line alongside it, that's Pro. Retiring a finished project frees the slot again, and a retired project keeps all of its records.",
  },
  {
    q: 'Does my subscription work in the iPhone app?',
    a: "Yes. SpawnOS has one account and one subscription. Your plan lives on your SpawnOS account, so subscribing here unlocks Pro in the app automatically the next time it syncs — sign in with the same email. There is no separate app subscription to buy.",
  },
  {
    q: 'What happens to my data if I cancel or downgrade?',
    a: "Nothing is deleted and nothing is locked. Every animal, pair, spawn, milestone, photo and lineage link you recorded stays readable on any plan. Downgrading only limits how many projects you can run at once going forward.",
  },
  {
    q: 'What happens after the 14-day Pro trial?',
    a: "You'll be prompted to add a payment method. If you don't, your account returns to Free. Your data stays intact.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, from your account settings. No cancellation fees. Annual subscribers receive a prorated refund within 30 days of purchase.',
  },
  {
    q: 'Is my breeding data private?',
    a: 'Yes. Your animals, pairs, spawns and notes are private to your account on every plan, protected by row-level security. SpawnOS does not publish your records.',
  },
  {
    q: 'What happened to the Breeder plan?',
    a: "We retired it. It promised capabilities we hadn't actually built, which isn't a fair thing to charge for. Existing Breeder subscribers keep full Pro access and their billing is unchanged. If we build genuine fish-room and multi-line tooling later, we'll introduce a plan for it then.",
  },
  {
    q: 'Which species does SpawnOS support?',
    a: "Any species can be registered. Betta splendens and guppies have SpawnOS-verified breeding timelines with milestone windows. Other species — mollies, platies, Neocaridina, corydoras, angelfish, clownfish and more — register and track, and SpawnOS researches a species profile on request. Where confidence is lower, the app says so instead of guessing at biology.",
  },
]

export const COMPARISON_FEATURES = [
  { label: 'iPhone app', free: 'Included', pro: 'Included' },
  { label: 'Active breeding projects', free: '1', pro: 'Unlimited' },
  { label: 'Registered animals', free: 'Unlimited', pro: 'Unlimited' },
  { label: 'Spawn timeline & milestone windows', free: '✓', pro: '✓' },
  { label: 'Preparation checklists & reminders', free: '✓', pro: '✓' },
  { label: 'Trait predictions from parent traits', free: '✓', pro: '✓' },
  { label: 'Lineage & relatedness warnings', free: '✓', pro: '✓' },
  { label: 'Photos & multi-device restore', free: '✓', pro: '✓' },
  { label: 'Ask SpawnOS', free: '10 / day', pro: 'Higher allowance' },
  { label: 'Species library', free: 'Full access', pro: 'Full access' },
  { label: 'Calculators', free: 'All 15', pro: 'All 15' },
  { label: 'Access to your past records', free: 'Always', pro: 'Always' },
  { label: 'Support', free: 'Community', pro: 'Email' },
]

export type Plan = (typeof PLANS)[number]
export type FaqItem = (typeof FAQ)[number]
export type ComparisonRow = (typeof COMPARISON_FEATURES)[number]
