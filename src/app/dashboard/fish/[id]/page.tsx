import { requireTier } from '@/lib/subscription'
import Client from './FishDetailClient'

export default async function Page() {
  await requireTier('pro')
  return <Client />
}
