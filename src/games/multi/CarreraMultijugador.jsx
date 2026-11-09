import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MultiplayerShell from './MultiplayerShell'
import { drawSprite, getSprite } from '../engine/sprites'
import { clamp, pixelText, setupCanvas, startLoop } from '../engine/canvas'
import { mulberry32 } from '../../lib/rng'
import { sfx, vibrate } from '../../lib/sfx'

const W = 160
const H = 240
const ROAD_L = 24
const ROAD_R = 136
const CAR_Y = 190
const FINISH = 9000 // ~60–75 s de carrera
const VMAX = 150
const BOOST_VMAX = 215
const COUNTDOWN = 3
const FINISH_GRACE = 20 // s que se espera a los demás tras el primer llegado

/** Circuito idéntico para todos (misma semilla). */
function buildCourse(seed) {
  const rand = mulberry32(seed)
  const obs = []
  for (let d = 420; d < FINISH - 250; d += 70 + rand() * 75) {
    const r = rand()
    const type = r < 0.55 ? 'cone' : r < 0.8 ? 'oil' : 'boost'
    obs.push({ d, x: ROAD_L + 10 + rand() * (ROAD_R - ROAD_L - 20), type })
    if (type === 'cone' && rand() < 0.3) obs.push({ d, x: ROAD_L + 10 + rand() * (ROAD_R - ROAD_L - 20), type: 'cone' })
  }
  return obs
}

const carSwap = (color) => ({ c: color, C: color })

export function RaceMatch({ seed, players, me, room, cpu, onEnd }) {
  const canvasRef = useRef(null)
  const inputRef = useRef(0) // -1 izquierda · 0 · 1 derecha
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd
  const [hud, setHud] = useState({ pos: 1, speed: 0, progress: {}, finished: false })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas, W, H)
    const course = buildCourse(seed)
    const startX = (i) => ROAD_L + ((i + 1) * (ROAD_R - ROAD_L)) / (players.length + 1)
    const racers = Object.fromEntries(
      players.map((p, i) => [
        p.id,
        { ...p, x: startX(i), d: 0, v: 0, finishTime: null, left: false, hits: new Set(), boostT: 0, shake: 0,
          botSkill: p.bot ? 0.9 + mulberry32(seed + i)() * 0.08 : 0, botRand: mulberry32(seed * 7 + i) },
      ]),
    )
    const mine = racers[me.id]
    let t = -COUNTDOWN
    let firstFinishAt = null
    let ended = false
    let sendT = 0
    let hudT = 0
    let lastCount = null

    const unsub = room?.subscribe((msg) => {
      const r = racers[msg.from]
      if (!r) return
      if (msg.type === 'pos') {
        r.d = msg.payload.d
        r.x = msg.payload.x
      } else if (msg.type === 'finish') {
        r.finishTime = msg.payload.time
        r.d = FINISH
        firstFinishAt ??= t
      } else if (msg.type === 'player-left') r.left = true
      else if (msg.type === 'host-left') Object.values(racers).forEach((x) => x.id !== me.id && (x.left = true))
    })

    const onKey = (down) => (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current = down ? -1 : inputRef.current === -1 ? 0 : inputRef.current
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current = down ? 1 : inputRef.current === 1 ? 0 : inputRef.current
    }
    const kd = onKey(true)
    const ku = onKey(false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    // tocar mitades del canvas también gira
    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect()
      inputRef.current = e.type === 'pointerup' || e.type === 'pointercancel' ? 0 : e.clientX - r.left < r.width / 2 ? -1 : 1
    }
    ;['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((ev) =>
      canvas.addEventListener(ev, (e) => (ev === 'pointermove' && !e.buttons && e.pointerType !== 'touch' ? null : onPointer(e))),
    )

    /** Física común a jugador y bots. steer: -1..1 */
    const physics = (r, steer, dt) => {
      if (r.finishTime != null) return
      r.boostT = Math.max(0, r.boostT - dt)
      r.shake = Math.max(0, r.shake - dt)
      const offRoad = r.x < ROAD_L + 4 || r.x > ROAD_R - 4
      const vmax = offRoad ? 60 : r.boostT > 0 ? BOOST_VMAX : VMAX * (r.bot ? r.botSkill : 1)
      r.v += (r.v < vmax ? 75 : -160) * dt
      r.v = clamp(r.v, 0, BOOST_VMAX)
      r.x = clamp(r.x + steer * 95 * dt, ROAD_L - 8, ROAD_R + 8)
      r.d += r.v * dt
      for (const o of course) {
        if (o.d > r.d + 12) break
        if (r.hits.has(o) || Math.abs(o.d - r.d) > 7 || Math.abs(o.x - r.x) > 8) continue
        r.hits.add(o)
        if (o.type === 'cone') {
          r.v *= 0.35
          r.shake = 0.4
          if (r.id === me.id) {
            sfx.bad()
            vibrate(90)
          }
        } else if (o.type === 'oil') {
          r.v *= 0.55
          r.shake = 0.6
          if (r.id === me.id) sfx.bad()
        } else {
          r.boostT = 1.5
          if (r.id === me.id) sfx.gold()
        }
      }
      if (r.d >= FINISH) {
        r.d = FINISH
        r.finishTime = Math.round(t * 100) / 100
        firstFinishAt ??= t
        if (r.id === me.id) {
          room?.send('finish', { time: r.finishTime })
          sfx.win()
        }
      }
    }

    const botSteer = (r) => {
      const ahead = course.find((o) => o.d > r.d + 10 && o.d < r.d + 70 && o.type !== 'boost' && Math.abs(o.x - r.x) < 11)
      if (ahead) return ahead.x > r.x ? -1 : 1
      const boost = course.find((o) => o.type === 'boost' && o.d > r.d + 10 && o.d < r.d + 60)
      if (boost && r.botRand() < 0.6) return Math.sign(boost.x - r.x)
      const center = (ROAD_L + ROAD_R) / 2
      return Math.abs(r.x - center) > 35 ? Math.sign(center - r.x) : 0
    }

    const finishRace = () => {
      ended = true
      const list = Object.values(racers)
      const ranking = [
        ...list.filter((r) => r.finishTime != null && !r.left).sort((a, b) => a.finishTime - b.finishTime),
        ...list.filter((r) => r.finishTime == null && !r.left).sort((a, b) => b.d - a.d),
        ...list.filter((r) => r.left),
      ].map((r) => ({
        id: r.id, name: r.name, color: r.color, value: r.finishTime ?? Infinity,
        label: r.left ? 'ABANDONÓ' : r.finishTime != null ? `${r.finishTime.toFixed(1)} s` : `${Math.round((r.d / FINISH) * 100)}%`,
      }))
      const othersLeft = list.filter((r) => r.id !== me.id).every((r) => r.left)
      onEndRef.current({ metric: 'time', ranking, note: othersLeft && list.length > 1 ? 'TUS RIVALES SE DESCONECTARON' : null })
    }

    const stop = startLoop((dt) => {
      if (ended) return
      t += dt
      if (t < 0) {
        const c = Math.ceil(-t)
        if (c !== lastCount) {
          lastCount = c
          sfx.count()
        }
      } else if (lastCount !== 0) {
        lastCount = 0
        sfx.go()
      }
      if (t >= 0) {
        physics(mine, inputRef.current, dt)
        if (cpu) Object.values(racers).filter((r) => r.bot).forEach((r) => physics(r, botSteer(r), dt))
        sendT -= dt
        if (room && sendT <= 0 && mine.finishTime == null) {
          sendT = 0.1
          room.send('pos', { d: Math.round(mine.d), x: Math.round(mine.x) })
        }
      }
      const active = Object.values(racers).filter((r) => !r.left)
      const allDone = active.every((r) => r.finishTime != null)
      const othersGone = active.length === 1 && players.length > 1
      if (allDone || othersGone || (firstFinishAt != null && t - firstFinishAt > FINISH_GRACE)) return finishRace()

      // --- dibujo ---
      const camD = mine.d
      const screenY = (d) => CAR_Y - (d - camD)
      ctx.fillStyle = '#3f7a35'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#4c8c3f'
      const gOff = camD % 16
      for (let y = -16 + gOff; y < H; y += 16) {
        ctx.fillRect(0, y, ROAD_L - 6, 8)
        ctx.fillRect(ROAD_R + 6, y + 8, W - ROAD_R - 6, 8)
      }
      ctx.fillStyle = '#4a4552'
      ctx.fillRect(ROAD_L - 4, 0, ROAD_R - ROAD_L + 8, H)
      // bordillos rojo/blanco
      const kOff = camD % 12
      for (let y = -12 + kOff; y < H; y += 12) {
        ctx.fillStyle = '#e04f3a'
        ctx.fillRect(ROAD_L - 6, y, 3, 6)
        ctx.fillRect(ROAD_R + 3, y, 3, 6)
        ctx.fillStyle = '#fbf5ec'
        ctx.fillRect(ROAD_L - 6, y + 6, 3, 6)
        ctx.fillRect(ROAD_R + 3, y + 6, 3, 6)
      }
      // líneas de carril
      ctx.fillStyle = 'rgba(251,245,236,0.55)'
      const lOff = camD % 24
      for (let y = -24 + lOff; y < H; y += 24) {
        ctx.fillRect(ROAD_L + (ROAD_R - ROAD_L) / 3, y, 2, 12)
        ctx.fillRect(ROAD_L + (2 * (ROAD_R - ROAD_L)) / 3, y, 2, 12)
      }
      // salida y meta (cuadros)
      for (const line of [0, FINISH]) {
        const y = screenY(line)
        if (y < -10 || y > H + 10) continue
        for (let x = ROAD_L - 4; x < ROAD_R + 4; x += 4) {
          ctx.fillStyle = ((x - ROAD_L) / 4) % 2 ? '#1b1220' : '#fbf5ec'
          ctx.fillRect(x, y - 4, 4, 4)
          ctx.fillStyle = ((x - ROAD_L) / 4) % 2 ? '#fbf5ec' : '#1b1220'
          ctx.fillRect(x, y, 4, 4)
        }
      }
      for (const o of course) {
        const y = screenY(o.d)
        if (y > H + 12) continue // ya quedó atrás
        if (y < -12) break // el resto está más adelante, fuera de pantalla
        drawSprite(ctx, o.type, o.x, y, 1)
      }
      // rivales (fantasmas) y yo
      const carH = getSprite('car').height
      for (const r of Object.values(racers)) {
        if (r.id === me.id || r.left) continue
        const y = screenY(r.d)
        if (y < -carH || y > H + carH) continue
        ctx.globalAlpha = 0.85
        drawSprite(ctx, 'car', r.x, y, 1, carSwap(r.color))
        ctx.globalAlpha = 1
      }
      const shake = mine.shake > 0 ? Math.sin(t * 60) * 2 : 0
      drawSprite(ctx, 'car', mine.x + shake, CAR_Y, 1, carSwap(mine.color))
      if (mine.boostT > 0) {
        ctx.fillStyle = '#ffd34a'
        ctx.fillRect(mine.x - 2, CAR_Y + 7, 4, 3 + Math.random() * 4)
      }
      // flechas de rivales fuera de pantalla
      for (const r of Object.values(racers)) {
        if (r.id === me.id || r.left) continue
        const y = screenY(r.d)
        if (y < -carH) {
          ctx.fillStyle = r.color
          ctx.fillRect(clamp(r.x, 4, W - 8) - 2, 2, 5, 5)
        }
      }
      if (t < 0) {
        ctx.fillStyle = 'rgba(27,18,32,0.55)'
        ctx.fillRect(0, 0, W, H)
        pixelText(ctx, String(Math.ceil(-t)), W / 2, H / 2 - 20, { size: 24, color: '#ffb547' })
      } else if (t < 0.8) {
        pixelText(ctx, '¡YA!', W / 2, H / 2 - 20, { size: 18, color: '#5eead4' })
      }
      if (mine.finishTime != null) {
        ctx.fillStyle = 'rgba(27,18,32,0.6)'
        ctx.fillRect(0, H / 2 - 30, W, 44)
        pixelText(ctx, '¡META!', W / 2, H / 2 - 16, { size: 12, color: '#ffb547' })
        pixelText(ctx, 'esperando rivales…', W / 2, H / 2 + 2, { size: 5 })
      }

      hudT -= dt
      if (hudT <= 0) {
        hudT = 0.15
        const order = Object.values(racers)
          .filter((r) => !r.left)
          .sort((a, b) => (a.finishTime ?? 1e9) - (b.finishTime ?? 1e9) || b.d - a.d)
        setHud({
          pos: order.findIndex((r) => r.id === me.id) + 1,
          total: order.length,
          speed: Math.round(mine.v),
          progress: Object.values(racers).map((r) => ({ id: r.id, name: r.name, color: r.color, pct: Math.min(100, (r.d / FINISH) * 100), left: r.left })),
        })
      }
    })

    return () => {
      stop()
      unsub?.()
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const hold = (dir) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      inputRef.current = dir
    },
    onPointerUp: () => (inputRef.current = 0),
    onPointerCancel: () => (inputRef.current = 0),
    onPointerLeave: () => inputRef.current === dir && (inputRef.current = 0),
  })

  return (
    <div className="flex flex-1 flex-col gap-2 px-3 pt-1 pb-3">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-white/10 bg-black/30 px-3 py-2">
        <p className="font-pixel text-lg text-neon" data-testid="race-pos">
          {hud.pos}°<span className="text-[9px] text-cream/50">/{hud.total ?? players.length}</span>
        </p>
        <div className="flex-1 space-y-1">
          {(hud.progress.length ? hud.progress : []).map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-14 truncate text-[10px] font-bold">{p.id === me.id ? 'Tú' : p.name.split(' ')[0]}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full" style={{ width: `${p.pct}%`, background: p.left ? '#5d646d' : p.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="w-12 text-right font-pixel text-[9px] text-mint">{hud.speed}<br />km/h</p>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Pista de carrera: mantén presionado izquierda o derecha"
        className="pixelated mx-auto h-[50dvh] w-auto max-w-full touch-none rounded-2xl border-2 border-white/10"
        style={{ aspectRatio: `${W} / ${H}` }}
      />
      <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-3">
        <button {...hold(-1)} aria-label="Girar a la izquierda" className="pixel-btn grid touch-none place-items-center py-5">
          <ChevronLeft className="size-7" />
        </button>
        <button {...hold(1)} aria-label="Girar a la derecha" className="pixel-btn grid touch-none place-items-center py-5">
          <ChevronRight className="size-7" />
        </button>
      </div>
    </div>
  )
}

export default function CarreraMultijugador({ game }) {
  return <MultiplayerShell game={game} Match={RaceMatch} />
}
