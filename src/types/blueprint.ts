export interface BlueprintFormInput {
  tankSize: number          // gallons
  waterType: 'freshwater' | 'brackish' | 'saltwater'
  experience: 'beginner' | 'intermediate' | 'advanced'
  primaryGoal: 'community' | 'biotope' | 'planted' | 'breeding' | 'species-only' | 'nano'
  budget: 'budget' | 'mid-range' | 'premium'
  maintenance: 'low' | 'moderate' | 'high'
  includeBreeding: boolean
  notes?: string
}

export interface BlueprintSpeciesSuggestion {
  commonName: string
  scientificName: string
  count: string
  role: string
  notes: string
}

export interface BlueprintSection {
  title: string
  content: string
}

export interface BlueprintOutput {
  title: string
  summary: string
  stockingList: BlueprintSpeciesSuggestion[]
  parameters: {
    temp: string
    ph: string
    gh: string
    kh: string
    nitrate: string
  }
  substrate: string
  filtration: string
  lighting: string
  plants: string[]
  hardscape: string
  sections: BlueprintSection[]
  warnings: string[]
  generatedAt: string       // ISO timestamp
  mockMode?: boolean
}
