import Link from 'next/link'

interface Props {
  /** Visual variant. `bar` is a slim full-width strip; `inline` is plain text. */
  variant?: 'bar' | 'inline'
  className?: string
}

/**
 * Sitewide brand attribution. Renders the canonical statement
 * "SpawnOS is a Blackwater Aquatics Canada product" on every page for both
 * users and SEO. Keep the wording exact — it is the parent-brand signal.
 */
export default function BrandLine({ variant = 'inline', className = '' }: Props) {
  const content = (
    <>
      <span className="font-semibold text-spawn-text/80">SpawnOS</span> is a{' '}
      <a
        href="https://blackwateraquatics.ca"
        target="_blank"
        rel="noopener noreferrer"
        className="text-spawn-cyan hover:underline font-medium"
      >
        Blackwater Aquatics Canada
      </a>{' '}
      product.
    </>
  )

  if (variant === 'bar') {
    return (
      <div
        className={`border-t border-spawn-border/40 bg-spawn-surface/30 px-4 py-3 text-center text-xs text-spawn-muted-text ${className}`}
      >
        {content}{' '}
        <Link href="/spawnos-by-blackwater-aquatics" className="text-spawn-muted-text/70 hover:text-spawn-cyan transition-colors">
          Learn more →
        </Link>
      </div>
    )
  }

  return <p className={`text-xs text-spawn-muted-text ${className}`}>{content}</p>
}
