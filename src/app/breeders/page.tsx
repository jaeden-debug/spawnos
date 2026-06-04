import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Breeder Directory — SpawnOS',
  description: 'Discover verified fish breeders on SpawnOS. Browse public breeder profiles, their fish registries, spawn history, and specialties.',
  alternates: { canonical: '/breeders' },
}

interface BreederProfile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  location: string | null
  subscription_tier: string
  specialties: string[] | null
  fish_count: number
  spawn_count: number
  created_at: string
}

async function getBreeders(): Promise<BreederProfile[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data } = await supabase
      .from('public_breeders')
      .select('id, username, display_name, bio, location, subscription_tier, specialties, fish_count, spawn_count, created_at')
      .order('created_at', { ascending: false })
      .limit(48)

    return (data ?? []) as BreederProfile[]
  } catch {
    return []
  }
}

export default async function BreedersPage() {
  const breeders = await getBreeders()

  return (
    <>
      <SiteHeader />
      <main className="pt-20">

        {/* Header */}
        <section className="py-14 px-4 border-b border-spawn-border/40">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-2">Community</div>
                <h1 className="text-4xl font-black text-spawn-text mb-3">Breeder Directory</h1>
                <p className="text-spawn-muted-text leading-relaxed max-w-lg">
                  Verified SpawnOS breeders sharing their fish, spawn records, and expertise with the community.
                </p>
              </div>
              <Link
                href="/signup?plan=breeder"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spawn-amber text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all shrink-0"
              >
                Get Listed →
              </Link>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            {breeders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-spawn-muted-text mb-6">No public breeders yet — be the first.</p>
                <Link
                  href="/signup?plan=breeder"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spawn-cyan text-spawn-bg font-bold text-sm hover:bg-opacity-90 transition-all"
                >
                  Create Breeder Profile
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {breeders.map((b) => (
                  <Link
                    key={b.id}
                    href={`/breeders/${b.username}`}
                    className="glass-card rounded-xl border border-spawn-border/40 hover:border-spawn-cyan/30 p-5 transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-spawn-cyan/10 border border-spawn-cyan/20 flex items-center justify-center shrink-0 text-lg font-black text-spawn-cyan">
                        {((b.display_name ?? b.username)[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-spawn-text group-hover:text-spawn-cyan transition-colors text-sm truncate">
                          {b.display_name ?? b.username}
                        </p>
                        <p className="text-xs text-spawn-muted-text">
                          @{b.username}{b.location && ` · ${b.location}`}
                        </p>
                      </div>
                      {b.subscription_tier === 'breeder' && (
                        <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor" className="text-spawn-amber shrink-0 mt-0.5 ml-auto" aria-label="Verified breeder">
                          <path d="M5 0L6.18 3.27L9.51 3.63L7.14 5.74L7.94 9L5 7.27L2.06 9L2.86 5.74L0.49 3.63L3.82 3.27L5 0Z"/>
                        </svg>
                      )}
                    </div>

                    {b.bio && (
                      <p className="text-xs text-spawn-muted-text leading-relaxed mb-3 line-clamp-2">{b.bio}</p>
                    )}

                    {b.specialties && b.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {b.specialties.slice(0, 3).map((s) => (
                          <span key={s} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-spawn-surface border border-spawn-border/50 text-spawn-muted-text">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-spawn-muted-text border-t border-spawn-border/30 pt-3">
                      <span><strong className="text-spawn-text">{b.fish_count}</strong> fish</span>
                      <span><strong className="text-spawn-text">{b.spawn_count}</strong> spawns</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
