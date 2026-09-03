import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared plumbing for the native-app AI routes (/api/spawnos/assistant and
 * /api/spawnos/species-profile).
 *
 * The iOS app authenticates with the user's Supabase access token as a
 * Bearer header. We validate it server-side, resolve the user's tier from
 * the same `profiles` row the website/Stripe webhook maintains, and meter
 * free-tier usage in `spawnos_ai_usage` (per-user, per-UTC-day — the app
 * can't use the website's browser-cookie quota).
 *
 * The OpenAI key never leaves this server. The model gets structured
 * context and returns structured proposals; it has no database access.
 */

export const APP_FREE_DAILY_LIMIT = 10

/**
 * Fair-use ceiling for paid tiers.
 *
 * "Unlimited" previously meant literally uncapped: `meterUsage` returned before
 * touching the database, so a paid account had no ceiling AND produced no usage
 * row at all — the one tier that could lose money was the one we could not see.
 *
 * 150/day is set well above real use and well below abuse. Measured cost per
 * assistant request is ~$0.010 typical and ~$0.036 at the saturated server caps,
 * so a $7/month subscription (~$6.30 net of Stripe's Canadian schedule) breaks
 * even around 620 questions/month — roughly 20/day sustained, every day. A
 * ceiling at 150/day therefore never touches a legitimate breeder, including one
 * working several spawns at once, while bounding a runaway or scripted account
 * to a knowable number instead of an open one.
 *
 * This is a ceiling, not a quota: it is not shown in the UI and is not part of
 * the offer. "Unlimited, subject to fair use" stays an accurate description.
 */
export const APP_PAID_DAILY_FAIR_USE = 150

export const FOUNDER_EMAIL = 'admin@zylx.ai'

/**
 * USD per 1M tokens, from OpenAI's published pricing.
 *
 * Cached input is billed at 50% of input. OpenAI caches prompt PREFIXES over
 * 1024 tokens automatically, and our prefix (system prompt + response schema +
 * the user's context block) is stable within a conversation, so turns after the
 * first in a thread already qualify.
 *
 * Keyed by the resolved model so OPENAI_CHAT_MODEL cannot silently invalidate
 * the accounting. Note the dated snapshot gpt-4o-2024-05-13 costs 2x input and
 * 1.5x output versus the floating alias.
 */
const MODEL_PRICES: Record<string, { in: number; cached: number; out: number }> = {
  'gpt-4o': { in: 2.5, cached: 1.25, out: 10 },
  'gpt-4o-2024-05-13': { in: 5, cached: 5, out: 15 },
  'gpt-4o-mini': { in: 0.15, cached: 0.075, out: 0.6 },
}

export interface TokenUsage {
  prompt: number
  completion: number
  cached: number
}

/** USD cost of one completion, from measured token counts. */
export function costUSD(model: string, u: TokenUsage): number {
  const p = MODEL_PRICES[model] ?? MODEL_PRICES['gpt-4o']
  const fresh = Math.max(0, u.prompt - u.cached)
  return (fresh * p.in + u.cached * p.cached + u.completion * p.out) / 1e6
}

export interface AppAIAuth {
  userId: string
  email: string
  tier: 'free' | 'pro' | 'breeder'
  founder: boolean
  unlimited: boolean
  admin: SupabaseClient
}

export async function authenticateAppRequest(
  request: Request
): Promise<{ auth: AppAIAuth } | { error: Response }> {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return { error: json({ error: 'Not signed in.' }, 401) }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) {
    return { error: json({ error: 'Session expired. Please sign in again.' }, 401) }
  }

  const user = data.user
  const email = (user.email || '').toLowerCase()

  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle()

  const tier = (profile?.subscription_tier as AppAIAuth['tier']) || 'free'
  const founder = email === FOUNDER_EMAIL
  const unlimited = founder || tier === 'pro' || tier === 'breeder'

  return {
    auth: { userId: user.id, email, tier, founder, unlimited, admin },
  }
}

/**
 * Returns null if within quota, otherwise a 429. Increments on success.
 *
 * Every tier is metered now. Free is gated at APP_FREE_DAILY_LIMIT, which is the
 * published offer; paid tiers are gated at APP_PAID_DAILY_FAIR_USE, which is an
 * abuse ceiling rather than a quota. The founder account is exempt from the gate
 * but is still counted, so its spend shows up in the same ledger.
 */
export async function meterUsage(auth: AppAIAuth): Promise<Response | null> {
  const limit = auth.unlimited ? APP_PAID_DAILY_FAIR_USE : APP_FREE_DAILY_LIMIT

  const day = new Date().toISOString().slice(0, 10)
  const { data } = await auth.admin
    .from('spawnos_ai_usage')
    .select('count')
    .eq('user_id', auth.userId)
    .eq('day', day)
    .maybeSingle()

  const count = data?.count ?? 0
  if (count >= limit && !auth.founder) {
    return json(
      {
        error: auth.unlimited
          ? // A paid account that reaches the fair-use ceiling is not being sold
            // short of the offer, so this says what happened without implying a
            // quota it can buy its way out of.
            "That's an unusual amount of activity for one day, so Ask SpawnOS is paused on this account until tomorrow. Get in touch if you were doing something legitimate — we'll raise it."
          : // No purchase instruction and no external link: this string is
            // rendered inside the iOS app, where steering users to an outside
            // checkout is App Review Guideline 3.1.1.
            "You've used today's free Ask SpawnOS questions. Your allowance resets tomorrow.",
        code: 'quota_exceeded',
      },
      429
    )
  }

  await auth.admin
    .from('spawnos_ai_usage')
    .upsert(
      { user_id: auth.userId, day, count: count + 1, tier: auth.tier },
      { onConflict: 'user_id,day' }
    )

  return null
}

/**
 * Record what a completion actually cost, after the fact.
 *
 * Kept separate from `meterUsage` because the gate has to run BEFORE the model
 * call and the true token count only exists after it. Failures here are
 * swallowed: accounting must never break a request the user already paid for
 * in latency.
 */
export async function recordUsage(
  auth: AppAIAuth,
  route: 'assistant' | 'species-profile',
  model: string,
  usage: TokenUsage
): Promise<void> {
  try {
    const day = new Date().toISOString().slice(0, 10)
    const { data } = await auth.admin
      .from('spawnos_ai_usage')
      .select('input_tokens, output_tokens, cached_tokens, cost_usd')
      .eq('user_id', auth.userId)
      .eq('day', day)
      .maybeSingle()

    await auth.admin.from('spawnos_ai_usage').upsert(
      {
        user_id: auth.userId,
        day,
        tier: auth.tier,
        route,
        input_tokens: Number(data?.input_tokens ?? 0) + usage.prompt,
        output_tokens: Number(data?.output_tokens ?? 0) + usage.completion,
        cached_tokens: Number(data?.cached_tokens ?? 0) + usage.cached,
        cost_usd: Number(data?.cost_usd ?? 0) + costUSD(model, usage),
      },
      { onConflict: 'user_id,day' }
    )
  } catch (err) {
    console.warn('[spawnos-ai] usage accounting failed', err)
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function openAIKey(): string | null {
  return process.env.OPENAI_API_KEY || null
}

/**
 * Direct chat-completions call over global fetch. The openai SDK's HTTP
 * stack has proven flaky under the Next dev runtime; the REST API is stable
 * and this route only needs one endpoint.
 */
export async function chatCompletion(
  apiKey: string,
  payload: Record<string, unknown>,
  timeoutMs = 55_000
): Promise<{ content: string; usage: TokenUsage } | { failure: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await res.text()
    if (!res.ok) {
      console.error('[openai]', res.status, text.slice(0, 400))
      return { failure: `OpenAI ${res.status}` }
    }
    const data = JSON.parse(text)
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content) return { failure: 'empty completion' }
    // data.usage was previously dropped on the floor, which is why no token
    // figure for this product has ever been measured rather than estimated.
    return {
      content,
      usage: {
        prompt: data?.usage?.prompt_tokens ?? 0,
        completion: data?.usage?.completion_tokens ?? 0,
        cached: data?.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      },
    }
  } catch (err) {
    return { failure: String(err) }
  } finally {
    clearTimeout(timer)
  }
}
