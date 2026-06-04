# SpawnOS — Species Intelligence Audit & Expansion Blueprint

**Date:** 2026-06-04
**Scope:** Full audit of the existing species system, gap analysis, and a prioritized 30-species expansion queue.
**Method:** Direct inspection of the live codebase — not assumptions. Files audited: `src/data/species.ts`, `src/types/species.ts`, `src/lib/species-db.ts`, `src/lib/content.ts`, `src/content/species/*.mdx`, `src/app/species/**`, `supabase/schema.sql`, `src/app/sitemap.ts`.

---

## PHASE 1 — DATABASE AUDIT

### How the system is actually wired

SpawnOS species run on a **dual-layer architecture**:

1. **Structured data layer** — `src/data/species.ts` holds 20 typed `SpeciesData` records (parameters, care profile, FAQ, related slugs, SEO). This is the source of truth for metadata, the species hub grid, search, and the sitemap.
2. **Long-form content layer** — `src/content/species/*.mdx` holds the article body for each species, rendered through `next-mdx-remote` in `src/app/species/[slug]/page.tsx`.
3. **CMS fallback** — `src/lib/species-db.ts` reads from Supabase when configured, and falls back to the static layer when it is not. `supabase/schema.sql` defines the production `species` table, a `species_category` enum, `species_categories` seed rows, FTS `search_vector`, and a recommendation/funnel column set.

**Critical wiring fact for expansion:** a new species only becomes "real" when it exists in **both** `src/data/species.ts` (drives sitemap + search + hub) **and** `src/content/species/<slug>.mdx` (drives the page body). Adding only an MDX file produces an orphan page with no metadata, no sitemap entry, and no search visibility.

### Inventory — 20 species exist

| # | Slug | Scientific name | Category (intended) | Body words |
|---|------|-----------------|---------------------|-----------:|
| 1 | betta-fish | *Betta splendens* | Freshwater | 5,411 |
| 2 | axolotl | *Ambystoma mexicanum* | Amphibian | 4,732 |
| 3 | cherry-shrimp | *Neocaridina davidi* | Shrimp | 3,264 |
| 4 | angelfish | *Pterophyllum scalare* | Freshwater | 2,534 |
| 5 | kuhli-loach | *Pangio kuhlii* | Freshwater | 2,068 |
| 6 | bristlenose-pleco | *Ancistrus* sp. | Freshwater | 2,008 |
| 7 | discus-fish | *Symphysodon* | Freshwater | 1,860 |
| 8 | rope-fish | *Erpetoichthys calabaricus* | Freshwater | 1,810 |
| 9 | clownfish | *Amphiprion ocellaris* | Saltwater | 1,767 |
| 10 | neon-tetra | *Paracheirodon innesi* | Freshwater | 1,741 |
| 11 | guppy | *Poecilia reticulata* | Freshwater | 1,723 |
| 12 | corydoras | *Corydoras* sp. | Freshwater | 1,684 |
| 13 | goldfish | *Carassius auratus* | Freshwater | 1,681 |
| 14 | pea-puffer | *Carinotetraodon travancoricus* | Freshwater | 1,676 |
| 15 | hillstream-loach | *Sewellia lineolata* | Freshwater | 1,662 |
| 16 | oscar-fish | *Astronotus ocellatus* | Freshwater | 1,536 |
| 17 | zebra-danio | *Danio rerio* | Freshwater | 1,546 |
| 18 | molly-fish | *Poecilia sphenops* | Freshwater | 1,487 |
| 19 | neocaridina-shrimp | *Neocaridina davidi* | Shrimp | 1,293 |
| 20 | platy-fish | *Xiphophorus maculatus* | Freshwater | 1,253 |

### Categorization of existing content

| Category | Count | Species |
|----------|------:|---------|
| **Freshwater Fish** | 16 | betta, guppy, neon-tetra, corydoras, angelfish, goldfish, bristlenose-pleco, kuhli-loach, discus, pea-puffer, oscar, molly, platy, zebra-danio, hillstream-loach, rope-fish |
| **Saltwater Fish** | 1 | clownfish |
| **Shrimp** | 2 | cherry-shrimp, neocaridina-shrimp |
| **Amphibians** | 1 | axolotl |
| **Snails** | 0 | — |
| **Crustaceans** (non-shrimp) | 0 | — |
| **Live Foods** | 0 | — |
| **Microfauna** | 0 | — |
| **Invertebrates** (other) | 0 | — |
| **Aquarium Plants** | 0 | — |
| **Other Aquatic Life** | 0 | — |

### Completeness assessment

**Against the existing template:** all 20 pages render and carry full structured metadata (parameters, care, FAQ, related slugs). In that sense the catalog is "live and complete."

**Against the new 6,000–8,000-word standard:** **zero of the 20 pages currently meet the bar.** The longest (betta) is 5,411 words; only betta and axolotl exceed 4,000. Sixteen of twenty sit under 2,600 words. The new standard therefore applies to both new *and* existing pages if it is to be enforced consistently.

### Defects & inconsistencies found

1. **Two template generations.** Seven pages (angelfish, axolotl, betta-fish, corydoras, goldfish, guppy, neon-tetra) have **no MDX frontmatter** and open with `## Species Overview`. The other thirteen carry full frontmatter and use different heading conventions (e.g. "Natural History and Origin"). Section structure is not uniform across the catalog.

2. **Near-duplicate species.** `cherry-shrimp` and `neocaridina-shrimp` are both *Neocaridina davidi*. This is exactly the redundancy the expansion brief warns against and should be consolidated (cherry as the canonical page, neocaridina as a redirect or color-morph hub).

3. **Category collapse in the static fallback.** `staticToCMS()` in `species-db.ts` only ever assigns `saltwater`, `shrimp`, or `freshwater`. Axolotl (tagged `amphibian`) falls through to **freshwater** on the live static site — the amphibian category is defined but never populated without Supabase.

4. **Dormant Blackwater funnel.** The schema and `CMSSpecies` type carry `recommend_daphnia`, `recommend_scuds`, `recommend_microworms`, `recommend_bbs`, and `blackwater_note`. In the static fallback these are hardcoded `false`/`null`, so the live site surfaces **no** live-food or Blackwater recommendations today.

5. **Missing category enums.** `species_category` supports `freshwater, saltwater, shrimp, amphibian, turtle, invertebrate, live_food`. There is **no** `snail`, `plant`, `microfauna`, or `crustacean` value, and `SpeciesData` (the static type) has **no category field at all**. The expansion's strategic categories are not yet representable in the type system.

6. **Thin internal-link targets.** Only `src/content/species/` exists under content. There are no `knowledge/` (Lab Notes) or `blueprints/` article files, so "Related Articles / Recommended Reading / Blueprints" links have few real destinations.

7. **Hub tabs lag the schema.** The hub page `CATEGORY_STATS` lists only freshwater / saltwater / shrimp / amphibian — no Live Food, Invertebrate, or Plant tabs.

8. **Two divergent schema files.** `supabase/schema.sql` (1,044 lines, full seed) and `src/supabase/schema.sql` (377 lines, older) coexist. The plug-and-play path should point to one canonical file.

---

## PHASE 2 — GAP ANALYSIS

### Where the catalog is weakest (highest strategic value)

The catalog is **17/20 freshwater-fish-heavy** and has **complete absence** of the four categories that carry the most untapped search demand and map directly to Blackwater Aquatics commercial intent:

- **Live Foods — 0 pages.** Highest funnel value. Daphnia, scuds, microworms, BBS are the products Blackwater sells; SpawnOS owns none of the informational intent yet.
- **Microfauna / problem organisms — 0 pages.** Massive, poorly-served informational traffic (planaria, hydra, detritus worms, green water). Strong topical-authority play.
- **Snails — 0 pages.** High hobby popularity and dense compatibility-link opportunity (every community-fish page should link to nerite/mystery snails).
- **Plants / nuisance algae — 0 pages.** Evergreen informational traffic (BBA, BGA, duckweed) with natural cross-links into water-chemistry calculators.

### Prioritized 30-species expansion queue (no duplicates of existing)

Ranked by: search demand × hobby popularity × educational value × compatibility links × calculator hooks × Blackwater funnel fit.

**Tier 1 — Live Foods (13) — Blackwater funnel core**

1. Daphnia — *Daphnia magna*
2. Scuds — *Hyalella azteca / Gammarus*
3. Moina — *Moina macrocopa*
4. Baby Brine Shrimp — *Artemia* (nauplii)
5. Microworms — *Panagrellus redivivus*
6. Vinegar Eels — *Turbatrix aceti*
7. Grindal Worms — *Enchytraeus buchholzi*
8. White Worms — *Enchytraeus albidus*
9. Banana Worms — *Panagrellus nepenthicola*
10. Walter Worms — *Panagrellus* sp.
11. Blackworms — *Lumbriculus variegatus*
12. Copepods — *Cyclops / Tigriopus*
13. Seed Shrimp (Ostracods) — *Cypridopsis*

**Tier 2 — Microfauna & nuisance organisms (7) — topical authority**

14. Detritus Worms — *Naididae*
15. Planaria — *Dugesia* (problem)
16. Hydra — *Hydra* sp. (problem)
17. Rotifers — *Brachionus*
18. Infusoria / Paramecium — *Paramecium*
19. Vorticella — *Vorticella* (problem)
20. Green Water — *Chlorella* / phytoplankton

**Tier 3 — Snails (6) — compatibility-link density**

21. Mystery Snail — *Pomacea bridgesii*
22. Nerite Snail — *Neritina*
23. Ramshorn Snail — *Planorbella*
24. Bladder / Pest Snail — *Physella acuta* (problem)
25. Malaysian Trumpet Snail — *Melanoides tuberculata*
26. Assassin Snail — *Clea helena*

**Tier 4 — Plants & algae (4) — evergreen informational**

27. Java Moss — *Taxiphyllum barbieri*
28. Duckweed — *Lemna minor* (problem/utility)
29. Black Beard Algae — *Audouinella* (problem)
30. Blue-Green Algae (Cyanobacteria) — *Cyanobacteria* (problem)

Every entry above is **new** (none collide with the existing 20). Each maps to at least one calculator (water-parameters, feeding, stocking, ph-buffer) and at least one Blackwater funnel hook.

---

## PHASE 3 — EXECUTION PLAN (pending scope confirmation)

Building 30 pages at 6,000–8,000 words is ~180k–240k words of accurate biological content plus 30 structured-data records, schema changes, and search/sitemap wiring. That is a multi-pass content effort, not a single sitting — and doing it badly would damage the topical-authority goal more than doing less, well.

**Infrastructure work (do once, unlocks everything):**

- Extend `species_category` enum + `species_categories` seed with `snail`, `plant`, `microfauna` (and treat `crustacean` under `invertebrate`/`live_food`).
- Add a `category` field to the `SpeciesData` type and fix `staticToCMS()` so amphibian/live-food/invert/snail/plant map correctly.
- Activate the Blackwater funnel: populate `recommend_*` flags + `blackwater_note` per species and surface them in the species template.
- Add Live Food / Microfauna / Snail / Plant tabs to the hub `CATEGORY_STATS`.
- Consolidate the `cherry-shrimp` / `neocaridina-shrimp` duplicate.

**Content work:** build pages in tier order (Live Foods first — they carry the funnel), each following the existing MDX template + a structured `SpeciesData` record, wired into search and sitemap.

> **Decision needed before building** — see the question in chat. The fork is *breadth* (all 30 data records + tabs live now, pages filled in waves) vs *depth* (a small number of complete 6–8k-word pages fully shipped first). This materially changes the first deliverable.
