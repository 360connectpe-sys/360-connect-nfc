import { useEffect, useMemo, useState } from 'react'
import { History, Info, Timer } from 'lucide-react'
import { fullName, useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import Sprite from '../games/engine/Sprite'
import { RANKED_GAME_IDS, getGame } from '../games/catalog'
import { backend, isSharedBackend } from '../services/backend'
import { formatDateTime, seasonKey, seasonLabel, timeLeft } from '../lib/season'

const medal = ['🥇', '🥈', '🥉']

function useCountdown() {
  const [left, setLeft] = useState(timeLeft())
  useEffect(() => {
    const t = setInterval(() => setLeft(timeLeft()), 1000)
    return () => clearInterval(t)
  }, [])
  return left
}

export default function Ranking() {
  const { route, navigate, player, settings } = useApp()
  const ranked = useMemo(() => RANKED_GAME_IDS.filter((id) => settings.enabledGames.includes(id)), [settings.enabledGames])
  const requested = route.split('/')[1]
  const gameId = ranked.includes(requested) ? requested : ranked[0]
  const game = getGame(gameId)
  const [rows, setRows] = useState(null)
  const [mine, setMine] = useState(null)
  const [history, setHistory] = useState([])
  const left = useCountdown()
  const season = seasonKey()

  useEffect(() => {
    if (!gameId) return
    setRows(null)
    let alive = true
    Promise.all([
      backend.getLeaderboard(gameId, season, 10),
      player ? backend.getMyStanding(gameId, season) : null,
      backend.getSeasonHistory(gameId, 5),
    ])
      .then(([r, m, h]) => {
        if (!alive) return
        setRows(r)
        setMine(m)
        setHistory(h)
      })
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [gameId, season, player])

  if (!gameId) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader title="Ranking semanal" back="" />
        <p className="px-6 py-16 text-center text-cocoa/70">Este restaurante no tiene juegos con ranking activos.</p>
      </div>
    )
  }

  const isMe = (r) => player && r.playerId === player.id
  const podium = [rows?.[1], rows?.[0], rows?.[2]]

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="🏆 Ranking semanal" subtitle={`Temporada ${seasonLabel(season)} · hora de Lima`} back="" />

      <div className="mx-4 flex items-center gap-2 rounded-2xl bg-espresso px-4 py-3 text-cream">
        <Timer className="size-4 text-gold" />
        <p className="text-sm">
          Termina en{' '}
          <strong className="text-gold tabular-nums" data-testid="season-countdown">
            {left.d}d {String(left.h).padStart(2, '0')}h {String(left.m).padStart(2, '0')}m {String(left.s).padStart(2, '0')}s
          </strong>
        </p>
      </div>

      {/* Un ranking independiente por juego */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4" role="tablist">
        {ranked.map((id) => {
          const g = getGame(id)
          return (
            <button
              key={id}
              role="tab"
              aria-selected={id === gameId}
              onClick={() => navigate(`ranking/${id}`)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                id === gameId ? 'bg-terra text-cream' : 'bg-white text-cocoa ring-1 ring-latte/70'
              }`}
            >
              <Sprite name={g.sprite} size={18} /> {g.name}
            </button>
          )
        })}
      </div>

      {/* Mi posición */}
      {player && mine && (
        <div className="mx-4 mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-latte/50">
          <div>
            <p className="text-[11px] text-cocoa/60">Tu posición</p>
            <p className="font-display text-xl font-bold text-terra">{mine.rank ? `#${mine.rank}` : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-cocoa/60">Mejor semanal</p>
            <p className="font-display text-xl font-bold">{mine.seasonBest ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-cocoa/60">Récord personal</p>
            <p className="font-display text-xl font-bold">{mine.personalBest ?? '—'}</p>
          </div>
        </div>
      )}

      {rows === null ? (
        <p className="py-16 text-center text-sm text-cocoa/60">Cargando ranking…</p>
      ) : rows.length === 0 ? (
        <div className="mx-4 mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <Sprite name={game.sprite} size={48} className="mx-auto" />
          <p className="mt-3 font-bold">Aún no hay puntajes esta semana</p>
          <button onClick={() => navigate(`juegos/${gameId}`)} className="mt-4 rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-cream">
            ¡Sé el primero!
          </button>
        </div>
      ) : (
        <>
          <div key={gameId} className="mt-7 grid grid-cols-3 items-end gap-2 px-4">
            {podium.map((r, idx) => {
              const place = [2, 1, 3][idx]
              const h = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }[place]
              return (
                <div key={place} className="flex animate-fade-up flex-col items-center text-center" style={{ animationDelay: `${idx * 80}ms` }}>
                  {r ? (
                    <>
                      <span className={place === 1 ? 'text-4xl' : 'text-3xl'}>{medal[place - 1]}</span>
                      <p className={`mt-1 w-full text-sm leading-tight font-extrabold ${isMe(r) ? 'text-terra' : ''}`}>
                        {r.firstName}
                        <br />
                        <span className="font-semibold">{r.lastName}</span>
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-cocoa/70">{r.score} pts</p>
                    </>
                  ) : (
                    <p className="text-xs text-cocoa/40">Libre</p>
                  )}
                  <div
                    className={`mt-2 grid w-full place-items-center rounded-t-2xl font-display text-3xl font-bold ${h} ${
                      place === 1 ? 'bg-linear-to-b from-gold to-[#c98b22] text-espresso' : place === 2 ? 'bg-latte text-cocoa' : 'bg-[#d9a27c] text-cocoa'
                    }`}
                  >
                    {place}
                  </div>
                </div>
              )
            })}
          </div>

          <h3 className="mx-4 mt-6 mb-2 text-sm font-bold text-cocoa/70">Top 10 · {game.name}</h3>
          <ol className="mx-4 divide-y divide-latte/50 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-latte/50" data-testid="top10">
            {rows.map((r) => (
              <li key={r.playerId} className={`flex items-center gap-3 px-4 py-3 ${isMe(r) ? 'bg-terra/10' : ''}`}>
                <span className={`w-6 text-center font-display text-lg font-bold ${r.rank <= 3 ? 'text-terra' : 'text-cocoa/50'}`}>{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {r.firstName} {r.lastName}
                    {isMe(r) && <span className="ml-1.5 rounded-full bg-terra px-1.5 py-0.5 text-[9px] text-cream">TÚ</span>}
                  </p>
                  <p className="text-[11px] text-cocoa/55">{formatDateTime(r.achievedAt)}</p>
                </div>
                <span className="font-extrabold tabular-nums">{r.score}</span>
              </li>
            ))}
          </ol>
          {player && mine && !mine.rank && (
            <p className="mx-4 mt-3 text-center text-sm text-cocoa/70">
              {fullName(player)}, aún no juegas {game.name} esta semana.{' '}
              <button onClick={() => navigate(`juegos/${gameId}`)} className="font-bold text-terra underline">Jugar ahora</button>
            </p>
          )}
        </>
      )}

      {/* Historial de ganadores */}
      <section className="mx-4 mt-7">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <History className="size-5 text-terra" /> Historial de ganadores
        </h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-cocoa/60">Aún no hay temporadas cerradas.</p>
        ) : (
          <div className="mt-3 space-y-2" data-testid="history">
            {history.map((h) => (
              <div key={h.season} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-latte/50">
                <p className="text-xs font-bold text-cocoa/60">Semana {seasonLabel(h.season)}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {h.winners.length ? (
                    h.winners.map((w) => (
                      <li key={w.place} className="flex justify-between text-sm">
                        <span>{medal[w.place - 1]} {w.name}</span>
                        <span className="font-bold tabular-nums">{w.score}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-cocoa/50">Sin participantes</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mx-4 mt-5 flex gap-3 rounded-2xl bg-sand/70 p-4 text-xs leading-relaxed text-cocoa/75">
        <Info className="mt-0.5 size-4 shrink-0 text-terra" />
        {isSharedBackend ? (
          <p>Ranking oficial compartido. Las partidas se validan en el servidor; cuenta la mejor puntuación semanal de cada jugador y, en empate, gana quien la logró primero.</p>
        ) : (
          <p>
            <strong>Modo demostración:</strong> el ranking se guarda en este celular (localStorage) junto con jugadores de ejemplo.
            <strong> No es un ranking compartido real.</strong> El ranking oficial entre todos los clientes requiere activar el servidor (Supabase).
          </p>
        )}
      </div>
    </div>
  )
}
