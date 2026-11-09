import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { normalizeName } from '../services/backend/validation'
import Sprite from '../games/engine/Sprite'

/**
 * Muestra el registro (nombre + apellido) si el jugador aún no tiene perfil.
 * El perfil queda guardado en el dispositivo: no se vuelve a pedir.
 */
export default function PlayerGate({ children }) {
  const { player } = useApp()
  if (player === undefined) {
    return <p className="py-24 text-center font-pixel text-[10px] text-neon">CARGANDO…</p>
  }
  if (!player) return <RegisterScreen />
  return children
}

export function RegisterScreen() {
  const { registerPlayer, restaurant } = useApp()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const valid = normalizeName(first) && normalizeName(last)

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) {
      setError('Escribe tu nombre y apellido (solo letras, mínimo 2 caracteres).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await registerPlayer({ firstName: first, lastName: last })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border-2 border-neon/40 bg-black/30 px-4 py-3.5 text-lg font-bold text-cream placeholder:text-cream/30 focus:border-neon focus:outline-none'

  return (
    <form onSubmit={submit} className="animate-fade-up px-4 pt-4 pb-10 text-cream">
      <div className="flex items-end justify-center gap-3">
        <Sprite name="chef" size={44} />
        <Sprite name="cuy" size={40} />
        <Sprite name="basket" size={52} />
      </div>
      <h2 className="mt-5 text-center font-pixel text-sm leading-relaxed text-neon">CREA TU JUGADOR</h2>
      <p className="mt-2 text-center text-sm text-cream/70">Solo una vez. Así aparecerás en el ranking de {restaurant.name}.</p>

      <div className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-pixel text-[9px] text-mint">NOMBRE</span>
          <input autoFocus autoComplete="given-name" value={first} maxLength={30} onChange={(e) => setFirst(e.target.value)} placeholder="Ej. Lucía" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-pixel text-[9px] text-mint">APELLIDO</span>
          <input autoComplete="family-name" value={last} maxLength={30} onChange={(e) => setLast(e.target.value)} placeholder="Ej. Ramírez" className={input} />
        </label>
      </div>

      {error && <p className="mt-3 rounded-xl bg-pink/15 px-3 py-2 text-sm text-pink">{error}</p>}

      <button type="submit" disabled={busy} className="pixel-btn mt-6 w-full py-4 text-xs disabled:opacity-50">
        {busy ? 'Creando…' : '▶ Comenzar a jugar'}
      </button>

      <div className="mt-6 flex gap-3 rounded-2xl border-2 border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-cream/65">
        <ShieldCheck className="size-5 shrink-0 text-mint" />
        <p>
          Tu nombre y apellido se mostrarán en el ranking. <strong className="text-cream/90">No pedimos DNI, correo ni teléfono.</strong>{' '}
          Si ganas, reclamarás tu premio en el local presentando tu DNI físico y tu código de premio.
          Usa tu nombre real: el personal lo comparará con tu DNI.
        </p>
      </div>
    </form>
  )
}
