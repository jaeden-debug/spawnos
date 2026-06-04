import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — SpawnOS',
  description: 'Sign in to your SpawnOS account.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-spawn-bg flex flex-col">
      <header className="px-6 py-4 border-b border-spawn-border/50">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="font-bold text-spawn-text">SpawnOS</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-spawn-text mb-2">Sign In</h1>
          <p className="text-spawn-muted-text text-sm mb-8">
            Access your SpawnOS account.
          </p>
          <LoginForm />
          <p className="text-xs text-spawn-muted/50 text-center mt-6">
            <Link href="/" className="hover:text-spawn-cyan transition-colors">← Back to SpawnOS</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
