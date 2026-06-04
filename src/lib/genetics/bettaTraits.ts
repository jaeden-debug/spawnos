import type { PatternType, ScaleType, BaseColor, TailType, FinQuality, BodyQuality } from '@/types/fish'

// Rarity tiers for patterns (higher = rarer)
export const PATTERN_RARITY: Record<PatternType, number> = {
  solid: 1,
  butterfly: 2,
  grizzle: 2,
  cambodian: 2,
  'mustard-gas': 3,
  marble: 3,
  koi: 4,
  dragon: 4,
  galaxy: 5,
  nemo: 5,
  avatar: 6,
  samurai: 6,
  alien: 7,
}

// Value multiplier for patterns
export const PATTERN_VALUE_WEIGHT: Record<PatternType, number> = {
  solid: 0.6,
  butterfly: 0.8,
  grizzle: 0.75,
  cambodian: 0.7,
  'mustard-gas': 0.9,
  marble: 1.0,
  koi: 1.2,
  dragon: 1.1,
  galaxy: 1.4,
  nemo: 1.3,
  avatar: 1.5,
  samurai: 1.4,
  alien: 1.6,
}

// Metallic/iridescent scales increase expression odds
export const SCALE_VALUE_WEIGHT: Record<ScaleType, number> = {
  normal: 0.7,
  opaque: 0.8,
  iridescent: 1.0,
  metallic: 1.2,
  'dragon-scale': 1.3,
}

// Tail type show potential
export const TAIL_SHOW_WEIGHT: Record<TailType, number> = {
  'wild-type': 0.4,
  veiltail: 0.5,
  plakat: 0.8,
  delta: 0.8,
  'super-delta': 1.0,
  crowntail: 0.9,
  halfmoon: 1.2,
  'double-tail': 1.1,
  dumbo: 1.1,
  rosetail: 1.0,
}

// Finnage quality weights
export const FINNAGE_QUALITY_WEIGHT: Record<FinQuality, number> = {
  low: 0.3,
  average: 0.6,
  strong: 0.9,
  'show-quality': 1.2,
}

// Body quality weights
export const BODY_QUALITY_WEIGHT: Record<BodyQuality, number> = {
  weak: 0.2,
  average: 0.6,
  strong: 0.9,
  'show-quality': 1.2,
}

// Color pairing compatibility map (0–1 scale)
export const COLOR_COMPATIBILITY: Partial<Record<BaseColor, Partial<Record<BaseColor, number>>>> = {
  red: { red: 0.9, orange: 0.8, copper: 0.8, yellow: 0.7, white: 0.6, blue: 0.5, black: 0.7 },
  blue: { blue: 0.9, turquoise: 0.9, green: 0.8, black: 0.7, white: 0.6, red: 0.5 },
  black: { black: 0.9, copper: 0.8, red: 0.7, blue: 0.7, white: 0.6 },
  turquoise: { turquoise: 0.9, blue: 0.9, green: 0.8 },
  copper: { copper: 0.9, red: 0.8, orange: 0.8, black: 0.8 },
  green: { green: 0.9, turquoise: 0.8, blue: 0.7 },
  white: { white: 0.8, cellophane: 0.9, blue: 0.6, yellow: 0.7 },
  cellophane: { cellophane: 0.9, white: 0.9, yellow: 0.7 },
  yellow: { yellow: 0.9, orange: 0.8, red: 0.7, white: 0.7 },
  orange: { orange: 0.9, red: 0.8, yellow: 0.8, copper: 0.7 },
  multicolor: { multicolor: 0.7, marble: 0.7 } as Partial<Record<BaseColor, number>>,
}

// Patterns that are "variable" (high variance, low predictability)
export const VARIABLE_PATTERNS: PatternType[] = ['marble', 'koi', 'galaxy', 'alien']

// Patterns that are metallic/scale-linked
export const METALLIC_PATTERNS: PatternType[] = ['dragon', 'samurai', 'galaxy', 'avatar']

// High-value pattern combinations
export const HIGH_VALUE_COMBOS: [PatternType, PatternType][] = [
  ['koi', 'galaxy'],
  ['koi', 'nemo'],
  ['samurai', 'dragon'],
  ['avatar', 'galaxy'],
  ['alien', 'galaxy'],
]

export function getColorCompatibility(a: BaseColor | null, b: BaseColor | null): number {
  if (!a || !b) return 0.5
  const forward = COLOR_COMPATIBILITY[a]?.[b]
  const reverse = COLOR_COMPATIBILITY[b]?.[a]
  const score = forward ?? reverse ?? 0.5
  return score
}

export function isHighValueCombo(a: PatternType | null, b: PatternType | null): boolean {
  if (!a || !b) return false
  return HIGH_VALUE_COMBOS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  )
}

export function isVariablePattern(p: PatternType | null): boolean {
  if (!p) return false
  return VARIABLE_PATTERNS.includes(p)
}

export function isMetallicPattern(p: PatternType | null): boolean {
  if (!p) return false
  return METALLIC_PATTERNS.includes(p)
}

export function getPatternRarity(p: PatternType | null): number {
  if (!p) return 1
  return PATTERN_RARITY[p] ?? 1
}

export function predictColorOutcomes(
  maleColor: BaseColor | null,
  femaleColor: BaseColor | null,
  malePattern: PatternType | null,
  femalePattern: PatternType | null
): string[] {
  const outcomes: string[] = []
  const colors = [maleColor, femaleColor].filter(Boolean) as BaseColor[]
  const patterns = [malePattern, femalePattern].filter(Boolean) as PatternType[]

  if (colors.length === 0) {
    outcomes.push('Color prediction unavailable — no base colors entered')
    return outcomes
  }

  // Same color parent prediction
  if (maleColor === femaleColor && maleColor) {
    outcomes.push(`~70–85% ${maleColor} base expression — high predictability from matched parents`)
  } else if (colors.length === 2) {
    outcomes.push(`Mixed ${colors[0]} × ${colors[1]} offspring — expect split expression`)
    if (getColorCompatibility(maleColor, femaleColor) > 0.75) {
      outcomes.push(`High color harmony — blended tones likely (e.g., ${colors[0]}/${colors[1]} bicolor possible)`)
    }
  }

  // Pattern-influenced color notes
  if (patterns.includes('marble') || patterns.includes('koi')) {
    outcomes.push('Marble/koi influence may produce unpredictable color shifting in offspring')
    outcomes.push('Offspring colors may change significantly over first 6–12 months')
  }
  if (patterns.includes('dragon') || patterns.includes('samurai')) {
    outcomes.push('Dragon/samurai genetics may produce metallic color overlay in some fry')
  }
  if (patterns.includes('galaxy')) {
    outcomes.push('Galaxy patterning may introduce iridescent flecking across any base color')
  }
  if (patterns.includes('mustard-gas')) {
    outcomes.push('Mustard gas genetics may produce body/fin bicolor split in offspring')
  }

  return outcomes
}

export function predictTailOutcomes(
  maleTail: TailType | null,
  femaleTail: TailType | null
): string[] {
  const outcomes: string[] = []
  if (!maleTail || !femaleTail) {
    outcomes.push('Tail prediction unavailable — enter tail types for both fish')
    return outcomes
  }

  if (maleTail === femaleTail) {
    outcomes.push(`~60–75% chance of ${maleTail} tail type — matched-tail crossing`)
    outcomes.push('Type stability is high when both parents share the same tail form')
  } else {
    outcomes.push(`Mixed tail crossing (${maleTail} × ${femaleTail}) — variable outcomes expected`)
    const showMale = TAIL_SHOW_WEIGHT[maleTail]
    const showFemale = TAIL_SHOW_WEIGHT[femaleTail]
    const avg = (showMale + showFemale) / 2
    if (avg >= 1.0) {
      outcomes.push('Both parents have strong tail form — above-average show potential in offspring likely')
    } else if (avg < 0.6) {
      outcomes.push('One or both parents have lower-grade tail form — finnage quality may vary widely')
    }
  }

  // Special combos
  if ((maleTail === 'halfmoon' && femaleTail === 'halfmoon') ||
      (maleTail === 'super-delta' && femaleTail === 'super-delta')) {
    outcomes.push('⭐ Matched high-grade tail pairing — excellent show potential across the spawn')
  }
  if (maleTail === 'double-tail' || femaleTail === 'double-tail') {
    outcomes.push('Double-tail gene may appear in ~25% of offspring as carriers or expressers')
  }
  if (maleTail === 'rosetail' || femaleTail === 'rosetail') {
    outcomes.push('Caution: rosetail may introduce over-branching — select only for finnage quality')
  }

  return outcomes
}
