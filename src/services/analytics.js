/**
 * Analítica (SIMULADA). Cuenta eventos en localStorage para mostrar la idea.
 * En producción: enviar a Supabase / Firebase / Google Analytics para que el
 * restaurante vea visitas por día, secciones más vistas, partidas jugadas…
 */
const KEY = '360c:analytics:v1'

export function track(event, props = {}) {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) || {}
    data[event] = (data[event] || 0) + 1
    localStorage.setItem(KEY, JSON.stringify(data))
    if (import.meta.env.DEV) console.debug('[analytics]', event, props)
  } catch {
    /* sin almacenamiento disponible: ignorar */
  }
}

export function getAnalytics() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}
