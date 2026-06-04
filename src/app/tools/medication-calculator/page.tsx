import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import MedicationCalculator from '@/components/tools/MedicationCalculator'

export const metadata: Metadata = {
  title: 'Aquarium Medication Dosage Calculator — Fish Disease Treatment | SpawnOS',
  description:
    'Calculate precise aquarium medication doses for kanamycin, metronidazole, copper, ich treatments, and more. Includes treatment schedules, species safety warnings, and hospital tank protocols.',
  alternates: { canonical: '/tools/medication-calculator' },
}

export default function MedicationCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquarium Medication Dosage Calculator',
    applicationCategory: 'UtilitiesApplication',
    description: 'Calculate aquarium medication doses with treatment schedules and safety warnings',
    operatingSystem: 'Web',
    url: 'https://spawnos.com/tools/medication-calculator',
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
              <span className="text-spawn-text">Medication Calculator</span>
            </nav>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">💊</div>
              <div>
                <h1 className="text-3xl font-black text-spawn-text mb-2">Medication Dosage Calculator</h1>
                <p className="text-spawn-muted-text leading-relaxed">
                  Calculate precise medication doses for kanamycin, metronidazole, copper, ich treatments,
                  praziquantel, and more. Generates full treatment schedules, identifies species-specific
                  risks, and flags dangerous interactions with invertebrates and biological filters.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-spawn-surface/30 border border-spawn-border/50 rounded-2xl p-6 mb-12">
              <MedicationCalculator />
            </div>

            <article className="prose-aqua max-w-none">
              <h2>Aquarium Disease Treatment: Diagnosis Before Medication</h2>
              <p>
                The most common and most damaging mistake in aquarium disease treatment is medicating
                without accurate diagnosis. Many aquarium diseases have visually similar symptoms —
                a fish gasping at the surface could indicate ich, velvet, bacterial gill disease,
                low dissolved oxygen, ammonia poisoning, or a failing filter. Treating with the wrong
                medication wastes time, exposes fish to unnecessary chemical stress, destroys the
                biological filter, and kills the disease you weren't targeting while allowing the
                actual pathogen to progress.
              </p>

              <h3>The Hospital Tank: Non-Negotiable</h3>
              <p>
                Medicating a display tank should be a last resort. Every medication used in aquarium
                disease treatment has collateral damage:
              </p>
              <ul>
                <li><strong>Antibiotics (kanamycin, nitrofurazone, doxycycline):</strong> Destroy beneficial nitrifying bacteria — the biological filter. Medicating a display tank risks a full nitrogen cycle crash, creating ammonia toxicity on top of disease.</li>
                <li><strong>Copper:</strong> Instantly lethal to all invertebrates, snails, shrimp, and live rock microbiome. Even trace copper contamination persists in substrate and silicone for months.</li>
                <li><strong>Formalin/malachite green (Ich-X, Rid-Ich):</strong> Toxic to biological filter bacteria and harmful to invertebrates.</li>
                <li><strong>Metronidazole:</strong> Less destructive to the filter but harmful to invertebrates at higher concentrations.</li>
              </ul>
              <p>
                A hospital tank — a bare-bottom tank with a mature sponge filter from the display tank,
                a heater, and a hiding place — allows intensive treatment without risking the entire
                display ecosystem. It also allows close observation of the sick fish. Minimum size
                is 40L for most fish; hospital tanks do not need to match display tank aesthetics.
              </p>

              <h3>Common Diseases and First-Line Treatments</h3>
              <p>
                <strong>Ich (Ichthyophthirius multifiliis):</strong> White salt-grain spots on body
                and fins, scratching behavior. First-line: Ich-X or Kordon Rid-Ich+ at half dose for
                sensitive species, combined with temperature increase to 28–30°C to accelerate the
                parasite life cycle. Treat every 24–48 hours for 10 days.
              </p>
              <p>
                <strong>Velvet (Piscinoodinium / Amyloodinium):</strong> Gold dust appearance
                on body, visible under flashlight, rapid gill movement. Treat with copper (marine)
                or formalin/malachite green (freshwater) plus complete blackout — the parasite has
                a photosynthetic stage that requires light. Marine velvet is more dangerous than
                freshwater velvet and requires copper at therapeutic levels.
              </p>
              <p>
                <strong>Columnaris (Flavobacterium columnare):</strong> White-gray patches with
                irregular edges, typically starting near the dorsal fin. Spreads very rapidly at
                higher temperatures. First-line: nitrofurazone at full dose, lower temperature to 24°C
                to slow progression, hospital tank mandatory. Second-line: kanamycin if nitrofurazone
                is unavailable.
              </p>
              <p>
                <strong>Dropsy (Aeromonas septicemia):</strong> Pinecone-like scale raising, distended
                abdomen, lethargy. Poor prognosis — by the time scales raise, internal organ damage
                is severe. Treatment: kanamycin + hospital tank + pristine water quality. Epsom salt
                (Magnesium sulfate) at 1 tbsp/40L may help draw fluid from tissues.
              </p>
              <p>
                <strong>Internal parasites / Hexamita / HITH:</strong> Pit lesions on head and lateral
                line (cichlids/discus), white stringy feces, wasting. First-line: metronidazole added
                to food (more effective than water column dosing) at 5 mg/g of food, fed 3× daily for
                7 days.
              </p>

              <h3>Activated Carbon and Medication</h3>
              <p>
                Remove all activated carbon before medicating. Carbon adsorbs most medications rapidly,
                rendering treatment ineffective within hours. After completing the treatment course,
                activated carbon can be used to remove medication residue from the water before
                returning fish to the display tank. Do not add new carbon during treatment.
              </p>

              <h3>UV Sterilizers During Treatment</h3>
              <p>
                Turn off UV sterilizers during medication treatment. UV light degrades many aquarium
                medications — including formalin/malachite green combinations and some antibiotics —
                reducing their effective concentration and compromising treatment. UV can be restarted
                after the medication course is complete.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
