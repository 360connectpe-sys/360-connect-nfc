/**
 * Punto de entrada del ranking. La UI SOLO importa desde aquí.
 * Elige el repositorio según la configuración:
 *  - Con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY -> Supabase (compartido)
 *  - Sin ellas -> localStorage (demo, solo este dispositivo)
 * Para Firebase: crear firebaseScoreRepository.js con la misma interfaz.
 */
import { restaurant } from '../../config/restaurant'
import { getWeekKey, getWeekStart } from '../../lib/week'
import { createLocalScoreRepository } from './localScoreRepository'
import { createSupabaseScoreRepository } from './supabaseScoreRepository'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const scoreRepository =
  SUPABASE_URL && SUPABASE_KEY
    ? createSupabaseScoreRepository({ restaurantId: restaurant.id, url: SUPABASE_URL, anonKey: SUPABASE_KEY })
    : createLocalScoreRepository({ restaurantId: restaurant.id })

export const isSharedRanking = scoreRepository.kind !== 'local'

// ---------------------------------------------------------------
// Datos DEMO: siembra jugadores ficticios una vez por semana para
// que el ranking no se vea vacío al mostrar el prototipo.
// ---------------------------------------------------------------
const DEMO_PLAYERS = [
  ['CevicheLover', 'trivia', 1540, '02'],
  ['Rocío_M', 'memoria', 1385, '07'],
  ['ElChino23', 'reflejos', 1260, '04'],
  ['PiscoPower', 'trivia', 1120, '11'],
  ['Valeee', 'memoria', 990, '03'],
  ['AndrésT', 'reflejos', 870, '09'],
  ['LaLuchita', 'trivia', 760, '05'],
  ['GamerLima', 'reflejos', 640, '01'],
  ['Mari.Q', 'memoria', 520, '06'],
]

export async function ensureDemoSeed() {
  if (isSharedRanking) return
  const flag = `360c:seed:${getWeekKey()}`
  if (localStorage.getItem(flag)) return
  localStorage.setItem(flag, '1') // marcar antes para evitar dobles siembras
  const start = getWeekStart().getTime()
  const span = Math.max(1, Date.now() - start)
  for (const [nickname, gameId, score, table] of DEMO_PLAYERS) {
    await scoreRepository.addScore({
      nickname, gameId, score, table, isDemo: true,
      createdAt: new Date(start + Math.random() * span),
    })
  }
}

export async function resetDemoRanking() {
  await scoreRepository.clear()
  Object.keys(localStorage)
    .filter((k) => k.startsWith('360c:seed:'))
    .forEach((k) => localStorage.removeItem(k))
  await ensureDemoSeed()
}
