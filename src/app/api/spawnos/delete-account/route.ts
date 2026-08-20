import { NextRequest } from 'next/server'
import { authenticateAppRequest, json } from '@/lib/spawnos-app-ai'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * App Store-required account deletion.
 *
 * Scope audit (2026-08): this Supabase identity is used ONLY by SpawnOS
 * (website + iOS app). Every user-owned table — profiles, the web dashboard
 * tables (fish/pairs/spawns/…), and all spawnos_* tables — references
 * auth.users with ON DELETE CASCADE, so deleting the auth user removes all
 * SpawnOS product data. The Blackwater Aquatics storefront runs on Shopify
 * with its own accounts and is unaffected.
 *
 * Order of operations:
 *   1. Best-effort cancel any active Stripe subscription (so the user isn't
 *      billed for an account that no longer exists).
 *   2. Delete the user's private photos from Storage (not covered by FK
 *      cascade).
 *   3. Delete the auth user — cascades everything else.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateAppRequest(request)
  if ('error' in authResult) return authResult.error
  const { auth } = authResult

  // Deleting the founder account from the app is almost certainly a mistake.
  if (auth.founder) {
    return json({ error: 'The founder account cannot be deleted from the app.' }, 403)
  }

  try {
    // 1. Cancel Stripe subscription, best effort.
    const { data: profile } = await auth.admin
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', auth.userId)
      .maybeSingle()

    const subId = profile?.stripe_subscription_id
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (subId && stripeKey) {
      try {
        const { default: Stripe } = await import('stripe')
        const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })
        await stripe.subscriptions.cancel(subId)
      } catch (err) {
        // Subscription may already be canceled/expired — log and continue.
        console.error('[delete-account] stripe cancel failed', err)
      }
    }

    // 2. Delete private photos (storage is not FK-cascaded).
    const { data: objects } = await auth.admin.storage
      .from('spawnos-photos')
      .list(auth.userId, { limit: 1000 })
    if (objects && objects.length > 0) {
      const paths = objects.map((o) => `${auth.userId}/${o.name}`)
      await auth.admin.storage.from('spawnos-photos').remove(paths)
    }

    // 3. Delete the auth user — cascades profiles + all SpawnOS tables.
    const { error } = await auth.admin.auth.admin.deleteUser(auth.userId)
    if (error) {
      console.error('[delete-account] deleteUser failed', error)
      return json({ error: 'Account deletion failed. Please try again or contact support.' }, 500)
    }

    return json({ deleted: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return json({ error: 'Account deletion failed. Please try again or contact support.' }, 500)
  }
}
