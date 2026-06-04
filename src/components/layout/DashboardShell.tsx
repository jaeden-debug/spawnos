import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'
import type { User } from '@supabase/supabase-js'

interface DashboardShellProps {
  children: React.ReactNode
  user: User | null
  pageTitle?: string
}

export default function DashboardShell({ children, user, pageTitle }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-spawn-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} pageTitle={pageTitle} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 page-enter">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
