// Efectos de sonido arcade generados con Web Audio (sin archivos = carga instantánea).
let ctx
let muted = localStorage.getItem('360c:muted') === '1'

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  localStorage.setItem('360c:muted', v ? '1' : '0')
}

function beep(freq = 660, dur = 0.08, type = 'square', vol = 0.04) {
  if (muted) return
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + dur)
  } catch {
    /* audio no disponible */
  }
}

export const sfx = {
  tap: () => beep(520, 0.05),
  good: () => {
    beep(660, 0.06)
    setTimeout(() => beep(990, 0.08), 60)
  },
  gold: () => [784, 988, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.07), i * 60)),
  bad: () => beep(150, 0.2, 'sawtooth', 0.05),
  count: () => beep(440, 0.1),
  go: () => beep(880, 0.18),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 110)),
}

export const vibrate = (pattern) => navigator.vibrate?.(pattern)
