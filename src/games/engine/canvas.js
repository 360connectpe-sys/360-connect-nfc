import { useEffect, useRef } from 'react'
import { PALETTE } from './sprites'

/** Bucle de juego con requestAnimationFrame. dt en segundos (limitado para evitar saltos). */
export function startLoop(step) {
  let raf
  let last = performance.now()
  let stopped = false
  const tick = (t) => {
    if (stopped) return
    const dt = Math.min(0.05, (t - last) / 1000)
    last = t
    step(dt, t)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    stopped = true
    cancelAnimationFrame(raf)
  }
}

export function setupCanvas(canvas, width, height) {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  return ctx
}

/** Pausa automática cuando el usuario cambia de app/pestaña. */
export function useAutoPause(onHide) {
  const ref = useRef(onHide)
  ref.current = onHide
  useEffect(() => {
    const h = () => document.hidden && ref.current()
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])
}

/** Texto pixel en canvas (fuente arcade). */
export function pixelText(ctx, text, x, y, { size = 8, color = PALETTE.w, align = 'center' } = {}) {
  ctx.font = `${size}px "Press Start 2P", monospace`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = PALETTE.k
  ctx.fillText(text, x + 1, y + 1)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
