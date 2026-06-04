'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface TopbarProps {
  user: User | null
  pageTitle?: string
}

export default function Topbar({ user, pageTitle }: TopbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split('@')[0] ??
    'Breeder'

  return (
    <header className="h-14 bg-spawn-surface border-b border-spawn-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-spawn-cyan/10 border border-spawn-cyan/30 flex items-center justify-center">
            <span className="text-spawn-cyan text-xs font-black">S</span>
          </div>
          <span className="font-bold text-spawn-text text-sm">SpawnOS</span>
        </div>
        {pageTitle && (
          <span className="hidden lg:block text-sm text-spawn-muted-text font-medium">{pageTitle}</span>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-spawn-card border border-transparent hover:border-spawn-border transition-all text-sm"
        >
          <div className="w-7 h-7 rounded-full bg-spawn-cyan/10 border border-spawn-cyan/20 flex items-center justify-center">
            <span className="text-spawn-cyan text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-spawn-text-dim font-medium">{displayName}</span>
          <svg className="w-3.5 h-3.5 text-spawn-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 z-50 glass-card rounded-2xl border border-spawn-border shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-spawn-border">
                <div className="text-xs font-medium text-spawn-text">{displayName}</div>
                <div className="text-xs text-spawn-muted truncate">{user?.email}</div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-400/10 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
