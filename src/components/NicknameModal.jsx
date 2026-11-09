import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const SUGGESTIONS = ['AjíPicante', 'ReyDelCeviche', 'LaChoclera', 'PiscoNinja', 'Lucumita']

export default function NicknameModal({ onClose, onSaved }) {
  const { nickname, setNickname, table } = useApp()
  const [value, setValue] = useState(nickname)
  const valid = value.trim().length >= 2

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    setNickname(value)
    onSaved?.(value.trim())
  }

  // Portal: se monta sobre <body> para quedar por encima de todo (barra inferior incluida)
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="arcade-bg pb-safe w-full max-w-md animate-fade-up rounded-t-3xl p-6 text-cream sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-pixel text-[10px] text-mint">PLAYER 1 · MESA {table}</p>
            <h2 className="mt-3 font-pixel text-base leading-relaxed text-neon">¿CUÁL ES TU APODO?</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full bg-white/10">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-cream/70">Así aparecerás en el ranking semanal del restaurante.</p>

        <input
          autoFocus
          value={value}
          maxLength={16}
          onChange={(e) => setValue(e.target.value.replace(/[<>]/g, ''))}
          placeholder="Ej. ReyDelCeviche"
          className="mt-5 w-full rounded-xl border-2 border-neon/50 bg-black/30 px-4 py-4 text-lg font-bold text-cream placeholder:text-cream/30 focus:border-neon focus:outline-none"
        />
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setValue(s)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cream/80 active:bg-white/20">
              {s}
            </button>
          ))}
        </div>
        <button type="submit" disabled={!valid} className="pixel-btn mt-6 w-full py-4 disabled:opacity-40">
          Guardar y jugar ▶
        </button>
      </form>
    </div>,
    document.body,
  )
}
