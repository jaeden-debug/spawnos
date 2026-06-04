import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import FilterSizeCalculator from '@/components/tools/FilterSizeCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Filter Size Calculator — Flow Rate & Model Selector | SpawnOS',
  description:
    'Calculate the correct filter flow rate for your tank size, stocking level, and fish species. Get specific canister, HOB, sponge, and sump model recommendations with turnover rates.',
  alternates: { canonical: '/tools/filter-size' },
}

export default function FilterSizePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Filter Size Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate required filter flow rate and get model recommendations',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/filter-size',
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
              <span className="text-spawn-text">Filter Size Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">🔬</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Filter Size Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Calculate required flow rate based on tank volume, bioload, and species. Get specific
                  canister, HOB, sponge, and sump model recommendations with actual LPH ratings and
                  turnover multiples.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <FilterSizeCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Aquarium Filtration: Flow Rate, Bioload, and Filter Type</h2>
              <p>
                Filtration is the life support system of an aquarium. Unlike most aquarium equipment,
                choosing the wrong filter — specifically, an undersized one — doesn't produce obvious
                symptoms until ammonia or nitrite reaches toxic levels. By then, the damage to fish
                health may already be significant.
              </p>

              <h3>The Turnover Rule</h3>
              <p>
                Filter flow rate is typically expressed as a "turnover" — the number of times the entire
                tank volume passes through the filter per hour. A 200L tank with a filter rated at
                800 LPH achieves 4× turnover.
              </p>
              <p>
                The standard recommendation of 4–6× turnover applies to lightly to moderately stocked
                community aquariums. This is not a biological constant — it's a practical guideline
                derived from the bioload of average community fish. Heavy bioload fish (goldfish, large
                plecos, heavily stocked cichlid tanks) require 8–10× turnover minimum.
              </p>
              <p>
                Note that manufacturer-rated flow rates are tested without media resistance. Real-world
                flow through a fully loaded canister filter with multiple media stages is 20–40% lower
                than the rated figure. Always size up by at least one tier when buying a canister filter.
              </p>

              <h3>Biological vs. Mechanical Filtration</h3>
              <p>
                Filtration has three stages, and flow rate addresses mechanical filtration most directly:
              </p>
              <ul>
                <li><strong>Mechanical:</strong> Physical removal of suspended particles via filter media. Flow rate determines how quickly particles are captured before settling. Regular cleaning (every 1–2 weeks for HOBs, 4–6 weeks for canisters) prevents nitrate accumulation in trapped waste.</li>
                <li><strong>Biological:</strong> Colonization of filter media by beneficial bacteria (<em>Nitrosomonas</em>, <em>Nitrospira</em>). The biological capacity is determined by surface area of media, not flow rate — more porous media with higher surface area supports larger bacterial colonies.</li>
                <li><strong>Chemical:</strong> Activated carbon, Purigen, zeolite — removes dissolved organics and specific chemicals. Optional for most setups; removed during medication treatment.</li>
              </ul>

              <h3>Filter Type Selection Guide</h3>
              <p>
                <strong>Canister filters</strong> are the best choice for most tanks above 100L. They
                have large media volumes for biological filtration, work silently, and can be customized
                with different media layers. The sealed design means water must pass through all media
                stages without bypassing.
              </p>
              <p>
                <strong>HOB (hang-on-back) filters</strong> are excellent for tanks under 200L.
                Easy to access for cleaning, good flow, but limited media volume compared to canisters
                of similar footprint. The AquaClear series with sponge/BioMax/activated carbon is the
                standard recommendation for HOBs.
              </p>
              <p>
                <strong>Sponge filters</strong> are ideal for fry tanks, hospital tanks, quarantine
                tanks, shrimp tanks, and betta tanks. Airstone-driven water flow is gentle enough for
                fry and shrimp. The sponge surface hosts biological filtration and provides microfilm
                (aufwuchs) that shrimp and fry graze on. They cannot handle heavy bioload tanks.
              </p>
              <p>
                <strong>Sump filters</strong> are the professional choice for large tanks and saltwater
                reef systems. The separate sump chamber allows large media volumes, easy equipment
                placement (skimmers, reactors, dosing pumps), and maintenance without disturbing the
                display tank.
              </p>

              <h3>Goldfish: The Special Case</h3>
              <p>
                Goldfish filtration requirements deserve special mention because they are dramatically
                different from other freshwater fish. A common goldfish produces approximately 4× more
                ammonia per unit body weight than a similarly sized tropical fish. A 300L goldfish tank
                with three standard-sized goldfish requires filtration equivalent to a 1,200L community
                fish tank.
              </p>
              <p>
                The only reliable approach for fancy goldfish indoors is a quality canister filter
                rated significantly above tank volume (Fluval 407 or 407 on a 200L tank, not a 307),
                plus weekly 30% water changes. No filter, regardless of rating, eliminates the need for
                water changes in a goldfish setup.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
