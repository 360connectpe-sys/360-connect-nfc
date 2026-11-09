import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader, SimBadge } from '../components/ui'
import { scoreRepository } from '../services/scores'
import { timeUntilReset } from '../lib/week'

const tone = {
  1: 'from-gold to-[#d48a1f] text-espresso',
  2: 'from-[#e9dccb] to-latte text-espresso',
  3: 'from-[#e3b08b] to-[#c98a5f] text-espresso',
}

export default function Prizes() {
  const { restaurant, navigate, nickname } = useApp()
  const [top, setTop] = useState([])
  const reset = timeUntilReset()

  useEffect(() => {
    scoreRepository.getLeaderboard({ limit: 3 }).then(setTop)
  }, [])

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Premios de la semana" subtitle={`Quedan ${reset.d}d ${reset.h}h para el cierre`} back="" />

      <div className="space-y-4 px-4">
        {restaurant.prizes.map((p, i) => {
          const holder = top[p.place - 1]
          const mine = holder && nickname && holder.nickname.toLowerCase() === nickname.toLowerCase()
          return (
            <article
              key={p.place}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`relative animate-fade-up overflow-hidden rounded-3xl bg-linear-to-br p-5 shadow-md ${tone[p.place]}`}
            >
              <span className="absolute -right-3 -bottom-6 font-display text-[120px] leading-none font-bold opacity-15">{p.place}</span>
              <div className="relative flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/40 text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-extrabold tracking-widest uppercase opacity-70">{p.place}.º lugar</p>
                  <h2 className="font-display text-2xl leading-tight font-bold">{p.title}</h2>
                  <p className="mt-1 text-sm opacity-80">{p.description}</p>
                  <p className="mt-3 inline-flex rounded-full bg-white/45 px-3 py-1 text-xs font-bold">
                    {holder ? `${mine ? '¡Eres tú! ' : 'Hoy: '}${holder.nickname} · ${holder.score} pts` : 'Puesto libre'}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <button onClick={() => navigate('juegos')} className="pixel-btn mx-4 mt-6 w-[calc(100%-2rem)] py-4">
        🕹️ Jugar y competir
      </button>

      <section className="mx-4 mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Condiciones</h3>
          <SimBadge>Canje manual</SimBadge>
        </div>
        <ul className="mt-3 space-y-2.5">
          {restaurant.prizeTerms.map((t) => (
            <li key={t} className="flex gap-2.5 text-sm text-cocoa/80">
              <Check className="mt-0.5 size-4 shrink-0 text-olive" /> {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
