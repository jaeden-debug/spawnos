/**
 * Which species the SpawnOS app actually supports, and how confidently.
 *
 * This mirrors `SpeciesProfile.all` in the iOS app
 * (SpawnOS/Engine/Species.swift). Keep the two in step: if a species gains a
 * validated timeline in the app, promote it here; if it is not in the app's
 * registry, it must not appear here at all.
 *
 * The point is to stop the website promising breeding support the app cannot
 * deliver. A visitor on the discus page should not be told SpawnOS will build
 * them a discus spawn timeline, because it will not.
 */

export type SpawnOSConfidence =
  /** Curated in-app, SpawnOS reviewed — real milestone windows. */
  | 'verified'
  /** Registers and tracks; timeline researched on request, confidence labelled in-app. */
  | 'tracked'

export interface SpawnOSSpeciesSupport {
  confidence: SpawnOSConfidence
  /** The app's noun for a breeding event — "Spawn", "Drop", "Hatch", "Clutch". */
  eventNoun: string
  /** Headline for the species-page breeding module. */
  headline: string
  /** Body copy. Must describe only what the app actually does for this species. */
  body: string
}

/** Keyed by the species-library slug used at /species/[slug]. */
export const SPAWNOS_SPECIES: Record<string, SpawnOSSpeciesSupport> = {
  'betta-fish': {
    confidence: 'verified',
    eventNoun: 'Spawn',
    headline: 'Breeding bettas? SpawnOS builds the spawn timeline for you.',
    body:
      'Record one spawn date and SpawnOS lays out the rest — hatch, free-swimming, when to pull the male, first feeding, the move to baby brine, labyrinth development and jarring — each with the window it should fall in and what to watch for. Betta splendens is a SpawnOS-verified timeline.',
  },
  guppy: {
    confidence: 'verified',
    eventNoun: 'Drop',
    headline: 'Breeding guppies? Track the drop, not just the date.',
    body:
      'Log a drop and SpawnOS follows it through fry refuge, first feeding, sexing the juveniles and when the next drop is possible. It also flags the thing that ruins controlled guppy lines — females store sperm for months, so early drops can have mixed paternity. Guppies are a SpawnOS-verified timeline.',
  },
  'molly-fish': {
    confidence: 'tracked',
    eventNoun: 'Drop',
    headline: 'Keeping molly breeding records?',
    body:
      'SpawnOS registers your mollies, builds pairs, records each drop and links the generations into a lineage with relatedness warnings. Mollies do not yet have a SpawnOS-verified milestone timeline — the app says so plainly rather than borrowing another livebearer’s biology.',
  },
  'platy-fish': {
    confidence: 'tracked',
    eventNoun: 'Drop',
    headline: 'Keeping platy breeding records?',
    body:
      'SpawnOS registers your platies, builds pairs, records each drop and links the generations into a lineage with relatedness warnings. Platies do not yet have a SpawnOS-verified milestone timeline — the app tells you that instead of guessing.',
  },
  'neocaridina-shrimp': {
    confidence: 'tracked',
    eventNoun: 'Hatch',
    headline: 'Running a shrimp colony with a plan?',
    body:
      'SpawnOS records berried females, hatches and generations so you can keep track of which line produced what. Neocaridina do not yet have a SpawnOS-verified milestone timeline — colony breeding is hard to pin to dates, and the app says so.',
  },
  'cherry-shrimp': {
    confidence: 'tracked',
    eventNoun: 'Hatch',
    headline: 'Running a shrimp colony with a plan?',
    body:
      'SpawnOS records berried females, hatches and generations so you can keep track of which line produced what. Neocaridina do not yet have a SpawnOS-verified milestone timeline — colony breeding is hard to pin to dates, and the app says so.',
  },
  corydoras: {
    confidence: 'tracked',
    eventNoun: 'Spawn',
    headline: 'Spawning corydoras?',
    body:
      'Register your group, record each spawn and keep the lineage as you grow fry out. Corydoras do not yet have a SpawnOS-verified milestone timeline — the app tracks the spawn honestly rather than inventing hatch windows.',
  },
  angelfish: {
    confidence: 'tracked',
    eventNoun: 'Spawn',
    headline: 'Breeding angelfish pairs?',
    body:
      'SpawnOS holds the pair, every spawn they produce and the lineage that follows, with relatedness warnings as you keep back your own fry. Angelfish do not yet have a SpawnOS-verified milestone timeline.',
  },
  clownfish: {
    confidence: 'tracked',
    eventNoun: 'Clutch',
    headline: 'Breeding clownfish?',
    body:
      'SpawnOS records the pair, each clutch and the lineage of what you raise. Clownfish do not yet have a SpawnOS-verified milestone timeline — marine larval rearing varies too much to fake a schedule.',
  },
}

export function spawnosSupportFor(slug: string): SpawnOSSpeciesSupport | undefined {
  return SPAWNOS_SPECIES[slug]
}
