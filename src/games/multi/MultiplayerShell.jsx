import { useEffect, useMemo, useState } from 'react'
import { Bot, Check, Copy, Crown, LogIn, Plus, RotateCcw, Share2, Wifi, WifiOff } from 'lucide-react'
import { fullName, useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/ui'
import PlayerGate from '../../components/PlayerGate'
import Sprite from '../engine/Sprite'
import { useRoom } from '../../services/multiplayer/useRoom'
import { randomSeed } from '../../lib/rng'
import { sfx } from '../../lib/sfx'

const BOT_NAMES = ['CPU Ají', 'CPU Rocoto', 'CPU Lúcuma']
const BOT_COLORS = ['#5eead4', '#ffb547', '#a78bfa']

/**
 * Pantallas comunes de los juegos multijugador:
 * menú (crear / unirse / práctica) → sala de espera → partida → resultados → revancha.
 * `Match` es el componente del juego: <Match seed players me room cpu onEnd />
 */
export default function MultiplayerShell({ game, Match }) {
  return (
    <div className="arcade-bg flex min-h-dvh flex-col text-cream">
      <PageHeader dark title={game.name.toUpperCase()} subtitle={`⚔️ ${game.players} · salas privadas con código`} back="juegos" />
      <PlayerGate>
        <Body game={game} Match={Match} />
      </PlayerGate>
    </div>
  )
}

function Body({ game, Match }) {
  const { player, showToast } = useApp()
  const me = useMemo(() => ({ id: player.id, name: fullName(player) }), [player])
  const room = useRoom({ gameId: game.id, me, maxPlayers: game.maxPlayers })
  const [cpu, setCpu] = useState(null) // { seed, players } en modo práctica
  const [results, setResults] = useState(null)
  const [joinCode, setJoinCode] = useState(() => new URLSearchParams(window.location.hash.split('?')[1]).get('sala') ?? '')

  // Al recibir "start" o "lobby" desde la sala
  useEffect(
    () =>
      room.subscribe((msg) => {
        if (msg.type === 'start') setResults(null)
        if (msg.type === 'lobby') setResults(null)
      }),
    [room.subscribe],
  )

  // ---------- PARTIDA EN CURSO ----------
  if (cpu) {
    if (results) {
      return (
        <Results
          results={results}
          me={me}
          onRematch={() => {
            setResults(null)
            setCpu({ ...cpu, seed: randomSeed() })
          }}
          onExit={() => {
            setResults(null)
            setCpu(null)
          }}
          canRematch
          cpuMode
        />
      )
    }
    return <Match key={cpu.seed} seed={cpu.seed} players={cpu.players} me={me} cpu onEnd={setResults} />
  }

  if (room.phase === 'playing' && room.seed != null && (room.status === 'hosting' || room.status === 'joined' || results)) {
    if (results) {
      return (
        <Results
          results={results}
          me={me}
          canRematch={room.isHost && room.status === 'hosting'}
          waiting={!room.isHost}
          onRematch={() => {
            room.backToLobby()
            setResults(null)
          }}
          onExit={() => {
            room.leave()
            setResults(null)
          }}
        />
      )
    }
    return <Match key={room.seed} seed={room.seed} players={room.players} me={me} room={room} onEnd={setResults} />
  }

  // ---------- SALA DE ESPERA ----------
  if (room.status === 'hosting' || room.status === 'joined') {
    const mine = room.players.find((p) => p.id === me.id)
    const allReady = room.players.length >= game.minPlayers && room.players.every((p) => p.ready)
    const shareUrl = `${window.location.origin}${window.location.pathname}#/juegos/${game.id}?sala=${room.code}`
    const share = async () => {
      const text = `¡Te reto en ${game.name}! Código de sala: ${room.code}\n${shareUrl}`
      try {
        if (navigator.share) await navigator.share({ title: game.name, text })
        else {
          await navigator.clipboard.writeText(text)
          showToast('Invitación copiada ✓')
        }
      } catch {
        /* cancelado */
      }
    }
    return (
      <section className="flex flex-1 animate-fade-up flex-col px-4 pb-8">
        <ConnectionBadge kind={room.transportKind} />
        <div className="mt-3 rounded-3xl border-2 border-neon/40 bg-black/30 p-5 text-center">
          <p className="font-pixel text-[9px] text-cream/60">CÓDIGO DE SALA</p>
          <p className="mt-3 font-pixel text-4xl tracking-[0.2em] text-neon" data-testid="room-code">{room.code}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                await navigator.clipboard?.writeText(room.code).catch(() => {})
                showToast('Código copiado ✓')
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold"
            >
              <Copy className="size-4" /> Copiar
            </button>
            <button onClick={share} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold">
              <Share2 className="size-4" /> Invitar
            </button>
          </div>
          <p className="mt-3 text-[11px] text-cream/45">El código es temporal: deja de existir cuando el anfitrión sale.</p>
        </div>

        <h3 className="mt-6 font-pixel text-[10px] text-mint">
          JUGADORES {room.players.length}/{game.maxPlayers}
        </h3>
        <ul className="mt-3 space-y-2">
          {room.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
              <span className="size-3 rounded-full" style={{ background: p.color }} />
              <span className="flex-1 truncate font-bold">
                {p.name} {p.id === me.id && <span className="text-cream/50">(tú)</span>}
              </span>
              {p.id === (room.hostId ?? me.id) && <Crown className="size-4 text-neon" aria-label="Anfitrión" />}
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.ready ? 'bg-mint/20 text-mint' : 'bg-white/10 text-cream/50'}`}>
                {p.ready ? 'LISTO' : 'Esperando'}
              </span>
            </li>
          ))}
          {room.players.length < game.minPlayers && (
            <li className="rounded-2xl border-2 border-dashed border-white/15 px-4 py-3 text-center text-sm text-cream/50">
              Esperando que alguien se una con el código…
            </li>
          )}
        </ul>

        <div className="mt-auto grid gap-3 pt-8">
          <button
            onClick={() => {
              sfx.tap()
              room.setReady(!mine?.ready)
            }}
            className={`w-full rounded-2xl py-4 font-bold ${mine?.ready ? 'bg-white/10 text-cream' : 'bg-mint text-arcade'}`}
          >
            {mine?.ready ? 'Cancelar "listo"' : '✓ Estoy listo'}
          </button>
          {room.isHost ? (
            <button onClick={room.startGame} disabled={!allReady} className="pixel-btn w-full py-4 disabled:opacity-40">
              {allReady ? '▶ Comenzar partida' : `Esperando jugadores (${room.players.filter((p) => p.ready).length}/${Math.max(game.minPlayers, room.players.length)} listos)`}
            </button>
          ) : (
            <p className="text-center text-sm text-cream/60">El anfitrión iniciará cuando todos estén listos.</p>
          )}
          <button onClick={room.leave} className="py-2 text-sm text-cream/50">Salir de la sala</button>
        </div>
      </section>
    )
  }

  // ---------- MENÚ ----------
  const startCpu = () => {
    const bots = Math.max(1, (game.maxPlayers ?? 2) - 1)
    setCpu({
      seed: randomSeed(),
      players: [
        { id: me.id, name: me.name, color: '#ff6b8b' },
        ...Array.from({ length: bots }, (_, i) => ({ id: `bot-${i}`, name: BOT_NAMES[i], color: BOT_COLORS[i], bot: true })),
      ],
    })
  }

  return (
    <section className="flex flex-1 animate-fade-up flex-col px-4 pb-8">
      <div className="pixel-frame mx-auto mt-3 grid size-24 place-items-center rounded-3xl" style={{ background: `${game.color}22` }}>
        <Sprite name={game.sprite} size={52} />
      </div>
      <p className="mt-4 text-center text-cream/70">{game.tagline}</p>

      {room.status === 'error' && <p className="mt-4 rounded-xl bg-pink/15 px-3 py-2 text-sm text-pink">{room.error}</p>}

      <button
        onClick={room.create}
        disabled={room.status === 'connecting'}
        className="pixel-btn mt-6 flex w-full items-center justify-center gap-2 py-4 disabled:opacity-50"
      >
        <Plus className="size-4" /> Crear sala
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          room.join(joinCode)
        }}
        className="mt-4 rounded-2xl border-2 border-white/10 bg-black/25 p-4"
      >
        <p className="font-pixel text-[9px] text-mint">UNIRSE CON CÓDIGO</p>
        <div className="mt-3 flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="K7Q4M"
            aria-label="Código de sala"
            className="min-w-0 flex-1 rounded-xl border-2 border-neon/40 bg-black/30 px-4 py-3 text-center font-pixel text-lg tracking-[0.25em] text-neon uppercase placeholder:text-cream/20 focus:border-neon focus:outline-none"
          />
          <button type="submit" disabled={joinCode.length !== 5 || room.status === 'connecting'} className="flex items-center gap-1 rounded-xl bg-mint px-4 font-bold text-arcade disabled:opacity-40">
            <LogIn className="size-4" /> {room.status === 'connecting' ? '…' : 'Entrar'}
          </button>
        </div>
      </form>

      <button onClick={startCpu} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold active:bg-white/20">
        <Bot className="size-5" /> Practicar contra la CPU
      </button>

      <ConnectionBadge kind={room.transportKind} className="mt-6" />
    </section>
  )
}

function ConnectionBadge({ kind, className = '' }) {
  return kind === 'local' ? (
    <p className={`flex gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] leading-snug text-cream/55 ${className}`}>
      <WifiOff className="size-4 shrink-0 text-neon" />
      Modo demo: las salas funcionan entre pestañas del mismo navegador. El juego entre celulares distintos requiere activar el servidor (Supabase).
    </p>
  ) : (
    <p className={`flex items-center gap-2 text-[11px] text-mint ${className}`}>
      <Wifi className="size-4" /> Conectado al servidor de salas en tiempo real
    </p>
  )
}

function Results({ results, me, onRematch, onExit, canRematch, waiting, cpuMode }) {
  const winner = results.ranking[0]
  const tie = results.ranking.length > 1 && results.ranking[1].value === winner.value && results.metric === 'score'
  const iWon = !tie && winner.id === me.id
  useEffect(() => {
    iWon ? sfx.win() : sfx.bad()
  }, [iWon])
  return (
    <section className="flex flex-1 animate-fade-up flex-col items-center px-4 pb-8 text-center">
      <p className="mt-6 font-pixel text-xs text-pink">{results.note ?? 'FIN DE LA PARTIDA'}</p>
      <p className="mt-5 font-pixel text-xl leading-relaxed text-neon">{tie ? '¡EMPATE!' : iWon ? '¡GANASTE!' : `GANA ${winner.name.split(' ')[0].toUpperCase()}`}</p>
      <ol className="mt-6 w-full space-y-2">
        {results.ranking.map((r, i) => (
          <li key={r.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${r.id === me.id ? 'bg-neon/15 ring-2 ring-neon/40' : 'bg-white/5'}`}>
            <span className="w-6 font-pixel text-xs text-neon">{i + 1}°</span>
            <span className="size-3 rounded-full" style={{ background: r.color }} />
            <span className="flex-1 truncate text-left font-bold">{r.name}</span>
            <span className="font-pixel text-[11px]">{r.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto grid w-full gap-3 pt-8">
        {canRematch ? (
          <button onClick={onRematch} className="pixel-btn flex w-full items-center justify-center gap-2 py-4">
            <RotateCcw className="size-4" /> {cpuMode ? 'Jugar otra vez' : 'Revancha (volver a la sala)'}
          </button>
        ) : waiting ? (
          <p className="flex items-center justify-center gap-2 text-sm text-cream/60">
            <Check className="size-4" /> Esperando que el anfitrión pida la revancha…
          </p>
        ) : null}
        <button onClick={onExit} className="rounded-xl bg-white/10 py-3.5 text-sm font-bold">Salir</button>
      </div>
    </section>
  )
}
