import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import { fullName, useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import PlayerGate from '../components/PlayerGate'
import Sprite from './engine/Sprite'
import { backend, isSharedBackend } from '../services/backend'
import { getRecord, saveRecord } from '../lib/records'
import { track } from '../services/analytics'
import { isMuted, setMuted, sfx } from '../lib/sfx'

/**
 * Envoltorio de los juegos individuales:
 *   intro → (abre sesión en el servidor si es de ranking) → 3-2-1 → partida → resultado
 * Juegos 'ranked': el puntaje + estadísticas se envían al backend, que
 *   recalcula y valida antes de aceptarlo en el ranking oficial.
 * Juegos 'casual': solo récord personal en el dispositivo.
 *
 * Contrato de cada juego: <Juego onFinish={({ score, stats, summary, completed }) => …} />
 *   stats   → datos que el servidor usa para validar
 *   summary → [['Etiqueta', valor], …] para la pantalla de resultados
 */
export default function SoloGameShell({ game }) {
  return (
    <div className="arcade-bg flex min-h-dvh flex-col text-cream">
      <Header game={game} />
      <PlayerGate>
        <ShellBody game={game} />
      </PlayerGate>
    </div>
  )
}

function Header({ game }) {
  const [muted, setMutedState] = useState(isMuted())
  return (
    <PageHeader
      dark
      title={game.name.toUpperCase()}
      subtitle={game.category === 'ranked' ? '🏆 Participa en el ranking semanal' : '🎮 Récord personal'}
      back="juegos"
      right={
        <button
          onClick={() => {
            setMuted(!muted)
            setMutedState(!muted)
          }}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          className="grid size-10 place-items-center rounded-full bg-white/10"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      }
    />
  )
}

function ShellBody({ game }) {
  const { player, navigate, settings } = useApp()
  const ranked = game.category === 'ranked'
  const [phase, setPhase] = useState('intro') // intro | starting | countdown | playing | over
  const [count, setCount] = useState(3)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const session = useRef(null)

  const start = async () => {
    setError(null)
    setResult(null)
    session.current = null
    if (ranked) {
      setPhase('starting')
      try {
        session.current = await backend.startSession(game.id)
      } catch (e) {
        setError(`No se pudo registrar la partida en el ranking: ${e.message}. Puedes jugar igual, pero no contará.`)
      }
    }
    setCount(3)
    setPhase('countdown')
  }

  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      sfx.go()
      setPhase('playing')
      setRound((r) => r + 1)
      track(`game_start:${game.id}`)
      return
    }
    sfx.count()
    const t = setTimeout(() => setCount((c) => c - 1), 700)
    return () => clearTimeout(t)
  }, [phase, count, game.id])

  const handleFinish = useCallback(
    async ({ score, stats, summary = [], completed = true }) => {
      setPhase('over')
      track(`game_finish:${game.id}`)
      if (completed) sfx.win()
      else sfx.bad()

      if (!ranked) {
        const rec = saveRecord(player.id, game.id, score)
        setResult({ score, summary, completed, ...rec })
        return
      }
      if (!completed) {
        setResult({ score, summary, completed, note: 'Partida incompleta: no cuenta para el ranking.' })
        return
      }
      if (!session.current) {
        setResult({ score, summary, completed, note: 'Esta partida no se registró en el ranking.' })
        return
      }
      setResult({ score, summary, completed, saving: true })
      try {
        const r = await backend.submitSession(session.current.sessionId, { score, stats })
        setResult({ score, summary, completed, ...r, saving: false })
      } catch (e) {
        setResult({ score, summary, completed, saving: false, accepted: false, reason: e.message })
      } finally {
        session.current = null
      }
    },
    [game.id, ranked, player.id],
  )

  const Game = game.Component
  const prize = result?.rank && settings.prizes.find((p) => p.place === result.rank)

  if (phase === 'intro' || phase === 'starting') {
    const best = ranked ? null : getRecord(player.id, game.id)
    return (
      <section className="flex flex-1 animate-fade-up flex-col px-4 pt-2 pb-8">
        <div className="pixel-frame mx-auto mt-3 grid size-28 place-items-center rounded-3xl" style={{ background: `${game.color}22` }}>
          <Sprite name={game.sprite} size={64} />
        </div>
        <p className="mt-5 text-center text-cream/70">{game.tagline} · {game.duration}</p>
        <ol className="mt-5 space-y-3 rounded-2xl border-2 border-white/10 bg-black/25 p-5">
          {game.howTo.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-cream/85">
              <span className="font-pixel text-[10px] leading-5 text-mint">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-sm text-cream/60">
          Jugador: <strong className="text-neon">{fullName(player)}</strong>
          {best ? <> · Récord: <strong className="text-mint">{best}</strong></> : null}
        </p>
        {ranked && !isSharedBackend && (
          <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-center text-[11px] text-cream/50">
            Modo demo: el ranking se guarda solo en este celular.
          </p>
        )}
        <div className="mt-auto pt-6">
          <button onClick={start} disabled={phase === 'starting'} className="pixel-btn w-full py-5 text-sm disabled:opacity-60">
            {phase === 'starting' ? 'Conectando…' : '▶ Comenzar'}
          </button>
        </div>
      </section>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="grid flex-1 place-items-center px-4">
        {error && <p className="absolute top-24 mx-4 rounded-xl bg-pink/15 px-3 py-2 text-xs text-pink">{error}</p>}
        <span key={count} className="animate-pop font-pixel text-7xl text-neon drop-shadow-[0_0_20px_rgba(255,181,71,0.5)]">
          {count || 'GO!'}
        </span>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <div className="flex flex-1 flex-col px-3 pt-1 pb-4">
        <Suspense fallback={<p className="mt-20 text-center font-pixel text-xs text-neon">CARGANDO…</p>}>
          <Game key={round} onFinish={handleFinish} />
        </Suspense>
      </div>
    )
  }

  // --- Resultado ---
  return (
    <section className="flex flex-1 animate-fade-up flex-col items-center px-4 pb-8 text-center">
      <p className="mt-6 font-pixel text-xs text-pink">{result?.completed === false ? 'TIEMPO AGOTADO' : 'GAME OVER'}</p>
      <p className="mt-5 text-sm text-cream/60">Tu puntuación</p>
      <p className="animate-pop font-pixel text-5xl text-neon drop-shadow-[0_0_24px_rgba(255,181,71,0.45)]">{result?.score ?? 0}</p>
      {result?.isNewBest && <p className="mt-3 animate-blink font-pixel text-[10px] text-mint">¡NUEVO RÉCORD PERSONAL!</p>}

      {result?.summary?.length > 0 && (
        <div className="mt-6 grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${result.summary.length}, minmax(0,1fr))` }}>
          {result.summary.map(([k, v]) => (
            <div key={k} className="rounded-xl border-2 border-white/10 bg-black/25 p-2.5">
              <p className="text-[11px] text-cream/50">{k}</p>
              <p className="mt-1 font-bold">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 w-full rounded-2xl border-2 border-neon/30 bg-neon/10 p-4 text-left text-sm">
        {!ranked ? (
          <p className="text-cream/80">
            Récord personal: <strong className="text-mint">{result?.best ?? 0}</strong>. Este juego es por diversión (sin ranking de premios).
          </p>
        ) : result?.saving ? (
          <p className="text-cream/70">Validando partida en el servidor…</p>
        ) : result?.note ? (
          <p className="flex gap-2 text-cream/80"><AlertTriangle className="size-4 shrink-0 text-pink" /> {result.note}</p>
        ) : result?.accepted === false ? (
          <p className="flex gap-2 text-pink"><AlertTriangle className="size-4 shrink-0" /> Partida rechazada: {result.reason}</p>
        ) : (
          <div className="flex items-center gap-3">
            <Trophy className="size-8 shrink-0 text-neon" />
            <div>
              <p className="font-bold">Partida válida ✓ · Puesto #{result?.rank} esta semana</p>
              <p className="text-cream/65">
                Tu mejor semanal: {result?.seasonBest} · Récord histórico: {result?.personalBest}.{' '}
                {prize ? <span className="font-semibold text-mint">¡Vas ganando: {prize.title}!</span> : 'Entra al top 3 para ganar premios.'}
              </p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-xs text-pink">{error}</p>}

      <div className="mt-auto grid w-full gap-3 pt-8">
        <button onClick={start} className="pixel-btn flex w-full items-center justify-center gap-2 py-4">
          <RotateCcw className="size-4" /> Jugar otra vez
        </button>
        <div className="grid grid-cols-2 gap-3">
          {ranked ? (
            <button onClick={() => navigate(`ranking/${game.id}`)} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold active:bg-white/20">
              Ver ranking
            </button>
          ) : (
            <button onClick={() => navigate('ranking')} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold active:bg-white/20">
              Ranking semanal
            </button>
          )}
          <button onClick={() => navigate('juegos')} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold active:bg-white/20">
            Otros juegos
          </button>
        </div>
      </div>
    </section>
  )
}
