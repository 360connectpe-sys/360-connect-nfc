import { useEffect, useRef, useState } from 'react'
import GameHud from '../GameHud'
import Sprite from '../engine/Sprite'
import { shuffle } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'
import { MEMORY_PAIRS, MEMORY_TIME_LIMIT, memoryScore } from '../../services/backend/validation'

const FOODS = ['tomato', 'fish', 'corn', 'chili', 'lemon', 'avocado', 'potato', 'cup', 'flan', 'pisco']

export default function MemoryGame({ onFinish }) {
  const [cards] = useState(() =>
    shuffle(shuffle(FOODS).slice(0, MEMORY_PAIRS).flatMap((f) => [f, f])).map((food, i) => ({ id: i, food })),
  )
  const [matched, setMatched] = useState(() => new Set())
  const [open, setOpen] = useState([])
  const [moves, setMoves] = useState(0)
  const [errors, setErrors] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [wrong, setWrong] = useState(false)
  const lock = useRef(false)
  const done = useRef(false)
  const startedAt = useRef(performance.now())

  const pairs = matched.size / 2

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((performance.now() - startedAt.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (done.current) return
    const won = pairs === MEMORY_PAIRS
    if (!won && elapsed < MEMORY_TIME_LIMIT) return
    done.current = true
    const seconds = Math.min(elapsed, MEMORY_TIME_LIMIT)
    const score = won ? memoryScore({ errors, seconds }) : 0
    setTimeout(
      () =>
        onFinish({
          score,
          completed: won,
          stats: { pairs, moves, errors, seconds },
          summary: [['Errores', errors], ['Movimientos', moves], ['Tiempo', `${seconds}s`]],
        }),
      won ? 700 : 200,
    )
  }, [pairs, elapsed, moves, errors, onFinish])

  const flip = (i) => {
    if (lock.current || done.current || matched.has(i) || open.includes(i)) return
    sfx.tap()
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    lock.current = true
    setMoves((m) => m + 1)
    const [a, b] = next
    if (cards[a].food === cards[b].food) {
      setTimeout(() => {
        setMatched((prev) => new Set(prev).add(a).add(b))
        setOpen([])
        lock.current = false
        sfx.good()
        vibrate(15)
      }, 300)
    } else {
      setErrors((e) => e + 1)
      setTimeout(() => {
        setWrong(true)
        sfx.bad()
      }, 350)
      setTimeout(() => {
        setOpen([])
        setWrong(false)
        lock.current = false
      }, 850)
    }
  }

  // Puntaje proyectado en vivo (lo que obtendrías si terminaras ahora)
  const projected = memoryScore({ errors, seconds: elapsed })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <GameHud
        items={[
          { label: 'PAREJAS', value: `${pairs}/${MEMORY_PAIRS}`, tone: 'mint' },
          { label: 'ERRORES', value: errors, tone: 'pink' },
          { label: 'TIEMPO', value: `${elapsed}s`, warn: elapsed >= MEMORY_TIME_LIMIT - 15 },
          { label: 'PUNTOS', value: projected },
        ]}
      />
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
              aria-label={isOpen ? c.food : 'Carta oculta'}
              data-food={c.food}
            >
              <div className="flip-inner">
                <div className="flip-face pixel-grid grid place-items-center rounded-xl border-2 border-neon/40 bg-arcade-2 shadow-[inset_0_-4px_0_rgba(0,0,0,0.35)]">
                  <span className="font-pixel text-lg text-neon/80">?</span>
                </div>
                <div
                  className={`flip-face flip-back grid place-items-center rounded-xl border-2 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] ${
                    isMatched ? 'border-mint bg-mint/25' : isWrong ? 'border-pink bg-pink/25' : 'border-cream/60 bg-cream'
                  }`}
                >
                  <Sprite name={c.food} size={40} className={isMatched ? 'animate-pop' : ''} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-center text-xs text-cream/45">Base 5 000 · −150 por error · −30 por segundo · bono si terminas en menos de 45 s</p>
    </div>
  )
}
