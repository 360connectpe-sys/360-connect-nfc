import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, UserRound } from 'lucide-react'
import { fullName, useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import PlayerGate from '../components/PlayerGate'
import Sprite from '../games/engine/Sprite'
import { CATEGORIES, filterEnabled } from '../games/catalog'
import { getRecord } from '../lib/records'

export default function GamesHub() {
  return (
    <div className="arcade-bg min-h-dvh pb-8 text-cream">
      <PageHeader dark title="ZONA DE JUEGOS" subtitle="Juega mientras esperas tu pedido" back="" />
      <PlayerGate>
        <Hub />
      </PlayerGate>
    </div>
  )
}

function Hub() {
  const { navigate, player, switchPlayer, settings } = useApp()
  const games = useMemo(() => filterEnabled(settings.enabledGames), [settings.enabledGames])
  const [confirmSwitch, setConfirmSwitch] = useState(false)
  const firstPrize = settings.prizes[0]

  useEffect(() => {
    if (!confirmSwitch) return
    const t = setTimeout(() => setConfirmSwitch(false), 4000)
    return () => clearTimeout(t)
  }, [confirmSwitch])

  return (
    <div className="px-4">
      <div className="flex animate-fade-up items-center gap-3 rounded-2xl border-2 border-white/10 bg-black/25 p-3">
        <span className="pixel-frame grid size-12 place-items-center rounded-xl bg-arcade-2">
          <Sprite name="chefHead" size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[8px] text-mint">JUGADOR</p>
          <p className="mt-1.5 truncate text-base font-bold" data-testid="player-name">{fullName(player)}</p>
        </div>
        <button
          onClick={() => (confirmSwitch ? switchPlayer() : setConfirmSwitch(true))}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ${confirmSwitch ? 'bg-pink text-arcade' : 'bg-white/10 text-cream/70'}`}
        >
          <UserRound className="size-3.5" /> {confirmSwitch ? '¿Seguro?' : '¿No eres tú?'}
        </button>
      </div>

      <button
        onClick={() => navigate('premios')}
        className="mt-3 flex w-full animate-fade-up items-center gap-3 rounded-2xl bg-linear-to-r from-neon to-[#ff8a5c] p-3.5 text-left text-arcade shadow-[0_6px_30px_-8px_rgba(255,181,71,0.6)]"
      >
        <span className="text-2xl">🏆</span>
        <div className="flex-1 text-sm">
          <p className="font-extrabold">1.er lugar semanal: {firstPrize?.title}</p>
          <p className="text-xs font-semibold opacity-75">En cada uno de los 3 rankings · reclamo con DNI físico</p>
        </div>
        <ChevronRight className="size-5" />
      </button>

      {CATEGORIES.map((cat) => {
        const list = games.filter((g) => g.category === cat.id)
        if (!list.length) return null
        return (
          <section key={cat.id} className="mt-7">
            <h2 className="flex items-center gap-2 font-pixel text-[11px] text-neon">
              <span className="text-base">{cat.emoji}</span> {cat.title.toUpperCase()}
            </h2>
            <p className="mt-1 text-xs text-cream/50">{cat.subtitle}</p>
            <div className="mt-3 space-y-3">
              {list.map((g, i) => (
                <GameCard key={g.id} game={g} delay={i * 60} record={g.category === 'casual' ? getRecord(player.id, g.id) : null} onClick={() => navigate(`juegos/${g.id}`)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GameCard({ game, onClick, delay, record }) {
  const badge =
    game.category === 'ranked' ? { text: 'RANKING', cls: 'bg-neon/20 text-neon' } : game.category === 'multi' ? { text: game.players.toUpperCase(), cls: 'bg-mint/15 text-mint' } : { text: 'LIBRE', cls: 'bg-white/10 text-cream/70' }
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="flex w-full animate-fade-up items-center gap-4 rounded-3xl border-2 border-white/10 bg-arcade-2 p-3.5 text-left shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-1 active:shadow-none"
    >
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl" style={{ background: `${game.color}26`, boxShadow: `inset 0 0 0 2px ${game.color}88` }}>
        <Sprite name={game.sprite} size={40} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-[10px] leading-relaxed" style={{ color: game.color }}>{game.name.toUpperCase()}</p>
        <p className="mt-1 text-sm text-cream/75">{game.tagline}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 font-pixel text-[7px] ${badge.cls}`}>{badge.text}</span>
          {game.duration && <span className="text-[11px] text-cream/45">{game.duration}</span>}
          {record > 0 && <span className="text-[11px] text-mint">Récord {record}</span>}
        </div>
      </div>
      <span className="font-pixel text-xs text-neon">▶</span>
    </button>
  )
}
