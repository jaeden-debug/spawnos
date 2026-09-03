import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Stripe → SpawnOS entitlement sync.
 *
 * Design rule: every event resolves the CURRENT subscription state from Stripe
 * and writes that, rather than trusting the payload that happened to arrive.
 * Webhooks are delivered at-least-once and out-of-order, so a delayed
 * `checkout.session.completed` can land after a `customer.subscription.deleted`
 * for the same subscription. Deriving state from a live fetch makes every
 * handler idempotent and order-independent: replaying any event, in any order,
 * converges on the same row.
 *
 * Failure rule: if we cannot write the entitlement, return 5xx so Stripe
 * retries. Returning 200 on a failed write is the one bug that silently takes
 * money without granting Pro.
 */

type Tier = 'free' | 'pro' | 'breeder'

/** Stripe subscription status → SpawnOS subscription_status. */
function mapStatus(stripeStatus: string): string {
  const MAP: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'canceled',
  }
  return MAP[stripeStatus] ?? 'active'
}

/** Statuses that should still grant the paid tier. */
const ENTITLED = new Set(['active', 'trialing', 'past_due'])

/**
 * Resolve the SpawnOS tier a subscription grants.
 *
 * Primary source is `price.metadata.tier`, set on every SpawnOS price (monthly
 * and annual alike). Subscription metadata and the legacy env-var price IDs are
 * fallbacks — env-only matching used to map annual plans to 'free'.
 */
function tierFromSubscription(sub: any): Tier {
  const price = sub?.items?.data?.[0]?.price
  const metaTier = price?.metadata?.tier ?? sub?.metadata?.plan
  if (metaTier === 'pro' || metaTier === 'breeder') return metaTier

  const priceId = price?.id ?? ''
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId && priceId === process.env.STRIPE_BREEDER_PRICE_ID) return 'breeder'
  return 'free'
}

/**
 * Current period end.
 *
 * Stripe removed `current_period_end` from Subscription and moved it onto
 * SubscriptionItem (stripe-node v18+; this repo runs v22). Reading it off the
 * subscription returns undefined on every modern API version, which silently
 * wrote NULL into subscription_ends_at forever — invisible because the payload
 * was cast to `any`. Take the latest item period, falling back to the legacy
 * field so older replayed events still resolve.
 */
function periodEndISO(sub: any): string | null {
  const itemEnds: number[] = (sub?.items?.data ?? [])
    .map((i: any) => i?.current_period_end)
    .filter((n: any) => typeof n === 'number')

  const epoch = itemEnds.length
    ? Math.max(...itemEnds)
    : typeof sub?.current_period_end === 'number'
      ? sub.current_period_end
      : null

  return epoch ? new Date(epoch * 1000).toISOString() : null
}

/** Locate the SpawnOS user for a subscription, by metadata then customer id. */
async function resolveUserId(
  supabase: any,
  sub: any,
  fallbackCustomerId?: string,
): Promise<string | null> {
  const metaUserId = sub?.metadata?.supabase_user_id
  if (metaUserId) return metaUserId

  const customerId =
    (typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id) ?? fallbackCustomerId
  if (!customerId) return null

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Write the entitlement implied by a live subscription object.
 * Throws on write failure so the caller returns 5xx and Stripe retries.
 */
async function syncSubscription(supabase: any, sub: any, fallbackCustomerId?: string) {
  const userId = await resolveUserId(supabase, sub, fallbackCustomerId)
  if (!userId) {
    // No SpawnOS account maps to this subscription. Nothing to grant, and a
    // retry would resolve the same way — do not fail the delivery.
    console.warn('[stripe/webhook] no profile for subscription', sub?.id)
    return
  }

  const status = mapStatus(sub?.status ?? 'active')
  const tier: Tier = ENTITLED.has(status) ? tierFromSubscription(sub) : 'free'
  const customerId = typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_customer_id: customerId ?? fallbackCustomerId ?? null,
      stripe_subscription_id: sub?.id ?? null,
      subscription_ends_at: periodEndISO(sub),
      trial_ends_at: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`profiles update failed for ${userId}: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    console.error('[stripe/webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

  let event: import('stripe').Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    // A signature failure is permanent — never ask Stripe to retry it.
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Stripe webhooks carry no user session, so the cookie-based client would be
  // blocked by RLS on `profiles`. Use the service-role client instead.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  let supabase
  try {
    supabase = createAdminClient()
  } catch (err) {
    console.error('[stripe/webhook] admin client unavailable:', err)
    // Transient from Stripe's perspective — ask for a retry.
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  try {
    switch (event.type) {
      /**
       * Checkout finished. The session names WHICH subscription, not what state
       * it is in now — retrieve it, so a replayed or delayed event cannot
       * resurrect a subscription that has since been cancelled.
       */
      case 'checkout.session.completed': {
        const session = event.data.object as any
        if (session.mode !== 'subscription' || !session.subscription) break

        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id

        const sub = await stripe.subscriptions.retrieve(subId)
        const merged = {
          ...sub,
          metadata: {
            ...(sub.metadata ?? {}),
            supabase_user_id:
              (sub.metadata as any)?.supabase_user_id ?? session.metadata?.supabase_user_id,
          },
        }

        await syncSubscription(supabase, merged, session.customer as string)
        break
      }

      /**
       * Plan change, renewal, trial end, cancel-at-period-end, deletion.
       *
       * Re-read from Stripe rather than trusting event.data.object. The payload
       * is a snapshot of the subscription when the event was CREATED, so an
       * out-of-order delivery carries stale state and would transiently write
       * the wrong tier until the next event corrected it. Retrieving makes the
       * write reflect Stripe's current truth regardless of arrival order.
       *
       * A deleted subscription still retrieves (status 'canceled'), so this is
       * safe for the deletion case too. If the retrieve fails we fall back to
       * the payload — a stale write beats no write, and the next event
       * reconciles.
       */
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const payload = event.data.object as any
        let sub = payload
        if (payload?.id) {
          try {
            sub = await stripe.subscriptions.retrieve(payload.id)
          } catch (e) {
            console.warn('[stripe/webhook] retrieve failed, using payload', payload.id, e)
          }
        }
        await syncSubscription(supabase, sub)
        break
      }

      /**
       * Payment outcome. Re-read the subscription rather than setting a status
       * directly, so recovery from past_due restores the paid tier without a
       * separate code path.
       */
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subRef =
          invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        if (!subRef) break

        const subId = typeof subRef === 'string' ? subRef : subRef.id
        const sub = await stripe.subscriptions.retrieve(subId)
        await syncSubscription(supabase, sub, invoice.customer as string)
        break
      }

      default:
        // Unhandled event type — safe to ignore.
        break
    }
  } catch (err) {
    /**
     * Return 5xx so Stripe retries with backoff.
     *
     * The previous implementation returned 200 here "to prevent Stripe from
     * retrying". That turned every transient Supabase failure into a permanent
     * one: the customer was charged, the entitlement write was dropped, and
     * Stripe was told the event had been handled. Retrying is the entire point
     * of the webhook contract.
     */
    console.error(`[stripe/webhook] Error processing ${event.type} (${event.id}):`, err)
    return NextResponse.json({ error: 'Processing failed — retry' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
