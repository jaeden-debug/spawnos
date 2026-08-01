import { requireTier } from '@/lib/subscription'
import Client from './PairsClient'

// Server gate: pairs is a Pro feature. requireTier redirects unauthenticated
// users to /login and free-tier users to /pricing before any client code runs.
export default async function Page() {
  await requireTier('pro')
  return <Client />
}
