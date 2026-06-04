# SpawnOS — Species Deep-Content Queue

**Goal:** Every species page carries a 2,500–4,000+ word original, SEO-optimized authority article (MDX body), on top of the auto-rendered parameter table, FAQ, funnel, calculators, and related-species sections.

**Standard per page (MDX body sections):** Species Overview · Natural History & Origin · Water Parameters (table) · Tank Setup Guide · Feeding Guide · Behavior & Temperament · Compatibility · Breeding Guide · Health & Disease · Interesting Facts · Bringing It Together — with rich **internal links** to related species and `/tools/*` calculators throughout.

**Status legend:** ✅ done (3k+) · 🟡 short (needs expansion) · ⬜ none (thin fallback)

---

## Progress

- **Total species:** 103
- **Deep content done:** 63 — original 3 + 5 amphibians + 10 saltwater flagships + 10 freshwater centerpieces + 10 schoolers + 7 freshwater specialists + 6 snails + 9 live foods + 3 microfauna
- **Remaining:** 40 (19 with no MDX, 21 short)

---

## Batch 1 — Amphibians ✅ COMPLETE
african-clawed-frog ✅ · african-dwarf-frog ✅ · fire-bellied-toad ✅ · fire-belly-newt ✅ · spanish-ribbed-newt ✅

## Batch 2 — Saltwater flagships ✅ COMPLETE (10/10)
percula-clownfish ✅ · royal-gramma ✅ · yellow-tang ✅ · blue-tang ✅ · mandarin-dragonet ✅ · tomato-clownfish ✅ · maroon-clownfish ✅ · firefish-goby ✅ · neon-goby ✅ · yellow-watchman-goby ✅

## Batch 3 — Saltwater II ⬜
banggai-cardinalfish · pajama-cardinalfish · six-line-wrasse · flame-angelfish · coral-beauty-angelfish · lawnmower-blenny · green-chromis · royal-dottyback · copperband-butterflyfish · foxface-rabbitfish · diamond-goby

## Batch 4 — Freshwater centerpieces ✅ COMPLETE (10/10)
german-blue-ram ✅ · bolivian-ram ✅ · cockatoo-cichlid ✅ · kribensis ✅ · convict-cichlid ✅ · firemouth-cichlid ✅ · electric-yellow-cichlid ✅ · dwarf-gourami ✅ · pearl-gourami ✅ · honey-gourami ✅

## Batch 5 — Freshwater schoolers ✅ COMPLETE (10/10)
cardinal-tetra ✅ · ember-tetra ✅ · rummynose-tetra ✅ · congo-tetra ✅ · harlequin-rasbora ✅ · cherry-barb ✅ · tiger-barb ✅ · celestial-pearl-danio ✅ · white-cloud-minnow ✅ · boesemani-rainbowfish ✅

## Batch 6 — Freshwater specialists ✅ COMPLETE (7/7)
swordtail ✅ · denison-barb ✅ · silver-dollar ✅ · clown-loach ✅ · paradise-fish ✅ · otocinclus ✅ · siamese-algae-eater ✅

## Batch 7 — Snails ✅ COMPLETE (6/6)
mystery-snail ✅ · nerite-snail ✅ · ramshorn-snail ✅ · bladder-snail ✅ · malaysian-trumpet-snail ✅ · assassin-snail ✅

## Batch 8 — Live foods ✅ COMPLETE (9/9)
moina ✅ · vinegar-eels ✅ · grindal-worms ✅ · white-worms ✅ · banana-worms ✅ · walter-worms ✅ · blackworms ✅ · copepods ✅ · seed-shrimp ✅

## Batch 9 — Microfauna & problem organisms 🟡 (3/7 done)
detritus-worms ✅ · planaria ✅ · hydra ✅ · rotifers ⬜ · infusoria ⬜ · vorticella ⬜ · green-water ⬜

## Batch 10 — Plants & nuisance algae ⬜
java-moss · duckweed · black-beard-algae · blue-green-algae

## Batch 11 — Expand existing SHORT pages 🟡 (already live, 1.2k–2.5k → 4k)
angelfish · bristlenose-pleco · kuhli-loach · discus-fish · rope-fish · clownfish · neon-tetra · corydoras · guppy · goldfish · pea-puffer · hillstream-loach · zebra-danio · oscar-fish · molly-fish · platy-fish · neocaridina-shrimp · daphnia · scuds · microworms · baby-brine-shrimp

---

## Notes
- **Wiring:** content lives only in `src/content/species/<slug>.mdx`. Data records, parameters, funnel, and sidebar are untouched — we only add the article body.
- **No duplicates:** every internal link target is a real slug in `SPECIES_DATA`.
- **Cadence:** ~5–10 pages per working session. At 5/session, ~19 sessions to complete; at 10/session, ~10.
- **Hero unit bug fixed** (2026-06-04): the temperature chip now shows °F (was hardcoded °C).
