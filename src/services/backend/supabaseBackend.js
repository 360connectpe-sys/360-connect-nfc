/**
 * BACKEND SUPABASE (PRODUCCIÓN) — ranking compartido real
 * ------------------------------------------------------------------
 * Se activa definiendo VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 * Toda la lógica sensible vive en el SERVIDOR (funciones SQL con
 * SECURITY DEFINER + Row Level Security, ver supabase/migrations/):
 *   - identidad del jugador = usuario anónimo de Supabase Auth (auth.uid())
 *   - validación de puntajes, mejor puntaje semanal, desempates
 *   - cierre de temporadas y generación de códigos de premio
 *   - verificación y canje (solo cuentas del personal)
 * La clave "anon" es pública por diseño; la clave service_role NUNCA
 * se usa en el frontend.
 *
 * ⚠️ Escrito y revisado, pero pendiente de probar contra un proyecto
 * Supabase real (requiere crear la cuenta y ejecutar la migración).
 */
import { createSupabaseTransport } from '../multiplayer/transport'

export function createSupabaseBackend({ restaurant, url, anonKey }) {
  const rid = restaurant.id
  let clientPromise

  const getClient = () =>
    (clientPromise ||= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }),
    ))

  /** Garantiza una sesión (anónima para clientes). */
  async function session() {
    const client = await getClient()
    const { data } = await client.auth.getSession()
    if (!data.session) {
      const { error } = await client.auth.signInAnonymously()
      if (error) throw new Error('No se pudo iniciar la sesión de jugador')
    }
    return client
  }

  async function rpc(fn, args, { anonymous = true } = {}) {
    const client = anonymous ? await session() : await getClient()
    const { data, error } = await client.rpc(fn, args)
    if (error) throw new Error(error.message)
    return data
  }

  const toPlayer = (r) => r && { id: r.id, firstName: r.first_name, lastName: r.last_name, createdAt: r.created_at }
  const toAward = (a) => ({
    code: a.code, season: a.season, gameId: a.game_id, place: a.place, prizeTitle: a.prize_title,
    score: a.score, status: a.status, winnerName: a.winner_name, redeemedAt: a.redeemed_at,
    redeemedBy: a.redeemed_by, expiresAt: a.expires_at,
  })

  return {
    kind: 'supabase',

    async getRestaurantSettings() {
      const client = await getClient()
      const [{ data: r, error }, { data: prizes }] = await Promise.all([
        client.from('restaurants').select('enabled_games').eq('id', rid).single(),
        client.from('prize_config').select('place,title,description,emoji').eq('restaurant_id', rid).order('place'),
      ])
      if (error) throw error
      return { enabledGames: r.enabled_games, prizes: prizes?.length ? prizes : restaurant.prizes }
    },

    async getCurrentPlayer() {
      return toPlayer(await rpc('get_my_player', { p_restaurant: rid }))
    },
    async registerPlayer({ firstName, lastName }) {
      return toPlayer(await rpc('register_player', { p_restaurant: rid, p_first_name: firstName, p_last_name: lastName }))
    },
    async signOutPlayer() {
      const client = await getClient()
      await client.auth.signOut() // la próxima visita crea una identidad anónima nueva
    },

    async startSession(gameId) {
      return { sessionId: await rpc('start_game_session', { p_restaurant: rid, p_game: gameId }) }
    },
    async submitSession(sessionId, { score, stats }) {
      const r = await rpc('submit_game_session', { p_session: sessionId, p_score: score, p_stats: stats })
      return {
        accepted: r.accepted, reason: r.reason, rank: r.rank, seasonBest: r.season_best,
        personalBest: r.personal_best, totalPlayers: r.total_players, isNewBest: r.is_new_best,
      }
    },

    async getLeaderboard(gameId, season = null, limit = 10) {
      const rows = await rpc('get_leaderboard', { p_restaurant: rid, p_game: gameId, p_season: season, p_limit: limit }, { anonymous: false })
      return rows.map((r) => ({
        rank: r.rank, playerId: r.player_id, firstName: r.first_name, lastName: r.last_name, score: r.score, achievedAt: r.achieved_at,
      }))
    },
    async getMyStanding(gameId, season = null) {
      const r = await rpc('get_my_standing', { p_restaurant: rid, p_game: gameId, p_season: season })
      return r && { rank: r.rank, seasonBest: r.season_best, personalBest: r.personal_best, totalPlayers: r.total_players }
    },
    async getSeasonHistory(gameId, limit = 6) {
      return rpc('get_season_history', { p_restaurant: rid, p_game: gameId, p_limit: limit }, { anonymous: false })
    },
    async getMyAwards() {
      return (await rpc('get_my_awards', { p_restaurant: rid })).map(toAward)
    },

    // ---------- Personal (cuentas con email y contraseña creadas por el administrador) ----------
    async staffLogin({ email, password }) {
      const client = await getClient()
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw new Error('Credenciales incorrectas')
      const staff = await rpc('get_staff_profile', { p_restaurant: rid }, { anonymous: false })
      if (!staff) {
        await client.auth.signOut()
        throw new Error('Esta cuenta no pertenece al personal de este restaurante')
      }
      return { name: staff.display_name }
    },
    async getStaff() {
      const client = await getClient()
      const { data } = await client.auth.getSession()
      if (!data.session || data.session.user.is_anonymous) return null
      const staff = await rpc('get_staff_profile', { p_restaurant: rid }, { anonymous: false })
      return staff ? { name: staff.display_name } : null
    },
    async staffLogout() {
      const client = await getClient()
      await client.auth.signOut()
    },
    async verifyPrizeCode(code) {
      const r = await rpc('staff_verify_prize', { p_restaurant: rid, p_code: code }, { anonymous: false })
      return r ? toAward(r) : null
    },
    async redeemPrize(code) {
      const r = await rpc('staff_redeem_prize', { p_restaurant: rid, p_code: code }, { anonymous: false })
      if (r?.error) throw new Error(r.error)
      return toAward(r)
    },
    async listAwards({ season } = {}) {
      return (await rpc('staff_list_awards', { p_restaurant: rid, p_season: season ?? null }, { anonymous: false })).map(toAward)
    },
    async listClosedSeasons() {
      return rpc('list_closed_seasons', { p_restaurant: rid }, { anonymous: false })
    },
    async closeCurrentSeasonDemo() {
      throw new Error('En producción las temporadas se cierran automáticamente cada domingo a las 23:59:59 (pg_cron).')
    },

    async createRoomTransport(roomCode) {
      return createSupabaseTransport(await getClient(), `room:${rid}:${roomCode}`)
    },
  }
}
