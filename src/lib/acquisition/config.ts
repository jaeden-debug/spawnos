import { APP_ID } from '@/lib/app-store'
import type { AscCredentials } from './asc-client'

/**
 * Server-only configuration for App Store acquisition reporting.
 *
 * Required for Apple (App Store Connect → Users and Access → Integrations →
 * Team Keys). A key with the **Sales and Reports** role is enough to read and
 * download Analytics Reports; only creating a report request needs Admin, and
 * those requests already exist for SpawnOS.
 *
 *   APP_STORE_CONNECT_ISSUER_ID     Issuer ID shown above the key list
 *   APP_STORE_CONNECT_KEY_ID        The key's Key ID
 *   APP_STORE_CONNECT_PRIVATE_KEY   Contents of AuthKey_<KEYID>.p8 — either the
 *                                   PEM with real or "\n"-escaped newlines, or
 *                                   the whole PEM base64-encoded
 *
 * Optional:
 *   APP_STORE_APP_ID                Defaults to the live SpawnOS Apple ID
 *   APP_STORE_REPORT_EMAIL_TO       Defaults to alerts@spawnos.ca
 *   APP_STORE_REPORT_EMAIL_FROM     Defaults to SpawnOS Reports <reports@spawnos.app>
 *   RESEND_API_KEY                  Existing transactional email provider
 *   CRON_SECRET                     Bearer secret Vercel Cron sends; required
 *                                   for the sync endpoint to accept any call
 *
 * Nothing in this file may be imported by a client component.
 */

export const DEFAULT_REPORT_RECIPIENT = 'alerts@spawnos.ca'
export const DEFAULT_REPORT_SENDER = 'SpawnOS Reports <reports@spawnos.app>'

/** Apple: "Downloads data is complete within 2 days". */
export const DOWNLOADS_COMPLETENESS_DAYS = 2

/** Only announce report dates this close to the newest complete date (never old backfill). */
export const ALERT_LOOKBACK_DAYS = 7

/** Operational alert: after this many consecutive failed runs… */
export const FAILURE_ALERT_MIN_CONSECUTIVE = 2
/** …and never more often than this. */
export const FAILURE_ALERT_COOLDOWN_HOURS = 72

/** If the newest Apple instance is older than this, the feed is stale. */
export const STALE_AFTER_DAYS = 5

/**
 * There is no documented deep link into one app's analytics, so the email CTA
 * opens App Store Connect itself (Apps → SpawnOS → Analytics).
 */
export const APP_STORE_CONNECT_URL = 'https://appstoreconnect.apple.com/'

export function appStoreAppId(): string {
  return process.env.APP_STORE_APP_ID?.trim() || APP_ID
}

export function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.includes('-----BEGIN')) {
    return trimmed.replace(/\\n/g, '\n').trim()
  }
  const decoded = Buffer.from(trimmed, 'base64').toString('utf8')
  if (decoded.includes('-----BEGIN')) return decoded.trim()
  throw new Error('APP_STORE_CONNECT_PRIVATE_KEY is neither a PEM nor a base64-encoded PEM')
}

/** Returns null (never throws) when any Apple credential is missing. */
export function ascCredentialsFromEnv(env: NodeJS.ProcessEnv = process.env): AscCredentials | null {
  const issuerId = env.APP_STORE_CONNECT_ISSUER_ID?.trim()
  const keyId = env.APP_STORE_CONNECT_KEY_ID?.trim()
  const rawKey = env.APP_STORE_CONNECT_PRIVATE_KEY
  if (!issuerId || !keyId || !rawKey) return null
  return { issuerId, keyId, privateKey: normalizePrivateKey(rawKey) }
}

export function reportRecipient(): string {
  return process.env.APP_STORE_REPORT_EMAIL_TO?.trim() || DEFAULT_REPORT_RECIPIENT
}

export function reportSender(): string {
  return process.env.APP_STORE_REPORT_EMAIL_FROM?.trim() || DEFAULT_REPORT_SENDER
}
