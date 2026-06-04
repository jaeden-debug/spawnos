import Link from 'next/link'

const TOOLS_LINKS = [
  { href: '/tools/water-parameters', label: 'Water Parameters' },
  { href: '/tools/stocking-density', label: 'Stocking Density' },
  { href: '/tools/nitrogen-cycle', label: 'Nitrogen Cycle' },
  { href: '/tools/fish-compatibility', label: 'Compatibility Checker' },
  { href: '/tools/tank-volume', label: 'Tank Volume' },
  { href: '/tools/ph-buffer', label: 'pH Buffer' },
]

const SPECIES_LINKS = [
  { href: '/species/betta-splendens', label: 'Betta Splendens' },
  { href: '/species/poecilia-reticulata', label: 'Guppy' },
  { href: '/species/paracheirodon-innesi', label: 'Neon Tetra' },
  { href: '/species/corydoras-paleatus', label: 'Corydoras' },
  { href: '/species/pterophyllum-scalare', label: 'Angelfish' },
  { href: '/species', label: 'All Species →' },
]

const SITE_LINKS = [
  { href: '/blueprints', label: 'AI Tank Blueprints' },
  { href: '/knowledge', label: 'Knowledge Base' },
  { href: '/about', label: 'About SpawnOS' },
  { href: 'https://blackwateraquatics.ca', label: 'Blackwater Aquatics', external: true },
]

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-spawn-border/50 bg-spawn-surface/50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="SpawnOS home">
              <div className="relative w-7 h-7 rounded-md bg-spawn-cyan/10 border border-spawn-cyan/30 flex items-center justify-center overflow-hidden">
                <img
                  src="/branding/spawnos-logo-master.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                <span className="text-spawn-cyan text-xs font-black absolute">S</span>
              </div>
              <span className="font-bold text-spawn-text">SpawnOS</span>
            </Link>
            <p className="text-sm text-spawn-muted-text leading-relaxed mb-4">
              The aquarium operating system. Science-grade tools, species data, and AI-powered tank design for hobbyists who demand precision.
            </p>
            <p className="text-xs text-spawn-muted/70">
              A{' '}
              <a
                href="https://blackwateraquatics.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-spawn-cyan hover:underline"
              >
                Blackwater Aquatics Canada
              </a>{' '}
              product.
            </p>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">
              Calculators
            </h3>
            <ul className="space-y-2">
              {TOOLS_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Species */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">
              Species Database
            </h3>
            <ul className="space-y-2">
              {SPECIES_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Site */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">
              SpawnOS
            </h3>
            <ul className="space-y-2">
              {SITE_LINKS.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-spawn-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-spawn-muted/60">
            © {year} SpawnOS / Blackwater Aquatics Canada. All rights reserved.
          </p>
          <p className="text-xs text-spawn-muted/50">
            Data provided for educational purposes. Always verify parameters with a calibrated test kit.
          </p>
        </div>
      </div>
    </footer>
  )
}
