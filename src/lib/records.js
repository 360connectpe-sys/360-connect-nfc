/**
 * Récords personales locales (juegos sin ranking de premios).
 * Se guardan por jugador en este dispositivo.
 */
const key = (playerId) => `360c:records:${playerId || 'anon'}`

export function getRecord(playerId, gameId) {
  try {
    return JSON.parse(localStorage.getItem(key(playerId)))?.[gameId] ?? 0
  } catch {
    return 0
  }
}

/** Guarda si supera el récord. Devuelve { best, isNewBest }. */
export function saveRecord(playerId, gameId, score) {
  const prev = getRecord(playerId, gameId)
  if (score > prev) {
    let all = {}
    try {
      all = JSON.parse(localStorage.getItem(key(playerId))) || {}
    } catch {
      /* ignorar */
    }
    localStorage.setItem(key(playerId), JSON.stringify({ ...all, [gameId]: score }))
    return { best: score, isNewBest: prev > 0 || score > 0 }
  }
  return { best: prev, isNewBest: false }
}
