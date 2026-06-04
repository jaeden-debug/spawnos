import type { Fish } from '@/types/fish'
import type { PredictionOutput } from '@/types/genetics'
import {
  getColorCompatibility,
  isHighValueCombo,
  isVariablePattern,
  isMetallicPattern,
  getPatternRarity,
  predictColorOutcomes,
  predictTailOutcomes,
  PATTERN_RARITY,
  PATTERN_VALUE_WEIGHT,
  SCALE_VALUE_WEIGHT,
  TAIL_SHOW_WEIGHT,
  FINNAGE_QUALITY_WEIGHT,
  BODY_QUALITY_WEIGHT,
} from './bettaTraits'

function safeNum(val: unknown): number {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export function predictPairing(male: Fish, femaleF: Fish): PredictionOutput {
  const warnings: string[] = []
  const selectionTips: string[] = []
  const cullWatchNotes: string[] = []

  const maleTraits = male.traits ?? {}
  const femaleTraits = femaleF.traits ?? {}

  const maleHealth = safeNum(maleTraits.health_score ?? 7)
  const femaleHealth = safeNum(femaleTraits.health_score ?? 7)
  const maleAggression = (maleTraits.aggression_level as string) ?? 'medium'
  const maleFertility = (maleTraits.fertility_confidence as string) ?? 'unknown'
  const femaleFertility = (femaleTraits.fertility_confidence as string) ?? 'unknown'
  const maleFinnage = male.finnage ?? 'average'
  const femaleFinnage = femaleF.finnage ?? 'average'
  const maleBody = male.body_type ?? 'average'
  const femaleBody = femaleF.body_type ?? 'average'

  // --- Base compatibility score (0–100) ---
  let compatScore = 60

  // Color harmony
  const colorHarmony = getColorCompatibility(male.color_base, femaleF.color_base)
  compatScore += (colorHarmony - 0.5) * 20

  // Health scores
  const avgHealth = (maleHealth + femaleHealth) / 2
  if (avgHealth >= 8) compatScore += 10
  else if (avgHealth >= 6) compatScore += 4
  else if (avgHealth < 5) { compatScore -= 15; warnings.push('Low health scores detected — breeding not recommended until fish recover') }

  // Aggression
  if (maleAggression === 'high') {
    compatScore -= 5
    warnings.push('High aggression male — monitor closely during conditioning, may injure female')
  }

  // Fertility
  if (maleFertility === 'low' || femaleFertility === 'low') {
    compatScore -= 8
    warnings.push('Low fertility confidence on one or both fish — spawn success uncertain')
  }
  if (maleFertility === 'high' && femaleFertility === 'high') compatScore += 8

  // Matching rare patterns
  if (male.pattern_type && male.pattern_type === femaleF.pattern_type) {
    compatScore += 5
    selectionTips.push(`Matched pattern pairing (${male.pattern_type} × ${femaleF.pattern_type}) — expect higher pattern expression rate`)
  }

  // High-value combo
  if (isHighValueCombo(male.pattern_type, femaleF.pattern_type)) {
    compatScore += 10
    selectionTips.push('High-value pattern combination detected — prioritize the best-expressing offspring as holdbacks')
  }

  // Clamp to 0–100
  compatScore = Math.max(0, Math.min(100, Math.round(compatScore)))

  // --- Predictability score (0–100) ---
  let predictScore = 70

  // Variable patterns lower predictability
  if (isVariablePattern(male.pattern_type)) predictScore -= 15
  if (isVariablePattern(femaleF.pattern_type)) predictScore -= 15
  if (male.pattern_type !== femaleF.pattern_type) predictScore -= 10
  if (male.color_base !== femaleF.color_base) predictScore -= 8
  if (male.tail_type !== femaleF.tail_type) predictScore -= 8
  if (male.scale_type !== femaleF.scale_type) predictScore -= 5

  predictScore = Math.max(10, Math.min(100, Math.round(predictScore)))

  // --- Rare trait chance (0–100) ---
  const maleRarity = getPatternRarity(male.pattern_type)
  const femaleRarity = getPatternRarity(femaleF.pattern_type)
  let rareChance = ((maleRarity + femaleRarity) / 2) * 8

  if (male.pattern_type === femaleF.pattern_type && maleRarity >= 5) rareChance += 20
  if (isMetallicPattern(male.pattern_type) || isMetallicPattern(femaleF.pattern_type)) rareChance += 10
  if (male.scale_type === 'dragon-scale' || femaleF.scale_type === 'dragon-scale') rareChance += 8
  if (male.scale_type === 'metallic' || femaleF.scale_type === 'metallic') rareChance += 6

  rareChance = Math.max(2, Math.min(90, Math.round(rareChance)))

  // --- High value potential (0–100) ---
  const malePatternVal = male.pattern_type ? PATTERN_VALUE_WEIGHT[male.pattern_type] ?? 0.7 : 0.7
  const femalePatternVal = femaleF.pattern_type ? PATTERN_VALUE_WEIGHT[femaleF.pattern_type] ?? 0.7 : 0.7
  const maleScaleVal = male.scale_type ? SCALE_VALUE_WEIGHT[male.scale_type] ?? 0.7 : 0.7
  const femaleScaleVal = femaleF.scale_type ? SCALE_VALUE_WEIGHT[femaleF.scale_type] ?? 0.7 : 0.7
  const maleTailShow = male.tail_type ? TAIL_SHOW_WEIGHT[male.tail_type] ?? 0.8 : 0.8
  const femaleTailShow = femaleF.tail_type ? TAIL_SHOW_WEIGHT[femaleF.tail_type] ?? 0.8 : 0.8
  const maleFinnVal = FINNAGE_QUALITY_WEIGHT[maleFinnage]
  const femaleFinnVal = FINNAGE_QUALITY_WEIGHT[femaleFinnage]
  const maleBodyVal = BODY_QUALITY_WEIGHT[maleBody]
  const femaleBodyVal = BODY_QUALITY_WEIGHT[femaleBody]

  const valueComposite =
    ((malePatternVal + femalePatternVal) / 2) * 25 +
    ((maleScaleVal + femaleScaleVal) / 2) * 15 +
    ((maleTailShow + femaleTailShow) / 2) * 20 +
    ((maleFinnVal + femaleFinnVal) / 2) * 20 +
    ((maleBodyVal + femaleBodyVal) / 2) * 20

  let highValuePotential = Math.round(valueComposite)
  highValuePotential = Math.max(0, Math.min(100, highValuePotential))

  // --- Likely outcomes ---
  const likelyOutcomes = [
    ...predictColorOutcomes(male.color_base, femaleF.color_base, male.pattern_type, femaleF.pattern_type),
    ...predictTailOutcomes(male.tail_type, femaleF.tail_type),
  ]

  if (maleFinnage === 'show-quality' && femaleFinnage === 'show-quality') {
    likelyOutcomes.push('Matched show-quality finnage parents — above-average fin development expected across spawn')
  } else if (maleFinnage === 'strong' || femaleFinnage === 'strong') {
    likelyOutcomes.push('At least one show-grade fin parent — select strong finnage fry early for holdbacks')
  }

  if (maleBody === 'show-quality' && femaleBody === 'show-quality') {
    likelyOutcomes.push('Both parents carry show-quality body structure — strong, well-proportioned fry expected')
  }

  // --- Rare outcomes ---
  const rareOutcomes: string[] = []
  if (rareChance > 40) {
    if (isMetallicPattern(male.pattern_type) || isMetallicPattern(femaleF.pattern_type)) {
      rareOutcomes.push('Possibility of metallic/iridescent expression breakthrough in select fry')
    }
    if (male.pattern_type === 'koi' || femaleF.pattern_type === 'koi') {
      rareOutcomes.push('Galaxy koi expression possible in rare fry — watch for early color spotting')
    }
    if (male.pattern_type === 'marble' || femaleF.pattern_type === 'marble') {
      rareOutcomes.push('Marble genetics may produce unique color-change individuals — photograph at multiple stages')
    }
  }
  if (male.tail_type === 'double-tail' || femaleF.tail_type === 'double-tail') {
    rareOutcomes.push('Double-tail carriers possible in offspring — can improve finnage fullness in subsequent generations')
  }
  if (rareChance > 60) {
    rareOutcomes.push(`Rare trait expression probability estimated at ${rareChance}% — this is an elite-potential pairing`)
  }

  // --- Warnings ---
  if (compatScore < 50) warnings.push('Low compatibility score — review fish traits and consider an alternative pairing')
  if (maleHealth < 6) warnings.push(`Male health score is ${maleHealth}/10 — ensure optimal conditioning before breeding`)
  if (femaleHealth < 6) warnings.push(`Female health score is ${femaleHealth}/10 — ensure she is fully conditioned before breeding`)
  if (male.status !== 'active') warnings.push(`Male is marked as "${male.status}" — verify availability before pairing`)
  if (femaleF.status !== 'active') warnings.push(`Female is marked as "${femaleF.status}" — verify availability before pairing`)
  if (male.sex !== 'male') warnings.push('Selected male fish is not marked as male in the database — verify sex')
  if (femaleF.sex !== 'female') warnings.push('Selected female fish is not marked as female in the database — verify sex')

  // --- Selection tips ---
  if (predictScore < 50) {
    selectionTips.push('Low predictability pairing — keep detailed fry records from day 1 to identify standout individuals early')
  }
  if (highValuePotential > 70) {
    selectionTips.push('High value potential detected — jar males at 8–10 weeks and photograph every 2 weeks for selection')
  }
  selectionTips.push('Condition both fish for 2–3 weeks on live/frozen foods before introducing them')
  selectionTips.push('Remove female after eggs are laid — she may eat eggs if stressed')

  // --- Cull watch notes ---
  if (maleBody === 'weak' || femaleBody === 'weak') {
    cullWatchNotes.push('Weak body parent — watch for underdeveloped body structure in fry. Cull early.')
  }
  if (male.tail_type === 'rosetail' || femaleF.tail_type === 'rosetail') {
    cullWatchNotes.push('Rosetail genetics present — over-branched fins are not show-worthy. Cull excessive branching at 8 weeks.')
  }
  if (compatScore < 40) {
    cullWatchNotes.push('High incompatibility detected — expect lower overall fry quality. Be selective.')
  }
  cullWatchNotes.push('Watch for fin biting or stress damage in grow-out containers — separate early if observed')

  // --- Breeder recommendation ---
  let breederRecommendation = ''
  if (compatScore >= 80 && highValuePotential >= 70) {
    breederRecommendation = `Strong pairing. Compatibility score of ${compatScore}/100 and high value potential make this a recommended breeding project. Focus on holdback selection at 8–10 weeks.`
  } else if (compatScore >= 65) {
    breederRecommendation = `Solid pairing with ${compatScore}/100 compatibility. Fry quality should be good — manage expectations on pattern predictability and select the best early.`
  } else if (compatScore >= 45) {
    breederRecommendation = `Moderate pairing (${compatScore}/100). Proceed with caution — address any health concerns first and monitor the spawn closely.`
  } else {
    breederRecommendation = `Low compatibility (${compatScore}/100). This pairing has significant concerns. Review warnings and consider an alternative pairing if possible.`
  }

  // --- Holdback advice ---
  let holdbackAdvice = ''
  if (highValuePotential >= 80) {
    holdbackAdvice = 'This is a high-potential spawn. Keep 3–5 males and 2–3 females as holdbacks. Prioritize rare pattern expression, finnage symmetry, and body structure.'
  } else if (highValuePotential >= 55) {
    holdbackAdvice = 'Keep 2–3 standout males as holdbacks. Look for the best combination of pattern clarity, finnage spread, and body proportions.'
  } else {
    holdbackAdvice = 'Keep 1–2 holdbacks that best represent the breeding goal. Focus on health and structure over aesthetics for future pairings.'
  }

  return {
    compatibilityScore: compatScore,
    predictabilityScore: predictScore,
    rareTraitChance: rareChance,
    highValuePotential,
    likelyOutcomes,
    rareOutcomes,
    warnings,
    breederRecommendation,
    selectionTips,
    cullWatchNotes,
    holdbackAdvice,
  }
}

// Inbreeding check utility
export function detectInbreeding(
  fish1Id: string,
  fish2Id: string,
  lineageLinks: Array<{ parent_fish_id: string; child_fish_id: string }>
): { isRelated: boolean; relationship: string | null } {
  // Check direct parent-child
  const isParentChild = lineageLinks.some(
    (link) =>
      (link.parent_fish_id === fish1Id && link.child_fish_id === fish2Id) ||
      (link.parent_fish_id === fish2Id && link.child_fish_id === fish1Id)
  )
  if (isParentChild) return { isRelated: true, relationship: 'parent-child' }

  // Check shared parents (siblings)
  const fish1Parents = lineageLinks
    .filter((l) => l.child_fish_id === fish1Id)
    .map((l) => l.parent_fish_id)
  const fish2Parents = lineageLinks
    .filter((l) => l.child_fish_id === fish2Id)
    .map((l) => l.parent_fish_id)

  const sharedParents = fish1Parents.filter((p) => fish2Parents.includes(p))
  if (sharedParents.length > 0) return { isRelated: true, relationship: 'siblings' }

  return { isRelated: false, relationship: null }
}
