import { useEffect, useMemo, useRef, useState } from 'react'
import MultiplayerShell from './MultiplayerShell'
import Sprite from '../engine/Sprite'
import { mulberry32 } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'

const DURATION = 45_000
const COUNTDOWN = 3000
const KINDS = {
  good: { sprite: 'star', pts: 100 },
  gold: { sprite: 'coin', pts: 250 },
  trap: { sprite: 'bomb', pts: -100 },
}

/** Secuencia de objetivos idéntica en todos los celulares (misma semilla). */
function buildTargets(seed) {
  const rand = mulberry32(seed)
  const busyUntil = Array(9).fill(0)
  const out = []
  let t = 600
  while (t < DURATION - 400) {
    const p = t / DURATION
    const ttl = 1150 - 450 * p
    const free = busyUntil.map((b, i) => (b <= t ? i : -1)).filter((i) => i >= 0)
    if (free.length) {
      const cell = free[Math.floor(rand() * free.length)]
      const r = rand()
      out.push({ id: out.length, cell, at: t, ttl, kind: r < 0.08 ? 'gold' : r < 0.22 ? 'trap' : 'good' })
      busyUntil[cell] = t + ttl + 100
    }
    t += 700 - 330 * p + rand() * 120
  }
  return out
}

/** Bot de práctica: acierta ~75 % con 280–880 ms de reacción. */
function botScoreAt(targets, seed, t) {
  const rand = mulberry32(seed ^ 0x9e3779b9)
  let score = 0
  for (const tg of targets) {
    const roll = rand()
    const delay = 280 + rand() * 600
    const hits = tg.kind === 'trap' ? roll < 0.06 : roll < 0.75
    if (hits && delay < tg.ttl && tg.at + delay <= t) score = Math.max(0, score + KINDS[tg.kind].pts)
  }
  return score
}

export function DuelMatch({ seed, players, me, room, cpu, onEnd }) {
  const targets = useMemo(() => buildTargets(seed), [seed])
  const opponents = players.filter((p) => p.id !== me.id)
  const startAt = useRef(performance.now() + COUNTDOWN)
  const tapped = useRef(new Set())
  const [myScore, setMyScore] = useState(0)
  const scoreRef = useRef(0)
  const [others, setOthers] = useState({}) // id -> { score, final, left }
  const othersRef = useRef(others)
  othersRef.current = others
  const [now, setNow] = useState(performance.now())
  const [pops, setPops] = useState([])
  const finished = useRef(false)
  const sentFinal = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  // Mensajes de la sala
  useEffect(() => {
    if (!room) return
    return room.subscribe((msg) => {
      if (msg.type === 'score' || msg.type === 'final') {
        setOthers((o) => ({ ...o, [msg.from]: { ...o[msg.from], score: msg.payload.score, final: msg.type === 'final' || o[msg.from]?.final } }))
      } else if (msg.type === 'player-left') {
        setOthers((o) => ({ ...o, [msg.from]: { ...o[msg.from], left: true } }))
      } else if (msg.type === 'host-left') {
        setOthers((o) => Object.fromEntries(opponents.map((p) => [p.id, { ...o[p.id], left: true }])))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  useEffect(() => {
    const t = setInterval(() => setNow(performance.now()), 50)
    return () => clearInterval(t)
  }, [])

  const t = now - startAt.current
  const playing = t >= 0 && t < DURATION

  // Fin de partida
  useEffect(() => {
    if (finished.current) return
    const allLeft = opponents.length > 0 && opponents.every((p) => othersRef.current[p.id]?.left)
    if (t < DURATION && !allLeft) return
    if (!cpu && !allLeft) {
      if (!sentFinal.current) {
        room?.send('final', { score: scoreRef.current })
        sentFinal.current = true
      }
      const waitingFinals = opponents.some((p) => !othersRef.current[p.id]?.final && !othersRef.current[p.id]?.left)
      if (waitingFinals && t < DURATION + 4000) return
    }
    finished.current = true
    const scoreOf = (p) => (p.id === me.id ? scoreRef.current : cpu ? botScoreAt(targets, seed + p.id.length, DURATION) : othersRef.current[p.id]?.score ?? 0)
    const ranking = players
      .map((p) => {
        const left = othersRef.current[p.id]?.left
        const value = left ? -1 : scoreOf(p)
        return { id: p.id, name: p.name, color: p.color, value, label: left ? 'ABANDONÓ' : `${value} pts` }
      })
      .sort((a, b) => b.value - a.value)
    onEndRef.current({ metric: 'score', ranking, note: allLeft ? 'TU RIVAL SE DESCONECTÓ' : null })
  }, [t, cpu, me.id, opponents, players, room, seed, targets])

  const tap = (target) => {
    if (!playing || tapped.current.has(target.id)) return
    tapped.current.add(target.id)
    const pts = KINDS[target.kind].pts
    scoreRef.current = Math.max(0, scoreRef.current + pts)
    setMyScore(scoreRef.current)
    room?.send('score', { score: scoreRef.current })
    if (pts > 0) {
      target.kind === 'gold' ? sfx.gold() : sfx.good()
      vibrate(10)
    } else {
      sfx.bad()
      vibrate(100)
    }
    const pop = { id: target.id, cell: target.cell, text: pts > 0 ? `+${pts}` : `${pts}`, bad: pts < 0 }
    setPops((p) => [...p, pop])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 600)
  }

  const visible = playing ? targets.filter((tg) => tg.at <= t && t < tg.at + tg.ttl && !tapped.current.has(tg.id)) : []
  const byCell = Object.fromEntries(visible.map((tg) => [tg.cell, tg]))
  const opp = opponents.map((p) => ({
    ...p,
    score: cpu ? botScoreAt(targets, seed + p.id.length, Math.max(0, t)) : others[p.id]?.score ?? 0,
    left: others[p.id]?.left,
  }))
  const remaining = Math.max(0, Math.ceil((DURATION - t) / 1000))
  const max = Math.max(1, myScore, ...opp.map((o) => o.score))

  return (
    <div className="flex flex-1 flex-col gap-4 px-3 pt-1 pb-4">
      {/* Marcador en vivo */}
      <div className="space-y-2 rounded-2xl border-2 border-white/10 bg-black/30 p-3">
        {[{ ...players.find((p) => p.id === me.id), score: myScore, isMe: true }, ...opp].map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-24 truncate text-xs font-bold">{p.isMe ? 'Tú' : p.name.split(' ')[0]}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full transition-[width] duration-200" style={{ width: `${(p.score / max) * 100}%`, background: p.color }} />
            </div>
            <span className="w-14 text-right font-pixel text-[10px]">{p.left ? 'OUT' : p.score}</span>
          </div>
        ))}
        <p className="text-center font-pixel text-[11px] text-neon">{t < 0 ? 'PREPÁRATE' : `${remaining}s`}</p>
      </div>

      <div className="relative mx-auto grid w-full max-w-sm grid-cols-3 gap-3 rounded-3xl border-2 border-white/10 bg-black/25 p-3 select-none">
        {Array.from({ length: 9 }, (_, cell) => {
          const tg = byCell[cell]
          return (
            <button
              key={cell}
              onPointerDown={(e) => {
                e.preventDefault()
                if (tg) tap(tg)
              }}
              aria-label={tg ? (tg.kind === 'trap' ? 'Bomba' : 'Objetivo') : 'Vacío'}
              data-kind={tg?.kind ?? ''}
              className="relative aspect-square touch-none rounded-2xl border-2 border-white/10 bg-arcade-2 shadow-[inset_0_6px_0_rgba(0,0,0,0.35)]"
            >
              {tg && (
                <span key={tg.id} className="absolute inset-0 grid animate-pop place-items-center">
                  <Sprite name={KINDS[tg.kind].sprite} size={tg.kind === 'gold' ? 40 : 48} />
                </span>
              )}
              {pops
                .filter((p) => p.cell === cell)
                .map((p) => (
                  <span key={p.id} className={`pointer-events-none absolute top-2 left-1/2 animate-float-up font-pixel text-xs ${p.bad ? 'text-pink' : 'text-neon'}`}>
                    {p.text}
                  </span>
                ))}
            </button>
          )
        })}
        {t < 0 && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-arcade/70">
            <span key={Math.ceil(-t / 1000)} className="animate-pop font-pixel text-6xl text-neon">{Math.ceil(-t / 1000)}</span>
          </div>
        )}
        {t >= DURATION && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-arcade/80 text-center font-pixel text-[10px] text-cream">
            ESPERANDO
            <br />
            RESULTADOS…
          </div>
        )}
      </div>
      <p className="text-center text-xs text-cream/55">⭐ +100 · moneda +250 · 💣 −100 · mismos objetivos para todos</p>
    </div>
  )
}

export default function DueloArcade({ game }) {
  return <MultiplayerShell game={game} Match={DuelMatch} />
}
