import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import HeaterSizeCalculator from '@/components/tools/HeaterSizeCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Heater Size Calculator — Wattage, Model & Cost | SpawnOS',
  description:
    'Calculate the correct aquarium heater wattage for your tank size, room temperature, and target temperature. Includes model recommendations, dual heater setup guide, and monthly energy cost estimate.',
  alternates: { canonical: '/tools/heater-size' },
}

export default function HeaterSizePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Heater Size Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate aquarium heater wattage requirements',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/heater-size',
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
              <span className="text-spawn-text">Heater Size Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">🌡️</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Heater Size Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Determine the correct wattage for your tank, room environment, and species requirements.
                  Includes model recommendations with reliability ratings, dual heater setup guidance,
                  and monthly energy cost estimates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <HeaterSizeCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Choosing the Right Aquarium Heater</h2>
              <p>
                Heater selection is often treated as an afterthought, with buyers simply grabbing the
                wattage printed on a product box that matches their tank size. This leads to undersized
                heaters that struggle to maintain temperature in cold environments, or oversized heaters
                that risk cooking the tank if the thermostat malfunctions.
              </p>

              <h3>The Wattage Calculation</h3>
              <p>
                Heater wattage requirements depend on three variables: tank volume, the temperature
                differential between the room and target water temperature, and how well-insulated the
                tank environment is. The standard rule of thumb — 1 watt per litre — assumes a ~6°C
                rise above room temperature in a temperate indoor environment.
              </p>
              <p>
                For larger temperature rises (cold basements, garages, or winter conditions), wattage
                requirements increase substantially. A 200L tank needing to maintain 26°C in a 15°C
                room (11°C rise) requires roughly 200 × 11 × 0.7 ≈ 1,540 watts of instantaneous
                heating capacity, but because heaters cycle on and off, actual wattage needs are
                lower — roughly 1.5–2× the simple volume calculation.
              </p>

              <h3>Why You Should Always Run Two Heaters</h3>
              <p>
                Running a single large heater is the most common configuration, but it has a critical
                failure mode: heater thermostat failures can fail in the "on" position, running the
                heater continuously and cooking the tank. This is not a rare occurrence — it has been
                responsible for countless whole-tank losses.
              </p>
              <p>
                The professional solution is to run two heaters, each set to maintain the target
                temperature, each sized to be capable of maintaining temperature on its own. If one
                fails "off," the other maintains temperature. If one fails "on," the second heater
                (which is maintaining temperature normally) prevents the runaway from significantly
                exceeding target — the second heater's thermostat will measure the temperature as above
                target and remain off, providing a partial limit on the runaway.
              </p>
              <p>
                Some hobbyists use an external temperature controller (Inkbird IBS-M2, Ranco ETC-111000)
                with a probe in the tank, connecting the heater to the controller rather than relying
                on the heater's internal thermostat. This provides fail-safe protection and very
                accurate temperature control (±0.1°C vs ±1–2°C for most inline thermostats).
              </p>

              <h3>Species That Don't Need Heaters</h3>
              <p>
                Not all aquarium fish are tropical. Several popular species actually prefer cooler
                water and may be stressed by heated tropical aquarium temperatures:
              </p>
              <ul>
                <li><strong>Goldfish:</strong> Optimal 15–22°C — unheated tanks in temperate homes are appropriate</li>
                <li><strong>Axolotls:</strong> Require 14–20°C and become seriously stressed above 22°C — may need a chiller in warm climates</li>
                <li><strong>Hillstream loaches:</strong> 18–23°C — cool, highly oxygenated water is mandatory</li>
                <li><strong>White Cloud Mountain minnows:</strong> 14–22°C — cool temperate species</li>
                <li><strong>Zebra danios:</strong> Tolerate 15–28°C but prefer the cooler end</li>
              </ul>

              <h3>Heater Placement for Even Heating</h3>
              <p>
                Position heaters near filter outputs or powerheads to distribute heated water evenly
                through the tank. A heater placed in a dead spot with no water circulation will heat
                that area only, potentially overheating locally while leaving the rest of the tank
                cool. In large tanks (300L+), two heaters placed at opposite ends of the tank provide
                more even temperature distribution than a single unit.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
