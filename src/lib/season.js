/**
 * TEMPORADAS SEMANALES — zona horaria America/Lima
 * ------------------------------------------------------------
 * Lunes 00:00:00 → domingo 23:59:59 (hora de Lima), sin importar
 * la zona horaria configurada en el celular del cliente.
 * Perú usa UTC-5 todo el año (sin horario de verano), así que el
 * cálculo con desplazamiento fijo es exacto.
 * La "clave" de temporada es la fecha del lunes: "2026-11-09".
 */
export const LIMA_TZ = 'America/Lima'
const LIMA_OFFSET_MS = -5 * 3600 * 1000
const DAY = 86400000
const pad = (n) => String(n).padStart(2, '0')

export function seasonKey(date = new Date()) {
  const lima = new Date(date.getTime() + LIMA_OFFSET_MS)
  const dow = (lima.getUTCDay() + 6) % 7 // lunes = 0
  const monday = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate() - dow))
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`
}

/** Instante real (Date) del lunes 00:00 de Lima. */
export function seasonStart(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - LIMA_OFFSET_MS)
}

/** Domingo 23:59:59 de Lima. */
export function seasonEnd(key) {
  return new Date(seasonStart(key).getTime() + 7 * DAY - 1000)
}

export function shiftSeason(key, weeks) {
  return seasonKey(new Date(seasonStart(key).getTime() + weeks * 7 * DAY + 3600 * 1000))
}

export function timeLeft(now = new Date()) {
  const ms = Math.max(0, seasonEnd(seasonKey(now)).getTime() + 1000 - now.getTime())
  return {
    ms,
    d: Math.floor(ms / DAY),
    h: Math.floor((ms % DAY) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  }
}

const dayFmt = new Intl.DateTimeFormat('es-PE', { timeZone: LIMA_TZ, day: 'numeric', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('es-PE', {
  timeZone: LIMA_TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
})

export const seasonLabel = (key) => `${dayFmt.format(seasonStart(key))} – ${dayFmt.format(seasonEnd(key))}`
export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso))
