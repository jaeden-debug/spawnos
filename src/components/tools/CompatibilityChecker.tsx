'use client'

import { useState } from 'react'
import { SPECIES_DATA } from '@/data/species'
import type { SpeciesData } from '@/types/species'

type RelationshipType =
  | 'Tankmates'
  | 'Conditional Community'
  | 'Predator / Prey'
  | 'Live Food'
  | 'Species-Only Conflict'
  | 'Habitat Mismatch'
  | 'Do Not Mix'

interface CompatSubScores {
  water: number
  temperature: number
  behavior: number
  predation: number
  habitat: number
  setup: number
}

interface SetupRecommendation {
  minimumTankGallons: number
  flow: 'Low' | 'Moderate' | 'High' | 'Species-specific'
  planting: 'Sparse' | 'Moderate' | 'Dense' | 'Optional'
  hiding: 'Low' | 'Moderate' | 'High'
  temperaturePlan: string
  groupPlan: string
  zonePlan: string
}

interface CompatResult {
  score: number
  verdict: 'Compatible' | 'Caution' | 'Incompatible'
  relationshipType: RelationshipType
  subScores: CompatSubScores
  setup: SetupRecommendation
  riskBadges: string[]
  paramOverlap: { param: string; a: string; b: string; overlap: boolean }[]
  warnings: string[]
  notes: string[]
}

function rangeOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax)
}

function speciesIdentityText(s: SpeciesData) {
  return [
    s.slug,
    s.commonName,
    s.scientificName,
    s.family,
  ].join(' ').toLowerCase()
}

function hasAny(s: SpeciesData, terms: string[]) {
  const t = speciesIdentityText(s)
  return terms.some((term) => t.includes(term.toLowerCase()))
}

function hasCareText(s: SpeciesData, terms: string[]) {
  const t = [
    ...(s.care?.compatibleWith ?? []),
    ...(s.care?.incompatibleWith ?? []),
  ].join(' ').toLowerCase()

  return terms.some((term) => t.includes(term.toLowerCase()))
}

function isLiveFoodOrMicrofauna(s: SpeciesData) {
  return hasAny(s, [
    'daphnia',
    'moina',
    'scud',
    'gammarus',
    'copepod',
    'cyclops',
    'ostracod',
    'seed shrimp',
    'rotifer',
    'infusoria',
    'paramecium',
    'microworm',
    'vinegar eel',
    'brine shrimp',
    'blackworm',
    'tubifex',
    'grindal worm',
    'white worm',
  ])
}

function isFishOrPredatorConsumer(s: SpeciesData) {
  return hasAny(s, [
    'betta',
    'guppy',
    'danio',
    'tetra',
    'rasbora',
    'gourami',
    'cichlid',
    'angelfish',
    'discus',
    'ram',
    'goldfish',
    'loach',
    'corydoras',
    'pleco',
    'axolotl',
    'puffer',
    'killifish',
  ])
}

function isColdWaterSpecies(s: SpeciesData) {
  return hasAny(s, ['axolotl', 'goldfish', 'hillstream', 'white cloud'])
}

function isWarmWaterSpecies(s: SpeciesData) {
  return hasAny(s, ['betta', 'discus', 'ram', 'gourami', 'angelfish'])
}

function isMarineOrBrackish(s: SpeciesData) {
  return hasAny(s, ['marine', 'saltwater', 'reef', 'clownfish', 'tang', 'dragonet', 'royal gramma']) ||
    hasCareText(s, ['marine', 'saltwater', 'reef'])
}

function isFreshwaterSpecies(s: SpeciesData) {
  return !isMarineOrBrackish(s)
}


function nameOf(s: SpeciesData) {
  return s.commonName || s.slug
}

function directListMatch(source: SpeciesData, target: SpeciesData, list: string[]) {
  const targetTerms = [
    target.slug,
    target.commonName,
    target.scientificName,
    target.family,
  ].filter(Boolean).map((v) => String(v).toLowerCase())

  return list
    .map((v) => String(v).toLowerCase())
    .some((entry) => targetTerms.some((term) => entry.includes(term) || term.includes(entry.split('(')[0].trim())))
}

function addRule(
  condition: boolean,
  amount: number,
  message: string,
  warnings: string[],
  notes: string[],
  type: 'warning' | 'note' = 'warning'
) {
  if (!condition) return 0
  if (type === 'warning') warnings.push(message)
  else notes.push(message)
  return amount
}


function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function overlapScore(aMin: number, aMax: number, bMin: number, bMax: number) {
  const overlapMin = Math.max(aMin, bMin)
  const overlapMax = Math.min(aMax, bMax)
  const overlap = Math.max(0, overlapMax - overlapMin)
  const aRange = Math.max(0.01, aMax - aMin)
  const bRange = Math.max(0.01, bMax - bMin)
  const overlapRatio = overlap / Math.min(aRange, bRange)

  if (overlap <= 0) return 0
  if (overlapRatio >= 0.8) return 95
  if (overlapRatio >= 0.55) return 82
  if (overlapRatio >= 0.3) return 68
  return 52
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge)
}

function labelRisk(score: number) {
  if (score >= 75) return 'Low'
  if (score >= 45) return 'Moderate'
  return 'High'
}

function makeSetupRecommendation(
  a: SpeciesData,
  b: SpeciesData,
  minTank: number,
  relationshipType: RelationshipType
): SetupRecommendation {
  const aName = nameOf(a)
  const bName = nameOf(b)

  const highFlow = hasAny(a, ['hillstream', 'sewellia', 'beaufortia']) || hasAny(b, ['hillstream', 'sewellia', 'beaufortia'])
  const betta = hasAny(a, ['betta']) || hasAny(b, ['betta'])
  const shrimp = hasAny(a, ['shrimp', 'neocaridina', 'caridina']) || hasAny(b, ['shrimp', 'neocaridina', 'caridina'])
  const liveFood = isLiveFoodOrMicrofauna(a) || isLiveFoodOrMicrofauna(b)
  const axolotl = hasAny(a, ['axolotl']) || hasAny(b, ['axolotl'])
  const goldfish = hasAny(a, ['goldfish']) || hasAny(b, ['goldfish'])

  const tempMin = Math.max(a.parameters.tempMin, b.parameters.tempMin)
  const tempMax = Math.min(a.parameters.tempMax, b.parameters.tempMax)
  const tempPlan = tempMin <= tempMax
    ? `Aim for the shared overlap: ${tempMin}–${tempMax}°F.`
    : `No safe shared temperature range. ${aName} prefers ${a.parameters.tempMin}–${a.parameters.tempMax}°F while ${bName} prefers ${b.parameters.tempMin}–${b.parameters.tempMax}°F.`

  let flow: SetupRecommendation['flow'] = 'Moderate'
  if (highFlow) flow = 'High'
  if (betta || axolotl || goldfish) flow = highFlow ? 'Species-specific' : 'Low'

  let planting: SetupRecommendation['planting'] = 'Moderate'
  if (betta || shrimp) planting = 'Dense'
  if (goldfish || axolotl) planting = 'Optional'

  let hiding: SetupRecommendation['hiding'] = 'Moderate'
  if (shrimp || betta || axolotl) hiding = 'High'
  if (liveFood) hiding = 'Low'

  const groupPlan = liveFood
    ? 'This is not a group/community pairing. Treat the microfauna as food, culture stock, or cleanup fauna depending on context.'
    : `${aName} and ${bName} should both be kept according to their normal group/social requirements. Schooling species need groups; territorial species need space and visual breaks.`

  const zonePlan = relationshipType === 'Predator / Prey' || relationshipType === 'Live Food'
    ? 'Do not plan tank zones like a normal community. One organism is likely to be hunted, eaten, or suppressed.'
    : 'Reduce conflict by mixing species that use different tank zones and by adding plants, hardscape, and open swimming space.'

  return {
    minimumTankGallons: minTank,
    flow,
    planting,
    hiding,
    temperaturePlan: tempPlan,
    groupPlan,
    zonePlan,
  }
}


function checkCompatibility(a: SpeciesData, b: SpeciesData): CompatResult {
  const warnings: string[] = []
  const notes: string[] = []
  const riskBadges: string[] = []
  let score = 100
  let relationshipType: RelationshipType = 'Tankmates'
  let behaviorScore = 85
  let predationScore = 90
  let habitatScore = 85
  let setupScore = 80

  const aName = nameOf(a)
  const bName = nameOf(b)

  const paramOverlap = [
    {
      param: 'Temperature °F',
      a: `${a.parameters.tempMin}–${a.parameters.tempMax}`,
      b: `${b.parameters.tempMin}–${b.parameters.tempMax}`,
      overlap: rangeOverlap(a.parameters.tempMin, a.parameters.tempMax, b.parameters.tempMin, b.parameters.tempMax),
    },
    {
      param: 'pH',
      a: `${a.parameters.phMin}–${a.parameters.phMax}`,
      b: `${b.parameters.phMin}–${b.parameters.phMax}`,
      overlap: rangeOverlap(a.parameters.phMin, a.parameters.phMax, b.parameters.phMin, b.parameters.phMax),
    },
    {
      param: 'GH dGH',
      a: `${a.parameters.ghMin}–${a.parameters.ghMax}`,
      b: `${b.parameters.ghMin}–${b.parameters.ghMax}`,
      overlap: rangeOverlap(a.parameters.ghMin, a.parameters.ghMax, b.parameters.ghMin, b.parameters.ghMax),
    },
  ]

  const temperatureScore = overlapScore(a.parameters.tempMin, a.parameters.tempMax, b.parameters.tempMin, b.parameters.tempMax)
  const phScore = overlapScore(a.parameters.phMin, a.parameters.phMax, b.parameters.phMin, b.parameters.phMax)
  const ghScore = overlapScore(a.parameters.ghMin, a.parameters.ghMax, b.parameters.ghMin, b.parameters.ghMax)
  let waterScore = average([temperatureScore, phScore, ghScore])

  // Environmental compatibility
  if (!paramOverlap[0].overlap) {
    score -= 40
    habitatScore -= 28
    addBadge(riskBadges, 'Temperature mismatch')
    warnings.push(`Temperature ranges do not overlap. ${aName} needs ${a.parameters.tempMin}–${a.parameters.tempMax}°F; ${bName} needs ${b.parameters.tempMin}–${b.parameters.tempMax}°F. One species will be chronically stressed.`)
  }

  if (!paramOverlap[1].overlap) {
    score -= 35
    waterScore -= 22
    addBadge(riskBadges, 'pH mismatch')
    warnings.push(`pH ranges do not overlap. ${aName} requires pH ${a.parameters.phMin}–${a.parameters.phMax}; ${bName} requires pH ${b.parameters.phMin}–${b.parameters.phMax}.`)
  }

  if (!paramOverlap[2].overlap) {
    score -= 15
    waterScore -= 10
    addBadge(riskBadges, 'Hardness mismatch')
    warnings.push(`GH ranges do not overlap. ${aName} needs GH ${a.parameters.ghMin}–${a.parameters.ghMax}; ${bName} needs GH ${b.parameters.ghMin}–${b.parameters.ghMax}.`)
  }

  // Direct compatibility / incompatibility lists
  const bInA = directListMatch(a, b, a.care?.incompatibleWith ?? [])
  const aInB = directListMatch(b, a, b.care?.incompatibleWith ?? [])

  if (bInA || aInB) {
    score -= 55
    behaviorScore -= 40
    addBadge(riskBadges, 'Listed incompatibility')
    warnings.push(`Direct incompatibility is listed in the species data. This pairing should be treated as high risk even if water parameters overlap.`)
  }

  const bPositiveInA = directListMatch(a, b, a.care?.compatibleWith ?? [])
  const aPositiveInB = directListMatch(b, a, b.care?.compatibleWith ?? [])

  if (bPositiveInA && !(isLiveFoodOrMicrofauna(a) || isLiveFoodOrMicrofauna(b))) {
    notes.push(`${aName} is documented as compatible with ${bName} in the database.`)
  }
  if (aPositiveInB && !(isLiveFoodOrMicrofauna(a) || isLiveFoodOrMicrofauna(b))) {
    notes.push(`${bName} is documented as compatible with ${aName} in the database.`)
  }

  // Behavioral/ecological categories
  const aBetta = hasAny(a, ['betta', 'betta splendens'])
  const bBetta = hasAny(b, ['betta', 'betta splendens'])

  const aDiscus = hasAny(a, ['discus', 'symphysodon'])
  const bDiscus = hasAny(b, ['discus', 'symphysodon'])

  const aAxolotl = hasAny(a, ['axolotl', 'ambystoma mexicanum'])
  const bAxolotl = hasAny(b, ['axolotl', 'ambystoma mexicanum'])

  const aShrimp = hasAny(a, ['shrimp', 'neocaridina', 'caridina', 'amano', 'cherry shrimp', 'ghost shrimp'])
  const bShrimp = hasAny(b, ['shrimp', 'neocaridina', 'caridina', 'amano', 'cherry shrimp', 'ghost shrimp'])

  const aPuffer = hasAny(a, ['puffer', 'pea puffer', 'carinotetraodon'])
  const bPuffer = hasAny(b, ['puffer', 'pea puffer', 'carinotetraodon'])

  const aGoldfish = hasAny(a, ['goldfish', 'carassius'])
  const bGoldfish = hasAny(b, ['goldfish', 'carassius'])

  const aCichlid = hasAny(a, ['cichlid', 'cichlidae', 'ram', 'apistogramma', 'mbuna', 'oscar', 'angelfish', 'discus'])
  const bCichlid = hasAny(b, ['cichlid', 'cichlidae', 'ram', 'apistogramma', 'mbuna', 'oscar', 'angelfish', 'discus'])

  const aFinNipper = hasAny(a, ['barb', 'tiger barb', 'serpae', 'puffer'])
  const bFinNipper = hasAny(b, ['barb', 'tiger barb', 'serpae', 'puffer'])

  const aLongFinSlow = hasAny(a, ['betta', 'guppy', 'angelfish', 'fancy goldfish', 'longfin'])
  const bLongFinSlow = hasAny(b, ['betta', 'guppy', 'angelfish', 'fancy goldfish', 'longfin'])

  const aPredatory = hasAny(a, ['axolotl', 'oscar', 'puffer', 'large cichlid', 'predatory cichlid'])
  const bPredatory = hasAny(b, ['axolotl', 'oscar', 'puffer', 'large cichlid', 'predatory cichlid'])

  const aTinyPrey = hasAny(a, ['shrimp', 'fry', 'daphnia', 'scud', 'copepod', 'snail'])
  const bTinyPrey = hasAny(b, ['shrimp', 'fry', 'daphnia', 'scud', 'copepod', 'snail'])

  const aLiveFood = isLiveFoodOrMicrofauna(a)
  const bLiveFood = isLiveFoodOrMicrofauna(b)
  const aConsumer = isFishOrPredatorConsumer(a)
  const bConsumer = isFishOrPredatorConsumer(b)

  // Food/prey context: this is useful, but it is not normal cohabitation.
  if ((aLiveFood && bConsumer) || (bLiveFood && aConsumer)) {
    const food = aLiveFood ? aName : bName
    const consumer = aLiveFood ? bName : aName

    relationshipType = 'Live Food'
    predationScore = 5
    behaviorScore = 20
    setupScore = 35
    addBadge(riskBadges, 'Live food / prey')
    addBadge(riskBadges, 'Not a tankmate')
    score = Math.min(score, 25)
    warnings.push(`${food} should be treated as live food or prey for ${consumer}, not as a permanent tankmate. The likely outcome is feeding, hunting, or population collapse rather than stable cohabitation.`)
    notes.push(`Context: this result means "not compatible as tankmates." It can still be a useful feeding relationship. ${consumer} may benefit from ${food} as enrichment or live food, but the calculator should not score it like two display species sharing a community tank.`)
  }

  // Freshwater / saltwater context.
  if (isMarineOrBrackish(a) !== isMarineOrBrackish(b)) {
    relationshipType = 'Do Not Mix'
    habitatScore = 0
    waterScore = Math.min(waterScore, 10)
    addBadge(riskBadges, 'Freshwater / saltwater conflict')
    score = Math.min(score, 10)
    warnings.push(`Freshwater and marine/brackish animals should not be mixed. Their salinity requirements are fundamentally different even if a few other parameters appear close.`)
  }

  // Cold-water / warm-water context.
  if ((isColdWaterSpecies(a) && isWarmWaterSpecies(b)) || (isColdWaterSpecies(b) && isWarmWaterSpecies(a))) {
    relationshipType = relationshipType === 'Tankmates' ? 'Habitat Mismatch' : relationshipType
    habitatScore -= 35
    setupScore -= 20
    addBadge(riskBadges, 'Cold/warm-water conflict')
    score = Math.min(score, 45)
    warnings.push(`Cold-water and warm-water preference conflict detected. This pairing may force one species outside its long-term comfort zone even when some parameter ranges overlap.`)
  }

  // Hard biological / husbandry conflicts
  score -= addRule(
    aAxolotl || bAxolotl,
    (aAxolotl && bAxolotl) ? 0 : 70,
    `Axolotls are best kept species-only. Fish can nip their gills, stress them, carry pathogens, or be eaten. This is not a normal community-tank pairing.`,
    warnings
  )

  score -= addRule(
    (aGoldfish && !bGoldfish) || (bGoldfish && !aGoldfish),
    45,
    `Goldfish are usually poor matches for tropical community species because of temperature, waste load, feeding style, and long-term size differences.`,
    warnings
  )

  // Betta-specific intelligence
  score -= addRule(
    (aBetta && bBetta),
    85,
    `Two bettas should not be housed together as a normal compatibility pairing. Territorial aggression can lead to severe injury or death.`,
    warnings
  )

  score -= addRule(
    (aBetta && bDiscus) || (bBetta && aDiscus),
    65,
    `Bettas and discus may overlap on warm water, but they are not a good real-world pairing. Discus are sensitive, group-oriented, slow-feeding fish; bettas are territorial and can harass or stress them.`,
    warnings
  )

  score -= addRule(
    (aBetta && bShrimp) || (bBetta && aShrimp),
    35,
    `Betta + shrimp is conditional, not automatically safe. Many bettas hunt cherry shrimp, and baby shrimp are especially likely to be eaten. Dense plants and individual temperament matter.`,
    warnings
  )

  score -= addRule(
    (aBetta && bPuffer) || (bBetta && aPuffer),
    80,
    `Bettas and puffers are a dangerous pairing. Puffers are notorious fin nippers, and bettas are territorial with long fins that invite damage.`,
    warnings
  )

  // Shrimp / prey risk
  score -= addRule(
    ((aPredatory && bShrimp) || (bPredatory && aShrimp)) && !(aBetta || bBetta),
    30,
    `There is predation risk. Shrimp may be hunted, especially juveniles or freshly molted individuals.`,
    warnings
  )

  score -= addRule(
    (aPredatory && bTinyPrey) || (bPredatory && aTinyPrey),
    20,
    `One species may treat the other as food or opportunistic prey depending on size, age, hunger, and tank structure.`,
    warnings
  )

  // Fin nipping / body shape risk
  score -= addRule(
    (aFinNipper && bLongFinSlow) || (bFinNipper && aLongFinSlow),
    35,
    `Fin-nipping risk is high. Long-finned or slow-moving fish can be stressed or injured by active nippers.`,
    warnings
  )

  // Cichlid territorial risk
  score -= addRule(
    aCichlid && bCichlid && a.slug !== b.slug,
    18,
    `Both species appear to be cichlids or cichlid-like territorial fish. Compatibility depends heavily on tank size, sex ratio, territory, and aquascape.`,
    warnings
  )

  // Same family check, but don't punish common peaceful schooling groups as heavily
  if (a.family === b.family && a.family && a.slug !== b.slug) {
    const peacefulException = ['Callichthyidae', 'Characidae', 'Cyprinidae'].includes(a.family)
    score -= peacefulException ? 4 : 10
    notes.push(`Both species belong to family ${a.family}. Same-family pairings may work, but behavior and territory should still be checked.`)
  }

  // Tank size compatibility
  const minTank = Math.max(a.care.tankSizeRecommended, b.care.tankSizeRecommended)
  notes.push(`Recommended minimum tank: ${minTank} gallons or larger to house both species comfortably.`)

  const aPeacefulSchooling = hasAny(a, ['guppy', 'poecilia reticulata', 'danio', 'tetra', 'rasbora', 'corydoras'])
  const bPeacefulSchooling = hasAny(b, ['guppy', 'poecilia reticulata', 'danio', 'tetra', 'rasbora', 'corydoras'])

  if (aPeacefulSchooling && bPeacefulSchooling && score >= 55) {
    notes.push(`${aName} and ${bName} are generally community-oriented species. If the tank is large enough and parameters are kept in the shared overlap, this pairing is usually manageable.`)
    score += 8
  }

  const aHighFlow = hasAny(a, ['hillstream', 'sewellia', 'beaufortia'])
  const bHighFlow = hasAny(b, ['hillstream', 'sewellia', 'beaufortia'])
  const aSoftWarmSchooler = hasAny(a, ['neon tetra', 'paracheirodon innesi', 'cardinal tetra'])
  const bSoftWarmSchooler = hasAny(b, ['neon tetra', 'paracheirodon innesi', 'cardinal tetra'])

  if ((aHighFlow && bSoftWarmSchooler) || (bHighFlow && aSoftWarmSchooler)) {
    score -= 20
    warnings.push(`This is a borderline habitat match. Hillstream loaches prefer cooler, highly oxygenated, fast-flowing water, while many small tetras prefer calmer planted setups. It can work only in a cooler, high-oxygen community tank.`)
  }

  const tankGap = Math.abs(a.care.tankSizeRecommended - b.care.tankSizeRecommended)
  if (tankGap >= 40) {
    score -= 15
    warnings.push(`Large tank-size mismatch detected. One species likely needs much more swimming space, waste capacity, or territory than the other.`)
  }

  // Reward only when both sides explicitly support the pairing
  if (aPositiveInB && bPositiveInA && score < 95) {
    score += 8
    notes.push(`Both species lists support this pairing, so the score receives a small confidence boost.`)
  }

  // Cap logic: hard-risk pairs should never show as high compatibility
  const hasHardRisk =
    (aAxolotl || bAxolotl) ||
    (aBetta && (bDiscus || bPuffer)) ||
    (bBetta && (aDiscus || aPuffer)) ||
    (aBetta && bBetta) ||
    bInA ||
    aInB

  if (hasHardRisk) score = Math.min(score, 35)

  const hasMajorRisk =
    (aBetta && bShrimp) ||
    (bBetta && aShrimp) ||
    (aFinNipper && bLongFinSlow) ||
    (bFinNipper && aLongFinSlow) ||
    ((aPredatory && bShrimp) || (bPredatory && aShrimp))

  if (hasMajorRisk) score = Math.min(score, 62)

  waterScore = clampScore(waterScore)
  habitatScore = clampScore(habitatScore)
  behaviorScore = clampScore(behaviorScore)
  predationScore = clampScore(predationScore)
  setupScore = clampScore(setupScore)

  if (relationshipType === 'Tankmates' && score < 70 && score >= 40) {
    relationshipType = 'Conditional Community'
  }

  if (warnings.some((w) => w.toLowerCase().includes('prey') || w.toLowerCase().includes('hunted') || w.toLowerCase().includes('eaten'))) {
    if (relationshipType === 'Tankmates') relationshipType = 'Predator / Prey'
    addBadge(riskBadges, 'Predation risk')
  }

  const subScores: CompatSubScores = {
    water: waterScore,
    temperature: temperatureScore,
    behavior: clampScore(behaviorScore),
    predation: clampScore(predationScore),
    habitat: clampScore(habitatScore),
    setup: clampScore(setupScore),
  }

  score = clampScore(score)

  const verdict: CompatResult['verdict'] =
    score >= 70 ? 'Compatible' : score >= 40 ? 'Caution' : 'Incompatible'

  if ((aLiveFood && bConsumer) || (bLiveFood && aConsumer)) {
    const food = aLiveFood ? aName : bName
    const consumer = aLiveFood ? bName : aName
    notes.unshift(`${consumer} and ${food} are not a tankmate pairing. This is a predator/prey or feeding relationship: ${food} may be useful as live food, but it should not be expected to survive as a stable display-tank companion.`)
  } else if (verdict === 'Compatible') {
    notes.unshift(`This pairing appears workable based on available parameter, behavior, and care data. Still monitor individual temperament.`)
  } else if (verdict === 'Caution') {
    notes.unshift(`This pairing may work only under specific conditions. Tank size, aquascape, feeding, and individual temperament matter heavily.`)
  } else {
    notes.unshift(`This pairing is not recommended for most aquariums. The issue is not just water parameters — behavior, predation, stress, or husbandry conflicts are likely.`)
  }

  const setup = makeSetupRecommendation(a, b, minTank, relationshipType)

  if (riskBadges.length === 0 && verdict === 'Compatible') {
    addBadge(riskBadges, 'Low obvious risk')
  }

  notes.push(`Score breakdown: water ${subScores.water}/100, temperature ${subScores.temperature}/100, behavior ${subScores.behavior}/100, predation safety ${subScores.predation}/100, habitat ${subScores.habitat}/100, setup difficulty ${subScores.setup}/100.`)
  notes.push(`Recommended setup: ${setup.minimumTankGallons}+ gallons, ${setup.flow.toLowerCase()} flow, ${setup.planting.toLowerCase()} planting, ${setup.hiding.toLowerCase()} hiding. ${setup.temperaturePlan}`)

  return { score, verdict, relationshipType, subScores, setup, riskBadges, paramOverlap, warnings, notes }
}

export default function CompatibilityChecker() {
  const [speciesA, setSpeciesA] = useState('')
  const [speciesB, setSpeciesB] = useState('')
  const [result, setResult] = useState<CompatResult | null>(null)

  function check() {
    if (!speciesA || !speciesB || speciesA === speciesB) return
    const a = SPECIES_DATA.find((s) => s.slug === speciesA)
    const b = SPECIES_DATA.find((s) => s.slug === speciesB)
    if (a && b) setResult(checkCompatibility(a, b))
  }

  const selectClass = 'w-full bg-spawn-surface border border-spawn-border rounded-lg px-3 py-2.5 text-spawn-text text-sm focus:outline-none focus:border-spawn-cyan/60 transition-colors'
  const labelClass = 'text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1.5 block'

  const scoreWidthClass =
    !result ? 'w-0' :
    result.score >= 95 ? 'w-[95%]' :
    result.score >= 90 ? 'w-[90%]' :
    result.score >= 85 ? 'w-[85%]' :
    result.score >= 80 ? 'w-[80%]' :
    result.score >= 75 ? 'w-[75%]' :
    result.score >= 70 ? 'w-[70%]' :
    result.score >= 65 ? 'w-[65%]' :
    result.score >= 60 ? 'w-[60%]' :
    result.score >= 55 ? 'w-[55%]' :
    result.score >= 50 ? 'w-[50%]' :
    result.score >= 45 ? 'w-[45%]' :
    result.score >= 40 ? 'w-[40%]' :
    result.score >= 35 ? 'w-[35%]' :
    result.score >= 30 ? 'w-[30%]' :
    result.score >= 25 ? 'w-[25%]' :
    result.score >= 20 ? 'w-[20%]' :
    result.score >= 15 ? 'w-[15%]' :
    result.score >= 10 ? 'w-[10%]' :
    result.score > 0 ? 'w-[5%]' : 'w-0'

  const verdictStyle = result ? {
    Compatible: 'border-spawn-emerald/30 bg-spawn-emerald/5 text-spawn-emerald',
    Caution: 'border-spawn-amber/30 bg-spawn-amber/5 text-spawn-amber',
    Incompatible: 'border-spawn-rose/30 bg-spawn-rose/5 text-spawn-rose',
  }[result.verdict] : ''

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl border border-spawn-border/50 p-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelClass}>Species A</label>
            <select title="Select option" aria-label="Select option" className={selectClass} value={speciesA} onChange={(e) => setSpeciesA(e.target.value)}>
              <option value="">Select species...</option>
              {SPECIES_DATA.map((s) => (
                <option key={s.slug} value={s.slug}>{s.commonName} ({s.scientificName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Species B</label>
            <select title="Select option" aria-label="Select option" className={selectClass} value={speciesB} onChange={(e) => setSpeciesB(e.target.value)}>
              <option value="">Select species...</option>
              {SPECIES_DATA.filter((s) => s.slug !== speciesA).map((s) => (
                <option key={s.slug} value={s.slug}>{s.commonName} ({s.scientificName})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={check}
          disabled={!speciesA || !speciesB}
          className="w-full py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Compatibility
        </button>
      </div>

      {result && (
        <div className={`mt-6 glass-card rounded-xl border p-6 ${verdictStyle}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="text-xl font-black">{result.verdict}</div>
            <div className="text-right">
              <div className="text-3xl font-black">{result.score}</div>
              <div className="text-xs text-spawn-muted-text">/ 100</div>
            </div>
          </div>

          {/* Score bar */}
          <div className="score-bar mb-5">
            <div
              data-score={result.score >= 70 ? 'good' : result.score >= 40 ? 'caution' : 'risk'}
              className="score-bar-fill"
              style={{ '--score-width': `${result.score}%` } as React.CSSProperties}
            />
          </div>

          {/* Relationship intelligence */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl border border-spawn-border/60 bg-spawn-bg/40 p-4">
              <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-1">Relationship Type</div>
              <div className="text-lg font-black text-spawn-text">{result.relationshipType}</div>
              <div className="text-xs text-spawn-muted-text mt-1">
                {result.relationshipType === 'Live Food'
                  ? 'Useful as food/enrichment, not a tankmate.'
                  : result.relationshipType === 'Predator / Prey'
                    ? 'One animal may hunt or suppress the other.'
                    : result.relationshipType === 'Conditional Community'
                      ? 'Possible only with the right setup.'
                      : result.relationshipType}
              </div>
            </div>

            <div className="rounded-xl border border-spawn-border/60 bg-spawn-bg/40 p-4">
              <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2">Risk Flags</div>
              <div className="flex flex-wrap gap-1.5">
                {result.riskBadges.map((badge) => (
                  <span key={badge} className="text-[0.68rem] font-bold uppercase tracking-wide rounded-full border border-spawn-amber/30 bg-spawn-amber/10 text-spawn-amber px-2 py-1">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subscores */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-3">Compatibility Intelligence</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['Water', result.subScores.water],
                ['Temperature', result.subScores.temperature],
                ['Behavior', result.subScores.behavior],
                ['Predation Safety', result.subScores.predation],
                ['Habitat', result.subScores.habitat],
                ['Setup Ease', result.subScores.setup],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-spawn-border/50 bg-spawn-bg/35 p-3">
                  <div className="text-[0.68rem] text-spawn-muted-text uppercase tracking-wide">{label}</div>
                  <div className="text-lg font-black text-spawn-text">{value as number}/100</div>
                  <div className="text-[0.68rem] text-spawn-muted-text">{labelRisk(value as number)} risk</div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup recommendation */}
          <div className="mb-5 rounded-xl border border-spawn-cyan/20 bg-spawn-cyan/5 p-4">
            <div className="text-xs font-semibold text-spawn-cyan uppercase tracking-wide mb-3">Recommended Setup</div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-spawn-muted-text">
              <div><span className="text-spawn-text font-semibold">Tank:</span> {result.setup.minimumTankGallons}+ gallons</div>
              <div><span className="text-spawn-text font-semibold">Flow:</span> {result.setup.flow}</div>
              <div><span className="text-spawn-text font-semibold">Plants:</span> {result.setup.planting}</div>
              <div><span className="text-spawn-text font-semibold">Hiding:</span> {result.setup.hiding}</div>
            </div>
            <p className="text-sm text-spawn-muted-text mt-3">{result.setup.temperaturePlan}</p>
            <p className="text-sm text-spawn-muted-text mt-2">{result.setup.zonePlan}</p>
          </div>

          {/* Parameter overlap */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-3">Parameter Overlap</div>
            <div className="space-y-2">
              {result.paramOverlap.map((p) => (
                <div key={p.param} className="flex items-center gap-3 text-sm">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.overlap ? 'bg-spawn-emerald/20' : 'bg-spawn-rose/20'}`}>
                    {p.overlap
                      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    }
                  </span>
                  <span className="text-spawn-muted-text w-28 text-xs">{p.param}</span>
                  <span className="text-spawn-text text-xs">{p.a}</span>
                  <span className="text-spawn-muted/40 text-xs">vs</span>
                  <span className="text-spawn-text text-xs">{p.b}</span>
                </div>
              ))}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-spawn-rose uppercase tracking-wide mb-2">Warnings</div>
              <ul className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text">⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.notes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-spawn-muted-text uppercase tracking-wide mb-2">Notes</div>
              <ul className="space-y-1.5">
                {result.notes.map((n, i) => (
                  <li key={i} className="text-sm text-spawn-muted-text">• {n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
