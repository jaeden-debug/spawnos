import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const PLAN_PRICES: Record<string, string | undefined> = {
  pro:     process.env.STRIPE_PRO_PRICE_ID,
  breeder: process.env.STRIPE_BREEDER_PRICE_ID,
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const plan = body.plan as string

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    const priceId = PLAN_PRICES[plan]
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for plan "${plan}" is not configured. Set STRIPE_${plan.toUpperCase()}_PRICE_ID.` },
        { status: 503 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    // Get or create Stripe customer
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

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
      await supabase
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
        },
      },
      success_url: `${siteUrl}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url: `${siteUrl}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout error]', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
