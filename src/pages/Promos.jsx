import { CalendarClock } from 'lucide-react'
import { loyalty, promos } from '../data/promos'
import SmartImage from '../components/SmartImage'
import { PageHeader, SimBadge, formatPrice } from '../components/ui'

const badgeTone = { terra: 'bg-terra text-cream', gold: 'bg-gold text-espresso', olive: 'bg-olive text-cream' }

export default function Promos() {
  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Promociones" subtitle="Descuentos, combos y beneficios" />

      {/* Fidelización */}
      <section className="mx-4 mt-1 animate-fade-up overflow-hidden rounded-3xl bg-espresso p-5 text-cream shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Clientes frecuentes</p>
          <SimBadge dark>Simulado</SimBadge>
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold">{loyalty.name}</h2>
        <p className="mt-1 text-sm text-cream/70">
          Junta {loyalty.stampsRequired} sellos y llévate {loyalty.reward}.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: loyalty.stampsRequired }).map((_, i) => (
            <div
              key={i}
              className={`grid aspect-square place-items-center rounded-full border-2 text-lg ${
                i < loyalty.demoStamps ? 'border-gold bg-gold/20' : 'border-dashed border-cream/25'
              }`}
            >
              {i < loyalty.demoStamps ? '☕' : <span className="text-xs text-cream/30">{i + 1}</span>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-cream/60">
          Llevas {loyalty.demoStamps}/{loyalty.stampsRequired} · ¡Te faltan {loyalty.stampsRequired - loyalty.demoStamps}!
        </p>
      </section>

      <div className="mt-6 space-y-4 px-4">
        {promos.map((p, i) => (
          <article
            key={p.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-latte/50"
          >
            <div className="relative">
              <SmartImage src={p.image} alt={p.title} emoji={p.emoji} className="h-40 w-full" />
              <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-extrabold shadow ${badgeTone[p.accent]}`}>{p.badge}</span>
              <span className="absolute top-3 right-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-bold text-cocoa">{p.type}</span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-cocoa/75">{p.description}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs text-cocoa/60">
                  <CalendarClock className="size-4" /> {p.validity}
                </p>
                <div className="text-right">
                  {p.oldPrice && <p className="text-xs text-cocoa/50 line-through">{formatPrice(p.oldPrice)}</p>}
                  <p className="font-display text-2xl leading-none font-bold text-terra">{formatPrice(p.price)}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
