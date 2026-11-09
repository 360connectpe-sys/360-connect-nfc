import { useEffect, useRef, useState } from 'react'
import GameHud from './GameHud'
import { sfx, vibrate } from '../lib/sfx'
import { shuffle } from '../lib/random'

const SYMBOLS = ['🌶️', '🥑', '🍋', '🌽', '🥔', '🐟', '☕', '🍮']
const TIME_LIMIT = 90

/**
 * Puntuación:
 *  - Completa: 800 + bono por tiempo (15 pts por cada segundo bajo 60 s)
 *              - 10 pts por cada intento extra sobre el mínimo (8).
 *  - Si se acaba el tiempo: 50 pts por pareja encontrada.
 */
export function memoryScore({ won, elapsed, moves, pairs }) {
  if (!won) return pairs * 50
  return Math.max(150, 800 + Math.max(0, 60 - elapsed) * 15 - Math.max(0, moves - SYMBOLS.length) * 10)
}

export default function MemoryGame({ onFinish }) {
  const [cards] = useState(() =>
    shuffle([...SYMBOLS, ...SYMBOLS]).map((s, i) => ({ id: i, s })),
  )
  const [matched, setMatched] = useState(() => new Set())
  const [open, setOpen] = useState([])
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [wrong, setWrong] = useState(false)
  const lock = useRef(false)
  const done = useRef(false)

  const pairs = matched.size / 2

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (done.current) return
    const won = pairs === SYMBOLS.length
    if (won || elapsed >= TIME_LIMIT) {
      done.current = true
      const score = memoryScore({ won, elapsed, moves, pairs })
      setTimeout(
        () => onFinish({ score, stats: [['Parejas', `${pairs}/${SYMBOLS.length}`], ['Intentos', moves], ['Tiempo', `${elapsed}s`]] }),
        won ? 600 : 200,
      )
    }
  }, [pairs, elapsed, moves, onFinish])

  const flip = (i) => {
    if (lock.current || done.current || matched.has(i) || open.includes(i)) return
    sfx.tap()
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return

    lock.current = true
    setMoves((m) => m + 1)
    const [a, b] = next
    if (cards[a].s === cards[b].s) {
      setTimeout(() => {
        setMatched((prev) => new Set(prev).add(a).add(b))
        setOpen([])
        lock.current = false
        sfx.good()
        vibrate(15)
      }, 320)
    } else {
      setTimeout(() => setWrong(true), 350)
      setTimeout(() => {
        setOpen([])
        setWrong(false)
        lock.current = false
      }, 850)
      setTimeout(() => sfx.bad(), 350)
    }
  }

  const remaining = Math.max(0, TIME_LIMIT - elapsed)

  return (
    <div className="flex flex-1 flex-col gap-5">
      <GameHud
        items={[
          { label: 'PAREJAS', value: `${pairs}/8`, tone: 'mint' },
          { label: 'INTENTOS', value: moves },
          { label: 'TIEMPO', value: `${remaining}s`, tone: 'pink', warn: remaining <= 10 },
        ]}
      />
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-pink transition-[width] duration-1000 ease-linear" style={{ width: `${(remaining / TIME_LIMIT) * 100}%` }} />
      </div>

      <div className="mx-auto grid w-full max-w-sm grid-cols-4 gap-2.5">
        {cards.map((c, i) => {
          const isOpen = open.includes(i) || matched.has(i)
          const isMatched = matched.has(i)
          const isWrong = wrong && open.includes(i)
          return (
            <button
              key={c.id}
              onClick={() => flip(i)}
              className={`flip aspect-[3/4] ${isOpen ? 'is-open' : ''} ${isWrong ? 'animate-shake' : ''}`}
              aria-label={isOpen ? c.s : 'Carta oculta'}
            >
              <div className="flip-inner">
                <div className="flip-face pixel-grid grid place-items-center rounded-xl border-2 border-neon/40 bg-arcade-2 shadow-[inset_0_-4px_0_rgba(0,0,0,0.35)]">
                  <span className="font-pixel text-lg text-neon/80">?</span>
                </div>
                <div
                  className={`flip-face flip-back grid place-items-center rounded-xl border-2 text-3xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] ${
                    isMatched ? 'border-mint bg-mint/20' : isWrong ? 'border-pink bg-pink/20' : 'border-cream/60 bg-cream'
                  }`}
                >
                  <span className={isMatched ? 'animate-pop' : ''}>{c.s}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
