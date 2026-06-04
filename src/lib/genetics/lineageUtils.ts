import type { Fish } from '@/types/fish'

export interface LineageLink {
  id: string
  parent_fish_id: string
  child_fish_id: string
  relationship: 'father' | 'mother' | 'offspring'
  spawn_id: string | null
}

export interface LineageNode {
  fish: Fish
  parents: LineageNode[]
  children: LineageNode[]
  depth: number
}

export function buildLineageTree(
  rootFish: Fish,
  allFish: Fish[],
  lineageLinks: LineageLink[],
  maxDepth = 3
): LineageNode {
  const fishMap = new Map<string, Fish>(allFish.map((f) => [f.id, f]))

  function buildNode(fish: Fish, depth: number, visited: Set<string>): LineageNode {
    if (visited.has(fish.id)) {
      return { fish, parents: [], children: [], depth }
    }
    visited.add(fish.id)

    const parentIds = lineageLinks
      .filter((l) => l.child_fish_id === fish.id)
      .map((l) => l.parent_fish_id)

    const childIds = lineageLinks
      .filter((l) => l.parent_fish_id === fish.id)
      .map((l) => l.child_fish_id)

    const parents: LineageNode[] =
      depth < maxDepth
        ? parentIds
            .map((pid) => fishMap.get(pid))
            .filter((f): f is Fish => !!f)
            .map((f) => buildNode(f, depth + 1, new Set(visited)))
        : []

    const children: LineageNode[] =
      depth < maxDepth
        ? childIds
            .map((cid) => fishMap.get(cid))
            .filter((f): f is Fish => !!f)
            .map((f) => buildNode(f, depth + 1, new Set(visited)))
        : []

    return { fish, parents, children, depth }
  }

  return buildNode(rootFish, 0, new Set())
}

export function getAncestors(
  fishId: string,
  lineageLinks: LineageLink[],
  depth = 0,
  maxDepth = 5
): string[] {
  if (depth >= maxDepth) return []
  const parentIds = lineageLinks
    .filter((l) => l.child_fish_id === fishId)
    .map((l) => l.parent_fish_id)
  const deeper = parentIds.flatMap((pid) =>
    getAncestors(pid, lineageLinks, depth + 1, maxDepth)
  )
  return [...parentIds, ...deeper]
}

export function getDescendants(
  fishId: string,
  lineageLinks: LineageLink[],
  depth = 0,
  maxDepth = 5
): string[] {
  if (depth >= maxDepth) return []
  const childIds = lineageLinks
    .filter((l) => l.parent_fish_id === fishId)
    .map((l) => l.child_fish_id)
  const deeper = childIds.flatMap((cid) =>
    getDescendants(cid, lineageLinks, depth + 1, maxDepth)
  )
  return [...childIds, ...deeper]
}

export function checkInbreedingRisk(
  fish1Id: string,
  fish2Id: string,
  lineageLinks: LineageLink[]
): { risk: boolean; reason: string | null } {
  const ancestors1 = new Set(getAncestors(fish1Id, lineageLinks))
  const ancestors2 = new Set(getAncestors(fish2Id, lineageLinks))

  // Direct parent-offspring
  if (ancestors1.has(fish2Id)) return { risk: true, reason: 'Fish 2 is an ancestor of Fish 1 (parent/grandparent)' }
  if (ancestors2.has(fish1Id)) return { risk: true, reason: 'Fish 1 is an ancestor of Fish 2 (parent/grandparent)' }

  // Shared grandparents = half-siblings
  const shared = [...ancestors1].filter((id) => ancestors2.has(id))
  if (shared.length > 0) return { risk: true, reason: 'Shared ancestors detected — potential sibling or cousin pairing' }

  return { risk: false, reason: null }
}
