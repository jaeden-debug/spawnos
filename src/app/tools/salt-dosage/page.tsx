import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SaltDosageCalculator from '@/components/tools/SaltDosageCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Salt Dosage Calculator — Freshwater, Brackish & Marine | SpawnOS',
  description:
    'Calculate exact aquarium salt doses for disease treatment, electrolyte support, brackish water, and marine saltwater preparation. Includes species safety warnings and marine SG presets.',
  alternates: { canonical: '/tools/salt-dosage' },
}

export default function SaltDosagePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Salt Dosage Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate aquarium salt doses for freshwater treatment and marine setup',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/salt-dosage',
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
              <span className="text-spawn-text">Salt Dosage Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">🧂</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Salt Dosage Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Calculate precise salt doses for freshwater disease treatment, electrolyte support,
                  brackish water preparation, and marine saltwater mixing. Includes marine specific
                  gravity presets, species safety warnings, and gram-to-tablespoon conversions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <SaltDosageCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Aquarium Salt: Uses, Risks, and Species Compatibility</h2>
              <p>
                Salt in aquariums is one of the most misunderstood and misused tools in the hobby.
                Used correctly and at the right dose for the right species, it reduces disease stress,
                inhibits nitrite toxicity, and supports osmoregulation during illness. Used incorrectly,
                it kills shrimp, harms scaleless fish, destroys planted tanks, and provides false
                confidence in treating conditions it cannot cure.
              </p>

              <h3>How Salt Works in Freshwater Aquariums</h3>
              <p>
                Freshwater fish are hypertonic to their environment — their body fluids contain more
                dissolved solids than the surrounding water. They constantly lose ions through osmosis
                and must actively absorb them through gill tissue to maintain internal balance. This
                osmoregulatory work requires energy and can be compromised by illness, injury, or
                poor water quality.
              </p>
              <p>
                Adding sodium chloride (NaCl) at low doses (1–3 g/L) raises the water's osmotic
                concentration slightly, reducing the osmotic gradient the fish must work against.
                This frees energy for immune function and healing. At higher doses (3–5 g/L), the
                increased salinity creates an osmotic environment that some pathogens and parasites
                cannot tolerate — the theoretical basis for salt as an ich treatment.
              </p>
              <p>
                However, the clinical evidence for salt as a sole ich treatment is weak. Salt may
                slow parasite progression and reduce secondary stress, but it does not reliably
                eliminate an established ich infection. Heat treatment (raising temperature to
                28–30°C to accelerate the parasite life cycle through the free-swimming stage,
                combined with medication) is significantly more effective.
              </p>

              <h3>Nitrite Reduction: Salt's Most Reliable Use</h3>
              <p>
                The most scientifically validated use of salt in freshwater aquariums is nitrite
                toxicity reduction. Nitrite (NO₂⁻) competes with chloride (Cl⁻) for uptake through
                gill chloride cells. When chloride concentration in the water is high relative to
                nitrite, chloride ions outcompete nitrite for transport — the fish absorbs chloride
                instead of nitrite, dramatically reducing toxicity.
              </p>
              <p>
                At 1–2 g/L aquarium salt (providing approximately 600–1,200 mg/L chloride), nitrite
                toxicity is significantly reduced even when nitrite readings are elevated. This is
                particularly valuable during the cycling stage of a fish-in cycle when nitrite spikes
                are unavoidable.
              </p>

              <h3>Species That Cannot Tolerate Salt</h3>
              <p>
                This is the most critical safety information. Salt tolerance varies dramatically between
                species, and dosing errors can be fatal within hours:
              </p>
              <ul>
                <li><strong>Shrimp (all species — Neocaridina, Caridina, Amano):</strong> No salt tolerance whatsoever. Even 0.5 g/L causes significant mortality. Never use salt in a shrimp tank.</li>
                <li><strong>Scaleless fish (Kuhli loach, hillstream loach, most loaches, corydoras):</strong> Absorb ions directly through skin rather than gills; much more sensitive to dissolved salts. Maximum 1 g/L, briefly.</li>
                <li><strong>Planted tanks:</strong> Most aquatic plants are severely harmed above 1–2 g/L NaCl. Salt and planted tanks are fundamentally incompatible at therapeutic doses.</li>
                <li><strong>Tetras and other soft-water species:</strong> Some tolerance at 1–3 g/L, but blackwater tetras (neon, cardinal) are sensitive. Maximum therapeutic dose is 2 g/L.</li>
              </ul>

              <h3>Marine Salt: A Completely Different Product</h3>
              <p>
                Marine salt mixes (Instant Ocean, Red Sea, Aquaforest) are not sodium chloride. They
                are complex mineral blends containing calcium, magnesium, potassium, strontium,
                bicarbonates, and trace elements designed to replicate natural seawater chemistry.
                Marine salt must never be substituted with aquarium salt or table salt for marine
                aquariums — the ionic balance would be completely wrong, fatal to marine invertebrates
                and corals.
              </p>
              <p>
                Marine salt must always be mixed with RODI (reverse osmosis + deionization) water,
                never tap water. Tap water contains chlorine, chloramine, phosphates, silicates, and
                dissolved minerals that interfere with salt chemistry and promote algae in reef tanks.
              </p>

              <h3>Measuring Specific Gravity Accurately</h3>
              <p>
                Swing-arm hydrometers — the inexpensive plastic devices sold at pet stores — are
                notoriously inaccurate, often reading 0.002–0.004 SG below the actual value. For
                FOWLR and reef systems where precision matters, a temperature-compensating refractometer
                calibrated with distilled water is the minimum standard. Digital lab refractometers
                provide the highest accuracy for reef systems.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
