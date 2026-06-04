'use client'

import { useRouter } from 'next/navigation'
import type { LineageNode } from '@/lib/genetics/lineageUtils'
import { cn } from '@/lib/utils'

interface LineageTreeProps {
  node: LineageNode
  maxDepth?: number
}

function FishNode({ fish, sex, depth }: { fish: { id: string; name: string; sex: string }; sex: string; depth: number }) {
  const router = useRouter()
  const colorClass = sex === 'male' ? 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5' : sex === 'female' ? 'border-rose-400/30 text-rose-400 bg-rose-400/5' : 'border-spawn-border text-spawn-muted-text bg-spawn-surface'
  const prefix = sex === 'male' ? '♂' : sex === 'female' ? '♀' : '?'

  return (
    <button
      onClick={() => router.push(`/dashboard/fish/${fish.id}`)}
      className={cn(
        'px-3 py-1.5 rounded-xl border text-sm font-medium hover:opacity-80 transition-opacity',
        colorClass
      )}
    >
      {prefix} {fish.name}
    </button>
  )
}

function TreeLevel({
  node,
  currentDepth,
  maxDepth,
}: {
  node: LineageNode
  currentDepth: number
  maxDepth: number
}) {
  if (currentDepth > maxDepth) return null

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Parents row */}
      {node.parents.length > 0 && (
        <>
          <div className="flex items-center gap-4">
            {node.parents.map((parent) => (
              <TreeLevel key={parent.fish.id} node={parent} currentDepth={currentDepth + 1} maxDepth={maxDepth} />
            ))}
          </div>
          {/* Connector line */}
          <div className="flex flex-col items-center">
            <div className="w-px h-6 bg-spawn-border" />
          </div>
        </>
      )}

      {/* Current fish */}
      <FishNode fish={node.fish} sex={node.fish.sex} depth={currentDepth} />

      {/* Children */}
      {node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-spawn-border" />
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {node.children.map((child) => (
              <TreeLevel key={child.fish.id} node={child} currentDepth={currentDepth + 1} maxDepth={maxDepth} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function LineageTree({ node, maxDepth = 3 }: LineageTreeProps) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="min-w-max mx-auto">
        <TreeLevel node={node} currentDepth={0} maxDepth={maxDepth} />
      </div>
    </div>
  )
}
