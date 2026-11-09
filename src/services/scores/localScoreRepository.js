/**
 * Repositorio de puntuaciones basado en localStorage.
 *
 * ⚠️ LIMITACIÓN: localStorage vive DENTRO de cada navegador/celular.
 * El ranking que ve un cliente solo contiene las partidas jugadas en
 * SU propio teléfono (más los datos demo). No se comparte entre mesas
 * ni entre clientes. Para un ranking real usar supabaseScoreRepository.
 *
 * Todos los repositorios exponen la MISMA interfaz (async), así que
 * cambiar de localStorage a Supabase/Firebase no requiere tocar la UI:
 *   addScore({ nickname, gameId, score, table, meta }) -> entry
 *   getLeaderboard({ gameId = 'all', weekKey, limit, uniquePlayers }) -> entry[]
 *   clear()
 */
import { getWeekKey } from '../../lib/week'
import { bestPerPlayer, newId } from './utils'

const STORAGE_KEY = '360c:scores:v1'
const MAX_ENTRIES = 1000

export function createLocalScoreRepository({ restaurantId }) {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  }
  const write = (list) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)))

  return {
    kind: 'local',

    async addScore({ nickname, gameId, score, table, meta = {}, createdAt, isDemo = false }) {
      const date = createdAt ? new Date(createdAt) : new Date()
      const entry = {
        id: newId(),
        restaurantId,
        nickname: nickname.trim(),
        gameId,
        score: Math.max(0, Math.round(score)),
        table,
        meta,
        isDemo,
        createdAt: date.toISOString(),
        weekKey: getWeekKey(date),
      }
      const list = read()
      list.push(entry)
      write(list)
      return entry
    },

    async getLeaderboard({ gameId = 'all', weekKey = getWeekKey(), limit = 10, uniquePlayers = true } = {}) {
      let rows = read().filter(
        (e) =>
          e.restaurantId === restaurantId &&
          e.weekKey === weekKey &&
          (gameId === 'all' || e.gameId === gameId),
      )
      rows.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
      if (uniquePlayers) rows = bestPerPlayer(rows)
      return rows.slice(0, limit)
    },

    async clear() {
      localStorage.removeItem(STORAGE_KEY)
    },
  }
}
