import { type NextRequest, NextResponse } from 'next/server'

// Only protect dashboard routes. All public routes (/, /species, /tools, /blueprints, /knowledge, /about, /login, /signup) are open.
const PROTECTED_PREFIXES = ['/dashboard']

/**
 * Domain split (Aug 2026):
 *
 *   spawnos.ca   → the public marketing/SEO website
 *   spawnos.app  → the native application domain: Universal Links, auth
 *                  callbacks, the AASA file, the native-app fallback page and
 *                  the /api/spawnos/* routes the iOS app depends on.
 *
 * spawnos.app is deliberately NOT redirected wholesale to spawnos.ca: Apple
 * requires the domain itself to serve its association file, and auth links
 * must stay on HTTPS spawnos.app so iOS can open the app.
 *
 * Editorial paths that used to be indexed on spawnos.app are redirected
 * path-for-path to spawnos.ca so the content has exactly one canonical home.
 */
const APP_HOSTS = new Set(['spawnos.app', 'www.spawnos.app'])

/** Paths that must keep working on spawnos.app. */
const APP_DOMAIN_PREFIXES = [
  '/api/',
  '/.well-known/',
  '/auth/',
  '/open/',
  '/_next/',
  '/app-landing',
]

function isAppDomainPath(pathname: string): boolean {
  return APP_DOMAIN_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? ''

  if (APP_HOSTS.has(host)) {
    // The app domain serves only app infrastructure.
    if (isAppDomainPath(pathname)) {
      return NextResponse.next()
    }

    // Root shows the lightweight native-app fallback, not the marketing site.
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/app-landing', request.url))
    }

    // Everything else was marketing content: send it to its canonical home.
    return NextResponse.redirect(`https://spawnos.ca${pathname}${search}`, 308)
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  // For protected routes: check Supabase session cookie
  // Dynamically import to avoid breaking build when Supabase env vars are absent
  try {
    const { updateSession } = await import('@/lib/supabase/middleware')
    return await updateSession(request)
  } catch {
    // If Supabase is not configured, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json)$).*)',
  ],
}
