import { useEffect, useRef, useState } from 'react'
import GameHud from '../GameHud'
import Sprite from '../engine/Sprite'
import { SWAPS, drawSprite } from '../engine/sprites'
import { clamp, pixelText, setupCanvas, startLoop } from '../engine/canvas'
import { pick, shuffle } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'
import { CHEF_DURATION, chefMultiplier, chefScoreFromLog } from '../../services/backend/validation'

const W = 150
const H = 200
const BASKET_Y = H - 18
const GOOD = ['tomato', 'fish', 'corn', 'chili', 'lemon', 'avocado', 'potato']
const BAD = [{ sprite: 'shoe' }, { sprite: 'bomb' }, { sprite: 'fish', swap: SWAPS.rotten, rotten: true }]

const newOrder = () => shuffle(GOOD).slice(0, 3)
const lerp = (a, b, t) => a + (b - a) * t

export default function ChefFrenetico({ onFinish }) {
  const canvasRef = useRef(null)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const [hud, setHud] = useState({ score: 0, mult: 1, time: CHEF_DURATION, order: [], got: [] })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas, W, H)
    const s = {
      x: W / 2, targetX: null, keys: { l: false, r: false }, items: [], fx: [], t: 0, spawnT: 0.4,
      log: '', streak: 0, order: newOrder(), got: [], orders: 0, done: false, flash: 0, hudT: 0,
    }

    const pointerX = (e) => {
      const r = canvas.getBoundingClientRect()
      return ((e.clientX - r.left) / r.width) * W
    }
    const onDown = (e) => {
      canvas.setPointerCapture?.(e.pointerId)
      s.targetX = pointerX(e)
    }
    const onMove = (e) => {
      if (e.buttons || e.pointerType === 'touch') s.targetX = pointerX(e)
    }
    const onUp = () => (s.targetX = null)
    const onKey = (down) => (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) s.keys.l = down
      if (['ArrowRight', 'd', 'D'].includes(e.key)) s.keys.r = down
      if (e.key.startsWith('Arrow')) e.preventDefault()
    }
    const kd = onKey(true)
    const ku = onKey(false)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    const addFx = (text, x, y, color) => s.fx.push({ text, x, y, color, life: 0.8 })

    const stop = startLoop((dt) => {
      if (s.done) return
      s.t += dt
      const p = Math.min(1, s.t / CHEF_DURATION)

      // --- movimiento de la cesta ---
      if (s.targetX != null) s.x += clamp(s.targetX - s.x, -320 * dt, 320 * dt)
      if (s.keys.l) s.x -= 150 * dt
      if (s.keys.r) s.x += 150 * dt
      s.x = clamp(s.x, 18, W - 18)

      // --- generar ingredientes ---
      s.spawnT -= dt
      if (s.spawnT <= 0) {
        s.spawnT = lerp(0.85, 0.42, p)
        const remaining = s.order.filter((o) => !s.got.includes(o))
        const r = Math.random()
        let item
        if (r < 0.5 && remaining.length) item = { kind: pick(remaining) }
        else if (r < 0.8) item = { kind: pick(GOOD.filter((g) => !s.order.includes(g))) }
        else item = { ...pick(BAD), bad: true }
        s.items.push({ ...item, sprite: item.sprite ?? item.kind, x: 10 + Math.random() * (W - 20), y: -10, vy: lerp(55, 115, p) + Math.random() * 15 })
      }

      // --- caída y captura ---
      for (const it of s.items) {
        it.y += it.vy * dt
        if (!it.caught && it.y > BASKET_Y - 8 && it.y < BASKET_Y + 4 && Math.abs(it.x - s.x) < 19) {
          it.caught = true
          const needed = !it.bad && s.order.includes(it.kind) && !s.got.includes(it.kind)
          const already = !it.bad && s.got.includes(it.kind)
          if (needed) {
            const pts = 100 * chefMultiplier(s.streak)
            s.streak += 1
            s.log += 'c'
            s.got.push(it.kind)
            addFx(`+${pts}`, it.x, BASKET_Y - 14, '#5eead4')
            sfx.good()
            vibrate(8)
            if (s.got.length === 3) {
              s.orders += 1
              s.order = newOrder()
              s.got = []
              addFx('¡PEDIDO!', W / 2, H / 2, '#ffb547')
              sfx.gold()
            }
          } else if (already) {
            addFx('YA ESTÁ', it.x, BASKET_Y - 14, '#c3cad2')
          } else {
            s.streak = 0
            s.log += 'x'
            s.order = newOrder() // pedido arruinado
            s.got = []
            s.flash = 0.18
            addFx('-50', it.x, BASKET_Y - 14, '#ff6b8b')
            sfx.bad()
            vibrate(60)
          }
        }
      }
      s.items = s.items.filter((it) => !it.caught && it.y < H + 12)
      s.fx.forEach((f) => {
        f.life -= dt
        f.y -= 25 * dt
      })
      s.fx = s.fx.filter((f) => f.life > 0)
      s.flash = Math.max(0, s.flash - dt)

      // --- dibujo ---
      for (let y = 0; y < H; y += 10)
        for (let x = 0; x < W; x += 10) {
          ctx.fillStyle = (x + y) % 20 === 0 ? '#2a1c31' : '#241829'
          ctx.fillRect(x, y, 10, 10)
        }
      ctx.fillStyle = '#4a3427'
      ctx.fillRect(0, H - 8, W, 8)
      for (const it of s.items) drawSprite(ctx, it.sprite, it.x, it.y, 1, it.swap)
      drawSprite(ctx, 'basket', s.x, BASKET_Y, 2)
      for (const f of s.fx) pixelText(ctx, f.text, f.x, f.y, { size: 6, color: f.color })
      if (s.flash > 0) {
        ctx.fillStyle = 'rgba(255,107,139,0.25)'
        ctx.fillRect(0, 0, W, H)
      }

      const score = chefScoreFromLog(s.log)
      s.hudT -= dt
      if (s.hudT <= 0) {
        s.hudT = 0.1
        setHud({ score, mult: chefMultiplier(s.streak), time: Math.max(0, Math.ceil(CHEF_DURATION - s.t)), order: s.order, got: [...s.got] })
      }

      if (s.t >= CHEF_DURATION) {
        s.done = true
        const correct = [...s.log].filter((c) => c === 'c').length
        onFinishRef.current({
          score,
          stats: { log: s.log },
          summary: [['Correctos', correct], ['Errores', s.log.length - correct], ['Pedidos', s.orders]],
        })
      }
    })

    return () => {
      stop()
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-3">
      <GameHud
        items={[
          { label: 'PUNTOS', value: hud.score },
          { label: 'MULTI', value: `x${hud.mult}`, tone: 'mint' },
          { label: 'TIEMPO', value: hud.time, tone: 'pink', warn: hud.time <= 5 },
        ]}
      />
      <div className="flex items-center gap-3 rounded-xl border-2 border-neon/30 bg-black/30 px-3 py-2">
        <span className="font-pixel text-[8px] text-neon">PEDIDO</span>
        <div className="flex flex-1 justify-around">
          {hud.order.map((o) => (
            <span key={o} className={`relative grid size-10 place-items-center rounded-lg ${hud.got.includes(o) ? 'bg-mint/25' : 'bg-white/5'}`}>
              <Sprite name={o} size={28} className={hud.got.includes(o) ? 'opacity-50' : ''} />
              {hud.got.includes(o) && <span className="absolute -top-1 -right-1 rounded-full bg-mint px-1 text-[10px] font-black text-arcade">✓</span>}
            </span>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Área de juego Chef Frenético"
        className="pixelated mx-auto h-[52dvh] w-auto max-w-full touch-none rounded-2xl border-2 border-white/10"
        style={{ aspectRatio: `${W} / ${H}` }}
      />
      <p className="text-center text-[11px] text-cream/45">Desliza el dedo para mover la cesta · evita el zapato, la bomba y el pescado verde (malogrado)</p>
    </div>
  )
}
