import { useEffect, useState } from 'react'
import { ChevronRight, Lock, Pencil, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { games } from '../games/registry'
import { PageHeader } from '../components/ui'
import NicknameModal from '../components/NicknameModal'
import { scoreRepository } from '../services/scores'
import { getTableRoomId } from '../services/rooms/roomService'

export default function GamesHub() {
  const { navigate, nickname, table, restaurant } = useApp()
  const [askName, setAskName] = useState(false)
  const [pending, setPending] = useState(null)
  const [leader, setLeader] = useState(null)

  useEffect(() => {
    scoreRepository.getLeaderboard({ limit: 1 }).then(([top]) => setLeader(top ?? null))
  }, [])

  const solo = games.filter((g) => g.mode === 'solo')
  const multi = games.filter((g) => g.mode === 'multi')

  const play = (id) => {
    if (!nickname) {
      setPending(id)
      setAskName(true)
    } else navigate(`juegos/${id}`)
  }

  return (
    <div className="arcade-bg min-h-dvh pb-8 text-cream">
      <PageHeader dark title="ZONA DE JUEGOS" subtitle="Juega mientras esperas tu pedido" back="" />

      <div className="px-4">
        {/* Jugador */}
        <button
          onClick={() => setAskName(true)}
          className="flex w-full animate-fade-up items-center gap-3 rounded-2xl border-2 border-white/10 bg-black/25 p-3 text-left"
        >
          <span className="pixel-frame grid size-12 place-items-center rounded-xl bg-arcade-2 text-2xl">👾</span>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[8px] text-mint">PLAYER 1 · MESA {table}</p>
            <p className="mt-1.5 truncate text-base font-bold">{nickname || 'Toca para elegir tu apodo'}</p>
          </div>
          <Pencil className="size-4 text-cream/50" />
        </button>

        {/* Premio */}
        <button
          onClick={() => navigate('premios')}
          className="mt-3 flex w-full animate-fade-up items-center gap-3 rounded-2xl bg-linear-to-r from-neon to-[#ff8a5c] p-3.5 text-left text-arcade shadow-[0_6px_30px_-8px_rgba(255,181,71,0.6)]"
        >
          <span className="text-2xl">🏆</span>
          <div className="flex-1 text-sm">
            <p className="font-extrabold">1.er lugar semanal: {restaurant.prizes[0].title}</p>
            <p className="text-xs font-semibold opacity-75">
              {leader ? `Líder actual: ${leader.nickname} · ${leader.score} pts` : 'Sé el primero del ranking'}
            </p>
          </div>
          <ChevronRight className="size-5" />
        </button>

        <h2 className="mt-7 font-pixel text-[10px] text-cream/60">— ELIGE TU JUEGO —</h2>
        <div className="mt-4 space-y-4">
          {solo.map((g, i) => (
            <button
              key={g.id}
              onClick={() => play(g.id)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group flex w-full animate-fade-up items-center gap-4 rounded-3xl border-2 border-white/10 bg-arcade-2 p-4 text-left shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-1 active:shadow-none"
            >
              <span
                className="grid size-16 shrink-0 place-items-center rounded-2xl text-4xl"
                style={{ background: `${g.color}26`, boxShadow: `inset 0 0 0 2px ${g.color}88` }}
              >
                {g.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-pixel text-[11px] leading-relaxed" style={{ color: g.color }}>{g.name.toUpperCase()}</p>
                <p className="mt-1 text-sm text-cream/75">{g.tagline}</p>
                <p className="mt-1 text-[11px] text-cream/45">1 jugador · {g.duration}</p>
              </div>
              <span className="font-pixel text-xs text-neon">▶</span>
            </button>
          ))}
        </div>

        {/* Multijugador futuro */}
        <div className="mt-8 rounded-3xl border-2 border-dashed border-white/15 p-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-mint" />
            <h2 className="font-pixel text-[10px] text-mint">MULTIJUGADOR EN TU MESA</h2>
          </div>
          <p className="mt-2 text-xs text-cream/60">
            Próximamente: todos los de la Mesa {table} se unirán a la misma sala para competir en tiempo real.
          </p>
          <p className="mt-1 font-mono text-[10px] text-cream/35">sala: {getTableRoomId(restaurant.id, table)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {multi.map((g) => (
              <div key={g.id} className="relative rounded-2xl bg-white/5 p-3 opacity-80">
                <Lock className="absolute top-3 right-3 size-3.5 text-cream/40" />
                <span className="text-2xl">{g.icon}</span>
                <p className="mt-2 text-sm font-bold">{g.name}</p>
                <p className="text-[11px] text-cream/50">{g.tagline}</p>
                <span className="mt-2 inline-block rounded-full bg-mint/15 px-2 py-0.5 font-pixel text-[7px] text-mint">PRONTO</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {askName && (
        <NicknameModal
          onClose={() => {
            setAskName(false)
            setPending(null)
          }}
          onSaved={() => {
            setAskName(false)
            if (pending) navigate(`juegos/${pending}`)
          }}
        />
      )}
    </div>
  )
}
