import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import LightingCalculator from '@/components/tools/LightingCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Lighting Calculator — PAR, Lux & Plant Requirements | SpawnOS',
  description:
    'Calculate aquarium lighting requirements for your plants and fish. Convert between PAR, lux, and lumens. Get fixture recommendations for low-light, medium, and high-light planted tanks.',
  alternates: { canonical: '/tools/lighting-calculator' },
}

export default function LightingCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Lighting Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate PAR requirements and convert lighting units for planted aquariums',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/lighting-calculator',
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
              <span className="text-spawn-text">Lighting Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">💡</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Aquarium Lighting Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Determine optimal PAR (photosynthetically active radiation) for your plant selection,
                  convert between PAR, lux, and lumens, and get science-backed fixture recommendations.
                  Includes CO₂ interaction analysis and algae risk assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <LightingCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Aquarium Lighting Science: PAR, DLI, and Plant Growth</h2>
              <p>
                Lighting is the most technically complex variable in planted aquarium keeping. Unlike
                temperature or pH, which can be directly tested and adjusted, light intensity involves
                multiple interacting factors: the fixture's output, the depth of water the light must
                penetrate, the reflectivity of substrate and hardscape, and critically — the balance
                between light energy input and the carbon availability for photosynthesis.
              </p>

              <h3>PAR: The Right Measurement for Planted Tanks</h3>
              <p>
                PAR (photosynthetically active radiation) measures light in the 400–700 nm wavelength
                range that plants can use for photosynthesis. It's measured in micromoles of photons
                per square metre per second (µmol/m²/s). This is fundamentally different from lux or
                lumens, which measure human-perceived brightness and are biased toward green wavelengths
                that plants use poorly.
              </p>
              <p>
                A red/blue LED with low lumen output can have high PAR for plant growth, while a neutral
                white fluorescent with high lumen output may have less usable PAR per watt for aquatic
                plants. PAR meters (Seneye, Apogee MQ-500) are the correct tool for measuring planted
                tank light intensity; a lux meter gives only a rough approximation.
              </p>

              <h3>The CO₂ Paradox: Why More Light Can Harm Planted Tanks</h3>
              <p>
                This is the most important concept beginners miss. In a planted tank, there must be a
                balance between three variables: light, CO₂, and nutrients. Photosynthesis consumes all
                three, and whichever is most limiting determines the growth rate.
              </p>
              <p>
                In a tank without CO₂ injection, available CO₂ from surface gas exchange is low (~3–5
                ppm). At low light (20–40 PAR), this CO₂ level is sufficient for plant growth, and
                plants outcompete algae. When light is increased without adding CO₂, plants cannot
                accelerate photosynthesis because they are CO₂-limited, but algae — which are more
                efficient at using low CO₂ — can utilize the extra light. The result is an algae bloom
                and poor plant growth despite "better" light.
              </p>
              <p>
                The rule is: medium light (40–70 PAR) without CO₂ injection, or high light (70–200 PAR)
                with CO₂ injection. Never high light without CO₂.
              </p>

              <h3>Photoperiod and Daily Light Integral (DLI)</h3>
              <p>
                DLI (daily light integral) measures the total photon dose plants receive per day:
                DLI = PAR × hours × 3600 / 1,000,000 (in mol/m²/day). Most aquatic plants thrive
                at DLI 10–25 mol/m²/day, which corresponds to:
              </p>
              <ul>
                <li>50 PAR × 10 hours = 1.8 DLI (very low — low-light plants only)</li>
                <li>80 PAR × 8 hours = 2.3 DLI (low-medium)</li>
                <li>150 PAR × 8 hours = 4.3 DLI (medium-high with CO₂)</li>
              </ul>
              <p>
                One underused technique is running high-intensity light for fewer hours rather than
                medium intensity for long hours — "high noon" periods of 4–6 hours of intense light
                for high-light stem plants, with dimmer periods around them.
              </p>

              <h3>Fish Lighting Preferences</h3>
              <p>
                Light requirements for fish are often incompatible with plant requirements, creating
                genuine tradeoffs in tank design. Blackwater species (wild bettas, discus, neon and
                cardinal tetras) originate from forest streams where overhead canopy blocks most
                direct sunlight, producing PAR levels of 10–30 µmol/m²/s at the water surface.
                These fish are stressed by the 80–150 PAR typical of planted tanks and show their
                best coloration in dimmer, tannin-stained environments.
              </p>
              <p>
                The standard resolution is using dense floating plants (Salvinia, frogbit, water
                lettuce) to create natural dappled light — the floaters grow in high-light conditions
                at the surface and cast diffused, natural light into the water column below.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
