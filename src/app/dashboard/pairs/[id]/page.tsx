import { requireTier } from '@/lib/subscription'
import Client from './PairDetailClient'

export default async function Page() {
  await requireTier('pro')
  return <Client />
}
