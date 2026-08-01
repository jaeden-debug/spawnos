import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Free-tier AI chat quota: N messages per UTC day, tracked in a signed cookie.
 *
 * Why a cookie and not a table: quota state is low-stakes and per-browser, and
 * this avoids a schema migration. The HMAC signature stops casual tampering
 * (editing the count client-side); clearing cookies resets the day's quota,
 * which is an accepted soft limit for a free tier. Pro/Breeder users bypass
 * this entirely, so the cookie only ever gates free usage.
 */

export const FREE_DAILY_LIMIT = 10
export const QUOTA_COOKIE = 'spawnos_chat_quota'

function secret(): string {
  // Prefer a dedicated secret; fall back to the OpenAI key, which is always
  // present wherever chat works and is never exposed client-side.
  const s = process.env.CHAT_QUOTA_SECRET || process.env.OPENAI_API_KEY
  if (!s) throw new Error('No secret available for chat quota signing')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface QuotaState {
  day: string
  count: number
}

export function readQuota(cookieValue: string | undefined): QuotaState {
  const fresh: QuotaState = { day: todayUtc(), count: 0 }
  if (!cookieValue) return fresh

  const dot = cookieValue.lastIndexOf('.')
  if (dot < 0) return fresh

  const payload = cookieValue.slice(0, dot)
  const sig = cookieValue.slice(dot + 1)

  try {
    const expected = sign(payload)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return fresh

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as QuotaState
    if (decoded.day !== todayUtc()) return fresh
    if (typeof decoded.count !== 'number' || decoded.count < 0) return fresh
    return decoded
  } catch {
    return fresh
  }
}

export function writeQuota(state: QuotaState): string {
  const payload = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

/** Serialized Set-Cookie header value for the quota cookie. */
export function quotaCookieHeader(state: QuotaState): string {
  const value = writeQuota(state)
  // Expires end of tomorrow UTC — cookie only needs to outlive its day.
  const expires = new Date(Date.now() + 48 * 3600 * 1000).toUTCString()
  return `${QUOTA_COOKIE}=${value}; Path=/api/chat; Expires=${expires}; HttpOnly; SameSite=Lax; Secure`
}
