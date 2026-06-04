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

// Map Stripe price ID → SpawnOS tier
function tierFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BREEDER_PRICE_ID) return 'breeder'
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
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Dynamically import Supabase server client (avoids issues if env vars missing)
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  try {
    switch (event.type) {

      // ── Checkout completed — subscription started or trial started ──────
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.CheckoutSession
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan ?? 'pro'

        if (!userId) break

        await supabase.from('profiles').update({
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
        const sub = event.data.object as import('stripe').Stripe.Subscription

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!profile) break

        const priceId = sub.items.data[0]?.price?.id ?? ''
        const tier = tierFromPriceId(priceId)
        const status = mapStatus(sub.status)
        const endsAt = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        await supabase.from('profiles').update({
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
        const sub = event.data.object as import('stripe').Stripe.Subscription

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!profile) break

        await supabase.from('profiles').update({
          subscription_tier:    'free',
          subscription_status:  'canceled',
          subscription_ends_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        break
      }

      // ── Invoice payment failed ────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!profile) break

        await supabase.from('profiles').update({
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
