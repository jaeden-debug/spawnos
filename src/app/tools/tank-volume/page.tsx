import type { Metadata } from 'next'
import ToolLayout from '@/components/layout/ToolLayout'
import TankVolumeCalculator from '@/components/tools/TankVolumeCalculator'
import { getToolBySlug } from '@/data/tools'
import { toolPageSchema, breadcrumbSchema } from '@/lib/schema'

const tool = getToolBySlug('tank-volume')!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.seoDescription,
  alternates: { canonical: '/tools/tank-volume' },
}

export default function TankVolumePage() {
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
      <ToolLayout tool={tool} articleContent={<TankVolumeArticle />}>
        <TankVolumeCalculator />
      </ToolLayout>
    </>
  )
}

function TankVolumeArticle() {
  return (
    <>
      <h2>Why Actual Tank Volume Matters</h2>
      <p>
        The volume printed on an aquarium box is the gross volume of the glass or acrylic enclosure — not the water
        volume you will actually have in your tank. Once you account for substrate, equipment, decorations, and a
        safe air gap at the top, actual water volume can be 15–30% lower than the marketed size.
      </p>
      <p>
        This matters for three critical reasons: stocking density calculations, medication dosing, and filter sizing.
        Overdosing medications based on a gross volume overestimate is a leading cause of medication toxicity in aquarium
        fish. Underestimating filtration requirements based on inflated volume leads to poor water quality.
      </p>

      <h3>Substrate Displacement</h3>
      <p>
        A 2-inch (5 cm) substrate layer in a 75-gallon (48×18×21 inch) aquarium displaces approximately 10 gallons of
        water volume — more than 13% of the tank. Heavier substrates (soil, sand, fine gravel) pack tighter and displace
        more water per inch than lighter decorative gravels.
      </p>
      <p>
        For planted tanks using ADA Amazonia or similar soil substrates, substrate depth often reaches 3–4 inches.
        A 20-gallon long tank with 3-inch soil substrate has closer to 14–15 gallons of actual water volume — significantly
        impacting both stocking and CO₂ dosing calculations.
      </p>

      <h3>Tank Shape and Volume</h3>
      <p>
        Hexagonal and cylindrical tanks are particularly prone to being overstated. A 26-gallon hexagonal tank marketed
        as such has a maximum gross volume of approximately 26 gallons — but its unusable corners, limited footprint,
        and narrow floor space make it considerably less practical than a 20-gallon long with much greater surface area.
      </p>
      <p>
        For livebearing and active species, tank footprint (length × width) matters as much as volume. A tall 30-gallon
        column tank is inferior to a 30-gallon standard for most fish despite identical volume — gas exchange at the
        water surface scales with surface area, not depth.
      </p>

      <h3>Medication Dosing</h3>
      <p>
        When treating disease with medications like salt, ich treatments, or antibiotics, always dose based on net water
        volume. Overdosing is a primary cause of medication-related fish mortality. When in doubt, start at the lower
        end of the recommended range and observe fish behaviour before completing the full dose.
      </p>
    </>
  )
}
