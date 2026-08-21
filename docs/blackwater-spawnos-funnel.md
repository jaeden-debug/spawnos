# Blackwater Aquatics → SpawnOS funnel

**Status: prepared, NOT applied.** Shopify write execution is not enabled in the Zylx
workspace (`get_provider_action_readiness` → `enabled: false`, no readiness record), and
these are live storefront pages with real rankings. Nothing in this document has been
published. Apply from Shopify Admin, or grant write access and ask for it to be queued.

---

## Why these placements and not others

Ranked by measured Google Search Console data (blackwateraquatics.ca, 90 days to
2026‑08‑19). The two best SpawnOS acquisition surfaces in the entire ecosystem are already
Blackwater's, and both convert badly for their position — which is what makes them
opportunities rather than pages to leave alone.

| Page | Impressions | Position | CTR |
|---|---|---|---|
| `/pages/how-to-raise-betta-fry` | 20,269 | 7.3 | **0.89%** |
| `/blogs/knowledge-base/how-to-choose-the-right-breeding-pair-of-betta-fish` | 15,597 | 7.4 | **0.59%** |
| `/blogs/knowledge-base/how-to-breed-betta-fish` | 3,961 | 16.6 | 0.43% |
| `/pages/how-to-breed-betta-fish-at-home` | 1,476 | 15.5 | 0.75% |
| `/pages/how-to-culture-microworms` | 1,758 | 11.9 | 0.51% |
| `/pages/spawnos` | 264 | 7.4 | 10.98% |

Relevant queries Blackwater already ranks for: `betta fry care guide` (pos 6.5),
`betta genetics calculator` (pos 7.4), `how to breed betta fish` (pos 15.5),
`betta fry food` (pos 10.4).

**Do not touch the ranking body content of any of these pages.** Every change below is
additive — a module appended to an existing section — except the `/pages/spawnos` retitle,
which is discussed separately.

---

## The reusable module

Paste into the Shopify page/article body editor in **HTML mode**. It uses inline styles
only, so it renders identically regardless of theme section, and carries no dependency on
theme CSS that a theme update could break.

`?utm_source=blackwater` on every link is what makes the funnel measurable —
`trackBlackwaterReferral()` in `src/lib/analytics.ts` also catches untagged referrals, but
the UTM survives referrer stripping.

```html
<!-- SPAWNOS MODULE — contextual, edit the headline + paragraph per page -->
<div style="border:1px solid rgba(0,212,255,.35);background:rgba(0,212,255,.05);
            border-radius:12px;padding:20px;margin:28px 0;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.14em;
            text-transform:uppercase;color:#00a6c7;">Track this spawn</p>
  <h3 style="margin:0 0 8px;font-size:19px;line-height:1.3;">HEADLINE GOES HERE</h3>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">BODY GOES HERE</p>
  <a href="https://spawnos.ca/app?utm_source=blackwater&utm_medium=content&utm_campaign=PLACEMENT_SLUG"
     style="display:inline-block;padding:11px 22px;border-radius:9px;background:#00d4ff;
            color:#04141a;font-weight:700;font-size:14px;text-decoration:none;">
    See how SpawnOS works
  </a>
  <p style="margin:12px 0 0;font-size:13px;opacity:.7;">
    Free for your first breeding project. Built by Blackwater Aquatics.
  </p>
</div>
```

---

## Placement 1 — `/pages/how-to-raise-betta-fry` (highest value)

Append after the first-foods / feeding-schedule section.
`utm_campaign=raise-betta-fry`

- **Headline:** Every milestone on this page, on a timeline that knows the dates.
- **Body:** You are about to spend six weeks tracking free‑swimming, first feeding, the
  move to baby brine, water changes and jarring. SpawnOS holds that schedule for you —
  record the spawn date and it tells you what should be happening in the tank today, and
  what to watch for at each stage. Betta splendens is one of its verified timelines.

## Placement 2 — `/blogs/knowledge-base/how-to-choose-the-right-breeding-pair-of-betta-fish`

Append at the end of the article.
`utm_campaign=choose-breeding-pair`

- **Headline:** Chosen your pair? Put them in SpawnOS before you spawn them.
- **Body:** SpawnOS registers both fish with their traits, tells you what tends to show up
  in the fry from what you can actually see on the parents, and warns you if the two are
  related. Then it tracks the spawn from the day it happens.
- **Caveat that must stay in the copy:** predictions read *visible traits*, not genotypes.
  Do not let this module imply a genetics calculator.

## Placement 3 — `/blogs/knowledge-base/how-to-breed-betta-fish`

`utm_campaign=how-to-breed-betta`

- **Headline:** The part this guide can't do for you: remembering the dates.
- **Body:** Conditioning, introduction, the wrap, egg collection, hatch, free‑swimming,
  pulling the male. SpawnOS turns one recorded spawn date into that whole sequence with
  expected windows, and adapts as you confirm what actually happened.

## Placement 4 — `/pages/how-to-breed-betta-fish-at-home`

Same copy as Placement 3. `utm_campaign=breed-betta-at-home`

## Placement 5 — live‑food products (fry-food intent)

`/products/microworm-culture-canada`, `/products/live-grindal-worm-culture`,
`/products/products-live-daphnia-culture`, `/products/scud-culture`.
`utm_campaign=live-food-<handle>`

- **Headline:** Raising fry? SpawnOS tells you when first foods are due.
- **Body:** First feeding lands a few days after free‑swimming, and missing it costs you
  the spawn. Record the spawn date in SpawnOS and it flags the first‑food window before
  you get there — including a reminder to have cultures running ahead of time.

**Note:** `/products/live-grindal-worm-culture` already contains SpawnOS copy describing it
as *"developing SpawnOS, a breeder-focused platform"*. That is now out of date — the app
exists and is in TestFlight. Replace that paragraph rather than adding a second module.

## Placement 6 — homepage + footer

One module in a content section, plus a footer link `SpawnOS → https://spawnos.ca`.
Do not put the module in the header; Blackwater's job on the SERP is commerce.

---

## `/pages/spawnos` — the cannibalization decision

Current title: **"SpawnOS Fish Breeding Software | Betta Breeding Tracker by Blackwater Aquatics"**

This page ranks position 7.4 at 10.98% CTR and currently owns the `SpawnOS` brand query,
while **spawnos.ca is not verified in Search Console at all** — so spawnos.ca's brand
performance is invisible and the migration from spawnos.app is unmeasured.

**Recommendation: retitle, do not redirect and do not delete.** It ranks and it converts;
301'ing it would throw away a working asset to tidy the architecture, which the brief
explicitly warns against.

- **New title:** `SpawnOS — The Breeding App Built by Blackwater Aquatics`
- **New meta description:** `SpawnOS is the breeding-records app from Blackwater Aquatics
  Canada — track pairs, spawn dates, fry milestones and lineage. First project free.`
- **Body change:** open with one line establishing spawnos.ca as the product home and link
  to it above the fold. Keep everything else.

Rationale for dropping "Fish Breeding Software" from the title: measured US volume for
`fish breeding software` is **no data** and `fish breeding app` is **10/mo**. The phrase
wins nothing, and having both domains target it splits the brand query for zero upside.

**Prerequisite before any of this ships:** verify `spawnos.ca` in Google Search Console and
submit `https://spawnos.ca/sitemap.xml`. Without it there is no way to tell whether these
placements moved anything.

---

## SpawnOS → Blackwater (the return path)

Already in place and left alone: species pages render a "Live Foods from Blackwater
Aquatics" section driven by the `recommend_daphnia` / `recommend_scuds` /
`recommend_microworms` / `recommend_bbs` flags on the species record, plus four product
links on the homepage.

The one addition worth making, and the reason it is *not* automatic: when the app's fry
timeline reaches the first‑food window it would be genuinely useful to link a live‑food
culture. That link must be a husbandry recommendation that happens to be purchasable, not a
placement — if SpawnOS ever recommends a food because it is sold rather than because it is
correct for the species, the assistant stops being worth trusting. Implement it as a static
link on the first‑feeding stage, never as something the AI generates.
