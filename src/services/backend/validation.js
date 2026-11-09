/**
 * REGLAS DE PUNTUACIÓN Y VALIDACIÓN (fuente única)
 * ------------------------------------------------------------------
 * Los juegos calculan el puntaje con estas funciones y el backend las
 * vuelve a ejecutar sobre las ESTADÍSTICAS de la partida: si el puntaje
 * enviado no coincide con el recalculado, o las estadísticas son
 * imposibles para el tiempo transcurrido, la partida se rechaza.
 * Las mismas reglas están replicadas en SQL (supabase/migrations/001_init.sql,
 * función validate_submission) que es la que decide en producción.
 */

// ---------- Memoria gastronómica ----------
export const MEMORY_PAIRS = 8
export const MEMORY_TIME_LIMIT = 180

/** Base 5 000 − 150 por error − 30 por segundo + bono si termina en menos de 45 s. Nunca negativo. */
export function memoryScore({ errors, seconds }) {
  const bonus = seconds < 45 ? (45 - seconds) * 20 : 0
  return Math.max(0, Math.round(5000 - errors * 150 - seconds * 30 + bonus))
}

// ---------- Chef Frenético ----------
export const CHEF_DURATION = 45
export const CHEF_MAX_CATCHES = 150

/** Multiplicador vigente según aciertos consecutivos desde el último error: x1, x2 (tras 1 pedido), x3 (tras 2). */
export const chefMultiplier = (streak) => Math.min(3, 1 + Math.floor(streak / 3))

/**
 * log: 'c' = ingrediente correcto, 'x' = incorrecto. El puntaje se
 * deriva SOLO del log: correcto = 100 × multiplicador; incorrecto = −50 (mínimo 0).
 */
export function chefScoreFromLog(log) {
  let score = 0
  let streak = 0
  for (const ch of log) {
    if (ch === 'c') {
      score += 100 * chefMultiplier(streak)
      streak += 1
    } else {
      score = Math.max(0, score - 50)
      streak = 0
    }
  }
  return score
}

// ---------- Carrera del Chef ----------
export const RUNNER = { maxSeconds: 60, maxSpeed: 170, pxPerMeter: 10 }
export const runnerScore = ({ meters, coins, ingredients }) => meters * 5 + coins * 50 + ingredients * 100

// ---------- Validación ----------
const isInt = (v, min = 0, max = 1e9) => Number.isInteger(v) && v >= min && v <= max

/**
 * @param {string} gameId
 * @param {{score:number, stats:object}} submission
 * @param {number} elapsedSec  segundos entre el inicio de la sesión (servidor) y el envío
 * @returns {{ok:true}|{ok:false, reason:string}}
 */
export function validateSubmission(gameId, { score, stats }, elapsedSec) {
  const fail = (reason) => ({ ok: false, reason })
  if (!isInt(score, 0, 100000)) return fail('Puntaje fuera de rango')
  if (!stats || typeof stats !== 'object') return fail('Faltan estadísticas de la partida')

  switch (gameId) {
    case 'memoria': {
      const { pairs, moves, errors, seconds } = stats
      if (pairs !== MEMORY_PAIRS) return fail('Partida incompleta')
      if (!isInt(errors, 0, 500) || moves !== MEMORY_PAIRS + errors) return fail('Movimientos inconsistentes')
      if (!isInt(seconds, 6, MEMORY_TIME_LIMIT)) return fail('Tiempo inválido')
      if (elapsedSec < seconds - 2 || elapsedSec > seconds + 300) return fail('Duración no coincide con la sesión')
      if (score !== memoryScore({ errors, seconds })) return fail('El puntaje no coincide')
      return { ok: true }
    }
    case 'chef-frenetico': {
      const { log } = stats
      if (typeof log !== 'string' || !/^[cx]*$/.test(log) || log.length > CHEF_MAX_CATCHES) return fail('Registro de jugadas inválido')
      if (elapsedSec < CHEF_DURATION - 1 || elapsedSec > CHEF_DURATION + 300) return fail('Duración no coincide con la sesión')
      if (score !== chefScoreFromLog(log)) return fail('El puntaje no coincide')
      return { ok: true }
    }
    case 'carrera-chef': {
      const { seconds, meters, coins, ingredients } = stats
      if (!isInt(seconds, 1, RUNNER.maxSeconds + 1)) return fail('Tiempo inválido')
      const maxMeters = Math.ceil((seconds * RUNNER.maxSpeed) / RUNNER.pxPerMeter) + 5
      if (!isInt(meters, 0, maxMeters)) return fail('Distancia imposible')
      if (!isInt(coins, 0, seconds * 4) || !isInt(ingredients, 0, seconds)) return fail('Objetos imposibles')
      if (elapsedSec < seconds - 2 || elapsedSec > seconds + 900) return fail('Duración no coincide con la sesión')
      if (score !== runnerScore({ meters, coins, ingredients })) return fail('El puntaje no coincide')
      return { ok: true }
    }
    default:
      return fail('Este juego no participa en el ranking')
  }
}

// ---------- Nombres ----------
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,30}$/

export function normalizeName(raw) {
  const clean = String(raw ?? '').replace(/\s+/g, ' ').trim()
  if (!NAME_RE.test(clean)) return null
  return clean
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase())
}
