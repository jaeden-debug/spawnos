import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import CyclingCalculator from '@/components/tools/CyclingCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Nitrogen Cycle Tracker & Calculator | SpawnOS',
  description:
    'Track your aquarium nitrogen cycle with daily test readings. Assess your cycle stage, get next steps, choose the best cycling method, and calculate exact ammonia dosing for fishless cycling.',
  alternates: { canonical: '/tools/nitrogen-cycle' },
}

export default function NitrogenCyclePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Nitrogen Cycle Tracker',
    applicationCategory: 'UtilitiesApplication',
    description: 'Track nitrogen cycle progress and calculate ammonia dosing',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/nitrogen-cycle',
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
              <span className="text-spawn-text">Nitrogen Cycle Tracker</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">🧫</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Nitrogen Cycle Tracker</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Enter your daily test readings to assess your cycle stage and get specific next-step
                  instructions. Compare cycling methods, choose the right approach for your tank, and
                  calculate precise ammonia doses for fishless cycling.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <CyclingCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>The Nitrogen Cycle: Complete Aquarist Guide</h2>
              <p>
                The nitrogen cycle is the biological process that makes aquariums safe for fish. Without
                it, fish waste accumulates as toxic ammonia in a closed water system with no natural
                dilution. Understanding the cycle — and knowing how to establish it correctly — is the
                single most important piece of knowledge for a new aquarist.
              </p>

              <h3>The Biology of the Nitrogen Cycle</h3>
              <p>
                Three compounds are central to the cycle, and two species of bacteria drive the
                conversions. Ammonia (NH₃/NH₄⁺) is produced by fish as a metabolic waste product
                excreted through the gills, and by the decomposition of uneaten food and dead plant
                matter. Ammonia is acutely toxic to fish at concentrations above 0.5 ppm. Nitrite
                (NO₂⁻) is produced by Nitrosomonas bacteria oxidizing ammonia — it interferes with
                hemoglobin and causes effective suffocation in fish above 0.5–1 ppm. Nitrate (NO₃⁻)
                is the end product, produced by Nitrospira bacteria — much less toxic, removed by
                water changes and consumed by live plants.
              </p>

              <h3>Why Fishless Cycling is Superior</h3>
              <p>
                Fish-in cycling subjects fish to weeks of chronic ammonia and nitrite exposure, causing
                gill damage, immune suppression, and shortened lifespans. Fishless cycling using pure
                ammonia is now the recommended standard approach: faster, more reliable, and no animal
                welfare compromise. Use pure liquid ammonia (Dr. Tim's Ammonium Chloride, or janitorial
                grade with no surfactants — test by shaking: no foam means no surfactants).
              </p>

              <h3>The Nitrite Spike: What to Expect</h3>
              <p>
                During a fishless cycle, nitrite rising to 5–10 ppm and staying elevated for 1–2 weeks
                is normal. It represents the period when Nitrosomonas (ammonia → nitrite) is established
                but Nitrospira (nitrite → nitrate) hasn't yet colonized sufficiently. Keep dosing ammonia
                and wait — the spike will peak and then fall. Do not do water changes during a fishless
                cycle; you are removing the ammonia that feeds the developing bacteria.
              </p>

              <h3>Confirming Your Cycle is Complete</h3>
              <p>
                A tank is cycled when ammonia drops to zero within 24 hours of a 2 ppm ammonia dose,
                nitrite simultaneously drops to zero, and nitrate is visibly rising. Run this
                confirmation test before adding any fish. If either ammonia or nitrite reads above
                0.25 ppm after 24 hours, the cycle is not complete.
              </p>

              <h3>Accelerating the Cycle</h3>
              <p>
                Seeding from an established tank is the most reliable acceleration method. Squeeze an
                old sponge from a mature filter into the new tank, or add established filter media
                directly — this can reduce cycle time to 3–7 days. Bottled bacteria (Tetra SafeStart,
                Dr. Tim's One & Only) work well if fresh and stored correctly. API Quick Start contains
                Nitrobacter rather than Nitrospira and is less reliable in practice.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
