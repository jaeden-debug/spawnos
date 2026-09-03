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

## Constraints

No search-volume figure in the plan is measured — GSC and Keyword Planner need re-auth.
Blackwater CTR experiment hold runs to **2026-09-16** and blocks the breeding-pair link.
Nothing has been published, shipped, submitted or spent.
