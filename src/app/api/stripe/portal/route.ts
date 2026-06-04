import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!(profile as any)?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 404 }
      )
    }

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: (profile as any).stripe_customer_id,
      return_url: `${siteUrl}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/portal error]', err)
    return NextResponse.json({ error: 'Failed to open billing portal.' }, { status: 500 })
  }
}
