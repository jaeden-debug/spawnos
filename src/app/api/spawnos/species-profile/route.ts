import { NextRequest } from 'next/server'
import {
  authenticateAppRequest,
  meterUsage,
  recordUsage,
  json,
  openAIKey,
  chatCompletion,
} from '@/lib/spawnos-app-ai'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * SpawnOS Species Brain.
 *
 * GET ?code=<species_code>        → return the cached profile (any user's
 *                                   earlier research benefits everyone)
 * GET ?query=<free text species>  → resolve the species; return cached
 *                                   profile if one exists, otherwise research
 *                                   and construct a structured candidate
 *                                   profile server-side, store it with
 *                                   provenance + confidence, and return it.
 *
 * Profiles are versioned rows in spawnos_species_profiles, written only by
 * this trusted route (service role). The model must label its own confidence
 * and is explicitly permitted to say "limited data" rather than invent
 * windows. Bundled app profiles (Betta, Guppy) are SpawnOS-verified and are
 * never overridden by this route.
 */

const PROFILE_SCHEMA = {
  name: 'spawnos_species_profile',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      resolution: {
        type: 'string',
        enum: ['resolved', 'ambiguous', 'unknown'],
        description:
          'resolved = species identified confidently. ambiguous = several species match the query. unknown = cannot identify a real bred species.',
      },
      candidates: {
        type: 'array',
        items: { type: 'string' },
        description: 'If ambiguous: up to 4 candidate species names (common + scientific).',
      },
      common_name: { type: ['string', 'null'] },
      scientific_name: { type: ['string', 'null'] },
      category: {
        type: ['string', 'null'],
        enum: ['freshwater_fish', 'saltwater_fish', 'shrimp', 'snail', 'amphibian', 'reptile', 'bird', 'mammal', 'invertebrate', 'other', null],
      },
      reproductive_model: {
        type: ['string', 'null'],
        enum: ['bubble_nester', 'livebearer', 'egg_scatterer', 'substrate_spawner', 'cave_spawner', 'mouthbrooder', 'shrimp', 'egg_layer', 'gestation', 'incubation', 'unknown', null],
      },
      event_noun: {
        type: ['string', 'null'],
        description: 'What one breeding event is called for this species: Spawn, Drop, Clutch, Litter, Hatch…',
      },
      confidence: {
        type: 'string',
        enum: ['high_confidence', 'general_guidance', 'limited_data'],
        description:
          'high_confidence = timing well-established in husbandry literature. general_guidance = known biology but timing varies substantially. limited_data = not enough reliable information for milestone prediction.',
      },
      has_timeline: {
        type: 'boolean',
        description: 'False when confidence is limited_data or windows would be guesses.',
      },
      stages: {
        type: 'array',
        description:
          'Development/husbandry stages in chronological order, anchored to the breeding event date or to an earlier milestone id. Windows are DAY OFFSETS from the anchor. Only include stages whose timing you can genuinely support; omit rather than guess.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', description: 'stable snake_case id, e.g. hatch, free_swimming' },
            title: { type: 'string' },
            short_title: { type: 'string', description: '1–2 words for buttons' },
            kind: { type: 'string', enum: ['milestone', 'task'] },
            anchor: {
              type: 'string',
              description: '"spawn" for the recorded breeding-event date, or "milestone:<id>" of an earlier stage.',
            },
            window_start_days: { type: 'integer' },
            window_end_days: { type: 'integer' },
            importance: { type: 'string', enum: ['critical', 'normal'] },
            summary: { type: 'string', description: '2–3 sentences of operational guidance.' },
            watch_for: { type: 'array', items: { type: 'string' } },
            learn_more: { type: ['string', 'null'] },
            prepare_ahead: {
              type: ['string', 'null'],
              description: 'What the breeder should have ready BEFORE this stage (e.g. first foods), if anything.',
            },
            prepare_days_before: { type: 'integer', description: '0 if no preparation lead time needed.' },
          },
          required: ['id', 'title', 'short_title', 'kind', 'anchor', 'window_start_days', 'window_end_days', 'importance', 'summary', 'watch_for', 'learn_more', 'prepare_ahead', 'prepare_days_before'],
        },
      },
      prep_steps: {
        type: 'array',
        description: 'Pre-breeding readiness steps shown on the pair screen before any breeding event exists.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['id', 'title', 'detail'],
        },
      },
      sources_note: {
        type: 'string',
        description:
          'Honest provenance: what kind of knowledge supports this profile (established husbandry literature, aquarist convention, sparse anecdote) and which claims are weakest.',
      },
    },
    required: ['resolution', 'candidates', 'common_name', 'scientific_name', 'category', 'reproductive_model', 'event_noun', 'confidence', 'has_timeline', 'stages', 'prep_steps', 'sources_note'],
  },
} as const

const RESEARCH_PROMPT = `You are the SpawnOS Species Brain — you construct structured breeding profiles for the SpawnOS breeding app.

Rules, in priority order:
1. NEVER fabricate biology. If timing for a stage is not well-established, omit the stage or mark the whole profile limited_data with has_timeline=false. An honest "not enough reliable data" is a correct answer.
2. Windows are ranges in whole days relative to their anchor, reflecting real variability (temperature, latitude, line). Use conservative, defensible ranges from established husbandry knowledge.
3. Chronological stages only, each anchored to "spawn" (the recorded breeding event — eggs laid / fry dropped / clutch deposited) or to an earlier milestone id ("milestone:hatch"). kind=milestone for biological events the breeder confirms; kind=task for husbandry actions.
4. Include prepare_ahead on stages the breeder must prepare for in advance (first foods, growout space), with a sensible prepare_days_before.
5. prep_steps are the pre-breeding checklist: conditioning, setup, environmental triggers, first-food cultures, compatibility cautions — max 6, only what genuinely matters.
6. Do not copy Betta splendens timings onto other species. Every number must be defensible for THIS species.
7. If the query is ambiguous (multiple distinct bred species match), return resolution=ambiguous with candidates and nothing else filled. If it isn't a real species that is bred in captivity, return resolution=unknown.`

function codeFrom(scientific: string): string {
  return scientific
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAppRequest(request)
  if ('error' in authResult) return authResult.error
  const { auth } = authResult

  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim()
  const query = url.searchParams.get('query')?.trim()

  if (!code && !query) return json({ error: 'Provide code or query.' }, 400)

  // 1) Cached lookup — the Species Brain grows once, serves everyone.
  if (code) {
    const { data } = await auth.admin
      .from('spawnos_species_profiles')
      .select('*')
      .eq('code', code)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return json({ source: 'cached', ...rowToResponse(data) })
    return json({ error: 'No profile for this species yet.' }, 404)
  }

  const q = query!.slice(0, 120)
  const { data: byName } = await auth.admin
    .from('spawnos_species_profiles')
    .select('*')
    .or(`common_name.ilike.%${q.replace(/[%,]/g, '')}%,scientific_name.ilike.%${q.replace(/[%,]/g, '')}%`)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (byName) return json({ source: 'cached', ...rowToResponse(byName) })

  // 2) Research path — metered like an AI question.
  const quotaError = await meterUsage(auth)
  if (quotaError) return quotaError

  const apiKey = openAIKey()
  if (!apiKey) return json({ error: 'Species research is not configured on this server.' }, 503)

  try {
    const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o'
    const result = await chatCompletion(apiKey, {
      model,
      messages: [
        { role: 'system', content: RESEARCH_PROMPT },
        { role: 'user', content: `Construct a SpawnOS breeding profile for: "${q}"` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_schema', json_schema: PROFILE_SCHEMA },
    })
    if (!('failure' in result)) await recordUsage(auth, 'species-profile', model, result.usage)
    if ('failure' in result) {
      console.error('[spawnos/species-profile]', result.failure)
      return json({ error: 'Species research is temporarily unavailable.' }, 502)
    }
    const raw = result.content

    let profile: Record<string, unknown>
    try {
      profile = JSON.parse(raw)
    } catch {
      return json({ error: 'Species research produced an unusable result. Try again.' }, 502)
    }

    if (profile.resolution === 'ambiguous') {
      return json({ resolution: 'ambiguous', candidates: profile.candidates ?? [] })
    }
    if (profile.resolution === 'unknown' || !profile.scientific_name || !profile.common_name) {
      return json({ resolution: 'unknown', error: `SpawnOS couldn't identify "${q}" as a bred species.` }, 404)
    }

    const speciesCode = codeFrom(profile.scientific_name as string)

    // Another user may have researched it concurrently or under another name.
    const { data: existing } = await auth.admin
      .from('spawnos_species_profiles')
      .select('*')
      .eq('code', speciesCode)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) return json({ source: 'cached', ...rowToResponse(existing) })

    const sources = [
      {
        kind: 'model_generated',
        model,
        retrieved_at: new Date().toISOString(),
        note: profile.sources_note ?? 'Assembled from general husbandry knowledge; unverified by SpawnOS.',
      },
    ]

    const row = {
      code: speciesCode,
      version: 1,
      common_name: profile.common_name,
      scientific_name: profile.scientific_name,
      status: profile.confidence,
      profile,
      sources,
      generated_by: model,
    }

    const { data: inserted, error: insertError } = await auth.admin
      .from('spawnos_species_profiles')
      .insert(row)
      .select('*')
      .single()

    if (insertError) {
      console.error('[species-profile insert]', insertError)
      // Still return the profile even if caching failed.
      return json({ source: 'generated', code: speciesCode, status: profile.confidence, profile, sources })
    }
    return json({ source: 'generated', ...rowToResponse(inserted) })
  } catch (err) {
    console.error('[spawnos/species-profile]', err)
    return json({ error: 'Species research is temporarily unavailable.' }, 502)
  }
}

function rowToResponse(row: Record<string, unknown>) {
  return {
    resolution: 'resolved',
    code: row.code,
    version: row.version,
    status: row.status,
    profile: row.profile,
    sources: row.sources,
  }
}
