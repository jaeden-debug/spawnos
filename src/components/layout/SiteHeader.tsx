'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/species', label: 'Species' },
  { href: '/tools', label: 'Calculators' },
  { href: '/blueprints', label: 'AI Assistant' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const prevScrollY = useRef(0)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 10) {
        setVisible(true)
      } else if (currentScrollY < prevScrollY.current) {
        setVisible(true)
      } else if (currentScrollY > prevScrollY.current + 4) {
        setVisible(false)
        setMenuOpen(false)
      }
      prevScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-spawn-border/50 bg-spawn-bg/90 backdrop-blur-xl transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="SpawnOS home">
            <div className="relative w-8 h-8 rounded-lg bg-spawn-cyan/10 border border-spawn-cyan/30 flex items-center justify-center overflow-hidden">
              <span className="text-spawn-cyan text-xs font-black">S</span>
            </div>
            <span className="font-bold text-lg text-spawn-text tracking-tight">SpawnOS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    active
                      ? 'text-spawn-cyan'
                      : 'text-spawn-muted-text hover:text-spawn-text'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-spawn-muted-text hover:text-spawn-text transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-spawn-amber/10 border border-spawn-amber/30 text-spawn-amber hover:bg-spawn-amber/15 transition-colors whitespace-nowrap"
            >
              Get 15% Off
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-spawn-muted-text hover:text-spawn-text hover:bg-spawn-surface transition-colors"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-spawn-border/50 bg-spawn-bg/95 backdrop-blur-xl">
          <nav className="px-4 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-spawn-cyan/10 text-spawn-cyan'
                      : 'text-spawn-muted-text hover:bg-spawn-surface hover:text-spawn-text'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="mt-2 pt-2 border-t border-spawn-border/50 space-y-1">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-spawn-muted-text hover:bg-spawn-surface hover:text-spawn-text transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-spawn-amber bg-spawn-amber/8 hover:bg-spawn-amber/12 transition-colors"
              >
                🎁 Get 15% Off — Join Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
