import { ALL_GAME_IDS } from '../games/catalog'

/**
 * Reglas de configuración por restaurante:
 *  - Demo (isDemo: true): puede activar cualquiera de los 7 juegos.
 *  - Restaurante real: EXACTAMENTE 4 juegos del catálogo, sin repetir.
 * La misma regla se aplica en la base de datos (supabase/migrations).
 */
export function validateRestaurantConfig(config) {
  const errors = []
  const games = config.enabledGames ?? []
  const unknown = games.filter((g) => !ALL_GAME_IDS.includes(g))
  if (unknown.length) errors.push(`Juegos desconocidos: ${unknown.join(', ')}`)
  if (new Set(games).size !== games.length) errors.push('Hay juegos repetidos en enabledGames')
  if (!config.isDemo && games.length !== 4) errors.push(`Un restaurante real debe activar exactamente 4 juegos (tiene ${games.length})`)
  if (!config.id || !/^[a-z0-9-]{3,40}$/.test(config.id)) errors.push('id de restaurante inválido')
  return errors
}

/** Lista final de juegos activos (si la configuración es inválida, se usa la parte válida). */
export function resolveEnabledGames(config) {
  const errors = validateRestaurantConfig(config)
  if (errors.length) console.error('[360 CONNECT] Configuración inválida:', errors)
  const valid = [...new Set(config.enabledGames ?? [])].filter((g) => ALL_GAME_IDS.includes(g))
  return config.isDemo ? valid : valid.slice(0, 4)
}
