import type { Metadata } from 'next'
import Link from 'next/link'
import ToolLayout from '@/components/layout/ToolLayout'
import { getToolBySlug } from '@/data/tools'
import { SPECIES_DATA } from '@/data/species'
import { toolPageSchema, breadcrumbSchema } from '@/lib/schema'

const tool = getToolBySlug('water-parameters')!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.seoDescription,
  alternates: { canonical: '/tools/water-parameters' },
}

export default function WaterParametersPage() {
  const jsonLd = [
    toolPageSchema({ name: tool.title, description: tool.description, slug: tool.slug }),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Calculators', href: '/tools' },
      { name: tool.shortTitle, href: `/tools/${tool.slug}` },
    ]),
  ]

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ToolLayout tool={tool} articleContent={<WaterParametersArticle />}>
        <WaterParametersTable />
      </ToolLayout>
    </>
  )
}

function WaterParametersTable() {
  return (
    <div>
      <h2 className="text-lg font-bold text-spawn-text mb-4">Freshwater Species — Parameter Reference</h2>
      <p className="text-sm text-spawn-muted-text mb-6">
        All parameters verified against primary literature. Use as a baseline — individual tank and population
        variation exists. Always test with a calibrated liquid test kit, not test strips.
      </p>
      <div className="overflow-x-auto rounded-xl border border-spawn-border/50">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-spawn-surface/80 border-b border-spawn-border/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Species</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">pH</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Temp °F</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">GH dGH</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Nitrate max</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-spawn-muted-text uppercase tracking-wide">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {SPECIES_DATA.map((s, i) => (
              <tr key={s.slug} className={`border-b border-spawn-border/30 hover:bg-spawn-surface/40 transition-colors ${i % 2 === 0 ? '' : 'bg-spawn-surface/10'}`}>
                <td className="px-4 py-3">
                  <Link href={`/species/${s.slug}`} className="font-semibold text-spawn-text hover:text-spawn-cyan transition-colors">
                    {s.commonName}
                  </Link>
                  <div className="text-xs text-spawn-muted-text italic">{s.scientificName}</div>
                </td>
                <td className="text-center px-4 py-3 text-spawn-text">{s.parameters.phMin}–{s.parameters.phMax}</td>
                <td className="text-center px-4 py-3 text-spawn-text">{s.parameters.tempMin}–{s.parameters.tempMax}</td>
                <td className="text-center px-4 py-3 text-spawn-text">{s.parameters.ghMin}–{s.parameters.ghMax}</td>
                <td className="text-center px-4 py-3 text-spawn-text">{s.parameters.nitrateMax} ppm</td>
                <td className="text-center px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    s.difficulty === 'Beginner'
                      ? 'bg-spawn-emerald/10 border-spawn-emerald/30 text-spawn-emerald'
                      : 'bg-spawn-amber/10 border-spawn-amber/30 text-spawn-amber'
                  }`}>
                    {s.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-spawn-muted/50 mt-3">
        Ammonia and nitrite should always be 0 ppm in a cycled aquarium regardless of species.
      </p>
    </div>
  )
}

function WaterParametersArticle() {
  return (
    <>
      <h2>Understanding Aquarium Water Parameters</h2>
      <p>
        Water parameters are the chemical and physical properties of your aquarium water that determine whether your fish
        can survive and thrive. The key parameters every aquarist needs to understand are pH, temperature, general hardness
        (GH), carbonate hardness (KH), and the nitrogen cycle compounds: ammonia, nitrite, and nitrate.
      </p>

      <h3>pH — Potential of Hydrogen</h3>
      <p>
        pH measures the acidity or alkalinity of water on a logarithmic scale from 0 to 14. A pH of 7.0 is neutral;
        below 7.0 is acidic; above 7.0 is alkaline. Each whole number represents a 10x change in hydrogen ion concentration
        — which is why a shift from pH 7.0 to 6.0 is far more significant than it appears.
      </p>
      <p>
        Different species evolved in waters of vastly different pH. Blackwater Amazonian species like neon tetras and
        discus prefer pH 5.5–6.5, while Central American livebearers like swordtails and mollies thrive at pH 7.5–8.2.
        Keeping a fish at the wrong pH causes chronic osmotic stress, suppresses immune function, and shortens lifespan —
        even if the fish appears healthy in the short term.
      </p>

      <h3>General Hardness (GH)</h3>
      <p>
        General hardness measures the concentration of dissolved calcium and magnesium ions in your water. It is expressed
        in degrees of General Hardness (dGH) or parts per million (ppm), where 1 dGH = 17.9 ppm. Soft water has GH under
        6 dGH; hard water is above 12 dGH.
      </p>
      <p>
        GH matters because calcium and magnesium are essential minerals for fish physiology — bone development, nerve
        function, and osmoregulation all depend on them. Soft-water species like neon tetras and discus have kidneys
        adapted to extract these minerals efficiently from dilute water; hard-water species like swordtails and some cichlids
        require higher concentrations.
      </p>

      <h3>Carbonate Hardness (KH) and pH Stability</h3>
      <p>
        Carbonate hardness measures the concentration of carbonate and bicarbonate ions — the primary pH buffers in
        freshwater aquariums. KH directly determines how resistant your water is to pH changes. A tank with KH below 3 dKH
        is at serious risk of pH crashes (sudden acidic drops that can kill fish overnight), while a tank with KH above
        6 dKH will maintain stable pH even with biological activity and CO₂ injection.
      </p>
      <p>
        For most community aquariums, maintaining KH between 4–8 dKH is ideal for pH stability. Planted tanks injecting
        CO₂ need careful KH management — too low and pH crashes occur; too high and you cannot achieve the acidic pH some
        plants and species prefer.
      </p>

      <h3>Temperature</h3>
      <p>
        Aquarium fish are ectothermic — their body temperature matches the water temperature, and all metabolic processes
        are temperature-dependent. Temperature affects oxygen solubility (cold water holds more oxygen), metabolic rate,
        immune function, digestion speed, and reproductive behaviour.
      </p>
      <p>
        Most tropical freshwater fish require 72–82°F (22–28°C). However, significant variation exists between species:
        German Blue Rams require 80–86°F; zebra danios tolerate down to 65°F; white cloud mountain minnows prefer
        60–72°F. Mixing species with incompatible temperature requirements creates chronic stress for one or both groups.
      </p>

      <h3>The Nitrogen Cycle Compounds</h3>
      <p>
        Ammonia (NH₃/NH₄⁺), nitrite (NO₂⁻), and nitrate (NO₃⁻) are the products of the aquarium nitrogen cycle.
        In a properly cycled tank, beneficial bacteria convert fish waste (ammonia) to nitrite, then nitrite to nitrate.
        Nitrate is removed through regular partial water changes.
      </p>
      <p>
        <strong>Ammonia</strong> is acutely toxic at any detectable concentration. Even 0.25 ppm causes gill irritation
        and immune suppression. In a cycled tank, ammonia should always read zero on a liquid test kit. <strong>Nitrite</strong> is
        similarly toxic, attacking hemoglobin and causing "brown blood disease." <strong>Nitrate</strong> is far less toxic but
        causes chronic problems above 20–40 ppm depending on species. Sensitive species like discus and German Blue Rams
        show disease symptoms at nitrate above 10–15 ppm.
      </p>

      <h3>Testing Your Water</h3>
      <p>
        Liquid test kits (API Master Test Kit, Salifert, Red Sea) are significantly more accurate than test strips.
        Test strips have wide error margins — particularly for pH and KH — that can give false confidence in unsafe water.
        For nitrate specifically, test strips routinely read 2–3x lower than actual concentrations.
      </p>
      <p>
        Test your water weekly during the first three months of a new tank, then every 2–4 weeks in a stable, established
        aquarium. Always test after adding new fish, after treating disease, or after any unusual fish behaviour. Water
        parameters that look good on Monday can deteriorate significantly by Friday if bioload increases suddenly.
      </p>
    </>
  )
}
