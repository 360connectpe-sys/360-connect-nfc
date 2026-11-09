import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, IdCard, LogOut, Search, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader, SimBadge } from '../components/ui'
import { GAME_CATALOG, gameName } from '../games/catalog'
import { backend, isSharedBackend } from '../services/backend'
import { formatDateTime, seasonKey, seasonLabel } from '../lib/season'

/**
 * PANEL DEL PERSONAL
 * Verificación de premios: código único + DNI físico (presencial).
 * En producción, cada acción la ejecuta y valida el servidor (Supabase);
 * aquí no se guarda ningún dato del DNI.
 */
export default function Staff() {
  const [staff, setStaff] = useState(undefined)
  useEffect(() => {
    backend.getStaff().then(setStaff, () => setStaff(null))
  }, [])

  return (
    <div className="min-h-dvh bg-cream pb-10">
      <PageHeader
        title="Panel del personal"
        subtitle="Verificación y entrega de premios"
        back="premios"
        right={
          staff ? (
            <button
              onClick={async () => {
                await backend.staffLogout()
                setStaff(null)
              }}
              aria-label="Cerrar sesión"
              className="grid size-10 place-items-center rounded-full bg-sand"
            >
              <LogOut className="size-4" />
            </button>
          ) : null
        }
      />
      {staff === undefined ? null : staff ? <Panel staff={staff} /> : <Login onLogin={setStaff} />}
    </div>
  )
}

function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      onLogin(await backend.staffLogin(isSharedBackend ? { email, password } : { pin }))
    } catch (err) {
      setError(err.message)
    }
  }
  const field = 'w-full rounded-xl border-2 border-latte bg-white px-4 py-3 text-lg focus:border-terra focus:outline-none'
  return (
    <form onSubmit={submit} className="mx-4 mt-2 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50">
      <ShieldCheck className="size-8 text-terra" />
      <h2 className="font-display text-xl font-bold">Acceso restringido</h2>
      {isSharedBackend ? (
        <>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo del personal" className={field} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className={field} />
        </>
      ) : (
        <>
          <input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" aria-label="PIN" className={field} />
          <p className="rounded-xl bg-sand/70 p-3 text-xs text-cocoa/70">
            <SimBadge>Demo</SimBadge> PIN de demostración: <strong>{backend.demoStaffPin}</strong>. En producción el personal ingresa con correo y contraseña,
            y los permisos los valida el servidor.
          </p>
        </>
      )}
      {error && <p className="text-sm font-semibold text-terra">{error}</p>}
      <button className="w-full rounded-2xl bg-espresso py-4 font-bold text-cream">Ingresar</button>
    </form>
  )
}

const STATUS = {
  pending: { text: 'PENDIENTE', cls: 'bg-gold/30 text-espresso' },
  redeemed: { text: 'ENTREGADO', cls: 'bg-olive text-cream' },
  expired: { text: 'VENCIDO', cls: 'bg-terra/20 text-terra' },
}

function Panel({ staff }) {
  const { settings, showToast } = useApp()
  const [tab, setTab] = useState('verificar')
  const [awards, setAwards] = useState([])
  const [seasons, setSeasons] = useState([])
  const reload = useCallback(() => {
    backend.listAwards().then(setAwards).catch(() => {})
    backend.listClosedSeasons().then(setSeasons).catch(() => {})
  }, [])
  useEffect(reload, [reload])

  const tabs = [
    ['verificar', 'Verificar'],
    ['ganadores', 'Ganadores'],
    ['entregas', 'Entregas'],
    ['config', 'Configuración'],
  ]

  return (
    <div className="px-4">
      <p className="text-xs text-cocoa/60">Sesión: <strong>{staff.name}</strong></p>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-espresso text-cream' : 'bg-white text-cocoa ring-1 ring-latte'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'verificar' && <Verify onRedeemed={reload} staff={staff} />}

      {tab === 'ganadores' && (
        <div className="mt-4 space-y-4">
          {!isSharedBackend && (
            <button
              onClick={async () => {
                try {
                  const n = await backend.closeCurrentSeasonDemo()
                  showToast(`Temporada cerrada: ${n} premios generados`)
                  reload()
                } catch (e) {
                  showToast(e.message)
                }
              }}
              disabled={seasons.includes(seasonKey())}
              className="w-full rounded-2xl border-2 border-dashed border-terra/50 py-3 text-sm font-bold text-terra disabled:opacity-40"
            >
              Simular cierre de la semana actual (demo)
            </button>
          )}
          {seasons.map((s) => (
            <div key={s} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-latte/50">
              <p className="text-sm font-bold">Semana {seasonLabel(s)}</p>
              <ul className="mt-2 divide-y divide-latte/40 text-sm">
                {awards.filter((a) => a.season === s).map((a) => (
                  <li key={`${a.gameId}-${a.place}`} className="flex items-center gap-2 py-2">
                    <span className="w-28 shrink-0 truncate text-xs text-cocoa/60">{gameName(a.gameId)}</span>
                    <span className="flex-1 truncate">{a.place}.º {a.winnerName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS[a.status].cls}`}>{STATUS[a.status].text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-cocoa/50">Los códigos se muestran enmascarados: solo el ganador ve su código completo.</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'entregas' && (
        <ul className="mt-4 divide-y divide-latte/50 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-latte/50" data-testid="deliveries">
          {awards.filter((a) => a.status === 'redeemed').length === 0 && <li className="p-4 text-sm text-cocoa/60">Aún no hay entregas.</li>}
          {awards
            .filter((a) => a.status === 'redeemed')
            .sort((a, b) => (b.redeemedAt ?? '').localeCompare(a.redeemedAt ?? ''))
            .map((a) => (
              <li key={`${a.season}-${a.gameId}-${a.place}`} className="p-3 text-sm">
                <p className="font-bold">{a.winnerName} · {a.prizeTitle}</p>
                <p className="text-xs text-cocoa/60">
                  {gameName(a.gameId)} · {a.place}.º lugar · semana {seasonLabel(a.season)}
                </p>
                <p className="text-xs text-cocoa/60">
                  Entregado {a.redeemedAt ? formatDateTime(a.redeemedAt) : ''} por {a.redeemedBy} · código {a.code}
                </p>
              </li>
            ))}
        </ul>
      )}

      {tab === 'config' && (
        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-latte/50">
            <p className="font-bold">Juegos activos ({settings.enabledGames.length})</p>
            <ul className="mt-2 space-y-1">
              {GAME_CATALOG.map((g) => (
                <li key={g.id} className="flex justify-between">
                  <span>{g.name}</span>
                  <span className={settings.enabledGames.includes(g.id) ? 'font-bold text-olive' : 'text-cocoa/40'}>
                    {settings.enabledGames.includes(g.id) ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-cocoa/60">Demo: 7 juegos. Restaurantes reales: exactamente 4 (se edita en la tabla <code>restaurants</code> o en el futuro panel administrativo).</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-latte/50">
            <p className="font-bold">Premios por posición</p>
            <ul className="mt-2 space-y-1">
              {settings.prizes.map((p) => (
                <li key={p.place}>{p.place}.º lugar: {p.title}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Verify({ onRedeemed, staff }) {
  const [code, setCode] = useState('')
  const [award, setAward] = useState(undefined)
  const [dniChecked, setDniChecked] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    setDniChecked(false)
    try {
      setAward(await backend.verifyPrizeCode(code))
    } catch (err) {
      setError(err.message)
    }
  }
  const redeem = async () => {
    setError(null)
    try {
      setAward(await backend.redeemPrize(code, { staffName: staff.name }))
      setDone(true)
      onRedeemed()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={verify} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-latte/50">
        <label className="text-sm font-bold" htmlFor="prize-code">Código de premio</label>
        <div className="mt-2 flex gap-2">
          <input
            id="prize-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CN-XXXX-XXXX"
            className="min-w-0 flex-1 rounded-xl border-2 border-latte px-3 py-3 font-mono text-lg tracking-wider uppercase focus:border-terra focus:outline-none"
          />
          <button className="flex items-center gap-1 rounded-xl bg-espresso px-4 font-bold text-cream">
            <Search className="size-4" /> Verificar
          </button>
        </div>
      </form>

      {award === null && <p className="rounded-2xl bg-terra/10 p-4 text-sm font-semibold text-terra">Código no encontrado. Verifica que esté bien escrito.</p>}

      {award && (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50" data-testid="award-card">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS[award.status].cls}`}>{STATUS[award.status].text}</span>
            <span className="font-mono text-xs text-cocoa/60">{award.code}</span>
          </div>
          <p className="mt-3 text-xs text-cocoa/60">Ganador registrado</p>
          <p className="font-display text-2xl font-bold">{award.winnerName}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-xs text-cocoa/60">Premio</dt><dd className="font-bold">{award.prizeTitle}</dd></div>
            <div><dt className="text-xs text-cocoa/60">Puesto</dt><dd className="font-bold">{award.place}.º · {gameName(award.gameId)}</dd></div>
            <div><dt className="text-xs text-cocoa/60">Semana</dt><dd>{seasonLabel(award.season)}</dd></div>
            <div><dt className="text-xs text-cocoa/60">Válido hasta</dt><dd>{formatDateTime(award.expiresAt)}</dd></div>
          </dl>

          {award.status === 'pending' && !done && (
            <>
              <label className="mt-4 flex items-start gap-3 rounded-2xl bg-sand/70 p-3 text-sm">
                <input type="checkbox" checked={dniChecked} onChange={(e) => setDniChecked(e.target.checked)} className="mt-1 size-5 accent-[#5e6b3a]" />
                <span>
                  <IdCard className="mr-1 inline size-4" /> Verifiqué el <strong>DNI físico</strong>: el nombre y apellido coinciden con <strong>{award.winnerName}</strong>.
                  <span className="block text-xs text-cocoa/60">No anotes ni fotografíes el DNI.</span>
                </span>
              </label>
              <button onClick={redeem} disabled={!dniChecked} className="mt-3 w-full rounded-2xl bg-olive py-4 font-bold text-cream disabled:opacity-40">
                Marcar premio como entregado
              </button>
            </>
          )}
          {done && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-olive/15 p-3 text-sm font-bold text-olive">
              <CheckCircle2 className="size-5" /> Premio entregado. El código ya no puede volver a usarse.
            </p>
          )}
          {award.status === 'redeemed' && !done && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-terra/10 p-3 text-sm font-bold text-terra">
              <AlertTriangle className="size-5" /> Ya fue entregado el {formatDateTime(award.redeemedAt)} por {award.redeemedBy}. No entregar de nuevo.
            </p>
          )}
          {award.status === 'expired' && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-terra/10 p-3 text-sm font-bold text-terra">
              <AlertTriangle className="size-5" /> Este código venció.
            </p>
          )}
        </div>
      )}
      {error && <p className="rounded-2xl bg-terra/10 p-4 text-sm font-semibold text-terra">{error}</p>}
    </div>
  )
}
