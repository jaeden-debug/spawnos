/**
 * SpawnOS Species Database — CMS Data Layer
 *
 * This module provides all species data access functions.
 * In production: reads from Supabase.
 * With Supabase unconfigured: falls back to static data in src/data/species.ts.
 *
 * This means the site works fully without env vars (public tools, species pages)
 * and gains CMS capabilities (admin edits, publishing, content tracking) when
 * Supabase is connected.
 */

import { SPECIES_DATA } from '@/data/species'
import type { SpeciesData } from '@/types/species'

// ─── Parameter Range Type ──────────────────────────────────────────────────
export interface ParamRange {
  min: number
  max: number
  ideal_min?: number
  ideal_max?: number
  unit: string
  note?: string
}

// ─── CMS Species Record (Supabase row shape) ────────────────────────────────
export interface CMSSpecies {
  id: string
  slug: string
  common_name: string
  scientific_name: string
  family: string
  order_name: string | null
  class_name: string | null
  category: 'freshwater' | 'saltwater' | 'shrimp' | 'amphibian' | 'turtle' | 'invertebrate' | 'live_food'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  temperament: 'peaceful' | 'semi-aggressive' | 'aggressive' | 'community' | 'species-only'
  lifespan_years_min: number | null
  lifespan_years_max: number | null
  adult_size_cm_min: number | null
  adult_size_cm_max: number | null
  min_tank_litres: number | null
  origin_regions: string[]
  origin_countries: string[]
  param_temp: ParamRange | null
  param_ph: ParamRange | null
  param_gh: ParamRange | null
  param_kh: ParamRange | null
  param_tds: ParamRange | null
  param_ammonia: ParamRange | null
  param_nitrite: ParamRange | null
  param_nitrate: ParamRange | null
  param_salinity: ParamRange | null
  param_flow: string | null
  param_lighting: string | null
  care_substrate: string[]
  care_plants: string[]
  care_filtration: string | null
  care_diet: string[]
  care_feeding_freq: string | null
  care_social: string | null
  compatible_with: string[]
  incompatible_with: string[]
  recommend_daphnia: boolean
  recommend_scuds: boolean
  recommend_microworms: boolean
  recommend_bbs: boolean
  blackwater_note: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[]
  hero_color: string
  published: boolean
  featured: boolean
  content_word_count: number
  last_reviewed: string | null
  updated_at: string
  faq_count?: number
  reference_count?: number
}

export interface CMSSpeciesFAQ {
  id: string
  species_id: string
  question: string
  answer: string
  sort_order: number
  schema_ready: boolean
}

export interface CMSSpeciesReference {
  id: string
  species_id: string
  citation: string
  url: string | null
  source_type: string | null
  year: number | null
  sort_order: number
}

// ─── Supabase availability check ────────────────────────────────────────────
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// ─── Convert static SpeciesData to CMSSpecies shape ─────────────────────────
// This allows the page template to work with a single type regardless of data source.
function staticToCMS(s: SpeciesData): CMSSpecies {
  const p = s.parameters
  return {
    id: s.slug,
    slug: s.slug,
    common_name: s.commonName,
    scientific_name: s.scientificName,
    family: s.family,
    order_name: null,
    class_name: null,
    category: (s.tags.includes('saltwater') ? 'saltwater' : s.tags.includes('shrimp') ? 'shrimp' : 'freshwater') as CMSSpecies['category'],
    difficulty: s.difficulty as CMSSpecies['difficulty'],
    temperament: 'peaceful' as CMSSpecies['temperament'],
    lifespan_years_min: null,
    lifespan_years_max: null,
    adult_size_cm_min: null,
    adult_size_cm_max: null,
    min_tank_litres: s.care.tankSizeMin ? Math.round(s.care.tankSizeMin * 3.785) : null,
    origin_regions: s.origin,
    origin_countries: [],
    param_temp: { min: p.tempMin, max: p.tempMax, unit: '°F' },
    param_ph: { min: p.phMin, max: p.phMax, unit: 'pH' },
    param_gh: { min: p.ghMin, max: p.ghMax, unit: 'dGH' },
    param_kh: p.kh ? { min: parseFloat(String(p.kh).split('–')[0] ?? '0'), max: parseFloat(String(p.kh).split('–')[1] ?? '10'), unit: 'dKH' } : null,
    param_tds: p.tdsMin != null ? { min: p.tdsMin, max: p.tdsMax ?? p.tdsMin, unit: 'ppm' } : null,
    param_ammonia: { min: 0, max: 0, unit: 'mg/L' },
    param_nitrite: { min: 0, max: 0, unit: 'mg/L' },
    param_nitrate: { min: 0, max: 20, unit: 'mg/L' },
    param_salinity: null,
    param_flow: null,
    param_lighting: null,
    care_substrate: [],
    care_plants: [],
    care_filtration: null,
    care_diet: s.care.diet ? s.care.diet.split(', ') : [],
    care_feeding_freq: null,
    care_social: null,
    compatible_with: s.care.compatibleWith ?? [],
    incompatible_with: s.care.incompatibleWith ?? [],
    recommend_daphnia: false,
    recommend_scuds: false,
    recommend_microworms: false,
    recommend_bbs: false,
    blackwater_note: null,
    seo_title: s.seoTitle,
    seo_description: s.seoDescription,
    seo_keywords: [],
    hero_color: s.heroColor ?? '#00d4ff',
    published: true,
    featured: false,
    content_word_count: 0,
    last_reviewed: s.lastUpdated,
    updated_at: s.lastUpdated,
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get all published species slugs — used by generateStaticParams.
 * Always returns static slugs + any extra slugs from Supabase.
 */
export async function getAllSpeciesSlugs(): Promise<string[]> {
  const staticSlugs = SPECIES_DATA.map((s) => s.slug)

  if (!isSupabaseConfigured()) {
    return staticSlugs
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase
      .from('species')
      .select('slug')
      .eq('published', true)

    if (data && data.length > 0) {
      // Merge Supabase slugs with static slugs (Supabase is authoritative)
      const dbSlugs = data.map((r: { slug: string }) => r.slug)
      const merged = Array.from(new Set([...dbSlugs, ...staticSlugs]))
      return merged
    }
  } catch {
    // Supabase unavailable — fall back to static
  }

  return staticSlugs
}

/**
 * Get a single species record by slug.
 * Supabase first, static data fallback.
 */
export async function getSpeciesRecord(slug: string): Promise<CMSSpecies | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('species_with_stats')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (data) return data as CMSSpecies
    } catch {
      // Fall through to static
    }
  }

  // Static fallback
  const staticSpecies = SPECIES_DATA.find((s) => s.slug === slug)
  if (!staticSpecies) return null
  return staticToCMS(staticSpecies)
}

/**
 * Get all FAQs for a species.
 */
export async function getSpeciesFAQ(speciesId: string): Promise<CMSSpeciesFAQ[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('species_faq')
        .select('*')
        .eq('species_id', speciesId)
        .order('sort_order', { ascending: true })

      if (data && data.length > 0) return data as CMSSpeciesFAQ[]
    } catch {
      // Fall through to static
    }
  }

  // Static fallback
  const staticSpecies = SPECIES_DATA.find((s) => s.slug === speciesId)
  if (!staticSpecies?.faq) return []
  return staticSpecies.faq.map((q, i) => ({
    id: `${speciesId}-faq-${i}`,
    species_id: speciesId,
    question: q.q,
    answer: q.a,
    sort_order: i,
    schema_ready: true,
  }))
}

/**
 * Get references for a species.
 */
export async function getSpeciesReferences(speciesId: string): Promise<CMSSpeciesReference[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase
      .from('species_references')
      .select('*')
      .eq('species_id', speciesId)
      .order('sort_order', { ascending: true })

    return (data ?? []) as CMSSpeciesReference[]
  } catch {
    return []
  }
}

/**
 * Get species list for hub page (all categories, with optional filter).
 */
export async function getSpeciesList(opts?: {
  category?: CMSSpecies['category']
  difficulty?: CMSSpecies['difficulty']
  limit?: number
}): Promise<CMSSpecies[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      let query = supabase
        .from('species_with_stats')
        .select('*')
        .eq('published', true)

      if (opts?.category) query = query.eq('category', opts.category)
      if (opts?.difficulty) query = query.eq('difficulty', opts.difficulty)
      if (opts?.limit) query = query.limit(opts.limit)

      query = query.order('common_name', { ascending: true })

      const { data } = await query
      if (data && data.length > 0) return data as CMSSpecies[]
    } catch {
      // Fall through
    }
  }

  // Static fallback — convert all static species
  let list = SPECIES_DATA.map(staticToCMS)
  if (opts?.category) list = list.filter((s) => s.category === opts.category)
  if (opts?.difficulty) list = list.filter((s) => s.difficulty === opts.difficulty)
  if (opts?.limit) list = list.slice(0, opts.limit)
  return list.sort((a, b) => a.common_name.localeCompare(b.common_name))
}

/**
 * Get featured species for homepage.
 */
export async function getFeaturedSpecies(limit = 6): Promise<CMSSpecies[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('species_with_stats')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .limit(limit)
        .order('common_name', { ascending: true })

      if (data && data.length > 0) return data as CMSSpecies[]
    } catch {
      // Fall through
    }
  }

  return SPECIES_DATA.slice(0, limit).map(staticToCMS)
}

/**
 * Full-text search species (Supabase only — client-side fallback for static).
 */
export async function searchSpecies(query: string): Promise<CMSSpecies[]> {
  if (!query.trim()) return getSpeciesList()

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Try full-text search first
      const { data: ftsData } = await supabase
        .from('species')
        .select('*')
        .textSearch('search_vector', query)
        .eq('published', true)

      if (ftsData && ftsData.length > 0) return ftsData as CMSSpecies[]

      // Fall back to ilike
      const { data: ilikeData } = await supabase
        .from('species')
        .select('*')
        .eq('published', true)
        .or(`common_name.ilike.%${query}%,scientific_name.ilike.%${query}%`)

      return (ilikeData ?? []) as CMSSpecies[]
    } catch {
      // Fall through
    }
  }

  // Client-side filter on static data
  const q = query.toLowerCase()
  return SPECIES_DATA
    .filter(
      (s) =>
        s.commonName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q)
    )
    .map(staticToCMS)
}
