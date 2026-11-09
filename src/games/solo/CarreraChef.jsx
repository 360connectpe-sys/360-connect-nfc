import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import GameHud from '../GameHud'
import { drawSprite, getSprite } from '../engine/sprites'
import { overlap, pixelText, setupCanvas, startLoop, useAutoPause } from '../engine/canvas'
import { pick } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'
import { RUNNER, runnerScore } from '../../services/backend/validation'

const W = 160
const H = 100
const GROUND = 84
const CHEF_X = 30
const GRAVITY = 900
const JUMP_V = -300
const INGREDIENTS = ['tomato', 'corn', 'lemon', 'avocado', 'chili']

export default function CarreraChef({ onFinish }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState({ score: 0, lives: 3, time: RUNNER.maxSeconds, meters: 0 })

  const togglePause = (value) => {
    const s = stateRef.current
    if (!s || s.done) return
    s.paused = value ?? !s.paused
    setPaused(s.paused)
  }
  useAutoPause(() => togglePause(true))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas, W, H)
    const chefH = getSprite('chef').height
    const s = (stateRef.current = {
      t: 0, dist: 0, y: 0, vy: 0, lives: 3, inv: 0, coins: 0, ingredients: 0, paused: false, done: false,
      obstacles: [], pickups: [], nextObs: 140, nextPick: 80, frame: 0, hudT: 0, fx: [],
    })

    const jump = () => {
      if (s.paused || s.done) return
      if (s.y >= -0.5) {
        s.vy = JUMP_V
        sfx.tap()
      }
    }
    const onPointer = (e) => {
      e.preventDefault()
      jump()
    }
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        jump()
      }
      if (e.key === 'p' || e.key === 'Escape') togglePause()
    }
    canvas.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)

    const finish = () => {
      s.done = true
      const seconds = Math.max(1, Math.min(RUNNER.maxSeconds + 1, Math.ceil(s.t)))
      const meters = Math.floor(s.dist / RUNNER.pxPerMeter)
      const stats = { seconds, meters, coins: s.coins, ingredients: s.ingredients }
      onFinishRef.current({
        score: runnerScore(stats),
        stats,
        summary: [['Distancia', `${meters} m`], ['Monedas', s.coins], ['Ingredientes', s.ingredients]],
      })
    }

    const stop = startLoop((dt) => {
      if (s.done) return
      if (!s.paused) {
        s.t += dt
        const p = Math.min(1, s.t / RUNNER.maxSeconds)
        const speed = 80 + (RUNNER.maxSpeed - 80) * p
        const dx = speed * dt
        s.dist += dx
        s.frame += dt * speed * 0.08

        // física del salto
        s.vy += GRAVITY * dt
        s.y = Math.min(0, s.y + s.vy * dt)
        if (s.y === 0) s.vy = 0

        // generar obstáculos
        if (s.dist >= s.nextObs) {
          const type = s.t > 8 && Math.random() < 0.22 ? 'knife' : pick(['pot', 'grater', 'pot'])
          const spr = getSprite(type)
          const y = type === 'knife' ? GROUND - 26 - spr.height : GROUND - spr.height
          s.obstacles.push({ type, x: W + 10, y, w: spr.width, h: spr.height, extra: type === 'knife' ? 45 : 0 })
          s.nextObs = s.dist + 95 + Math.random() * 90 + speed * 0.35
        }
        // generar monedas (grupos) o ingrediente
        if (s.dist >= s.nextPick) {
          if (Math.random() < 0.2) {
            s.pickups.push({ kind: 'ing', sprite: pick(INGREDIENTS), x: W + 10, y: GROUND - 34 })
          } else {
            const n = 3 + Math.floor(Math.random() * 3)
            const base = GROUND - 12 - Math.random() * 22
            for (let i = 0; i < n; i++) s.pickups.push({ kind: 'coin', sprite: 'coin', x: W + 10 + i * 13, y: base - Math.sin((i / (n - 1)) * Math.PI) * 8 })
          }
          s.nextPick = s.dist + 150 + Math.random() * 120
        }

        for (const o of s.obstacles) o.x -= dx + o.extra * dt
        for (const c of s.pickups) c.x -= dx
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > -10)
        s.pickups = s.pickups.filter((c) => c.x > -10 && !c.taken)

        // colisiones (caja del chef algo más chica que el sprite)
        const chefBox = { x: CHEF_X - 4, y: GROUND + s.y - chefH + 4, w: 9, h: chefH - 5 }
        s.inv = Math.max(0, s.inv - dt)
        if (s.inv === 0) {
          for (const o of s.obstacles) {
            if (!o.hit && overlap(chefBox, { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 3 })) {
              o.hit = true
              s.lives -= 1
              s.inv = 1.2
              sfx.bad()
              vibrate(120)
              if (s.lives <= 0) return finish()
              break
            }
          }
        }
        for (const c of s.pickups) {
          if (overlap(chefBox, { x: c.x - 5, y: c.y - 5, w: 10, h: 10 })) {
            c.taken = true
            if (c.kind === 'coin') {
              s.coins += 1
              sfx.tap()
            } else {
              s.ingredients += 1
              sfx.gold()
              s.fx.push({ text: '+100', x: c.x, y: c.y, life: 0.7 })
            }
          }
        }
        s.fx.forEach((f) => {
          f.life -= dt
          f.y -= 20 * dt
        })
        s.fx = s.fx.filter((f) => f.life > 0)

        if (s.t >= RUNNER.maxSeconds) return finish()
      }

      // --- dibujo ---
      ctx.fillStyle = '#3b2a3f'
      ctx.fillRect(0, 0, W, H)
      // pared con azulejos (parallax lento)
      const off = (s.dist * 0.3) % 20
      for (let x = -off; x < W; x += 20) {
        ctx.fillStyle = '#4a3550'
        ctx.fillRect(x, 18, 19, 19)
        ctx.fillRect(x + 10, 38, 19, 19)
      }
      // repisa con frascos
      const off2 = (s.dist * 0.5) % 48
      ctx.fillStyle = '#5a3a26'
      ctx.fillRect(0, 60, W, 3)
      for (let x = -off2; x < W; x += 48) {
        ctx.fillStyle = '#e6a12e'
        ctx.fillRect(x + 6, 52, 6, 8)
        ctx.fillStyle = '#5fb84a'
        ctx.fillRect(x + 16, 50, 5, 10)
        ctx.fillStyle = '#e04f3a'
        ctx.fillRect(x + 30, 54, 7, 6)
      }
      // piso
      ctx.fillStyle = '#c9b49a'
      ctx.fillRect(0, GROUND, W, H - GROUND)
      const off3 = s.dist % 16
      ctx.fillStyle = '#a8927a'
      for (let x = -off3; x < W; x += 16) ctx.fillRect(x, GROUND, 8, 4)
      ctx.fillRect(0, GROUND + 8, W, 1)

      for (const c of s.pickups) drawSprite(ctx, c.sprite, c.x, c.y, 1)
      for (const o of s.obstacles) drawSprite(ctx, o.type, o.x + o.w / 2, o.y + o.h / 2, 1)
      if (s.inv === 0 || Math.floor(s.inv * 12) % 2 === 0) {
        const spr = s.y < 0 || Math.floor(s.frame) % 2 === 0 ? 'chef' : 'chef2'
        drawSprite(ctx, spr, CHEF_X, GROUND + s.y - chefH / 2, 1)
      }
      for (const f of s.fx) pixelText(ctx, f.text, f.x, f.y, { size: 6, color: '#ffd34a' })
      if (s.paused) {
        ctx.fillStyle = 'rgba(27,18,32,0.7)'
        ctx.fillRect(0, 0, W, H)
        pixelText(ctx, 'PAUSA', W / 2, H / 2 - 6, { size: 10, color: '#ffb547' })
        pixelText(ctx, 'toca ▶ para seguir', W / 2, H / 2 + 10, { size: 5 })
      }

      s.hudT -= dt
      if (s.hudT <= 0) {
        s.hudT = 0.1
        const meters = Math.floor(s.dist / RUNNER.pxPerMeter)
        setHud({
          score: runnerScore({ meters, coins: s.coins, ingredients: s.ingredients }),
          lives: s.lives, meters, time: Math.max(0, Math.ceil(RUNNER.maxSeconds - s.t)),
        })
      }
    })

    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-3">
      <GameHud
        items={[
          { label: 'PUNTOS', value: hud.score },
          { label: 'METROS', value: hud.meters, tone: 'mint' },
          { label: 'VIDAS', value: '♥'.repeat(Math.max(0, hud.lives)) || '—', tone: 'pink' },
          { label: 'TIEMPO', value: hud.time, warn: hud.time <= 5 },
        ]}
      />
      <div className="relative">
        <canvas
          ref={canvasRef}
          aria-label="Área de juego Carrera del Chef: toca para saltar"
          className="pixelated w-full touch-none rounded-2xl border-2 border-white/10"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
        <button
          onClick={() => togglePause()}
          aria-label={paused ? 'Continuar' : 'Pausar'}
          className="absolute top-2 right-2 grid size-10 place-items-center rounded-xl bg-arcade/80 text-neon ring-2 ring-neon/40"
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
      </div>
      <button
        onPointerDown={(e) => {
          e.preventDefault()
          canvasRef.current?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
        }}
        className="pixel-btn mt-1 w-full touch-none py-6 text-sm"
      >
        ▲ SALTAR
      </button>
      <p className="text-center text-[11px] text-cream/45">Toca la pantalla o el botón para saltar · ESPACIO en computadora</p>
    </div>
  )
}
