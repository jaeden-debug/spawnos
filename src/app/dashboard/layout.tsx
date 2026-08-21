import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * The web dashboard is no longer the product SpawnOS sells — the iPhone app
 * is. These routes stay available and working for anyone who used them, but
 * they are private, signed-in-only surfaces with no search value, and they
 * must not compete with /app for product intent.
 *
 * robots.txt already disallows /dashboard; this makes the intent explicit at
 * the page level too, which is what search engines honour if a signed-in URL
 * is ever linked externally.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return <>{children}</>
  } catch {
    return (
      <div className="min-h-screen bg-spawn-bg flex items-center justify-center p-4">
        <div className="max-w-md glass-card rounded-2xl p-8 border border-amber-400/20 text-center">
          <div className="text-3xl mb-4">⚙️</div>
          <h2 className="font-black text-xl text-spawn-text mb-3">Supabase Not Connected</h2>
          <p className="text-spawn-muted-text text-sm mb-6 leading-relaxed">
            Add your Supabase environment variables to get started.
            Create a <code className="text-spawn-cyan bg-spawn-surface px-1.5 py-0.5 rounded">.env.local</code> file with:
          </p>
          <div className="text-left bg-spawn-surface rounded-xl p-4 border border-spawn-border text-xs font-mono text-spawn-cyan space-y-1">
            <div>NEXT_PUBLIC_SUPABASE_URL=your_url</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key</div>
          </div>
          <p className="text-xs text-spawn-muted mt-4">See docs/SETUP.md for full setup instructions</p>
        </div>
      </div>
    )
  }
}
