import { useEffect, useState } from 'react'
import { BadgeCheck, Check, IdCard, Ticket } from 'lucide-react'
import { fullName, useApp } from '../context/AppContext'
import { PageHeader, SimBadge } from '../components/ui'
import { gameName } from '../games/catalog'
import { backend, isSharedBackend } from '../services/backend'
import { seasonLabel, timeLeft } from '../lib/season'

const tone = {
  1: 'from-gold to-[#d48a1f] text-espresso',
  2: 'from-[#e9dccb] to-latte text-espresso',
  3: 'from-[#e3b08b] to-[#c98a5f] text-espresso',
}
const STATUS = {
  pending: { text: 'Listo para reclamar', cls: 'bg-olive text-cream' },
  redeemed: { text: 'Entregado', cls: 'bg-cocoa/20 text-cocoa' },
  expired: { text: 'Vencido', cls: 'bg-terra/20 text-terra' },
}

export default function Prizes() {
  const { navigate, player, settings, restaurant } = useApp()
  const [awards, setAwards] = useState([])
  const left = timeLeft()

  useEffect(() => {
    if (player) backend.getMyAwards().then(setAwards).catch(() => setAwards([]))
  }, [player])

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Premios de la semana" subtitle={`Cierre en ${left.d}d ${left.h}h · domingo 23:59 (Lima)`} back="" />

      {/* Mis premios */}
      {awards.length > 0 && (
        <section className="mx-4 mb-6 rounded-3xl bg-espresso p-5 text-cream shadow-lg" data-testid="my-awards">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Ticket className="size-5 text-gold" /> Tus premios
          </h2>
          <div className="mt-3 space-y-3">
            {awards.map((a) => (
              <div key={a.code} className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{a.place}.º lugar · {gameName(a.gameId)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[a.status].cls}`}>{STATUS[a.status].text}</span>
                </div>
                <p className="text-xs text-cream/60">Semana {seasonLabel(a.season)} · {a.prizeTitle}</p>
                <p className="mt-3 rounded-xl bg-cream py-3 text-center font-mono text-2xl font-black tracking-widest text-espresso" data-testid="prize-code">
                  {a.code}
                </p>
                {a.status === 'pending' && (
                  <p className="mt-2 text-xs text-cream/70">
                    Muestra este código y tu <strong>DNI físico</strong> al personal. El nombre del DNI debe coincidir con <strong>{fullName(player)}</strong>.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4 px-4">
        <p className="text-sm text-cocoa/75">
          Se premia al top 3 de <strong>cada</strong> ranking: Memoria gastronómica, Chef Frenético y Carrera del Chef.
        </p>
        {settings.prizes.map((p, i) => (
          <article key={p.place} style={{ animationDelay: `${i * 80}ms` }} className={`relative animate-fade-up overflow-hidden rounded-3xl bg-linear-to-br p-5 shadow-md ${tone[p.place]}`}>
            <span className="absolute -right-3 -bottom-6 font-display text-[120px] leading-none font-bold opacity-15">{p.place}</span>
            <div className="relative flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/40 text-3xl">{p.emoji}</span>
              <div>
                <p className="text-xs font-extrabold tracking-widest uppercase opacity-70">{p.place}.º lugar</p>
                <h2 className="font-display text-2xl leading-tight font-bold">{p.title}</h2>
                <p className="mt-1 text-sm opacity-80">{p.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button onClick={() => navigate('juegos')} className="pixel-btn mx-4 mt-6 w-[calc(100%-2rem)] py-4">
        🕹️ Jugar y competir
      </button>

      {/* Cómo reclamar */}
      <section className="mx-4 mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50">
        <h3 className="font-display text-lg font-bold">¿Cómo reclamo mi premio?</h3>
        <ol className="mt-3 space-y-3 text-sm text-cocoa/85">
          <li className="flex gap-3"><BadgeCheck className="size-5 shrink-0 text-olive" /> Al cierre de la temporada (domingo 23:59:59, hora de Lima) se publican los ganadores oficiales.</li>
          <li className="flex gap-3"><Ticket className="size-5 shrink-0 text-olive" /> Si quedaste en el top 3, aquí aparecerá tu <strong>código de premio único</strong> (de un solo uso).</li>
          <li className="flex gap-3"><IdCard className="size-5 shrink-0 text-olive" /> Acércate a {restaurant.name} con tu <strong>DNI físico</strong> y el código. El personal verifica ambos y marca el premio como entregado.</li>
        </ol>
        <p className="mt-4 rounded-xl bg-sand/70 p-3 text-xs text-cocoa/70">
          🔒 Privacidad: no pedimos ni guardamos tu número de DNI ni fotos del documento. La verificación es solo presencial.
        </p>
      </section>

      <section className="mx-4 mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Condiciones</h3>
          {!isSharedBackend && <SimBadge>Demo</SimBadge>}
        </div>
        <ul className="mt-3 space-y-2.5">
          {restaurant.prizeTerms.map((t) => (
            <li key={t} className="flex gap-2.5 text-sm text-cocoa/80">
              <Check className="mt-0.5 size-4 shrink-0 text-olive" /> {t}
            </li>
          ))}
        </ul>
      </section>

      <button onClick={() => navigate('personal')} className="mx-auto mt-6 block text-xs text-cocoa/45 underline">
        Acceso para el personal
      </button>
    </div>
  )
}
