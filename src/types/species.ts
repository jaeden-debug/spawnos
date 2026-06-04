export interface WaterParameters {
  tempMin: number       // °F
  tempMax: number       // °F
  phMin: number
  phMax: number
  ghMin: number         // dGH
  ghMax: number
  kh?: string           // dKH range as string e.g. "2–8"
  tdsMin?: number       // ppm
  tdsMax?: number
  conductivity?: string // µS/cm range
  ammonia: 0            // always 0
  nitrite: 0            // always 0
  nitrateMax: number    // ppm
  oxygenMin?: number    // mg/L
}

export interface CareProfile {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  activityLevel: 'Low' | 'Moderate' | 'High'
  socialBehavior: string      // e.g. "Solitary — males must be kept alone"
  schoolingMin?: number       // minimum school size (if schooling)
  tankSizeMin: number         // gallons
  tankSizeRecommended: number
  lifespan: string            // e.g. "2–4 years"
  maxSize: string             // e.g. "2.5 inches (6.4 cm)"
  diet: string
  feedingFrequency: string
  compatibleWith: string[]
  incompatibleWith: string[]
  breeding: string
}

export interface SpeciesData {
  slug: string
  commonName: string
  scientificName: string
  family: string
  origin: string[]
  habitat: string
  description: string         // 2–3 sentences for card previews
  longDescription: string     // Full paragraph for species page intro
  parameters: WaterParameters
  care: CareProfile
  tags: string[]              // e.g. ["labyrinth fish", "betta", "blackwater"]
  difficulty: CareProfile['difficulty']
  heroColor: string           // Tailwind color for accent on species card
  imageAlt: string
  seoTitle: string
  seoDescription: string
  faq: { q: string; a: string }[]
  relatedSlugs: string[]
  lastUpdated: string         // ISO date
}
