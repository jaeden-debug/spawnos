# Growth Phase 1 — decisions and verified corrections

Date: 2026-09-03 · Full plan: https://claude.ai/code/artifact/b0ab7c28-f0e7-4049-a917-0a0a4f88de52

Research was 42 agents, each adversarially verified. Several headline findings were
**overturned** by verification. This file records the corrected versions, so nobody
re-derives the refuted ones from the original research.

## P0 — Pro is Option C (Hybrid), sequenced

Capacity caps + assistant tiering behind one Pro, sold via StoreKit. But:

- **Do NOT enforce any capacity cap in the first IAP release.** At 0 ratings a punitive
  cap converts into 1-star reviews, and there is no evidence yet about which gate
  matters. Ship StoreKit + paywall first; flip `capacityLimitsEnforced` in the release
  after cap-hit data exists.
- Capacity Pro is ~90% built already: `PlanLimitSheet.swift` exists and is App
  Review-compliant, and `canStartAnotherPair()` is wired at `BreedingView.swift:14`
  and `AnimalDetailView.swift:147`. Only `Entitlements.capacityLimitsEnforced = false`
  gates it.

### Cost model — measured from source, not assumed

Read from `src/app/api/spawnos/assistant/route.ts` (the research assumed a 3,000-token
bundle and never read the caps):

| Load | Input tokens | $/question | Pro break-even |
|---|---|---|---|
| Typical | ~2,270 | $0.0097 | ~669/mo (22/day) |
| Worst case (caps maxed) | ~16,720 | $0.0508 | **~128/mo (4.3/day)** |

Caps: context `.slice(0,14000)` chars, history `.slice(-12)` × `.slice(0,4000)` chars,
system prompt 3,107 chars, schema 1,776 chars, `max_tokens: 900`.
Model is `OPENAI_CHAT_MODEL || 'gpt-4o'` — the **floating alias**, so $2.50/$10.00 per
1M applies (not the dated snapshot at $5/$15). Images use `detail:'low'` (85 tokens flat).

Fixes: fair-use ceiling ~100/day in `meterUsage`; context 14k→6k; history 12→6 turns;
prompt caching on the stable system prompt; A/B species-profile on gpt-4o-mini.

## Corrections — do NOT act on the original research

1. **"No comparable monetises an AI assistant" — FALSE.** AquaCare: AI Aquarium
   Assistant (4.3★/115 ratings, $39.99/yr) and AquariumFriendAI both gate AI. Option A
   is not category-contradicting; it fails on 3.1.3(f) and unbounded COGS instead.
2. **"Free tier is the larger COGS exposure" — FALSE.** Free is bounded at 10/day;
   Pro is unbounded. Do NOT cut free to 5/day — it moves heavy users into the uncapped tier.
3. **App Store false-cap claim: the field attribution was INVERTED.** The ALL-CAPS line
   is in the *description* (locked), not promo text. Promo text (152 chars, editable
   today) is a *third*, separately-worded occurrence.
4. **`/tools` vs `/tools-database` is NOT duplicate content.** 8-gram shingle overlap
   0.4628 for the "duplicate" pair vs 0.4601 for an unrelated control and 0.6518 for two
   unrelated same-section pages. Calculator + long-form guide. **Consolidating would
   delete ~130,000 words on a false premise.**
5. **Lifestyle→Productivity has no evidence behind it.** Age-controlled p = 0.404.
   Cheap and reversible, but not a traction lever.
6. **"No aquarium breeding app exists" — FALSE.** ShrimpKeepers (2 ratings), ShrimpNote
   (0), Medaka Log (0, ships COI + pedigree PDF). Correct version: none has traction,
   all launched within nine months, and entrants are clustering in **shrimp**.
7. **"fish breeding tracker" is NOT contaminated** — that SERP is aquarium-hobby. Viable.
8. **Betta timing contradiction is intra-page**, in one FAQ answer on
   `/lab-notes/betta-breeding-timeline` that re-bases days 3–5 to post-hatch.
9. **Club outreach premise "they already link to external tools" — FALSE** for GSAS
   (first-party PHP forms) and partly for PVAS (Delta Tale dead 16 years) and HDAS
   (cited URL 404s). Targets are real; pitch the BAP workflow fit instead.
10. **faas.info now 301-redirects to an offshore gambling domain.** Never link it.

## Confirmed blockers

- **101 of 103 `/species/` pages render raw YAML frontmatter as a visible `<h2>`.**
  Verified live on guppy, neon-tetra, corydoras (betta-fish is clean). One parser fix.
- **The false project-cap claim appears in 7 places in this repo:**
  `src/app/page.tsx:135`, `:333`, `src/app/app/page.tsx:25`,
  `src/app/signup/layout.tsx:10`, `src/app/breeders/[username]/page.tsx:267`,
  `src/content/lab-notes/what-is-spawnos.mdx:19` (self-contradicting in one paragraph),
  `src/components/tools/CompatibilityChecker.tsx:942`.
  `llms.txt` and the JSON-LD Offer are already correct.
- **`track()` fires at 6 sites with no provider loaded** — all web events are no-ops.
  Fix server-side from Supabase, not with an SDK.

## Validated App Store strings

- Promo text (169/170, ship today, deliberately silent on price):
  `Log one spawn date. SpawnOS builds the species-aware timeline - hatch, free-swimming, first food, when to jar - and tells you what should be happening in the tank today.`
- Subtitle (28/30): `Breeding logs & fry timeline`
- Keywords (97/100): `betta,guppy,aquarium,fish,breeder,hatch,lineage,pedigree,tracker,shrimp,eggs,pair,genetics,strain`

## MEASURED AI economics (2026-09-03)

Measured with tiktoken `o200k_base` against the live prompts, not estimated.
Fixed overhead per request: system 623 tok + response schema 411 tok + wrapper 25 tok
= **1,059 tokens** before any user data.

| Scenario | in tok | out | $/req now | $/req optimized |
|---|---|---|---|---|
| minimal — general question, no records | 1,078 | 300 | $0.0057 | $0.0057 |
| typical — mid-spawn, short thread | 3,197 | 550 | $0.0135 | **$0.0102** (−25%) |
| heavy — rich fishroom, long thread | 6,203 | 550 | $0.0210 | $0.0138 (−34%) |
| CEILING — server caps saturated | 10,821 | 900 | **$0.0361** | $0.0199 (−45%) |

**Corrections to figures previously carried:**
- Worst case is **$0.0361**, not the $0.0508 I estimated with a chars/4 approximation.
- The species route makes **one** model call, not two (~$0.0331). It is also cached
  globally (`spawnos_species_profiles` has no `user_id`), so it is a once-per-species
  cost across all users — a few dollars lifetime. Routing it to gpt-4o-mini would save
  a rounding error for a real quality risk. **Do not.**

Break-even at $7/mo (~$6.30 net, Stripe CA incl. cross-border + FX):
**620 questions/month (~20.7/day)** optimized-typical; 317/mo (10.6/day) optimized-worst.

Monthly exposure per user, optimized: 30 q/mo = $0.31 · 100 q/mo = $1.02 ·
free cap 10/day = $3.05 · a paid account at 100/day = $30.50.

**Verdict: "unlimited Ask SpawnOS, fair use" IS financially defensible** at $7/mo,
because breaking even needs >20 questions/day sustained every day. It was *not*
defensible as literally uncapped, and it was never measurable.

### Shipped 2026-09-03
- Token accounting: `chatCompletion` was discarding `data.usage`; `spawnos_ai_usage`
  now records input/output/cached tokens, tier, route and server-computed USD.
- Paid tiers metered at **150/day** fair-use (abuse ceiling, ~7x above break-even).
  Free stays at 10/day — tightening it pushes heavy users into the uncapped tier.
- Context serialized compact instead of `indent: 1` — a third of the context budget
  was whitespace (1,198 tok pretty vs 795 compact on a representative bundle).
- No prompt, model, temperature or `max_tokens` changed. Quality untouched.

### Still to decide (needs the data now being collected)
History summarization beyond 4 turns and retrieval-instead-of-injection for the
context block. Both change behaviour, so they wait for real P50/P90/P99 — which
**cannot be computed today**: total real usage is 3 questions, 1 user, one day
(2026-08-22). Any percentile quoted before instrumentation accrues would be invented.

## Measurement status (2026-09-03, Zylx reconnected)

- **GSC connected and healthy** — but the two resources are
  `sc-domain:blackwateraquatics.ca` and `sc-domain:spawnos.app`.
  **There is no `spawnos.ca` resource.** Canonical-domain search data is not being
  collected at all. GSC data only accrues from property creation, so every day of
  delay is permanently lost. Create/connect `sc-domain:spawnos.ca` now.
- **Semrush: `API UNITS BALANCE IS ZERO`** — keyword volume still unavailable.
  Do not quote or invent search volume.
- **GA4 property 535548495: `permission_denied`** — authenticated but not authorized.
  Reconnecting will not fix it; the property must grant the connected account access.
- Google Ads (580-849-7735) and Shopify are healthy.

## Constraints

No search-volume figure in the plan is measured — Semrush is out of API units and
GA4 is unauthorized. GSC is live but points at the wrong domain (see above).
Blackwater CTR experiment hold runs to **2026-09-16** and blocks the breeding-pair link.
Nothing has been published, shipped, submitted or spent.
