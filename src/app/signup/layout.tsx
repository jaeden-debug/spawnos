import type { Metadata } from 'next'

/**
 * /signup is a client component and cannot export metadata itself, so it is
 * declared here. Noindex to match /login: both are conversion steps with no
 * search value, and neither is in the sitemap.
 */
export const metadata: Metadata = {
  title: 'Create your SpawnOS account',
  description: 'Create a free SpawnOS account — your first breeding project is free.',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
