import crypto from 'node:crypto'

/**
 * Constant-time check of `Authorization: Bearer <CRON_SECRET>`.
 * Refuses everything when the secret is unset or implausibly short.
 */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header)
  return given.length === expected.length && crypto.timingSafeEqual(given, expected)
}
