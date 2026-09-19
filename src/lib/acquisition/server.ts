import { createAdminClient } from '@/lib/supabase/admin'
import { AscClient } from './asc-client'
import { appStoreAppId, ascCredentialsFromEnv, reportRecipient, reportSender } from './config'
import { ResendMailer } from './email'
import { SupabaseAcquisitionStore } from './store'
import type { SyncDeps } from './sync'
import type { SyncTrigger } from './types'

/**
 * Wires the acquisition sync to real infrastructure from server env vars.
 * Missing Apple credentials yield `client: null` (the sync records
 * "not_configured" and exits cleanly) rather than an exception.
 */
export function createSyncDeps(trigger: SyncTrigger): SyncDeps {
  const creds = ascCredentialsFromEnv()
  const resendKey = process.env.RESEND_API_KEY?.trim()
  return {
    appId: appStoreAppId(),
    client: creds ? new AscClient(creds) : null,
    store: new SupabaseAcquisitionStore(createAdminClient()),
    mailer: resendKey ? new ResendMailer(resendKey) : null,
    recipient: reportRecipient(),
    sender: reportSender(),
    trigger,
  }
}
