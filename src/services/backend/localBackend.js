/**
 * BACKEND LOCAL (MODO DEMOSTRACIÓN)
 * ------------------------------------------------------------------
 * Implementa la MISMA interfaz que supabaseBackend, pero guardando todo
 * en localStorage del celular. Sirve para probar los flujos completos
 * (registro, sesiones de juego, validación, ranking, cierre de temporada,
 * códigos de premio y canje) sin servidor.
 *
 * ⚠️ NO es un ranking compartido: cada celular ve solo sus propias
 * partidas + jugadores de ejemplo. Y como todo corre en el navegador,
 * un usuario técnico podría alterar sus datos. El ranking oficial y
 * los premios reales requieren el backend Supabase (validación en servidor).
 */
import { RANKED_GAME_IDS } from '../../games/catalog'
import { resolveEnabledGames } from '../../config/validateConfig'
import { seasonEnd, seasonKey, shiftSeason } from '../../lib/season'
import { buildDemoData } from './demoData'
import { makePrizeCode, maskCode, newId, normalizeCode } from './ids'
import { normalizeName, validateSubmission } from './validation'
import { createLocalTransport } from '../multiplayer/transport'

const DEMO_STAFF_PIN = '2580'
const SEED_VERSION = 'v2'

export function createLocalBackend({ restaurant }) {
  const rid = restaurant.id
  const K = (k) => `360c:${rid}:${k}`
  const read = (k, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(K(k))) ?? fallback
    } catch {
      return fallback
    }
  }
  const write = (k, v) => localStorage.setItem(K(k), JSON.stringify(v))
  const enabledRanked = () => resolveEnabledGames(restaurant).filter((g) => RANKED_GAME_IDS.includes(g))

  // ---------- semilla demo + cierre automático de temporadas pasadas ----------
  function ensureSeed() {
    if (read('seed', null) === SEED_VERSION) return
    const { players, bests } = buildDemoData(seasonKey(), RANKED_GAME_IDS)
    write('players', { ...read('players', {}), ...players })
    write('bests', [...read('bests', []).filter((b) => !b.sessionId.startsWith('demo-')), ...bests])
    write('awards', read('awards', []).filter((a) => !a.demo))
    write('closed', [])
    write('seed', SEED_VERSION)
    autoClose()
    // Demo: los premios de hace 2 y 3 semanas ya fueron entregados.
    const old = shiftSeason(seasonKey(), -2)
    write('awards', read('awards', []).map((a) =>
      a.season <= old ? { ...a, demo: true, status: 'redeemed', redeemedAt: seasonEnd(a.season).toISOString(), redeemedBy: 'Personal Casa Nativa' } : { ...a, demo: true },
    ))
  }

  function autoClose() {
    const current = seasonKey()
    const pending = [...new Set(read('bests', []).map((b) => b.season))].filter((s) => s < current && !read('closed', []).includes(s))
    pending.sort().forEach((s) => closeSeason(s))
  }

  const rankRows = (season, gameId) =>
    read('bests', [])
      .filter((b) => b.season === season && b.gameId === gameId)
      .sort((a, b) => b.score - a.score || a.achievedAt.localeCompare(b.achievedAt))

  const withNames = (rows) => {
    const ps = read('players', {})
    return rows.map((r, i) => ({
      rank: i + 1,
      playerId: r.playerId,
      firstName: ps[r.playerId]?.firstName ?? 'Jugador',
      lastName: ps[r.playerId]?.lastName ?? '',
      score: r.score,
      achievedAt: r.achievedAt,
    }))
  }

  function closeSeason(season) {
    const closed = read('closed', [])
    if (closed.includes(season)) throw new Error('Esa temporada ya fue cerrada')
    const expiresAt = new Date(seasonEnd(season).getTime() + restaurant.prizeValidityDays * 86400000).toISOString()
    const fresh = []
    for (const gameId of enabledRanked()) {
      rankRows(season, gameId)
        .slice(0, restaurant.prizes.length)
        .forEach((row, i) => {
          fresh.push({
            id: newId(), code: makePrizeCode(restaurant.initials), season, gameId, place: i + 1,
            playerId: row.playerId, score: row.score, prizeTitle: restaurant.prizes[i].title,
            status: 'pending', createdAt: new Date().toISOString(), expiresAt,
          })
        })
    }
    write('awards', [...read('awards', []), ...fresh])
    write('closed', [...closed, season])
    return fresh.length
  }

  const currentPlayerId = () => localStorage.getItem(K('playerId'))
  const requirePlayer = () => {
    const id = currentPlayerId()
    if (!id || !read('players', {})[id]) throw new Error('Primero regístrate para jugar')
    return id
  }
  const requireStaff = () => {
    if (sessionStorage.getItem(K('staff')) !== '1') throw new Error('Acceso solo para el personal')
  }
  const awardView = (a, { revealCode = false } = {}) => {
    const p = read('players', {})[a.playerId]
    const expired = a.status === 'pending' && new Date(a.expiresAt) < new Date()
    return {
      code: revealCode ? a.code : maskCode(a.code), season: a.season, gameId: a.gameId, place: a.place,
      prizeTitle: a.prizeTitle, score: a.score, status: expired ? 'expired' : a.status,
      winnerName: p ? `${p.firstName} ${p.lastName}` : 'Jugador', redeemedAt: a.redeemedAt, redeemedBy: a.redeemedBy,
      expiresAt: a.expiresAt,
    }
  }

  ensureSeed()
  autoClose()

  function myStanding(gameId, season = seasonKey()) {
    const id = currentPlayerId()
    if (!id) return null
    const rows = rankRows(season, gameId)
    const idx = rows.findIndex((r) => r.playerId === id)
    const allTime = read('bests', []).filter((b) => b.gameId === gameId && b.playerId === id).map((b) => b.score)
    return {
      rank: idx >= 0 ? idx + 1 : null,
      seasonBest: idx >= 0 ? rows[idx].score : null,
      personalBest: allTime.length ? Math.max(...allTime) : null,
      totalPlayers: rows.length,
    }
  }


  return {
    kind: 'local',

    async getRestaurantSettings() {
      return { enabledGames: resolveEnabledGames(restaurant), prizes: restaurant.prizes }
    },

    // ---------- Jugadores ----------
    async getCurrentPlayer() {
      const id = currentPlayerId()
      return (id && read('players', {})[id]) || null
    },

    async registerPlayer({ firstName, lastName }) {
      const f = normalizeName(firstName)
      const l = normalizeName(lastName)
      if (!f || !l) throw new Error('Escribe un nombre y apellido válidos (solo letras, 2 a 30 caracteres).')
      // Identificador interno único: dos personas con el mismo nombre son jugadores distintos.
      const player = { id: newId(), firstName: f, lastName: l, createdAt: new Date().toISOString() }
      write('players', { ...read('players', {}), [player.id]: player })
      localStorage.setItem(K('playerId'), player.id)
      return player
    },

    async signOutPlayer() {
      localStorage.removeItem(K('playerId'))
    },

    // ---------- Sesiones de juego (ranking) ----------
    async startSession(gameId) {
      const playerId = requirePlayer()
      if (!enabledRanked().includes(gameId)) throw new Error('Este juego no participa en el ranking')
      const sessions = read('sessions', {})
      const dayAgo = Date.now() - 86400000
      for (const [id, s] of Object.entries(sessions)) if (s.startedAt < dayAgo) delete sessions[id]
      const sessionId = newId()
      sessions[sessionId] = { gameId, playerId, startedAt: Date.now(), status: 'started' }
      write('sessions', sessions)
      return { sessionId }
    },

    async submitSession(sessionId, { score, stats }) {
      const playerId = requirePlayer()
      const sessions = read('sessions', {})
      const s = sessions[sessionId]
      if (!s || s.playerId !== playerId) return { accepted: false, reason: 'Sesión de juego inválida' }
      if (s.status !== 'started') return { accepted: false, reason: 'Esta partida ya fue registrada' }
      const elapsed = (Date.now() - s.startedAt) / 1000
      const v = validateSubmission(s.gameId, { score, stats }, elapsed)
      s.status = v.ok ? 'accepted' : 'rejected'
      write('sessions', sessions)
      if (!v.ok) return { accepted: false, reason: v.reason }

      const season = seasonKey()
      const bests = read('bests', [])
      const prev = bests.find((b) => b.season === season && b.gameId === s.gameId && b.playerId === playerId)
      const allTimeBefore = Math.max(0, ...bests.filter((b) => b.gameId === s.gameId && b.playerId === playerId).map((b) => b.score))
      if (!prev) bests.push({ season, gameId: s.gameId, playerId, score, achievedAt: new Date().toISOString(), sessionId })
      else if (score > prev.score) Object.assign(prev, { score, achievedAt: new Date().toISOString(), sessionId })
      // Empate o menor: se conserva el registro anterior (gana quien lo logró primero).
      write('bests', bests)
      const standing = myStanding(s.gameId)
      return { accepted: true, ...standing, isNewBest: score > allTimeBefore && score > 0 }
    },

    // ---------- Ranking ----------
    async getLeaderboard(gameId, season = seasonKey(), limit = 10) {
      return withNames(rankRows(season, gameId)).slice(0, limit)
    },

    async getMyStanding(gameId, season = seasonKey()) {
      return myStanding(gameId, season)
    },

    async getSeasonHistory(gameId, limit = 6) {
      const awards = read('awards', [])
      return read('closed', [])
        .slice()
        .sort()
        .reverse()
        .slice(0, limit)
        .map((season) => ({
          season,
          winners: awards
            .filter((a) => a.season === season && a.gameId === gameId)
            .sort((a, b) => a.place - b.place)
            .map((a) => ({ place: a.place, score: a.score, name: awardView(a).winnerName })),
        }))
    },

    async getMyAwards() {
      const id = currentPlayerId()
      if (!id) return []
      return read('awards', [])
        .filter((a) => a.playerId === id)
        .sort((a, b) => b.season.localeCompare(a.season) || a.place - b.place)
        .map((a) => awardView(a, { revealCode: true }))
    },

    // ---------- Personal del restaurante (DEMO: PIN local) ----------
    demoStaffPin: DEMO_STAFF_PIN,

    async staffLogin({ pin }) {
      if (pin !== DEMO_STAFF_PIN) throw new Error('PIN incorrecto')
      sessionStorage.setItem(K('staff'), '1')
      return { name: 'Personal (demo)' }
    },
    async getStaff() {
      return sessionStorage.getItem(K('staff')) === '1' ? { name: 'Personal (demo)' } : null
    },
    async staffLogout() {
      sessionStorage.removeItem(K('staff'))
    },

    async verifyPrizeCode(rawCode) {
      requireStaff()
      const code = normalizeCode(rawCode)
      const award = read('awards', []).find((a) => a.code === code)
      if (!award) return null
      return awardView(award, { revealCode: true })
    },

    async redeemPrize(rawCode, { staffName = 'Personal' } = {}) {
      requireStaff()
      const code = normalizeCode(rawCode)
      const awards = read('awards', [])
      const award = awards.find((a) => a.code === code)
      if (!award) throw new Error('Código no encontrado')
      if (award.status === 'redeemed') throw new Error(`Este premio ya fue entregado (${new Date(award.redeemedAt).toLocaleString('es-PE')})`)
      if (new Date(award.expiresAt) < new Date()) throw new Error('El código venció')
      award.status = 'redeemed'
      award.redeemedAt = new Date().toISOString()
      award.redeemedBy = staffName
      write('awards', awards)
      return awardView(award, { revealCode: true })
    },

    async listAwards({ season } = {}) {
      requireStaff()
      return read('awards', [])
        .filter((a) => !season || a.season === season)
        .sort((a, b) => b.season.localeCompare(a.season) || a.gameId.localeCompare(b.gameId) || a.place - b.place)
        .map((a) => awardView(a))
    },

    async listClosedSeasons() {
      return read('closed', []).slice().sort().reverse()
    },

    /** DEMO: cierra la temporada en curso para probar códigos y canje sin esperar al domingo. */
    async closeCurrentSeasonDemo() {
      requireStaff()
      return closeSeason(seasonKey())
    },

    async resetDemo() {
      Object.keys(localStorage).filter((k) => k.startsWith(`360c:${rid}:`)).forEach((k) => localStorage.removeItem(k))
      ensureSeed()
    },

    // ---------- Multijugador ----------
    async createRoomTransport(roomCode) {
      return createLocalTransport(`360c:${rid}:room:${roomCode}`)
    },
  }
}
