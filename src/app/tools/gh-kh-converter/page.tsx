import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import GHKHConverter from '@/components/tools/GHKHConverter'

export const metadata: Metadata = {
  title: 'GH/KH Hardness Converter — dGH, dKH, ppm, mmol/L | SpawnOS',
  description:
    'Convert aquarium water hardness between dGH, dKH, ppm (mg/L CaCO₃), and mmol/L. Includes carbonate hardness buffering guide and species GH/KH reference table.',
  alternates: { canonical: '/tools/gh-kh-converter' },
}

export default function GHKHPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GH/KH Hardness Converter',
    applicationCategory: 'UtilitiesApplication',
    description: 'Convert aquarium water hardness between dGH, dKH, ppm, and mmol/L',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/gh-kh-converter',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="pt-20">
        <section className="py-12 px-4 border-b border-spawn-border/50 bg-spawn-surface/20">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/tools" className="hover:text-spawn-cyan transition-colors">Tools</Link>
              <span>/</span>
              <span className="text-spawn-text">GH/KH Converter</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">⚗️</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">GH / KH Hardness Converter</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Convert between degrees of general hardness (dGH), carbonate hardness (dKH), parts per million
                  (ppm / mg/L CaCO₃), and millimoles per litre (mmol/L). Includes species reference table and
                  buffering capacity guide.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <GHKHConverter />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Understanding GH and KH in Aquariums</h2>
              <p>
                Water hardness is one of the most misunderstood parameters in the aquarium hobby. Two
                separate measurements — GH (general hardness) and KH (carbonate hardness / alkalinity) —
                are often conflated, but they measure fundamentally different properties of water and
                affect fish in different ways.
              </p>

              <h3>General Hardness (GH): Calcium and Magnesium Content</h3>
              <p>
                General hardness measures the total concentration of dissolved calcium (Ca²⁺) and
                magnesium (Mg²⁺) ions in water. These ions are responsible for water's "hardness" in the
                household sense — they cause limescale buildup in kettles and pipes.
              </p>
              <p>
                For aquatic organisms, GH affects osmoregulation — the biological process by which fish
                and invertebrates maintain internal ion balance. Fish adapted to soft, ion-poor water
                (tetras, discus, wild bettas) have osmoregulatory systems tuned to extract the small
                amounts of ions available in their native environment. Placing them in hard water forces
                their kidneys and gills to work harder to excrete excess ions, causing chronic stress.
              </p>
              <p>
                For invertebrates — shrimp, snails, crabs — GH is critical for exoskeleton development
                and molting. Neocaridina shrimp (cherry shrimp) require GH of 6–8 dGH as a minimum for
                successful molts. Below 4 dGH, failed molts ("death by molt") become common, with animals
                found stuck in their old exoskeleton unable to complete the process.
              </p>

              <h3>Carbonate Hardness (KH): pH Buffering</h3>
              <p>
                Carbonate hardness — also called alkalinity or buffering capacity — measures the
                concentration of carbonate (CO₃²⁻) and bicarbonate (HCO₃⁻) ions. KH does not directly
                affect fish health at typical aquarium levels, but it has a critical indirect effect:
                KH determines how stable your pH is.
              </p>
              <p>
                In a planted tank or any tank with CO₂ fluctuation, pH rises overnight (CO₂ consumed by
                plants during the day, no CO₂ production at night). The magnitude of this swing is
                directly controlled by KH:
              </p>
              <ul>
                <li><strong>KH 0–2 dKH:</strong> pH can swing 2–3 points overnight — potentially lethal</li>
                <li><strong>KH 3–5 dKH:</strong> Moderate swing (0.5–1 pH unit) — manageable for most species</li>
                <li><strong>KH 6+ dKH:</strong> Very stable pH — minimal overnight variation</li>
              </ul>
              <p>
                This creates a dilemma for soft-water species that need low KH for accurate pH: low KH
                means unstable pH, but the instability itself is harmful. The solution is either CO₂
                injection to control pH directly, or very dense plant growth to minimize CO₂ fluctuation.
              </p>

              <h3>Unit Conversions Explained</h3>
              <p>
                The relationship between hardness units is fixed by the molecular weight of CaCO₃:
              </p>
              <ul>
                <li><strong>1 dGH (German degree of hardness)</strong> = 17.848 ppm (mg/L as CaCO₃) = 0.17848 mmol/L</li>
                <li><strong>1 dKH</strong> uses the same conversion factor as dGH (both reference CaCO₃)</li>
                <li><strong>ppm vs mg/L:</strong> In aquarium context, these are equivalent for water at normal aquarium density</li>
              </ul>
              <p>
                Different test kits and water reports use different units — German kits typically report
                dGH/dKH, US municipal water reports use mg/L (ppm), and scientific literature uses mmol/L.
                This converter handles all three directions.
              </p>

              <h3>RO Water and Remineralization</h3>
              <p>
                Reverse osmosis (RO) water has GH and KH of approximately zero, which is ideal for
                adjusting water to specific target parameters. RO water is mixed with tap water to dilute
                hardness, or remineralized using mineral additives:
              </p>
              <ul>
                <li><strong>Caridina shrimp (Crystal, Taiwan Bee):</strong> SL-Aqua Purify or Salty Shrimp Bee Shrimp Mineral GH+ to achieve GH 4–6, KH 0–1</li>
                <li><strong>Neocaridina shrimp (Cherry, Blue Velvet):</strong> Salty Shrimp GH/KH+ to achieve GH 6–8, KH 2–4</li>
                <li><strong>Blackwater soft water (discus, wild bettas):</strong> RO/tap blend to achieve GH 1–5, KH 0–3</li>
                <li><strong>Marine/reef:</strong> Specialized reef salt mixes to achieve NSW parameters</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
