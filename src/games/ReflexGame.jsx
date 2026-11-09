import { useEffect, useRef, useState } from 'react'
import GameHud from './GameHud'
import { pick } from '../lib/random'
import { sfx, vibrate } from '../lib/sfx'

const DURATION = 30 // segundos
const CELLS = 9
const GOOD = ['🍤', '🥑', '🌽', '🍋', '🐟', '🥔', '🌶️']

/**
 * Puntuación:
 *  - Ingrediente: 10 pts + 2 x combo (bono de combo máx. x10)
 *  - Estrella ⭐: 100 pts
 *  - Bomba 💣: -50 pts y reinicia el combo
 *  - Dejar escapar un ingrediente reinicia el combo
 */
export default function ReflexGame({ onFinish }) {
  const g = useRef({
    cells: Array(CELLS).fill(null),
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    bombs: 0,
    start: performance.now(),
    lastSpawn: 0,
    done: false,
    uid: 0,
  })
  const [, setFrame] = useState(0)
  const [pops, setPops] = useState([])
  const [flash, setFlash] = useState(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  useEffect(() => {
    const s = g.current
    const loop = setInterval(() => {
      if (s.done) return
      const now = performance.now()
      const elapsed = (now - s.start) / 1000
      if (elapsed >= DURATION) {
        s.done = true
        s.cells = Array(CELLS).fill(null)
        setFrame((f) => f + 1)
        onFinishRef.current({
          score: s.score,
          stats: [['Aciertos', s.hits], ['Mejor combo', `x${s.bestCombo}`], ['Bombas', s.bombs]],
        })
        return
      }
      const progress = elapsed / DURATION
      const spawnEvery = 850 - 480 * progress // se acelera con el tiempo
      const ttl = 1350 - 650 * progress

      // Expirar
      s.cells = s.cells.map((c) => {
        if (c && now - c.born > c.ttl) {
          if (c.kind !== 'bad') {
            s.misses += 1
            s.combo = 0
          }
          return null
        }
        return c
      })

      // Generar
      if (now - s.lastSpawn > spawnEvery) {
        const spawnCount = progress > 0.55 && Math.random() < 0.4 ? 2 : 1
        for (let n = 0; n < spawnCount; n++) {
          const empty = s.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0)
          if (!empty.length) break
          const r = Math.random()
          const kind = r < 0.07 ? 'gold' : r < 0.27 ? 'bad' : 'good'
          s.cells[pick(empty)] = {
            id: ++s.uid,
            kind,
            emoji: kind === 'gold' ? '⭐' : kind === 'bad' ? '💣' : pick(GOOD),
            born: now,
            ttl: kind === 'gold' ? ttl * 0.75 : ttl,
          }
        }
        s.lastSpawn = now
      }
      setFrame((f) => f + 1)
    }, 50)
    return () => clearInterval(loop)
  }, [])

  const hit = (i) => {
    const s = g.current
    const c = s.cells[i]
    if (!c || s.done) return
    s.cells[i] = null
    let text
    if (c.kind === 'bad') {
      s.score = Math.max(0, s.score - 50)
      s.combo = 0
      s.bombs += 1
      text = '-50'
      sfx.bad()
      vibrate(120)
      setFlash(true)
      setTimeout(() => setFlash(false), 180)
    } else {
      s.combo += 1
      s.hits += 1
      s.bestCombo = Math.max(s.bestCombo, s.combo)
      const pts = c.kind === 'gold' ? 100 : 10 + Math.min(s.combo, 10) * 2
      s.score += pts
      text = `+${pts}`
      c.kind === 'gold' ? sfx.gold() : sfx.good()
      vibrate(10)
    }
    const pop = { id: c.id, i, text, bad: c.kind === 'bad' }
    setPops((p) => [...p, pop])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 700)
    setFrame((f) => f + 1)
  }

  const s = g.current
  const remaining = Math.max(0, DURATION - (performance.now() - s.start) / 1000)

  return (
    <div className={`flex flex-1 flex-col gap-5 transition-colors ${flash ? 'rounded-3xl bg-pink/20' : ''}`}>
      <GameHud
        items={[
          { label: 'PUNTOS', value: s.score },
          { label: 'COMBO', value: `x${s.combo}`, tone: 'mint' },
          { label: 'TIEMPO', value: Math.ceil(remaining), tone: 'pink', warn: remaining <= 5 },
        ]}
      />
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-neon" style={{ width: `${(remaining / DURATION) * 100}%` }} />
      </div>

      <div className="pixel-grid mx-auto grid w-full max-w-sm grid-cols-3 gap-3 rounded-3xl border-2 border-white/10 bg-black/25 p-3 select-none">
        {s.cells.map((c, i) => (
          <button
            key={i}
            onPointerDown={(e) => {
              e.preventDefault()
              hit(i)
            }}
            className="relative aspect-square rounded-2xl border-2 border-white/10 bg-arcade-2 shadow-[inset_0_6px_0_rgba(0,0,0,0.35)] touch-none"
            aria-label={c ? (c.kind === 'bad' ? 'Bomba' : 'Ingrediente') : 'Vacío'}
          >
            {c && (
              <span
                key={c.id}
                className={`absolute inset-1.5 grid animate-pop place-items-center rounded-xl text-4xl sm:text-5xl ${
                  c.kind === 'gold' ? 'bg-neon/25 ring-2 ring-neon' : c.kind === 'bad' ? 'bg-pink/15' : 'bg-cream/10'
                }`}
              >
                {c.emoji}
              </span>
            )}
            {pops
              .filter((p) => p.i === i)
              .map((p) => (
                <span
                  key={p.id}
                  className={`pointer-events-none absolute top-2 left-1/2 animate-float-up font-pixel text-xs ${p.bad ? 'text-pink' : 'text-neon'}`}
                >
                  {p.text}
                </span>
              ))}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-cream/50">Toca rápido · ⭐ = 100 pts · evita 💣</p>
    </div>
  )
}
