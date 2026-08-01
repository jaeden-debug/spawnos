import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for trusted server-only contexts.
 *
 * The cookie-based client in `./server.ts` authenticates as the *end user* and
 * is therefore subject to RLS. Stripe webhooks have no user session and no
 * cookies, so writes made with that client are silently rejected by the
 * `profiles_own_write` policy — subscriptions appear to succeed in Stripe but
 * the tier never updates in SpawnOS.
 *
 * This client uses the service-role key, which bypasses RLS. It must never be
 * imported into client components or any route that echoes data back to an
 * untrusted caller.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY — required for Stripe webhooks to update subscription tiers.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
