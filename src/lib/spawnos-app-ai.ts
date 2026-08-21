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
export const FOUNDER_EMAIL = 'admin@zylx.ai'

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

/** Returns null if within quota, otherwise a 429 response. Increments on success. */
export async function meterUsage(auth: AppAIAuth): Promise<Response | null> {
  if (auth.unlimited) return null

  const day = new Date().toISOString().slice(0, 10)
  const { data } = await auth.admin
    .from('spawnos_ai_usage')
    .select('count')
    .eq('user_id', auth.userId)
    .eq('day', day)
    .maybeSingle()

  const count = data?.count ?? 0
  if (count >= APP_FREE_DAILY_LIMIT) {
    return json(
      {
        error:
          // No purchase instruction and no external link: this string is
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
    .upsert({ user_id: auth.userId, day, count: count + 1 }, { onConflict: 'user_id,day' })

  return null
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
): Promise<{ content: string } | { failure: string }> {
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
    return { content }
  } catch (err) {
    return { failure: String(err) }
  } finally {
    clearTimeout(timer)
  }
}
