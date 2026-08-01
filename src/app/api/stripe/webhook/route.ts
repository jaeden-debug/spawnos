import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Map Stripe subscription status → SpawnOS subscription_status
function mapStatus(stripeStatus: string): string {
  const MAP: Record<string, string> = {
    active:             'active',
    trialing:           'trialing',
    past_due:           'past_due',
    canceled:           'canceled',
    incomplete:         'incomplete',
    incomplete_expired: 'canceled',
    unpaid:             'past_due',
    paused:             'canceled',
  }
  return MAP[stripeStatus] ?? 'active'
}

// Map a Stripe subscription's price → SpawnOS tier.
// Primary source is price.metadata.tier (set on every SpawnOS price, monthly
// and annual alike); subscription metadata and the legacy env-var price IDs
// are fallbacks. Env-only matching silently mapped annual plans to 'free'.
function tierFromSubscription(sub: {
  items?: { data?: Array<{ price?: { id?: string; metadata?: Record<string, string> } }> }
  metadata?: Record<string, string>
}): string {
  const price = sub.items?.data?.[0]?.price
  const metaTier = price?.metadata?.tier ?? sub.metadata?.plan
  if (metaTier === 'pro' || metaTier === 'breeder') return metaTier

  const priceId = price?.id ?? ''
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId && priceId === process.env.STRIPE_BREEDER_PRICE_ID) return 'breeder'
  return 'free'
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

  let event: import('stripe').Stripe.Event

  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
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
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  try {
    switch (event.type) {

      // ── Checkout completed — subscription started or trial started ──────
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan ?? 'pro'

        if (!userId) break

        await (supabase as any).from('profiles').update({
          subscription_tier:   plan,
          subscription_status: 'active',
          stripe_customer_id:  session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        break
      }

      // ── Subscription updated (plan change, renewal) ───────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as any

        // Find user by Stripe customer ID
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!profile) break

        const tier = tierFromSubscription(sub)
        const status = mapStatus(sub.status)
        const endsAt = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        await (supabase as any).from('profiles').update({
          subscription_tier:    tier,
          subscription_status:  status,
          stripe_subscription_id: sub.id,
          subscription_ends_at: endsAt,
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        break
      }

      // ── Subscription deleted (cancelled, expired) ─────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any

        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!profile) break

        await (supabase as any).from('profiles').update({
          subscription_tier:    'free',
          subscription_status:  'canceled',
          subscription_ends_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        break
      }

      // ── Invoice payment failed ────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any

        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!profile) break

        await (supabase as any).from('profiles').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        break
      }

      default:
        // Unhandled event type — safe to ignore
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error processing event ${event.type}:`, err)
    // Return 200 to prevent Stripe from retrying — log for investigation
    return NextResponse.json({ received: true, warning: 'Processing error logged' })
  }

  return NextResponse.json({ received: true })
}
