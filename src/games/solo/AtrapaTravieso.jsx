import { useEffect, useRef, useState } from 'react'
import GameHud from '../GameHud'
import Sprite from '../engine/Sprite'
import { SWAPS } from '../engine/sprites'
import { pick } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'

const DURATION = 30
const CELLS = 9
const KINDS = {
  cuy: { sprite: 'cuy', pts: 50 },
  gold: { sprite: 'cuy', swap: SWAPS.goldCuy, pts: 150 },
  chef: { sprite: 'chefHead', pts: -75, trap: true },
  bomb: { sprite: 'bomb', pts: -75, trap: true },
}

export default function AtrapaTravieso({ onFinish }) {
  const g = useRef({
    cells: Array(CELLS).fill(null), score: 0, hits: 0, traps: 0, escaped: 0,
    start: performance.now(), lastSpawn: 0, done: false, uid: 0,
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
          summary: [['Atrapados', s.hits], ['Escapados', s.escaped], ['Trampas', s.traps]],
        })
        return
      }
      const p = elapsed / DURATION
      const spawnEvery = 820 - 470 * p // se acelera
      const ttl = 1250 - 600 * p
      s.cells = s.cells.map((c) => {
        if (c && now - c.born > c.ttl) {
          if (!KINDS[c.kind].trap) s.escaped += 1
          return null
        }
        return c
      })
      if (now - s.lastSpawn > spawnEvery) {
        const n = p > 0.5 && Math.random() < 0.4 ? 2 : 1
        for (let k = 0; k < n; k++) {
          const empty = s.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0)
          if (!empty.length) break
          const r = Math.random()
          const kind = r < 0.08 ? 'gold' : r < 0.2 ? 'chef' : r < 0.3 ? 'bomb' : 'cuy'
          s.cells[pick(empty)] = { id: ++s.uid, kind, born: now, ttl: kind === 'gold' ? ttl * 0.7 : ttl }
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
    const k = KINDS[c.kind]
    s.score = Math.max(0, s.score + k.pts)
    if (k.trap) {
      s.traps += 1
      sfx.bad()
      vibrate(110)
      setFlash(true)
      setTimeout(() => setFlash(false), 160)
    } else {
      s.hits += 1
      c.kind === 'gold' ? sfx.gold() : sfx.good()
      vibrate(10)
    }
    const pop = { id: c.id, i, text: k.pts > 0 ? `+${k.pts}` : `${k.pts}`, bad: k.trap }
    setPops((p) => [...p, pop])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 650)
    setFrame((f) => f + 1)
  }

  const s = g.current
  const remaining = Math.max(0, DURATION - (performance.now() - s.start) / 1000)

  return (
    <div className={`flex flex-1 flex-col gap-4 rounded-3xl transition-colors ${flash ? 'bg-pink/20' : ''}`}>
      <GameHud
        items={[
          { label: 'PUNTOS', value: s.score },
          { label: 'ATRAPADOS', value: s.hits, tone: 'mint' },
          { label: 'TIEMPO', value: Math.ceil(remaining), tone: 'pink', warn: remaining <= 5 },
        ]}
      />
      <div className="pixel-grid mx-auto grid w-full max-w-sm grid-cols-3 gap-3 rounded-3xl border-2 border-white/10 bg-black/25 p-3 select-none">
        {s.cells.map((c, i) => (
          <button
            key={i}
            onPointerDown={(e) => {
              e.preventDefault()
              hit(i)
            }}
            className="relative aspect-square touch-none overflow-hidden rounded-2xl border-2 border-white/10 bg-[#3a2a1f] shadow-[inset_0_8px_0_rgba(0,0,0,0.45)]"
            aria-label={c ? (KINDS[c.kind].trap ? 'Trampa' : 'Cuy travieso') : 'Hoyo vacío'}
            data-kind={c?.kind ?? ''}
          >
            {c && (
              <span key={c.id} className="absolute inset-0 grid animate-pop place-items-center">
                <Sprite name={KINDS[c.kind].sprite} swap={KINDS[c.kind].swap} size={56} />
              </span>
            )}
            {pops
              .filter((p) => p.i === i)
              .map((p) => (
                <span key={p.id} className={`pointer-events-none absolute top-2 left-1/2 animate-float-up font-pixel text-xs ${p.bad ? 'text-pink' : 'text-neon'}`}>
                  {p.text}
                </span>
              ))}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-cream/55">
        <span className="flex items-center gap-1"><Sprite name="cuy" size={18} /> +50</span>
        <span className="flex items-center gap-1"><Sprite name="cuy" swap={SWAPS.goldCuy} size={18} /> +150</span>
        <span className="flex items-center gap-1"><Sprite name="chefHead" size={16} /><Sprite name="bomb" size={16} /> −75</span>
      </div>
    </div>
  )
}
