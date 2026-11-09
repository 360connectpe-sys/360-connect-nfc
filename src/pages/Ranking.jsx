import { useCallback, useEffect, useState } from 'react'
import { Info, RefreshCw, Timer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import { playableGames, gameIcon, gameName } from '../games/registry'
import { isSharedRanking, resetDemoRanking, scoreRepository } from '../services/scores'
import { formatDate, timeUntilReset, weekRangeLabel } from '../lib/week'

const filters = [{ id: 'all', name: 'General' }, ...playableGames]
const medal = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const { nickname, navigate, showToast } = useApp()
  const [gameId, setGameId] = useState('all')
  const [rows, setRows] = useState(null)
  const reset = timeUntilReset()

  const load = useCallback(() => {
    setRows(null)
    scoreRepository
      .getLeaderboard({ gameId, limit: 20 })
      .then(setRows)
      .catch(() => setRows([]))
  }, [gameId])

  useEffect(load, [load])

  const isMe = (r) => nickname && r.nickname.toLowerCase() === nickname.toLowerCase()
  const podium = rows?.slice(0, 3) ?? []
  const rest = rows?.slice(3) ?? []
  // Orden visual del podio: 2.º - 1.º - 3.º
  const podiumOrder = [podium[1], podium[0], podium[2]]

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Ranking semanal" subtitle={`Semana del ${weekRangeLabel()}`} back="" />

      <div className="mx-4 flex items-center gap-2 rounded-2xl bg-espresso px-4 py-3 text-cream">
        <Timer className="size-4 text-gold" />
        <p className="text-sm">
          Se reinicia en <strong className="text-gold">{reset.d}d {reset.h}h {reset.m}m</strong>
        </p>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setGameId(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
              gameId === f.id ? 'bg-terra text-cream' : 'bg-white text-cocoa ring-1 ring-latte/70'
            }`}
          >
            {f.icon ? `${f.icon} ` : '🏆 '}
            {f.name}
          </button>
        ))}
      </div>

      {rows === null ? (
        <p className="py-16 text-center text-sm text-cocoa/60">Cargando ranking…</p>
      ) : rows.length === 0 ? (
        <div className="mx-4 mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">🎮</p>
          <p className="mt-3 font-bold">Aún no hay puntajes esta semana</p>
          <button onClick={() => navigate('juegos')} className="mt-4 rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-cream">
            ¡Sé el primero!
          </button>
        </div>
      ) : (
        <>
          {/* Podio */}
          <div key={gameId} className="mt-8 grid grid-cols-3 items-end gap-2 px-4">
            {podiumOrder.map((r, idx) => {
              const place = [2, 1, 3][idx]
              const h = { 1: 'h-32', 2: 'h-24', 3: 'h-20' }[place]
              return (
                <div key={place} className="flex animate-fade-up flex-col items-center text-center" style={{ animationDelay: `${idx * 80}ms` }}>
                  {r ? (
                    <>
                      <span className={place === 1 ? 'text-4xl' : 'text-3xl'}>{medal[place - 1]}</span>
                      <p className={`mt-1 w-full truncate text-sm font-extrabold ${isMe(r) ? 'text-terra' : ''}`}>{r.nickname}</p>
                      <p className="text-xs font-bold text-cocoa/70">{r.score} pts</p>
                      <p className="text-[10px] text-cocoa/50">{gameIcon(r.gameId)} {gameName(r.gameId)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-cocoa/40">—</p>
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

          {/* Resto */}
          <ul className="mx-4 divide-y divide-latte/50 overflow-hidden rounded-b-3xl rounded-t-md bg-white shadow-sm ring-1 ring-latte/50">
            {podium.map((r, i) => (
              <Row key={r.id} r={r} pos={i + 1} me={isMe(r)} />
            ))}
            {rest.map((r, i) => (
              <Row key={r.id} r={r} pos={i + 4} me={isMe(r)} />
            ))}
          </ul>
        </>
      )}

      <div className="mx-4 mt-5 flex gap-3 rounded-2xl bg-sand/70 p-4 text-xs leading-relaxed text-cocoa/75">
        <Info className="mt-0.5 size-4 shrink-0 text-terra" />
        {isSharedRanking ? (
          <p>Ranking compartido en tiempo real entre todos los clientes del restaurante.</p>
        ) : (
          <p>
            <strong>Modo demostración:</strong> los puntajes se guardan en este celular (localStorage) junto a jugadores
            de ejemplo. En la versión final el ranking será compartido entre todas las mesas.
          </p>
        )}
      </div>

      {!isSharedRanking && (
        <button
          onClick={async () => {
            await resetDemoRanking()
            load()
            showToast('Ranking demo reiniciado')
          }}
          className="mx-auto mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-cocoa/60 active:bg-sand"
        >
          <RefreshCw className="size-3.5" /> Reiniciar ranking demo
        </button>
      )}
    </div>
  )
}

function Row({ r, pos, me }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${me ? 'bg-terra/8' : ''}`}>
      <span className={`w-6 text-center font-display text-lg font-bold ${pos <= 3 ? 'text-terra' : 'text-cocoa/50'}`}>{pos}</span>
      <span className="grid size-9 place-items-center rounded-xl bg-sand text-lg">{gameIcon(r.gameId)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {r.nickname} {me && <span className="ml-1 rounded-full bg-terra px-1.5 py-0.5 text-[9px] text-cream">TÚ</span>}
        </p>
        <p className="text-[11px] text-cocoa/55">
          {gameName(r.gameId)} · {formatDate(r.createdAt)}
          {r.table ? ` · Mesa ${r.table}` : ''}
        </p>
      </div>
      <span className="font-extrabold tabular-nums">{r.score}</span>
    </li>
  )
}
