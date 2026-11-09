import { useCallback, useEffect, useRef, useState } from 'react'
import GameHud from './GameHud'
import { triviaPool } from '../data/trivia'
import { shuffle } from '../lib/random'
import { sfx, vibrate } from '../lib/sfx'

const TOTAL = 8
const QUESTION_TIME = 12 // segundos
const LETTERS = ['A', 'B', 'C', 'D']

/** Acierto = 100 pts + 10 pts por cada segundo restante (máx. ~220 por pregunta). */
export const triviaPoints = (secondsLeft) => 100 + Math.round(secondsLeft * 10)

export default function TriviaGame({ onFinish }) {
  const [questions] = useState(() =>
    shuffle(triviaPool)
      .slice(0, TOTAL)
      .map((q) => ({ q: q.q, options: shuffle(q.options.map((text, i) => ({ text, correct: i === 0 }))) })),
  )
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [selected, setSelected] = useState(null) // índice elegido | -1 (tiempo agotado)
  const [gained, setGained] = useState(0)
  const score = useRef(0)
  const correct = useRef(0)
  const [, force] = useState(0)
  const deadline = useRef(Date.now() + QUESTION_TIME * 1000)
  const answered = useRef(false)

  const current = questions[index]

  const answer = useCallback(
    (optIndex) => {
      if (answered.current) return
      answered.current = true
      const left = Math.max(0, (deadline.current - Date.now()) / 1000)
      const isCorrect = optIndex >= 0 && current.options[optIndex].correct
      const pts = isCorrect ? triviaPoints(left) : 0
      setSelected(optIndex)
      setGained(pts)
      if (isCorrect) {
        score.current += pts
        correct.current += 1
        sfx.good()
        vibrate(15)
      } else {
        sfx.bad()
        vibrate([40, 40, 40])
      }
      force((n) => n + 1)

      setTimeout(() => {
        if (index + 1 >= TOTAL) {
          onFinish({
            score: score.current,
            stats: [['Correctas', `${correct.current}/${TOTAL}`], ['Precisión', `${Math.round((correct.current / TOTAL) * 100)}%`]],
          })
        } else {
          deadline.current = Date.now() + QUESTION_TIME * 1000
          setIndex((i) => i + 1)
          setSelected(null)
          answered.current = false
          setTimeLeft(QUESTION_TIME)
        }
      }, 1400)
    },
    [selected, current, index, onFinish],
  )

  // Temporizador por pregunta
  useEffect(() => {
    if (selected !== null) return
    const t = setInterval(() => {
      const left = Math.max(0, (deadline.current - Date.now()) / 1000)
      setTimeLeft(left)
      if (left <= 0) answer(-1)
    }, 100)
    return () => clearInterval(t)
  }, [selected, answer])

  const pct = (timeLeft / QUESTION_TIME) * 100

  return (
    <div className="flex flex-1 flex-col gap-5">
      <GameHud
        items={[
          { label: 'PREGUNTA', value: `${index + 1}/${TOTAL}`, tone: 'mint' },
          { label: 'PUNTOS', value: score.current },
          { label: 'TIEMPO', value: Math.ceil(timeLeft), tone: 'pink', warn: timeLeft <= 3 && selected === null },
        ]}
      />
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${pct < 30 ? 'bg-pink' : 'bg-mint'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div key={index} className="animate-fade-up">
        <div className="relative rounded-2xl border-2 border-white/10 bg-black/25 p-5">
          <p className="text-lg leading-snug font-bold text-cream">{current.q}</p>
          {selected !== null && (
            <span
              className={`absolute -top-3 right-4 animate-pop rounded-full px-3 py-1 font-pixel text-[9px] ${
                gained ? 'bg-mint text-arcade' : 'bg-pink text-arcade'
              }`}
            >
              {gained ? `+${gained}` : selected === -1 ? '¡TIEMPO!' : 'X'}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {current.options.map((opt, i) => {
            const reveal = selected !== null
            const state = reveal ? (opt.correct ? 'correct' : i === selected ? 'wrong' : 'dim') : 'idle'
            return (
              <button
                key={opt.text}
                disabled={reveal}
                onClick={() => answer(i)}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition active:scale-[0.98] ${
                  {
                    idle: 'border-white/15 bg-arcade-2 text-cream',
                    correct: 'border-mint bg-mint/20 text-cream',
                    wrong: 'animate-shake border-pink bg-pink/20 text-cream',
                    dim: 'border-white/5 bg-arcade-2/50 text-cream/40',
                  }[state]
                }`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg font-pixel text-[10px] ${
                    state === 'correct' ? 'bg-mint text-arcade' : state === 'wrong' ? 'bg-pink text-arcade' : 'bg-white/10 text-neon'
                  }`}
                >
                  {LETTERS[i]}
                </span>
                {opt.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
