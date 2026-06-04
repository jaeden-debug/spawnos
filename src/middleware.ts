import { type NextRequest, NextResponse } from 'next/server'

// Only protect dashboard routes. All public routes (/, /species, /tools, /blueprints, /knowledge, /about, /login, /signup) are open.
const PROTECTED_PREFIXES = ['/dashboard']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
