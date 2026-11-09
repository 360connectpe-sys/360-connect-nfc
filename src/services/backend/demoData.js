/**
 * DATOS DE DEMOSTRACIÓN (solo modo local).
 * Jugadores ficticios con puntajes de la semana actual y de 3 semanas
 * anteriores, para que el ranking y el historial de ganadores no se vean
 * vacíos al presentar el prototipo. Generados con semilla fija.
 */
import { mulberry32, shuffle } from '../../lib/rng'
import { seasonStart, shiftSeason } from '../../lib/season'

const PEOPLE = [
  ['Lucía', 'Ramírez'], ['Diego', 'Fernández'], ['Valeria', 'Quispe'], ['Andrés', 'Torres'],
  ['Camila', 'Huamán'], ['Mateo', 'Rojas'], ['Rosa', 'Mamani'], ['Jorge', 'Castillo'],
  ['Sofía', 'Vargas'], ['Luis', 'Chávez'], ['Fiorella', 'Paredes'], ['Renzo', 'Gutiérrez'],
]

const RANGES = {
  memoria: [2600, 4700, 10],
  'chef-frenetico': [2500, 7500, 50],
  'carrera-chef': [1800, 5200, 5],
}

export function buildDemoData(currentSeason, rankedGames, now = Date.now()) {
  const rand = mulberry32(360)
  const players = {}
  PEOPLE.forEach(([firstName, lastName], i) => {
    const id = `demo-${i + 1}`
    players[id] = { id, firstName, lastName, createdAt: new Date(now - 30 * 86400000).toISOString(), demo: true }
  })
  const ids = Object.keys(players)
  const bests = []
  for (let weeksAgo = 0; weeksAgo <= 3; weeksAgo++) {
    const season = shiftSeason(currentSeason, -weeksAgo)
    const start = seasonStart(season).getTime()
    const span = Math.max(60000, Math.min(7 * 86400000, now - start) - 60000)
    for (const gameId of rankedGames) {
      const [min, max, step] = RANGES[gameId]
      const count = weeksAgo === 0 ? 8 : 6
      for (const playerId of shuffle(ids, rand).slice(0, count)) {
        const score = Math.round((min + rand() * (max - min)) / step) * step
        bests.push({
          season, gameId, playerId, score,
          achievedAt: new Date(start + rand() * span).toISOString(),
          sessionId: `demo-${season}-${gameId}-${playerId}`,
        })
      }
    }
  }
  return { players, bests }
}
