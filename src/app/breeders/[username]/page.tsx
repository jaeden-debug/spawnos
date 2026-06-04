import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

interface Props {
  params: Promise<{ username: string }>
}

interface BreederProfile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  subscription_tier: string
  specialties: string[] | null
  social_instagram: string | null
  social_youtube: string | null
  breeder_since: string | null
  fish_count: number
  spawn_count: number
  created_at: string
}

async function getBreeder(username: string): Promise<BreederProfile | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('public_breeders')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) return null
    return data as BreederProfile
  } catch {
    return null
  }
}

async function getBreederSpawns(userId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data } = await supabase
      .from('spawns')
      .select('id, stage, current_fry_count, survival_rate, created_at, pairs(pair_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    return data ?? []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const breeder = await getBreeder(username)

  if (!breeder) {
    return { title: 'Breeder Not Found — SpawnOS' }
  }

  const name = breeder.display_name ?? breeder.username
  const description = breeder.bio
    ? `${name} on SpawnOS — ${breeder.bio.slice(0, 140)}`
    : `${name} is a fish breeder on SpawnOS. ${breeder.fish_count} fish registered, ${breeder.spawn_count} spawns tracked.`

  return {
    title: `${name} — Breeder Profile | SpawnOS`,
    description,
    alternates: { canonical: `/breeders/${username}` },
    openGraph: {
      title: `${name} — SpawnOS Breeder`,
      description,
      type: 'profile',
    },
  }
}

const STAGE_LABELS: Record<string, string> = {
  planned:    'Planned',
  conditioning: 'Conditioning',
  spawning:   'Spawning',
  hatching:   'Hatching',
  fry_care:   'Fry Care',
  growing:    'Growing Out',
  sold:       'Sold / Complete',
}

const STAGE_COLORS: Record<string, string> = {
  planned:    'bg-spawn-surface text-spawn-muted-text border-spawn-border',
  conditioning: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  spawning:   'bg-spawn-cyan/10 text-spawn-cyan border-spawn-cyan/20',
  hatching:   'bg-green-400/10 text-green-400 border-green-400/20',
  fry_care:   'bg-green-400/10 text-green-400 border-green-400/20',
  growing:    'bg-blue-400/10 text-blue-400 border-blue-400/20',
  sold:       'bg-spawn-surface text-spawn-muted-text border-spawn-border',
}

export default async function BreederProfilePage({ params }: Props) {
  const { username } = await params
  const breeder = await getBreeder(username)

  if (!breeder) notFound()

  const spawns = await getBreederSpawns(breeder.id)
  const name = breeder.display_name ?? breeder.username
  const isBreeder = breeder.subscription_tier === 'breeder'

  const joinYear = new Date(breeder.created_at).getFullYear()
  const breederSince = breeder.breeder_since
    ? new Date(breeder.breeder_since).getFullYear()
    : null

  return (
    <>
      <SiteHeader />
      <main className="pt-20 min-h-screen">

        {/* Profile hero */}
        <section className="border-b border-spawn-border/40 py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 items-start">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-spawn-cyan/10 border border-spawn-cyan/20 flex items-center justify-center shrink-0 text-3xl font-black text-spawn-cyan">
                {(name[0] ?? '?').toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-black text-spawn-text">{name}</h1>
                  {isBreeder && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-spawn-amber/10 border border-spawn-amber/25 text-spawn-amber">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                        <path d="M5 0L6.18 3.27L9.51 3.63L7.14 5.74L7.94 9L5 7.27L2.06 9L2.86 5.74L0.49 3.63L3.82 3.27L5 0Z"/>
                      </svg>
                      Verified Breeder
                    </span>
                  )}
                </div>

                <p className="text-sm text-spawn-muted-text mb-3">
                  @{breeder.username}
                  {breeder.location && <span> · {breeder.location}</span>}
                  {breederSince
                    ? <span> · Breeding since {breederSince}</span>
                    : <span> · Joined {joinYear}</span>
                  }
                </p>

                {breeder.bio && (
                  <p className="text-sm text-spawn-muted-text leading-relaxed max-w-xl mb-4">
                    {breeder.bio}
                  </p>
                )}

                {breeder.specialties && breeder.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {breeder.specialties.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-spawn-surface border border-spawn-border/50 text-spawn-muted-text">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social links */}
                <div className="flex items-center gap-3">
                  {breeder.social_instagram && (
                    <a
                      href={`https://instagram.com/${breeder.social_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-spawn-muted-text hover:text-spawn-cyan transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      {breeder.social_instagram}
                    </a>
                  )}
                  {breeder.social_youtube && (
                    <a
                      href={breeder.social_youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-spawn-muted-text hover:text-spawn-cyan transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex sm:flex-col gap-4 sm:gap-3 shrink-0">
                <div className="text-center sm:text-right">
                  <div className="text-xl font-black text-spawn-cyan">{breeder.fish_count}</div>
                  <div className="text-xs text-spawn-muted-text">Fish registered</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-xl font-black text-spawn-amber">{breeder.spawn_count}</div>
                  <div className="text-xs text-spawn-muted-text">Spawns tracked</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spawns */}
        {spawns.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-bold text-spawn-text mb-6">Active & Recent Spawns</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {spawns.map((spawn: any) => (
                  <div key={spawn.id} className="glass-card rounded-xl border border-spawn-border/40 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-spawn-text text-sm">
                          {spawn.pairs?.pair_name ?? 'Unnamed Spawn'}
                        </p>
                        <p className="text-xs text-spawn-muted-text mt-0.5">
                          {new Date(spawn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STAGE_COLORS[spawn.stage] ?? STAGE_COLORS.planned}`}>
                        {STAGE_LABELS[spawn.stage] ?? spawn.stage}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-spawn-muted-text">
                      {spawn.current_fry_count != null && (
                        <span><strong className="text-spawn-text">{spawn.current_fry_count}</strong> fry</span>
                      )}
                      {spawn.survival_rate != null && (
                        <span><strong className="text-spawn-text">{spawn.survival_rate}%</strong> survival</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-14 px-4 border-t border-spawn-border/30 bg-spawn-surface/10">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl font-bold text-spawn-text mb-3">
              Build your own breeder profile
            </h2>
            <p className="text-spawn-muted-text text-sm leading-relaxed mb-6">
              SpawnOS Breeder gives you a public profile, fish registry, spawn tracker, genetics engine, and verified badge — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup?plan=breeder"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-spawn-amber text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
              >
                Start Breeder Plan
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-spawn-border text-spawn-text text-sm font-semibold hover:border-spawn-border/80 transition-all"
              >
                Compare Plans →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
