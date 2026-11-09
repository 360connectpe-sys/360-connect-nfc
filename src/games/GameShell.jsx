import { Suspense, useCallback, useEffect, useState } from 'react'
import { Pencil, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import NicknameModal from '../components/NicknameModal'
import { scoreRepository } from '../services/scores'
import { track } from '../services/analytics'
import { isMuted, setMuted, sfx } from '../lib/sfx'

/**
 * Envoltorio común de todos los juegos:
 * intro (reglas + apodo) -> cuenta regresiva -> partida -> resultado.
 * Al terminar, registra automáticamente el puntaje en el ranking.
 */
export default function GameShell({ game }) {
  const { nickname, table, navigate, restaurant } = useApp()
  const [phase, setPhase] = useState('intro') // intro | countdown | playing | over
  const [count, setCount] = useState(3)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null)
  const [askName, setAskName] = useState(false)
  const [muted, setMutedState] = useState(isMuted())

  const start = () => {
    if (!nickname) return setAskName(true)
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
    async ({ score, stats }) => {
      setPhase('over')
      setResult({ score, stats, saving: true })
      sfx.win()
      track(`game_finish:${game.id}`)
      try {
        const isMine = (e) => e.nickname.toLowerCase() === nickname.toLowerCase()
        // Mejor puntaje previo del jugador en este juego (para detectar récord personal)
        const before = await scoreRepository.getLeaderboard({ gameId: game.id, limit: 500 })
        const prevBest = before.find(isMine)?.score ?? 0
        await scoreRepository.addScore({ nickname, gameId: game.id, score, table, meta: { stats } })
        const [byGame, overall] = await Promise.all([
          scoreRepository.getLeaderboard({ gameId: game.id, limit: 100 }),
          scoreRepository.getLeaderboard({ limit: 100 }),
        ])
        const pos = (list) => list.findIndex(isMine) + 1
        const isBest = score > 0 && score > prevBest
        setResult({ score, stats, saving: false, gamePos: pos(byGame), overallPos: pos(overall), isBest })
      } catch (err) {
        console.error(err)
        setResult({ score, stats, saving: false, error: true })
      }
    },
    [game.id, nickname, table],
  )

  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  const Game = game.Component
  const prize = result?.overallPos && restaurant.prizes.find((p) => p.place === result.overallPos)

  return (
    <div className="arcade-bg flex min-h-dvh flex-col text-cream">
      <PageHeader
        dark
        title={game.name.toUpperCase()}
        subtitle={`${nickname || 'Sin apodo'} · Mesa ${table}`}
        back="juegos"
        right={
          <button onClick={toggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'} className="grid size-10 place-items-center rounded-full bg-white/10">
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-4 pt-2 pb-8">
        {phase === 'intro' && (
          <section className="flex flex-1 animate-fade-up flex-col">
            <div className="pixel-frame mx-auto mt-4 grid size-28 place-items-center rounded-3xl text-6xl" style={{ background: `${game.color}22` }}>
              {game.icon}
            </div>
            <h2 className="mt-6 text-center font-pixel text-lg text-neon">{game.name.toUpperCase()}</h2>
            <p className="mt-2 text-center text-cream/70">{game.tagline} · {game.duration}</p>

            <ol className="mt-6 space-y-3 rounded-2xl border-2 border-white/10 bg-black/25 p-5">
              {game.howTo.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-cream/85">
                  <span className="font-pixel text-[10px] leading-5 text-mint">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>

            <button onClick={() => setAskName(true)} className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="text-cream/60">Jugador:</span>
              <strong className="text-neon">{nickname || 'Elige tu apodo'}</strong>
              <Pencil className="size-3.5 text-cream/60" />
            </button>

            <div className="mt-auto pt-8">
              <button onClick={start} className="pixel-btn w-full py-5 text-sm">
                ▶ Comenzar
              </button>
            </div>
          </section>
        )}

        {phase === 'countdown' && (
          <div className="grid flex-1 place-items-center">
            <span key={count} className="animate-pop font-pixel text-7xl text-neon drop-shadow-[0_0_20px_rgba(255,181,71,0.5)]">
              {count || 'GO!'}
            </span>
          </div>
        )}

        {phase === 'playing' && (
          <Suspense fallback={<p className="mt-20 text-center font-pixel text-xs text-neon">CARGANDO…</p>}>
            <Game key={round} onFinish={handleFinish} />
          </Suspense>
        )}

        {phase === 'over' && result && (
          <section className="flex flex-1 animate-fade-up flex-col items-center text-center">
            <p className="mt-6 font-pixel text-xs text-pink">GAME OVER</p>
            <p className="mt-6 text-sm text-cream/60">Tu puntuación</p>
            <p className="animate-pop font-pixel text-5xl text-neon drop-shadow-[0_0_24px_rgba(255,181,71,0.45)]">{result.score}</p>
            {result.isBest && <p className="mt-3 animate-blink font-pixel text-[10px] text-mint">¡NUEVO RÉCORD PERSONAL!</p>}

            <div className="mt-6 grid w-full grid-cols-3 gap-2">
              {result.stats.map(([k, v]) => (
                <div key={k} className="rounded-xl border-2 border-white/10 bg-black/25 p-3">
                  <p className="text-[11px] text-cream/50">{k}</p>
                  <p className="mt-1 font-bold">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 w-full rounded-2xl border-2 border-neon/30 bg-neon/10 p-4 text-left">
              {result.saving ? (
                <p className="text-sm text-cream/70">Registrando en el ranking…</p>
              ) : result.error ? (
                <p className="text-sm text-pink">No se pudo guardar el puntaje. Intenta de nuevo.</p>
              ) : (
                <div className="flex items-center gap-3">
                  <Trophy className="size-8 shrink-0 text-neon" />
                  <div className="text-sm">
                    <p className="font-bold text-cream">
                      Puntaje registrado ✓ · Tu mejor puesto: #{result.overallPos} general
                    </p>
                    <p className="text-cream/65">
                      #{result.gamePos} en {game.name}.{' '}
                      {prize ? (
                        <span className="font-semibold text-mint">¡Vas ganando: {prize.title}!</span>
                      ) : (
                        'Entra al top 3 para ganar premios.'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto grid w-full gap-3 pt-8">
              <button onClick={start} className="pixel-btn flex w-full items-center justify-center gap-2 py-4">
                <RotateCcw className="size-4" /> Jugar otra vez
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('ranking')} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold active:bg-white/20">
                  Ver ranking
                </button>
                <button onClick={() => navigate('premios')} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold active:bg-white/20">
                  Ver premios
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {askName && (
        <NicknameModal
          onClose={() => setAskName(false)}
          onSaved={() => setAskName(false)}
        />
      )}
    </div>
  )
}
