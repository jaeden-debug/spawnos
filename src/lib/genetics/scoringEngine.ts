import type { Fish } from '@/types/fish'
import type { ValuePotentialOutput, ValuePotentialTier } from '@/types/genetics'
import {
  PATTERN_RARITY,
  PATTERN_VALUE_WEIGHT,
  SCALE_VALUE_WEIGHT,
  TAIL_SHOW_WEIGHT,
  FINNAGE_QUALITY_WEIGHT,
  BODY_QUALITY_WEIGHT,
} from './bettaTraits'

export function calculateRarityScore(fish: Fish): number {
  let score = 0

  // Pattern rarity
  if (fish.pattern_type) {
    score += (PATTERN_RARITY[fish.pattern_type] ?? 1) * 8
  }

  // Scale type
  if (fish.scale_type) {
    const scaleWeight = SCALE_VALUE_WEIGHT[fish.scale_type] ?? 0.7
    score += (scaleWeight - 0.7) * 30
  }

  // Tail type
  if (fish.tail_type) {
    const tailWeight = TAIL_SHOW_WEIGHT[fish.tail_type] ?? 0.8
    score += (tailWeight - 0.8) * 20
  }

  // Finnage quality
  if (fish.finnage) {
    const finnWeight = FINNAGE_QUALITY_WEIGHT[fish.finnage] ?? 0.6
    score += (finnWeight - 0.6) * 20
  }

  return Math.max(1, Math.min(100, Math.round(score)))
}

export function calculateValuePotential(fish: Fish): ValuePotentialOutput {
  const traits = fish.traits ?? {}
  const healthScore = Number(traits.health_score ?? 7)
  const finnage = fish.finnage ?? 'average'
  const body = fish.body_type ?? 'average'

  let totalScore = 0
  const whatToLookFor: string[] = []
  const holdbackTraits: string[] = []
  const bestSellingTraits: string[] = []
  const unstableTraits: string[] = []

  // Pattern contribution
  const patternWeight = fish.pattern_type ? PATTERN_VALUE_WEIGHT[fish.pattern_type] ?? 0.7 : 0.5
  totalScore += patternWeight * 30

  // Scale contribution
  const scaleWeight = fish.scale_type ? SCALE_VALUE_WEIGHT[fish.scale_type] ?? 0.7 : 0.7
  totalScore += scaleWeight * 15

  // Tail contribution
  const tailWeight = fish.tail_type ? TAIL_SHOW_WEIGHT[fish.tail_type] ?? 0.8 : 0.8
  totalScore += tailWeight * 20

  // Finnage contribution
  const finnWeight = FINNAGE_QUALITY_WEIGHT[finnage] ?? 0.6
  totalScore += finnWeight * 20

  // Body contribution
  const bodyWeight = BODY_QUALITY_WEIGHT[body] ?? 0.6
  totalScore += bodyWeight * 15

  // Health modifier
  const healthModifier = (healthScore - 5) * 1.5
  totalScore += healthModifier

  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)))

  // Determine tier
  let tier: ValuePotentialTier
  if (totalScore >= 80) tier = 'elite'
  else if (totalScore >= 65) tier = 'high'
  else if (totalScore >= 45) tier = 'medium'
  else tier = 'low'

  // Build advice
  if (fish.pattern_type === 'koi' || fish.pattern_type === 'galaxy' || fish.pattern_type === 'nemo') {
    bestSellingTraits.push(`${fish.pattern_type} pattern expression — highly sought by hobbyists`)
    holdbackTraits.push(`Best ${fish.pattern_type} color contrast and density`)
  }
  if (fish.pattern_type === 'marble') {
    unstableTraits.push('Marble gene — colors will shift, final pattern unpredictable')
    whatToLookFor.push('Photograph offspring at 3, 6, and 12 months — marble coloration develops over time')
  }
  if (fish.pattern_type === 'samurai' || fish.pattern_type === 'avatar' || fish.pattern_type === 'alien') {
    bestSellingTraits.push(`Rare ${fish.pattern_type} pattern — premium collector market`)
    holdbackTraits.push(`Purest ${fish.pattern_type} expression — prioritize for future breeding lines`)
  }
  if (fish.scale_type === 'dragon-scale' || fish.scale_type === 'metallic') {
    bestSellingTraits.push(`${fish.scale_type} scale expression — metallic finish adds significant market value`)
  }
  if (fish.tail_type === 'halfmoon' || fish.tail_type === 'super-delta') {
    holdbackTraits.push(`${fish.tail_type} tail — keep the most symmetrical and full-spread individuals`)
    whatToLookFor.push('180° spread or close to it — this is the primary show selection criterion')
  }
  if (finnage === 'show-quality') {
    holdbackTraits.push('Show-quality finnage — highest priority holdback characteristic')
    whatToLookFor.push('No tears, even spread, no biting damage by jarring time')
  }
  if (finnage === 'low') {
    unstableTraits.push('Low finnage quality noted — may require 2+ generations of line improvement')
  }
  if (body === 'show-quality') {
    holdbackTraits.push('Show-quality body structure — strong backbone and proportional head-to-body ratio')
  }
  if (healthScore < 6) {
    unstableTraits.push(`Health score ${healthScore}/10 — improve condition before breeding or selling`)
  }

  if (whatToLookFor.length === 0) whatToLookFor.push('Balanced expression of color, pattern, and finnage in fry')
  if (holdbackTraits.length === 0) holdbackTraits.push('Best overall structure and color clarity for future breeding')
  if (bestSellingTraits.length === 0) bestSellingTraits.push('Healthy individuals with clean finnage and clear color expression')

  const reasoning = `${fish.name} scores ${totalScore}/100 value potential. ` +
    (tier === 'elite' ? 'Elite tier — exceptional rarity, quality, and market appeal. Prioritize for show and selective breeding.' :
    tier === 'high' ? 'High tier — strong genetics with notable pattern or quality traits. Excellent breeding candidate.' :
    tier === 'medium' ? 'Medium tier — solid foundation fish with room to improve through selective pairing.' :
    'Low tier — best suited as a pet quality or background genetics fish. Pair with high-quality specimens to improve line.')

  return {
    tier,
    score: totalScore,
    whatToLookFor,
    holdbackTraits,
    bestSellingTraits,
    unstableTraits,
    reasoning,
  }
}

export function calculateSurvivalStats(
  estimatedEggs: number,
  estimatedHatched: number,
  currentFryCount: number,
  stage: string
) {
  const hatchRate = estimatedEggs > 0 ? (estimatedHatched / estimatedEggs) * 100 : 0
  const survivalRate = estimatedHatched > 0 ? (currentFryCount / estimatedHatched) * 100 : 0
  const lossCount = Math.max(0, estimatedHatched - currentFryCount)
  const warnings: string[] = []

  if (hatchRate < 30) warnings.push('Very low hatch rate — check water temperature, bubble nest stability, and male behavior during hatching')
  else if (hatchRate < 60) warnings.push('Below-average hatch rate — monitor water quality and temperature consistency')

  if (survivalRate < 20) warnings.push('Critical fry loss detected — check for disease, poor water quality, or predation')
  else if (survivalRate < 50) warnings.push('Below-average survival rate — increase water change frequency and feeding quality')
  else if (survivalRate < 75) warnings.push('Moderate survival — normal range, but room to improve with infusoria/live foods')

  const stageNotes: Record<string, string> = {
    eggs: 'Eggs are developing — maintain stable temperature 78–82°F, ensure male is tending the nest',
    wrigglers: 'Wrigglers hatching — do not disturb the tank, male will retrieve fallen fry',
    'free-swimming': 'Fry are free-swimming — start feeding infusoria or commercial fry food 4–6x daily',
    growout: 'Grow-out phase — feed BBS, micro worms, or high-quality crushed flake 3–4x daily. Begin jarring at 8–10 weeks',
    jarring: 'Jarring males — ensure adequate space (at least 1L per fish), watch for fin damage',
    juvenile: 'Juvenile stage — full color developing. Begin trait selection and documentation',
    sold: 'Spawn sold/distributed — document final numbers for breeding records',
  }

  return {
    hatchRate: Math.round(hatchRate * 10) / 10,
    survivalRate: Math.round(survivalRate * 10) / 10,
    lossCount,
    stageNotes: stageNotes[stage] ?? 'Track fry count regularly and maintain water quality',
    warnings,
    isHealthy: warnings.length === 0,
  }
}
