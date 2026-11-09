import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play } from 'lucide-react'
import GameHud from '../GameHud'
import { drawSprite } from '../engine/sprites'
import { pixelText, setupCanvas, startLoop, useAutoPause } from '../engine/canvas'
import { pick } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'

const N = 15 // celdas por lado
const T = 12 // px por celda
const SIZE = N * T
const FOODS = ['tomato', 'corn', 'lemon', 'avocado', 'potato', 'chili', 'fish']
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

export default function SerpienteHambrienta({ onFinish }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState({ score: 0, length: 3, speed: 1 })

  const turn = (dir) => {
    const s = stateRef.current
    if (!s || s.done) return
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir
    const [dx, dy] = DIRS[dir]
    const [lx, ly] = DIRS[last]
    if (dx === -lx && dy === -ly) return // no se puede ir en reversa
    if (dir === last || s.queue.length >= 2) return
    s.queue.push(dir)
    if (s.paused) togglePause(false)
  }
  const togglePause = (value) => {
    const s = stateRef.current
    if (!s || s.done) return
    s.paused = value ?? !s.paused
    setPaused(s.paused)
  }
  useAutoPause(() => togglePause(true))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas, SIZE, SIZE)
    const s = (stateRef.current = {
      snake: [[4, 7], [3, 7], [2, 7]], dir: 'right', queue: [], food: null, eaten: 0,
      acc: 0, step: 0.17, paused: false, done: false, dead: 0,
    })
    const placeFood = () => {
      const free = []
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!s.snake.some(([a, b]) => a === x && b === y)) free.push([x, y])
      const [x, y] = pick(free)
      s.food = { x, y, sprite: pick(FOODS) }
    }
    placeFood()

    // Deslizar el dedo
    let start = null
    const onDown = (e) => (start = { x: e.clientX, y: e.clientY })
    const onUp = (e) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      start = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    }
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
    const onKey = (e) => {
      if (KEYS[e.key]) {
        e.preventDefault()
        turn(KEYS[e.key])
      }
      if (e.key === ' ' || e.key === 'p') {
        e.preventDefault()
        togglePause()
      }
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)

    const tick = () => {
      if (s.queue.length) s.dir = s.queue.shift()
      const [dx, dy] = DIRS[s.dir]
      const [hx, hy] = s.snake[0]
      const nx = hx + dx
      const ny = hy + dy
      const grows = s.food && nx === s.food.x && ny === s.food.y
      const body = grows ? s.snake : s.snake.slice(0, -1)
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || body.some(([a, b]) => a === nx && b === ny)) {
        s.done = true
        sfx.bad()
        vibrate([80, 60, 80])
        setTimeout(
          () => onFinishRef.current({ score: s.eaten * 10, summary: [['Comida', s.eaten], ['Largo', s.snake.length]] }),
          600,
        )
        return
      }
      s.snake = [[nx, ny], ...body]
      if (grows) {
        s.eaten += 1
        s.step = Math.max(0.075, 0.17 - s.eaten * 0.005) // más rápido
        sfx.good()
        vibrate(10)
        placeFood()
      }
      setHud({ score: s.eaten * 10, length: s.snake.length, speed: Math.round((0.17 / s.step) * 10) / 10 })
    }

    const stop = startLoop((dt) => {
      if (!s.paused && !s.done) {
        s.acc += dt
        while (s.acc >= s.step && !s.done) {
          s.acc -= s.step
          tick()
        }
      }
      // dibujo
      for (let x = 0; x < N; x++)
        for (let y = 0; y < N; y++) {
          ctx.fillStyle = (x + y) % 2 ? '#2a1c31' : '#30213a'
          ctx.fillRect(x * T, y * T, T, T)
        }
      if (s.food) drawSprite(ctx, s.food.sprite, s.food.x * T + T / 2, s.food.y * T + T / 2, 1)
      s.snake.forEach(([x, y], i) => {
        ctx.fillStyle = '#1b1220'
        ctx.fillRect(x * T, y * T, T, T)
        ctx.fillStyle = i === 0 ? '#7ed957' : i % 2 ? '#5fb84a' : '#52a43f'
        ctx.fillRect(x * T + 1, y * T + 1, T - 2, T - 2)
        if (i === 0) {
          ctx.fillStyle = s.done ? '#e04f3a' : '#1b1220'
          const [dx, dy] = DIRS[s.dir]
          const ex = dx === 0 ? [3, 7] : [dx > 0 ? 7 : 3, dx > 0 ? 7 : 3]
          const ey = dy === 0 ? [3, 7] : [dy > 0 ? 7 : 3, dy > 0 ? 7 : 3]
          ctx.fillRect(x * T + ex[0], y * T + ey[0], 2, 2)
          ctx.fillRect(x * T + ex[1], y * T + ey[1], 2, 2)
        }
      })
      if (s.paused) {
        ctx.fillStyle = 'rgba(27,18,32,0.7)'
        ctx.fillRect(0, 0, SIZE, SIZE)
        pixelText(ctx, 'PAUSA', SIZE / 2, SIZE / 2, { size: 12, color: '#ffb547' })
      }
    })
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Pad = ({ dir, Icon, className }) => (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        turn(dir)
      }}
      aria-label={dir}
      className={`grid size-14 touch-none place-items-center rounded-2xl border-2 border-neon/40 bg-arcade-2 text-neon shadow-[0_4px_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none ${className}`}
    >
      <Icon className="size-6" />
    </button>
  )

  return (
    <div className="flex flex-1 flex-col gap-3">
      <GameHud
        items={[
          { label: 'PUNTOS', value: hud.score },
          { label: 'LARGO', value: hud.length, tone: 'mint' },
          { label: 'VELOC.', value: `x${hud.speed}`, tone: 'pink' },
        ]}
      />
      <div className="relative mx-auto w-full max-w-[340px]">
        <canvas ref={canvasRef} aria-label="Tablero de la serpiente: desliza para girar" className="pixelated aspect-square w-full touch-none rounded-2xl border-2 border-white/10" />
        <button
          onClick={() => togglePause()}
          aria-label={paused ? 'Continuar' : 'Pausar'}
          className="absolute top-2 right-2 grid size-10 place-items-center rounded-xl bg-arcade/80 text-neon ring-2 ring-neon/40"
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
      </div>
      <div className="mx-auto grid grid-cols-3 gap-2">
        <span />
        <Pad dir="up" Icon={ArrowUp} />
        <span />
        <Pad dir="left" Icon={ArrowLeft} />
        <Pad dir="down" Icon={ArrowDown} />
        <Pad dir="right" Icon={ArrowRight} />
      </div>
    </div>
  )
}
