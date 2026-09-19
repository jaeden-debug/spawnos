import crypto from 'node:crypto'
import type { SyncErrorCode } from './types'

/**
 * Minimal App Store Connect API client (server-only, zero dependencies).
 *
 * Auth follows Apple's "Generating Tokens for API Requests": an ES256 JWT with
 * the team key's Key ID in the header, the Issuer ID as `iss`, audience
 * `appstoreconnect-v1`, and a lifetime under Apple's 20-minute ceiling.
 *
 * Report files are fetched from the pre-signed `url` Apple returns on each
 * analyticsReportSegment. That URL is valid for ~5 minutes and must be fetched
 * WITHOUT our Authorization header.
 */

export interface AscCredentials {
  issuerId: string
  keyId: string
  /** PEM contents of the .p8 key. */
  privateKey: string
}

export class AscError extends Error {
  constructor(
    message: string,
    public readonly code: SyncErrorCode,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'AscError'
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface AscClientOptions {
  fetch?: FetchLike
  baseUrl?: string
  /** Attempts per request for retryable failures (429, 5xx, network). */
  maxAttempts?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const TOKEN_TTL_SECONDS = 15 * 60

export function signAscJwt(creds: AscCredentials, nowSeconds: number, ttlSeconds = TOKEN_TTL_SECONDS): string {
  if (ttlSeconds > 20 * 60) throw new Error('App Store Connect rejects tokens that live longer than 20 minutes')
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = encode({ alg: 'ES256', kid: creds.keyId, typ: 'JWT' })
  const payload = encode({
    iss: creds.issuerId,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    aud: 'appstoreconnect-v1',
  })
  const signature = crypto
    .sign('sha256', Buffer.from(`${header}.${payload}`), { key: creds.privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url')
  return `${header}.${payload}.${signature}`
}

function classifyStatus(status: number): SyncErrorCode {
  if (status === 401) return 'auth'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'unavailable'
  return 'bad_response'
}

function isRetryable(code: SyncErrorCode): boolean {
  return code === 'rate_limited' || code === 'unavailable' || code === 'network'
}

/** Pulls Apple's first error title/detail out of a JSON:API error body, without secrets. */
function describeAppleError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { errors?: Array<{ title?: string; detail?: string; code?: string }> }
    const first = parsed.errors?.[0]
    if (first) return [first.code, first.title, first.detail].filter(Boolean).join(' — ').slice(0, 300)
  } catch {
    // not JSON
  }
  return body.slice(0, 200)
}

export interface JsonApiResource<A = Record<string, unknown>> {
  id: string
  type: string
  attributes: A
}

interface JsonApiList<A> {
  data: Array<JsonApiResource<A>>
  links?: { next?: string }
}

export class AscClient {
  private readonly fetchImpl: FetchLike
  private readonly baseUrl: string
  private readonly maxAttempts: number
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  private token: { value: string; expiresAt: number } | null = null

  constructor(
    private readonly creds: AscCredentials,
    options: AscClientOptions = {},
  ) {
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init))
    this.baseUrl = options.baseUrl ?? 'https://api.appstoreconnect.apple.com'
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 3)
    this.sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
    this.now = options.now ?? (() => Date.now())
  }

  private bearer(): string {
    const nowSec = Math.floor(this.now() / 1000)
    if (!this.token || this.token.expiresAt - 60 <= nowSec) {
      let value: string
      try {
        value = signAscJwt(this.creds, nowSec)
      } catch (err) {
        throw new AscError(`Could not sign App Store Connect token: ${(err as Error).message}`, 'auth')
      }
      this.token = { value, expiresAt: nowSec + TOKEN_TTL_SECONDS }
    }
    return this.token.value
  }

  private async withRetries<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: AscError | null = null
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        const ascErr =
          err instanceof AscError ? err : new AscError(`Network error: ${(err as Error).message}`, 'network')
        lastError = ascErr
        if (!isRetryable(ascErr.code) || attempt === this.maxAttempts) throw ascErr
        await this.sleep(500 * 3 ** (attempt - 1))
      }
    }
    throw lastError ?? new AscError('Request failed', 'unknown')
  }

  async getJson<T>(pathOrUrl: string): Promise<T> {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`
    return this.withRetries(async () => {
      const res = await this.fetchImpl(url, {
        headers: { Authorization: `Bearer ${this.bearer()}`, Accept: 'application/json' },
        cache: 'no-store',
      })
      const text = await res.text()
      if (!res.ok) {
        throw new AscError(
          `App Store Connect ${res.status} for ${new URL(url).pathname}: ${describeAppleError(text)}`,
          classifyStatus(res.status),
          res.status,
        )
      }
      try {
        return JSON.parse(text) as T
      } catch {
        throw new AscError(`App Store Connect returned non-JSON for ${new URL(url).pathname}`, 'bad_response', res.status)
      }
    })
  }

  /** Follows JSON:API `links.next` until exhausted (bounded). */
  async getAll<A>(path: string, maxPages = 20): Promise<Array<JsonApiResource<A>>> {
    const out: Array<JsonApiResource<A>> = []
    let next: string | undefined = path
    for (let page = 0; next && page < maxPages; page++) {
      const body: JsonApiList<A> = await this.getJson<JsonApiList<A>>(next)
      out.push(...(body.data ?? []))
      next = body.links?.next
    }
    return out
  }

  /** Downloads a pre-signed report segment. No Authorization header. */
  async download(url: string): Promise<Buffer> {
    return this.withRetries(async () => {
      const res = await this.fetchImpl(url, { cache: 'no-store' })
      if (!res.ok) {
        throw new AscError(`Report segment download failed with HTTP ${res.status}`, classifyStatus(res.status), res.status)
      }
      return Buffer.from(await res.arrayBuffer())
    })
  }
}
