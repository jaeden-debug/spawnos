import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const PLANS = ['pro', 'breeder'] as const
const PERIODS = ['monthly', 'annual'] as const
type Plan = (typeof PLANS)[number]
type Period = (typeof PERIODS)[number]

/**
 * Prices are resolved by Stripe lookup key (spawnos_<plan>_<period>), so the
 * app needs no per-price env vars. STRIPE_PRO_PRICE_ID /
 * STRIPE_BREEDER_PRICE_ID remain as monthly-only overrides if ever set.
 */
const ENV_OVERRIDES: Record<string, string | undefined> = {
  'pro:monthly':     process.env.STRIPE_PRO_PRICE_ID,
  'breeder:monthly': process.env.STRIPE_BREEDER_PRICE_ID,
}

async function resolvePriceId(
  stripe: import('stripe').Stripe,
  plan: Plan,
  period: Period,
): Promise<string | null> {
  const override = ENV_OVERRIDES[`${plan}:${period}`]
  if (override) return override

  const lookupKey = `spawnos_${plan}_${period}`
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  return prices.data[0]?.id ?? null
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const plan = body.plan as Plan
    const period: Period = body.period === 'monthly' ? 'monthly' : 'annual'

    if (!PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    // Get or create Stripe customer
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

    const priceId = await resolvePriceId(stripe, plan, period)
    if (!priceId) {
      return NextResponse.json(
        { error: `No active Stripe price found for ${plan} (${period}). Expected lookup key spawnos_${plan}_${period}.` },
        { status: 503 }
      )
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single()

    let customerId = (profile as any)?.stripe_customer_id

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          display_name: user.user_metadata?.display_name ?? '',
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await (supabase as any)
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: user.id,
          plan,
          period,
        },
      },
      success_url: `${siteUrl}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url: `${siteUrl}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        period,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout error]', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
