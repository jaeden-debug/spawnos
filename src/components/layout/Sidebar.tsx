'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/dashboard/fish',
    label: 'Fish Library',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/dashboard/pairs',
    label: 'Pair Builder',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    href: '/dashboard/spawns',
    label: 'Spawns',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/lineage',
    label: 'Lineage',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h9M3 18h6m9-12v12m-3-3l3 3 3-3" />
      </svg>
    ),
  },
  {
    href: '/dashboard/parameters',
    label: 'Parameter Log',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    badge: 'New',
  },
  {
    href: '/dashboard/calculators',
    label: 'Calculators',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-spawn-surface border-r border-spawn-border h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-spawn-border">
        <div className="w-8 h-8 rounded-lg bg-spawn-cyan/10 border border-spawn-cyan/30 flex items-center justify-center">
          <span className="text-spawn-cyan text-sm font-black">S</span>
        </div>
        <div>
          <div className="font-black text-spawn-text text-sm">SpawnOS</div>
          <div className="text-xs text-spawn-muted">v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive(item)
                ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
                : 'text-spawn-muted-text hover:text-spawn-text hover:bg-spawn-card'
            )}
          >
            <span className={isActive(item) ? 'text-spawn-cyan' : 'text-spawn-muted'}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {'badge' in item && item.badge && (
              <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full bg-spawn-cyan/15 text-spawn-cyan border border-spawn-cyan/25">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-2 border-t border-spawn-border pt-3">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === '/dashboard/settings'
              ? 'bg-spawn-cyan/10 text-spawn-cyan border border-spawn-cyan/20'
              : 'text-spawn-muted-text hover:text-spawn-text hover:bg-spawn-card'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="flex-1">Settings</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-spawn-border">
        <div className="text-xs text-spawn-muted leading-relaxed">
          <div className="font-medium text-spawn-muted-text mb-1">Blackwater Aquatics Canada</div>
          <div>Powered by Zylx.ai</div>
          <div>Design by StillAwake Media</div>
        </div>
      </div>
    </aside>
  )
}
