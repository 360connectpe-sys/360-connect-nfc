// Utilidades de fechas para el ranking semanal (semana de lunes a domingo, hora local).

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // lunes = 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

export function getWeekEnd(date = new Date()) {
  const end = getWeekStart(date)
  end.setDate(end.getDate() + 7)
  return end
}

/** Clave estable de la semana, ej. "2026-11-09" (fecha del lunes). */
export function getWeekKey(date = new Date()) {
  const s = getWeekStart(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`
}

export function timeUntilReset(now = new Date()) {
  const ms = getWeekEnd(now) - now
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return { d, h, m }
}

const dateFmt = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
})
export const formatDate = (iso) => dateFmt.format(new Date(iso))

const rangeFmt = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })
export function weekRangeLabel(now = new Date()) {
  const s = getWeekStart(now)
  const e = new Date(getWeekEnd(now) - 1)
  return `${rangeFmt.format(s)} – ${rangeFmt.format(e)}`
}
