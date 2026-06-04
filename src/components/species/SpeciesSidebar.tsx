import Link from 'next/link'
import type { CMSSpecies, ParamRange } from '@/lib/species-db'

interface Props {
  species: CMSSpecies
  paramTemp: ParamRange | null
  paramPh: ParamRange | null
  paramGh: ParamRange | null
  paramKh: ParamRange | null
  paramTds: ParamRange | null
  difficultyColor: Record<string, string>
  temperamentColor: Record<string, string>
  minTankGallons: number | null
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-spawn-border/30 last:border-0">
      <span className="text-xs text-spawn-muted-text">{label}</span>
      <span className="text-xs font-semibold text-spawn-text text-right">{value}</span>
    </div>
  )
}

function paramStr(p: ParamRange | null): string {
  if (!p) return '—'
  if (p.ideal_min !== undefined && p.ideal_max !== undefined) {
    return `${p.ideal_min}–${p.ideal_max} ${p.unit}`
  }
  return `${p.min}–${p.max} ${p.unit}`
}

function paramFull(p: ParamRange | null): string {
  if (!p) return '—'
  const ideal = (p.ideal_min !== undefined && p.ideal_max !== undefined)
    ? `${p.ideal_min}–${p.ideal_max}`
    : `${p.min}–${p.max}`
  const tolerance = (p.ideal_min !== undefined && (p.min !== p.ideal_min || p.max !== p.ideal_max))
    ? ` (${p.min}–${p.max} tolerated)`
    : ''
  return `${ideal} ${p.unit}${tolerance}`
}

export default function SpeciesSidebar({
  species, paramTemp, paramPh, paramGh, paramKh, paramTds,
  difficultyColor, temperamentColor, minTankGallons,
}: Props) {
  return (
    <aside className="lg:w-72 xl:w-80 shrink-0">
      <div className="lg:sticky lg:top-24 space-y-5">

        {/* Water Parameters Card */}
        <div className="rounded-2xl bg-spawn-surface/60 border border-spawn-border/50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">Water Parameters</h3>
          <div>
            {paramTemp && <ParamRow label="Temperature" value={paramFull(paramTemp)} />}
            {paramPh && <ParamRow label="pH" value={paramFull(paramPh)} />}
            {paramGh && <ParamRow label="General Hardness" value={paramFull(paramGh)} />}
            {paramKh && <ParamRow label="Carbonate Hardness" value={paramFull(paramKh)} />}
            {paramTds && <ParamRow label="TDS" value={paramFull(paramTds)} />}
            {species.param_ammonia && <ParamRow label="Ammonia" value="0 mg/L" />}
            {species.param_nitrite && <ParamRow label="Nitrite" value="0 mg/L" />}
            {species.param_nitrate && <ParamRow label="Nitrate" value={`< ${species.param_nitrate.max} mg/L`} />}
            {species.param_flow && <ParamRow label="Flow" value={species.param_flow} />}
            {species.param_lighting && <ParamRow label="Lighting" value={species.param_lighting} />}
          </div>
          <Link href="/tools/water-parameters"
            className="mt-4 block text-center text-xs text-spawn-cyan hover:underline">
            Full parameter reference →
          </Link>
        </div>

        {/* Care Profile Card */}
        <div className="rounded-2xl bg-spawn-surface/60 border border-spawn-border/50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">Care Profile</h3>
          <div>
            <ParamRow label="Difficulty" value={species.difficulty.charAt(0).toUpperCase() + species.difficulty.slice(1)} />
            <ParamRow label="Temperament" value={species.temperament.charAt(0).toUpperCase() + species.temperament.slice(1)} />
            {minTankGallons && species.min_tank_litres && (
              <ParamRow label="Min. Tank" value={`${species.min_tank_litres}L / ${minTankGallons} gal`} />
            )}
            {species.lifespan_years_max && (
              <ParamRow label="Lifespan" value={
                species.lifespan_years_min
                  ? `${species.lifespan_years_min}–${species.lifespan_years_max} years`
                  : `Up to ${species.lifespan_years_max} years`
              } />
            )}
            {species.adult_size_cm_max && (
              <ParamRow label="Adult Size" value={
                species.adult_size_cm_min
                  ? `${species.adult_size_cm_min}–${species.adult_size_cm_max} cm`
                  : `${species.adult_size_cm_max} cm`
              } />
            )}
            {species.care_feeding_freq && <ParamRow label="Feeding" value={species.care_feeding_freq} />}
            {species.care_social && <ParamRow label="Social" value={species.care_social} />}
          </div>
        </div>

        {/* Substrate & Plants Card */}
        {(species.care_substrate.length > 0 || species.care_plants.length > 0) && (
          <div className="rounded-2xl bg-spawn-surface/60 border border-spawn-border/50 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">Tank Setup</h3>
            {species.care_substrate.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-spawn-muted-text mb-1.5">Substrate</p>
                <div className="flex flex-wrap gap-1.5">
                  {species.care_substrate.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-spawn-bg border border-spawn-border text-spawn-muted-text">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {species.care_plants.length > 0 && (
              <div>
                <p className="text-xs text-spawn-muted-text mb-1.5">Compatible Plants</p>
                <div className="flex flex-wrap gap-1.5">
                  {species.care_plants.slice(0, 6).map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-spawn-bg border border-spawn-border text-spawn-muted-text">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-2xl bg-spawn-surface/60 border border-spawn-border/50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-spawn-muted-text mb-4">Quick Tools</h3>
          <div className="space-y-2">
            {[
              { href: '/tools/tank-volume', label: '📐 Volume Calculator' },
              { href: '/tools/stocking-density', label: '🐠 Stocking Calculator' },
              { href: '/tools/fish-compatibility', label: '🤝 Compatibility Checker' },
              { href: '/blueprints', label: '✨ AI Blueprint Generator' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="block text-sm text-spawn-muted-text hover:text-spawn-cyan transition-colors py-1">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </aside>
  )
}
