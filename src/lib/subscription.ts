/**
 * SpawnOS subscription utilities.
 *
 * Tier hierarchy:  free < pro < breeder
 *
 * Use `getProfile()` in server components to read the authenticated user's tier.
 * Use `requireTier()` to gate Pro/Breeder features and redirect if not subscribed.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'pro' | 'breeder'

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  subscription_ends_at: string | null
  is_public: boolean
  specialties: string[] | null
  social_instagram: string | null
  social_youtube: string | null
  created_at: string
}

const TIER_LEVEL: Record<SubscriptionTier, number> = {
  free:    0,
  pro:     1,
  breeder: 2,
}

export function tierAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_LEVEL[current] >= TIER_LEVEL[required]
}

/** Fetch the current user's profile. Returns null if not authenticated or profile not found. */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return data as UserProfile | null
  } catch {
    return null
  }
}

/** Fetch the current user's subscription tier. Returns 'free' if anything fails. */
export async function getTier(): Promise<SubscriptionTier> {
  const profile = await getProfile()
  return (profile?.subscription_tier ?? 'free') as SubscriptionTier
}

/**
 * Require a minimum tier. Redirects to /pricing if the user doesn't qualify.
 * Use in server components / page.tsx files to gate Pro/Breeder features.
 *
 * @example
 * // In a Pro-only page:
 * await requireTier('pro')
 */
export async function requireTier(minimum: SubscriptionTier): Promise<UserProfile> {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  const tier = profile.subscription_tier as SubscriptionTier

  if (!tierAtLeast(tier, minimum)) {
    redirect(`/pricing?required=${minimum}`)
  }

  return profile
}

/** Returns a human-readable tier label. */
export function tierLabel(tier: SubscriptionTier): string {
  return { free: 'Free', pro: 'Pro', breeder: 'Breeder' }[tier]
}

/** Returns the tier badge colour classes. */
export function tierBadgeClass(tier: SubscriptionTier): string {
  return {
    free:    'bg-spawn-surface border-spawn-border text-spawn-muted-text',
    pro:     'bg-spawn-cyan/10 border-spawn-cyan/30 text-spawn-cyan',
    breeder: 'bg-spawn-amber/10 border-spawn-amber/30 text-spawn-amber',
  }[tier]
}

/** Feature flags by tier — single source of truth for the whole app. */
export const FEATURES = {
  unlimitedAI:       ['pro', 'breeder'] as SubscriptionTier[],
  dashboard:         ['pro', 'breeder'] as SubscriptionTier[],
  parameterLog:      ['pro', 'breeder'] as SubscriptionTier[],
  geneticsEngine:    ['pro', 'breeder'] as SubscriptionTier[],
  csvExport:         ['pro', 'breeder'] as SubscriptionTier[],
  publicProfile:     ['breeder']        as SubscriptionTier[],
  apiAccess:         ['breeder']        as SubscriptionTier[],
  verifiedBadge:     ['breeder']        as SubscriptionTier[],
}

export function canAccess(tier: SubscriptionTier, feature: keyof typeof FEATURES): boolean {
  return (FEATURES[feature] as SubscriptionTier[]).includes(tier)
}
