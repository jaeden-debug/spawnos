import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import WaterChangeCalculator from '@/components/tools/WaterChangeCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Water Change Calculator — Volume & Nitrate Reduction | SpawnOS',
  description:
    'Calculate exact water change volumes, nitrate reduction across multiple changes, and weekly maintenance percentages. Supports litres and US gallons with tap water nitrate adjustment.',
  alternates: { canonical: '/tools/water-change' },
}

export default function WaterChangePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Water Change Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate water change volumes and nitrate reduction for aquariums',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/water-change',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 px-4 border-b border-spawn-border/50 bg-spawn-surface/20">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-spawn-muted-text mb-6">
              <Link href="/" className="hover:text-spawn-cyan transition-colors">Home</Link>
              <span>/</span>
              <Link href="/tools" className="hover:text-spawn-cyan transition-colors">Tools</Link>
              <span>/</span>
              <span className="text-spawn-text">Water Change Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">💧</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Water Change Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Calculates exact volumes to remove, predicts nitrate concentration after each change,
                  and determines how many consecutive changes are needed to reach your target nitrate level.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <WaterChangeCalculator />
            </div>

            {/* Authority article */}
            <article className="prose-aqua max-w-none">
              <h2>Water Changes: The Foundation of Aquarium Maintenance</h2>
              <p>
                Of all aquarium maintenance tasks, water changes are the most important and the most frequently
                misunderstood. The common advice to "change 25% weekly" is a useful default but ignores the
                chemistry behind why water changes work, and when that default is inadequate.
              </p>

              <h3>What Water Changes Actually Remove</h3>
              <p>
                The primary purpose of water changes is nitrate reduction. Nitrate (<code>NO₃⁻</code>) is the
                end product of the nitrogen cycle — ammonia produced by fish waste and uneaten food is
                converted to nitrite by <em>Nitrosomonas</em> bacteria, and then to nitrate by
                <em>Nitrospira</em> bacteria. Unlike ammonia and nitrite, which are acutely toxic at low
                concentrations, nitrate accumulates in the tank over time and causes chronic stress at high
                levels.
              </p>
              <p>
                Beyond nitrate, water changes also replenish trace minerals depleted by biological processes,
                remove dissolved organic compounds (DOC), export phosphates, and dilute any other metabolic
                byproducts that standard testing doesn't measure. In tanks with thriving plant growth,
                nitrate may be consumed by the plants — but DOC and other byproducts still accumulate.
              </p>

              <h3>The Dilution Equation</h3>
              <p>
                Every water change is a dilution. If your tank contains water at 40 ppm nitrate and you
                replace 25% with fresh tap water at 5 ppm nitrate, the resulting concentration is:
              </p>
              <p>
                <code>New concentration = (Current × (1 − change%)) + (Tap × change%)</code>
              </p>
              <p>
                In this example: <code>(40 × 0.75) + (5 × 0.25) = 30 + 1.25 = 31.25 ppm</code>. A single
                25% change drops nitrate from 40 to ~31 ppm. To reach 20 ppm from 40 ppm, you'd need
                approximately three consecutive 25% water changes, or one single 50% change.
              </p>

              <h3>Nitrate Thresholds by Species</h3>
              <p>
                Not all fish have the same nitrate tolerance. Saltwater fish and corals are significantly
                more sensitive than freshwater fish.
              </p>
              <ul>
                <li><strong>Reef corals:</strong> &lt;5 ppm nitrate — even low nitrate causes bleaching in SPS corals</li>
                <li><strong>Discus / wild bettas / cardinal tetras:</strong> &lt;10 ppm — blackwater species from pristine rivers</li>
                <li><strong>Community freshwater fish:</strong> &lt;20–30 ppm — reasonable safe limit for most species</li>
                <li><strong>Goldfish, cichlids, livebearers:</strong> &lt;40 ppm — more tolerant; excellent filtration reduces change frequency needs</li>
                <li><strong>Nano shrimp (Caridina):</strong> &lt;10 ppm — Caridina shrimp are highly nitrate-sensitive</li>
              </ul>

              <h3>When 25% Weekly Is Not Enough</h3>
              <p>
                The 25% weekly rule was designed for lightly to moderately stocked community aquariums with
                efficient filtration. Several scenarios require more aggressive water change schedules:
              </p>
              <ul>
                <li><strong>Goldfish:</strong> Goldfish produce approximately 4× more waste per unit body weight than small community fish. A 200L goldfish tank may need 30–40% changes twice weekly to maintain nitrate below 40 ppm.</li>
                <li><strong>Heavily stocked tanks:</strong> Any tank stocked above the standard 1cm fish per 2–3L rule requires proportionally more water changes.</li>
                <li><strong>Discus tanks:</strong> Many discus breeders perform daily 50% water changes on grow-out tanks, using matched-temperature water to prevent disease and support growth rates.</li>
                <li><strong>High nitrate tap water:</strong> If your tap water already contains 20–30 ppm nitrate, water changes become partially self-defeating — each change introduces additional nitrate. RO water blending or denitrification systems may be necessary.</li>
              </ul>

              <h3>Tap Water Nitrate: An Overlooked Factor</h3>
              <p>
                Tap water in agricultural areas commonly contains 10–40 ppm nitrate due to fertilizer runoff.
                This fundamentally changes the math of water changes: you're not replacing tank water with
                zero-nitrate water, but with water that may be nearly as high in nitrate as the tank itself.
              </p>
              <p>
                Always test your tap water nitrate before troubleshooting high nitrate in a well-maintained
                tank. If tap water exceeds 20 ppm, a reverse osmosis unit or purchasing RO water for water
                changes is the only reliable solution for sensitive species.
              </p>

              <h3>Temperature Matching</h3>
              <p>
                Water change water should be within 1–2°C of tank water temperature. A sudden influx of cold
                water shocks fish, suppresses immune function, and can trigger ich outbreaks in susceptible
                species. Use a thermometer to verify temperature before adding water, or match by mixing hot
                and cold tap water until the target temperature is reached.
              </p>

              <h3>Dechlorination</h3>
              <p>
                Always treat tap water with a dechlorinator before adding it to the tank.
                Modern municipal water uses chloramine — a chlorine-ammonia compound — rather than plain
                chlorine. Unlike chlorine, chloramine does not dissipate with aging or aeration and must
                be chemically neutralized. Standard sodium thiosulfate-based dechlorinators do not remove
                chloramine; use a product that explicitly neutralizes chloramine (SeaChem Prime,
                Kordon AmQuel+, API Tap Water Conditioner).
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
