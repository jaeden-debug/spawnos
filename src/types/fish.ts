export type FishSex = 'male' | 'female' | 'unknown'
export type FishStatus = 'active' | 'retired' | 'sold' | 'deceased'

export type TailType =
  | 'halfmoon'
  | 'plakat'
  | 'crowntail'
  | 'veiltail'
  | 'double-tail'
  | 'dumbo'
  | 'rosetail'
  | 'delta'
  | 'super-delta'
  | 'wild-type'

export type BaseColor =
  | 'red'
  | 'blue'
  | 'black'
  | 'white'
  | 'yellow'
  | 'orange'
  | 'copper'
  | 'green'
  | 'turquoise'
  | 'cellophane'
  | 'multicolor'

export type PatternType =
  | 'solid'
  | 'marble'
  | 'koi'
  | 'galaxy'
  | 'butterfly'
  | 'dragon'
  | 'grizzle'
  | 'cambodian'
  | 'mustard-gas'
  | 'nemo'
  | 'avatar'
  | 'samurai'
  | 'alien'

export type ScaleType = 'normal' | 'dragon-scale' | 'metallic' | 'iridescent' | 'opaque'

export type FinQuality = 'low' | 'average' | 'strong' | 'show-quality'
export type BodyQuality = 'weak' | 'average' | 'strong' | 'show-quality'
export type AggressionLevel = 'low' | 'medium' | 'high'
export type FertilityConfidence = 'unknown' | 'low' | 'medium' | 'high'

export interface FishTraits {
  aggression_level?: AggressionLevel
  health_score?: number
  fertility_confidence?: FertilityConfidence
  finnage_quality?: FinQuality
  body_quality?: BodyQuality
  [key: string]: unknown
}

export interface Fish {
  id: string
  user_id: string
  name: string
  sex: FishSex
  species: string
  strain: string | null
  tail_type: TailType | null
  color_base: BaseColor | null
  pattern_type: PatternType | null
  scale_type: ScaleType | null
  finnage: FinQuality | null
  body_type: BodyQuality | null
  eye_color: string | null
  traits: FishTraits | null
  genotype_notes: string | null
  breeder_notes: string | null
  rarity_score: number | null
  estimated_value_range: string | null
  photo_url: string | null
  birth_date: string | null
  acquired_date: string | null
  status: FishStatus
  created_at: string
  updated_at: string
}

export const TAIL_TYPE_OPTIONS: { value: TailType; label: string }[] = [
  { value: 'halfmoon', label: 'Halfmoon' },
  { value: 'plakat', label: 'Plakat' },
  { value: 'crowntail', label: 'Crowntail' },
  { value: 'veiltail', label: 'Veiltail' },
  { value: 'double-tail', label: 'Double Tail' },
  { value: 'dumbo', label: 'Dumbo / Elephant Ear' },
  { value: 'rosetail', label: 'Rosetail' },
  { value: 'delta', label: 'Delta' },
  { value: 'super-delta', label: 'Super Delta' },
  { value: 'wild-type', label: 'Wild Type' },
]

export const BASE_COLOR_OPTIONS: { value: BaseColor; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'copper', label: 'Copper' },
  { value: 'green', label: 'Green' },
  { value: 'turquoise', label: 'Turquoise' },
  { value: 'cellophane', label: 'Cellophane' },
  { value: 'multicolor', label: 'Multicolor' },
]

export const PATTERN_TYPE_OPTIONS: { value: PatternType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'marble', label: 'Marble' },
  { value: 'koi', label: 'Koi' },
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'butterfly', label: 'Butterfly' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'grizzle', label: 'Grizzle' },
  { value: 'cambodian', label: 'Cambodian' },
  { value: 'mustard-gas', label: 'Mustard Gas' },
  { value: 'nemo', label: 'Nemo' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'samurai', label: 'Samurai' },
  { value: 'alien', label: 'Alien' },
]

export const SCALE_TYPE_OPTIONS: { value: ScaleType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'dragon-scale', label: 'Dragon Scale' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'iridescent', label: 'Iridescent' },
  { value: 'opaque', label: 'Opaque' },
]
