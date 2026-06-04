export interface PredictionOutput {
  compatibilityScore: number
  predictabilityScore: number
  rareTraitChance: number
  highValuePotential: number
  likelyOutcomes: string[]
  rareOutcomes: string[]
  warnings: string[]
  breederRecommendation: string
  selectionTips: string[]
  cullWatchNotes: string[]
  holdbackAdvice: string
}

export type ValuePotentialTier = 'low' | 'medium' | 'high' | 'elite'

export interface ValuePotentialOutput {
  tier: ValuePotentialTier
  score: number
  whatToLookFor: string[]
  holdbackTraits: string[]
  bestSellingTraits: string[]
  unstableTraits: string[]
  reasoning: string
}

export interface SurvivalStats {
  hatchRate: number
  survivalRate: number
  lossCount: number
  stageNotes: string
  warnings: string[]
  isHealthy: boolean
}

export interface TraitCompatibility {
  score: number
  notes: string[]
  concerns: string[]
}
