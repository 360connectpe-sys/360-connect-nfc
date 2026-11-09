/**
 * Repositorio de puntuaciones con SUPABASE (ranking compartido real).
 * ------------------------------------------------------------------
 * PREPARADO PERO NO ACTIVO: se activa automáticamente si defines
 * VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env
 * (ver .env.example y README). Usa la API REST de Supabase con fetch,
 * así que no requiere instalar librerías adicionales.
 *
 * SQL para crear la tabla en Supabase (SQL Editor):
 *
 *   create table public.scores (
 *     id uuid primary key default gen_random_uuid(),
 *     restaurant_id text not null,
 *     nickname text not null check (char_length(nickname) between 2 and 16),
 *     game_id text not null,
 *     score integer not null check (score >= 0 and score < 100000),
 *     table_number text,
 *     meta jsonb default '{}'::jsonb,
 *     week_key text not null,
 *     created_at timestamptz not null default now()
 *   );
 *   create index on public.scores (restaurant_id, week_key, score desc);
 *   alter table public.scores enable row level security;
 *   create policy "lectura publica" on public.scores for select using (true);
 *   create policy "insertar publico" on public.scores for insert with check (true);
 *
 * Nota de seguridad: con inserción pública un usuario avanzado podría enviar
 * puntajes falsos. Para producción, validar en una Edge Function.
 */
import { getWeekKey } from '../../lib/week'
import { bestPerPlayer } from './utils'

export function createSupabaseScoreRepository({ restaurantId, url, anonKey }) {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/scores`
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  }
  const toEntry = (r) => ({
    id: r.id,
    restaurantId: r.restaurant_id,
    nickname: r.nickname,
    gameId: r.game_id,
    score: r.score,
    table: r.table_number,
    meta: r.meta,
    createdAt: r.created_at,
    weekKey: r.week_key,
  })

  return {
    kind: 'supabase',

    async addScore({ nickname, gameId, score, table, meta = {} }) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          nickname: nickname.trim(),
          game_id: gameId,
          score: Math.max(0, Math.round(score)),
          table_number: table,
          meta,
          week_key: getWeekKey(),
        }),
      })
      if (!res.ok) throw new Error(`Supabase: ${res.status}`)
      const [row] = await res.json()
      return toEntry(row)
    },

    async getLeaderboard({ gameId = 'all', weekKey = getWeekKey(), limit = 10, uniquePlayers = true } = {}) {
      const params = new URLSearchParams({
        select: '*',
        restaurant_id: `eq.${restaurantId}`,
        week_key: `eq.${weekKey}`,
        order: 'score.desc,created_at.asc',
        limit: String(uniquePlayers ? 300 : limit),
      })
      if (gameId !== 'all') params.set('game_id', `eq.${gameId}`)
      const res = await fetch(`${endpoint}?${params}`, { headers })
      if (!res.ok) throw new Error(`Supabase: ${res.status}`)
      let rows = (await res.json()).map(toEntry)
      if (uniquePlayers) rows = bestPerPlayer(rows)
      return rows.slice(0, limit)
    },

    async clear() {
      throw new Error('El borrado se hace desde el panel administrativo.')
    },
  }
}
